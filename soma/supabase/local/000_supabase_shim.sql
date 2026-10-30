-- =============================================================================
-- SOMA — local Supabase shim.  LOCAL DEVELOPMENT AND TESTS ONLY.
--
-- Recreates the parts of a Supabase project that the real migrations in
-- supabase/migrations rely on, so the very same migrations, RLS policies and
-- grants run on a plain PostgreSQL >= 15:
--
--   * roles anon / authenticated / service_role (NOLOGIN, like Supabase)
--   * schema "extensions" (Supabase installs extensions there)
--   * schema "auth" with a minimal auth.users table and auth.uid(), auth.role(),
--     auth.jwt() reading request.jwt.claims exactly like Supabase/PostgREST
--   * Supabase's default privileges on schema public (ALL to the API roles),
--     so our migrations must revoke and re-grant explicitly, as on Supabase
--   * schema app_private for the local auth adapter (sessions, login attempts,
--     password reset tokens).  Never exposed to the API roles.
--
-- NEVER apply this file to a Supabase project. scripts/db/setup.ts applies it
-- only when AUTH_PROVIDER=local. Idempotent.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

-- The application connects as the database owner (postgres on Supabase) and
-- drops privileges per transaction with SET LOCAL ROLE. The owner must be a
-- member of the API roles for that (Supabase grants the same).
do $$
begin
  execute format('grant anon, authenticated, service_role to %I', current_user);
end
$$;

-- ---------------------------------------------------------------------------
-- Schemas
-- ---------------------------------------------------------------------------
create schema if not exists extensions;
grant usage on schema extensions to anon, authenticated, service_role;

create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;

-- Supabase: API roles can use schema public; new objects get ALL by default.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- auth.users (subset of the Supabase table that SOMA relies on)
-- ---------------------------------------------------------------------------
create table if not exists auth.users (
  id                  uuid primary key default gen_random_uuid(),
  aud                 text default 'authenticated',
  role                text default 'authenticated',
  email               text,
  encrypted_password  text,
  email_confirmed_at  timestamptz,
  raw_app_meta_data   jsonb not null default '{}'::jsonb,
  raw_user_meta_data  jsonb not null default '{}'::jsonb,
  last_sign_in_at     timestamptz,
  banned_until        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create unique index if not exists users_email_key on auth.users (lower(email));
revoke all on auth.users from anon, authenticated;

-- ---------------------------------------------------------------------------
-- auth.uid() / auth.role() / auth.jwt() — same definitions as Supabase
-- ---------------------------------------------------------------------------
create or replace function auth.uid() returns uuid
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create or replace function auth.role() returns text
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

create or replace function auth.jwt() returns jsonb
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb
$$;

grant execute on function auth.uid(), auth.role(), auth.jwt() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- app_private — local auth adapter state (never reachable by API roles)
-- ---------------------------------------------------------------------------
create schema if not exists app_private;
revoke all on schema app_private from public;

create table if not exists app_private.local_sessions (
  token_hash    text primary key,              -- sha256(token), the token itself only lives in the cookie
  user_id       uuid not null references auth.users (id) on delete cascade,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null,
  last_seen_at  timestamptz not null default now(),
  ip            text,
  user_agent    text
);
create index if not exists local_sessions_user_idx on app_private.local_sessions (user_id);
create index if not exists local_sessions_expiry_idx on app_private.local_sessions (expires_at);

create table if not exists app_private.login_attempts (
  id          bigserial primary key,
  email       text not null,
  ip          text,
  success     boolean not null,
  created_at  timestamptz not null default now()
);
create index if not exists login_attempts_email_idx on app_private.login_attempts (email, created_at desc);
create index if not exists login_attempts_ip_idx on app_private.login_attempts (ip, created_at desc);

create table if not exists app_private.password_resets (
  token_hash  text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

revoke all on all tables in schema app_private from public, anon, authenticated;
revoke all on all sequences in schema app_private from public, anon, authenticated;
