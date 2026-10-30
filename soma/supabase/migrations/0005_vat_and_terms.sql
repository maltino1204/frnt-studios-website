-- =============================================================================
-- SOMA 0005 — VAT mode (PAngV / § 19 UStG price notes) and provider terms acceptance.
--
-- * providers.vat_mode     'regular' = prices include 19 % USt; 'small_business' =
--                          Kleinunternehmer per § 19 UStG (no USt). Provider-editable.
-- * providers.terms_accepted_at   set by the onboarding submit (service), never by
--                          the provider directly (no UPDATE grant).
-- * bookings.vat_mode      snapshot of the provider's mode at booking time; set by a
--                          trigger (never from client input) and immutable afterwards.
-- =============================================================================

alter table public.providers
  add column vat_mode text not null default 'small_business'
    constraint providers_vat_mode_check check (vat_mode in ('regular', 'small_business')),
  add column terms_accepted_at timestamptz;

alter table public.bookings
  add column vat_mode text not null default 'small_business'
    constraint bookings_vat_mode_check check (vat_mode in ('regular', 'small_business'));

-- ---------------------------------------------------------------------------
-- Snapshot + immutability (the trusted seed connection may write history as-is)
-- ---------------------------------------------------------------------------
create or replace function public.bookings_snapshot_vat_mode() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if not public.seed_mode() then
      select p.vat_mode into new.vat_mode from public.providers p where p.id = new.provider_id;
    end if;
    return new;
  end if;
  if new.vat_mode is distinct from old.vat_mode and not public.seed_mode() then
    raise exception 'SOMA_BOOKING_IMMUTABLE' using errcode = 'P0001', detail = 'vat_mode';
  end if;
  return new;
end
$$;

create trigger bookings_25_snapshot_vat_mode
before insert or update of vat_mode on public.bookings
for each row execute function public.bookings_snapshot_vat_mode();

revoke execute on function public.bookings_snapshot_vat_mode() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Column grants (providers and bookings use column-level grants since 0004)
-- ---------------------------------------------------------------------------
grant select (vat_mode, terms_accepted_at) on public.providers to authenticated;
grant select (vat_mode) on public.providers to anon;
grant update (vat_mode) on public.providers to authenticated;   -- terms_accepted_at: service only
grant select (vat_mode) on public.bookings to authenticated;

-- ---------------------------------------------------------------------------
-- Provider view: append the snapshot (columns may only be added at the end)
-- ---------------------------------------------------------------------------
create or replace view public.provider_bookings with (security_barrier = true) as
select
  b.id, b.reference, b.provider_id, b.provider_service_id, b.service_id, b.category_id, b.service_name,
  b.duration_minutes, b.starts_at, b.ends_at, b.status, b.booking_mode, b.location_kind,
  b.postal_code, b.city, b.distance_km, b.customer_notes,
  p.first_name as customer_first_name,
  case when v.revealed then p.last_name end as customer_last_name,
  case when v.revealed then b.address_line end as address_line,
  case when v.revealed then b.address_details end as address_details,
  case when v.revealed then b.lat end as lat,
  case when v.revealed then b.lng end as lng,
  case when b.status in ('confirmed', 'in_progress') then p.phone end as customer_phone,
  b.service_price_cents, b.travel_fee_cents, b.commission_rate, b.commission_tier, b.commission_cents,
  b.provider_payout_cents, b.is_repeat_client, b.cancellation_fee_cents, b.respond_by,
  b.confirmed_at, b.started_at, b.completed_at, b.cancelled_at, b.cancelled_by, b.cancellation_reason,
  b.payout_id, b.created_at,
  (select count(*)::int from public.bookings c where c.customer_id = b.customer_id and c.status = 'completed')
    as customer_completed_count,
  b.vat_mode
from public.bookings b
join public.profiles p on p.id = b.customer_id
cross join lateral (
  select (b.status in ('confirmed', 'in_progress')
          or (b.status = 'completed' and b.completed_at > now() - interval '24 hours')) as revealed
) v
where b.provider_id = auth.uid()
  and b.status <> 'pending_payment';

revoke all on public.provider_bookings from anon, authenticated;
grant select on public.provider_bookings to authenticated;
