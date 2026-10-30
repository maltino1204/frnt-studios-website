-- =============================================================================
-- SOMA 0008 — QA audit-3:
--  * F16  app_private.reauth_attempts: rate limit for the password re-confirmation
--         on self-deletion (5 failures per 15 minutes per account).
--  * F2   category qualification enforced in the database: an approved provider's
--         offering in a category whose required documents (categories.required_documents)
--         are not all approved and valid is stored inactive with awaiting_documents = true
--         ("wartet auf Nachweis"). It activates when the documents are approved
--         (services/verification.ts re-runs the check). Providers cannot write the flag.
-- =============================================================================

create schema if not exists app_private;
revoke all on schema app_private from public;

create table app_private.reauth_attempts (
  id          bigserial primary key,
  user_id     uuid not null,
  success     boolean not null,
  created_at  timestamptz not null default now()
);
create index reauth_attempts_user_idx on app_private.reauth_attempts (user_id, created_at desc);

revoke all on app_private.reauth_attempts from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on app_private.reauth_attempts from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on app_private.reauth_attempts from authenticated';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- F2: category documents gate for offerings
-- ---------------------------------------------------------------------------
alter table public.provider_services
  add column awaiting_documents boolean not null default false;

comment on column public.provider_services.awaiting_documents is
  'Offering waits for the category''s required documents ("wartet auf Nachweis"); kept inactive until they are approved.';

create or replace function public.category_documents_complete(p_provider uuid, p_category uuid) returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select coalesce(bool_and(exists (
           select 1 from public.provider_documents d
           where d.provider_id = p_provider
             and d.kind::text = req ->> 'kind'
             and (d.category_id = p_category or d.category_id is null)
             and d.status = 'approved'
             and (d.expires_at is null or d.expires_at > now())
         )), true)
  from public.categories c
  cross join lateral jsonb_array_elements(coalesce(c.required_documents, '[]'::jsonb)) as req
  where c.id = p_category
$$;

revoke execute on function public.category_documents_complete(uuid, uuid) from public, anon, authenticated;

create or replace function public.provider_services_require_documents() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.provider_status;
  v_category uuid;
begin
  if public.seed_mode() then
    return new;
  end if;
  if not new.is_active then
    -- deactivated by the provider: no longer waiting
    if tg_op = 'UPDATE' and old.is_active is distinct from new.is_active then
      new.awaiting_documents := false;
    end if;
    return new;
  end if;
  select status into v_status from public.providers where id = new.provider_id;
  if v_status is distinct from 'approved' then
    new.awaiting_documents := false;  -- onboarding: checked at approval (decideProvider)
    return new;
  end if;
  select category_id into v_category from public.services where id = new.service_id;
  if public.category_documents_complete(new.provider_id, v_category) then
    new.awaiting_documents := false;
  else
    new.is_active := false;
    new.awaiting_documents := true;
  end if;
  return new;
end
$$;

revoke execute on function public.provider_services_require_documents() from public, anon, authenticated;

create trigger provider_services_10_require_documents
before insert or update of is_active, service_id on public.provider_services
for each row execute function public.provider_services_require_documents();
