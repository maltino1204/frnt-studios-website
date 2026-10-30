-- =============================================================================
-- SOMA 0007 — document expiry (QA audit-2 N4), auth e-mail throttle (N8),
--             response window default (N6).
--
-- * provider_documents.expires_at   optional validity end (insurance mainly).
--   Set by the provider at upload or by an admin on review. An approved required
--   document of an approved provider that is rejected or reaches expires_at
--   suspends the provider (services/verification.ts, booking maintenance).
-- * app_private.auth_email_requests   one row per password-reset / account-claim
--   e-mail request (also the suppressed ones), for the 3/h per address and
--   20/h per trusted IP limits. app_private is created here as well so the
--   throttle also works with AUTH_PROVIDER=supabase (the local shim creates it too).
-- * request_response_hours: 12 → 4 business hours (08:00–21:00 Europe/Berlin,
--   capped at start − 2 h). Only the untouched default is changed.
-- =============================================================================

alter table public.provider_documents
  add column expires_at timestamptz;

comment on column public.provider_documents.expires_at is
  'Optional validity end (e.g. liability insurance). Expired required documents suspend an approved provider.';

create index provider_documents_expiry_idx on public.provider_documents (expires_at)
  where status = 'approved' and expires_at is not null;

grant insert (expires_at) on public.provider_documents to authenticated;

create schema if not exists app_private;
revoke all on schema app_private from public;

create table app_private.auth_email_requests (
  id          bigserial primary key,
  email       text not null,
  ip          text,
  kind        text not null check (kind in ('password_reset', 'account_claim')),
  sent        boolean not null,
  created_at  timestamptz not null default now()
);
create index auth_email_requests_email_idx on app_private.auth_email_requests (email, created_at desc);
create index auth_email_requests_ip_idx on app_private.auth_email_requests (ip, created_at desc) where ip is not null;

revoke all on app_private.auth_email_requests from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on app_private.auth_email_requests from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on app_private.auth_email_requests from authenticated';
  end if;
end
$$;

update public.platform_settings
set value = '4'::jsonb, updated_at = now()
where key = 'request_response_hours' and value = '12'::jsonb;
