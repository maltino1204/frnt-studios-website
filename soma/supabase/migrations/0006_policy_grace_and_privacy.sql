-- =============================================================================
-- SOMA 0006 — cancellation policy v2 (QA audit-1 R10/R21) and GDPR anonymisation (R20).
--
-- * platform_settings.cancellation_policy
--     - fee basis = service price only ("fee_basis": "service_price")
--     - per tier "travel_fee_retained": travel fee refunded >= 2 h, kept < 2 h
--     - "grace_minutes": 15 — free cancellation within 15 minutes after booking
--   Existing bookings keep their snapshot; snapshots without these keys are read
--   as "no Bedenkzeit, travel kept in 100 % tiers" (domain/cancellation.parsePolicy).
--   Admin-edited tiers/percentages are preserved; only the missing keys are added.
--
-- * profiles.anonymized_at  set when an account was anonymised (Art. 17 DSGVO).
--   Bookings and payments stay for accounting (§ 147 AO); their personal snapshot
--   fields are scrubbed by the service (src/server/services/privacy.ts).
-- =============================================================================

update public.platform_settings
set value = jsonb_build_object(
      'tiers', (
        select jsonb_agg(
                 jsonb_build_object(
                   'min_hours_before', (t ->> 'min_hours_before')::numeric,
                   'fee_percent', (t ->> 'fee_percent')::numeric,
                   'travel_fee_retained', coalesce((t ->> 'travel_fee_retained')::boolean, (t ->> 'fee_percent')::numeric >= 100)
                 )
                 order by (t ->> 'min_hours_before')::numeric desc
               )
        from jsonb_array_elements(value -> 'tiers') as t
      ),
      'no_show_fee_percent', coalesce(value -> 'no_show_fee_percent', '100'::jsonb),
      'provider_cancellation', 'full_refund',
      'grace_minutes', coalesce(value -> 'grace_minutes', '15'::jsonb),
      'fee_basis', 'service_price'
    ),
    updated_at = now()
where key = 'cancellation_policy'
  and jsonb_typeof(value -> 'tiers') = 'array';

alter table public.profiles
  add column anonymized_at timestamptz;

comment on column public.profiles.anonymized_at is
  'Set when the account was anonymised (DSGVO Art. 17). Names, phone, avatar, addresses and the login are removed; bookings stay with scrubbed snapshots.';
