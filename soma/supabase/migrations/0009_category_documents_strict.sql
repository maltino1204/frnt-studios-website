-- =============================================================================
-- SOMA 0009 — QA audit-4:
--  * A4-3  A category requirement (categories.required_documents) is met only by a
--          document filed for that category. An uncategorised upload ("Weiteres
--          Dokument") no longer counts for every category.
--  * A4-1  seed_mode() is called from SECURITY DEFINER triggers, where current_user
--          is the function owner. It now also checks the session's role setting, so
--          an API session (role anon/authenticated) can never opt into seed mode.
-- =============================================================================

create or replace function public.seed_mode() returns boolean
language sql stable
set search_path = ''
as $$
  select coalesce(current_setting('soma.seed_mode', true), '') = 'on'
     and current_user not in ('anon', 'authenticated')
     and coalesce(nullif(current_setting('role', true), ''), 'none') not in ('anon', 'authenticated')
$$;

create or replace function public.category_documents_complete(p_provider uuid, p_category uuid) returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select coalesce(bool_and(exists (
           select 1 from public.provider_documents d
           where d.provider_id = p_provider
             and d.kind::text = req ->> 'kind'
             and d.category_id = p_category
             and d.status = 'approved'
             and (d.expires_at is null or d.expires_at > now())
         )), true)
  from public.categories c
  cross join lateral jsonb_array_elements(coalesce(c.required_documents, '[]'::jsonb)) as req
  where c.id = p_category
$$;

revoke execute on function public.category_documents_complete(uuid, uuid) from public, anon, authenticated;

-- Offerings that were only unlocked by an uncategorised document wait for the right one again.
update public.provider_services ps
set is_active = false, awaiting_documents = true
from public.services s, public.providers p
where s.id = ps.service_id and p.id = ps.provider_id
  and ps.is_active and p.status = 'approved'
  and not public.category_documents_complete(ps.provider_id, s.category_id);
