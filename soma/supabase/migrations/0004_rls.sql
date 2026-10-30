-- =============================================================================
-- SOMA 0004 — row-level security, column-level grants, restricted views.
--
-- Principles (docs/architecture.md §3.2):
--   * RLS on every table in public, default deny.
--   * Supabase grants ALL to anon/authenticated by default -> revoke everything,
--     then grant exactly what each role needs (column lists where relevant).
--   * No INSERT/UPDATE for API roles on bookings, payments, refunds, payouts,
--     provider aggregates or credit_ledger: those change only via server use cases.
--   * Providers read their bookings only through public.provider_bookings, which
--     reveals address/full name only after confirmation and phone only while
--     confirmed/in progress. E-mail addresses are never exposed.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Start from zero
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

grant usage on schema public to anon, authenticated;

-- Functions API roles legitimately call (inside policies or directly).
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_booking_customer(uuid) to authenticated;
grant execute on function public.is_booking_participant(uuid) to authenticated;
grant execute on function public.haversine_km(double precision, double precision, double precision, double precision) to anon, authenticated;
grant execute on function public.provider_busy_ranges(uuid[], timestamptz, timestamptz) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
do $$
declare
  t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Public catalogue
-- ---------------------------------------------------------------------------
grant select on public.cities, public.postal_codes, public.categories, public.services,
              public.content_blocks, public.platform_settings to anon, authenticated;

create policy cities_read on public.cities for select to anon, authenticated using (true);
create policy postal_codes_read on public.postal_codes for select to anon, authenticated using (true);
create policy categories_read on public.categories for select to anon, authenticated using (is_active or public.is_admin());
create policy services_read on public.services for select to anon, authenticated using (is_active or public.is_admin());
create policy content_blocks_read on public.content_blocks for select to anon, authenticated using (true);
create policy platform_settings_read on public.platform_settings for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- profiles: own row only; column-limited updates
-- ---------------------------------------------------------------------------
grant select on public.profiles to authenticated;
grant update (first_name, last_name, phone, avatar_path, marketing_opt_in) on public.profiles to authenticated;

create policy profiles_select_own on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- addresses: customers manage their own
-- ---------------------------------------------------------------------------
grant select, delete on public.addresses to authenticated;
grant insert (user_id, label, kind, street, house_number, postal_code, city, details, is_default) on public.addresses to authenticated;
grant update (label, kind, street, house_number, postal_code, city, details, is_default) on public.addresses to authenticated;

create policy addresses_select_own on public.addresses for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy addresses_insert_own on public.addresses for insert to authenticated
  with check (user_id = auth.uid());
create policy addresses_update_own on public.addresses for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy addresses_delete_own on public.addresses for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- providers: approved ones are public; owner may edit safe columns only.
-- Excluded from SELECT for API roles: commission_rate_override, stripe_account_id,
-- invite_code (the owner reads it through the pro service).
-- Excluded from UPDATE: status, rating_*, completed_count, commission override,
-- Stripe fields, slug, invite_code, coordinates (derived), timestamps.
-- ---------------------------------------------------------------------------
grant select (
  id, slug, display_name, headline, bio, avatar_path, years_experience, languages, status,
  booking_mode, lead_time_minutes, max_advance_days, travel_buffer_minutes, base_postal_code, base_lat, base_lng,
  service_radius_km, travel_fee_base_cents, travel_fee_included_km, travel_fee_per_km_cents,
  rating_avg, rating_count, completed_count, payouts_enabled, approved_at, submitted_at, created_at, updated_at
) on public.providers to authenticated;
grant select (
  id, slug, display_name, headline, bio, avatar_path, years_experience, languages, status,
  booking_mode, lead_time_minutes, max_advance_days, travel_buffer_minutes, base_postal_code, base_lat, base_lng,
  service_radius_km, travel_fee_base_cents, travel_fee_included_km, travel_fee_per_km_cents,
  rating_avg, rating_count, completed_count, approved_at, created_at
) on public.providers to anon;
grant update (
  display_name, headline, bio, avatar_path, years_experience, languages, booking_mode, lead_time_minutes,
  max_advance_days, travel_buffer_minutes, base_postal_code, service_radius_km, travel_fee_base_cents,
  travel_fee_included_km, travel_fee_per_km_cents
) on public.providers to authenticated;

create policy providers_read_public on public.providers for select to anon
  using (status = 'approved');
create policy providers_read on public.providers for select to authenticated
  using (status = 'approved' or id = auth.uid() or public.is_admin());
create policy providers_update_own on public.providers for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- provider-owned tables
-- ---------------------------------------------------------------------------
grant select on public.provider_services to anon, authenticated;
grant insert (provider_id, service_id, duration_minutes, price_cents, is_active) on public.provider_services to authenticated;
grant update (duration_minutes, price_cents, is_active) on public.provider_services to authenticated;
grant delete on public.provider_services to authenticated;

create policy provider_services_read on public.provider_services for select to anon, authenticated
  using (
    (is_active and exists (select 1 from public.providers p where p.id = provider_id and p.status = 'approved'))
    or provider_id = auth.uid()
    or public.is_admin()
  );
create policy provider_services_insert_own on public.provider_services for insert to authenticated
  with check (provider_id = auth.uid() and exists (select 1 from public.providers p where p.id = auth.uid()));
create policy provider_services_update_own on public.provider_services for update to authenticated
  using (provider_id = auth.uid()) with check (provider_id = auth.uid());
create policy provider_services_delete_own on public.provider_services for delete to authenticated
  using (provider_id = auth.uid());

grant select on public.provider_weekly_hours to anon, authenticated;
grant insert (provider_id, weekday, start_time, end_time) on public.provider_weekly_hours to authenticated;
grant update (weekday, start_time, end_time) on public.provider_weekly_hours to authenticated;
grant delete on public.provider_weekly_hours to authenticated;

create policy weekly_hours_read on public.provider_weekly_hours for select to anon, authenticated
  using (
    exists (select 1 from public.providers p where p.id = provider_id and p.status = 'approved')
    or provider_id = auth.uid()
    or public.is_admin()
  );
create policy weekly_hours_insert_own on public.provider_weekly_hours for insert to authenticated
  with check (provider_id = auth.uid() and exists (select 1 from public.providers p where p.id = auth.uid()));
create policy weekly_hours_update_own on public.provider_weekly_hours for update to authenticated
  using (provider_id = auth.uid()) with check (provider_id = auth.uid());
create policy weekly_hours_delete_own on public.provider_weekly_hours for delete to authenticated
  using (provider_id = auth.uid());

-- Time off is private (reason); availability uses provider_busy_ranges().
grant select, delete on public.provider_time_off to authenticated;
grant insert (provider_id, period, reason) on public.provider_time_off to authenticated;
grant update (period, reason) on public.provider_time_off to authenticated;

create policy time_off_select_own on public.provider_time_off for select to authenticated
  using (provider_id = auth.uid() or public.is_admin());
create policy time_off_insert_own on public.provider_time_off for insert to authenticated
  with check (provider_id = auth.uid() and exists (select 1 from public.providers p where p.id = auth.uid()));
create policy time_off_update_own on public.provider_time_off for update to authenticated
  using (provider_id = auth.uid()) with check (provider_id = auth.uid());
create policy time_off_delete_own on public.provider_time_off for delete to authenticated
  using (provider_id = auth.uid());

-- Verification documents: private to the provider and admins.
grant select, delete on public.provider_documents to authenticated;
grant insert (provider_id, kind, category_id, storage_path, file_name, mime_type, size_bytes) on public.provider_documents to authenticated;

create policy documents_select_own on public.provider_documents for select to authenticated
  using (provider_id = auth.uid() or public.is_admin());
create policy documents_insert_own on public.provider_documents for insert to authenticated
  with check (
    provider_id = auth.uid()
    and storage_path like 'documents/' || auth.uid()::text || '/%'
    and exists (select 1 from public.providers p where p.id = auth.uid())
  );
create policy documents_delete_own on public.provider_documents for delete to authenticated
  using (provider_id = auth.uid() and status = 'pending');

grant select on public.provider_portfolio to anon, authenticated;
grant insert (provider_id, storage_path, caption, category_id, sort_order) on public.provider_portfolio to authenticated;
grant update (caption, category_id, sort_order) on public.provider_portfolio to authenticated;
grant delete on public.provider_portfolio to authenticated;

create policy portfolio_read on public.provider_portfolio for select to anon, authenticated
  using (
    exists (select 1 from public.providers p where p.id = provider_id and p.status = 'approved')
    or provider_id = auth.uid()
    or public.is_admin()
  );
create policy portfolio_insert_own on public.provider_portfolio for insert to authenticated
  with check (
    provider_id = auth.uid()
    and (storage_path like 'portfolio/' || auth.uid()::text || '/%')
    and exists (select 1 from public.providers p where p.id = auth.uid())
  );
create policy portfolio_update_own on public.provider_portfolio for update to authenticated
  using (provider_id = auth.uid()) with check (provider_id = auth.uid());
create policy portfolio_delete_own on public.provider_portfolio for delete to authenticated
  using (provider_id = auth.uid());

grant select on public.provider_status_events to authenticated;
create policy status_events_select on public.provider_status_events for select to authenticated
  using (provider_id = auth.uid() or public.is_admin());

grant select on public.provider_client_links to authenticated;
create policy client_links_select on public.provider_client_links for select to authenticated
  using (provider_id = auth.uid() or customer_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- bookings: customers read their own (no commission internals, no attempts
-- counter); providers use provider_bookings; nobody writes via the API.
-- ---------------------------------------------------------------------------
grant select (
  id, reference, customer_id, provider_id, provider_service_id, service_id, category_id, service_name,
  duration_minutes, starts_at, ends_at, status, booking_mode, location_kind, address_line, postal_code, city,
  address_details, lat, lng, customer_notes, distance_km, service_price_cents, travel_fee_cents,
  service_fee_cents, discount_cents, total_cents, cancellation_policy, start_code, hold_expires_at, respond_by,
  confirmed_at, started_at, completed_at, cancelled_at, cancelled_by, cancellation_reason,
  cancellation_fee_cents, refund_cents, rebooked_from_id, created_at, updated_at
) on public.bookings to authenticated;

create policy bookings_select_customer on public.bookings for select to authenticated
  using (customer_id = auth.uid() or public.is_admin());

grant select on public.booking_events to authenticated;
create policy booking_events_select on public.booking_events for select to authenticated
  using (public.is_booking_participant(booking_id) or public.is_admin());

grant select (id, booking_id, provider, status, amount_cents, captured_cents, refunded_cents, card_brand, card_last4, created_at, updated_at)
  on public.payments to authenticated;
create policy payments_select on public.payments for select to authenticated
  using (public.is_booking_customer(booking_id) or public.is_admin());

grant select (id, payment_id, booking_id, amount_cents, reason, status, created_at) on public.refunds to authenticated;
create policy refunds_select on public.refunds for select to authenticated
  using (public.is_booking_customer(booking_id) or public.is_admin());

grant select on public.payouts to authenticated;
create policy payouts_select on public.payouts for select to authenticated
  using (provider_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- reviews: own rows; public reads via public_reviews (no customer ids)
-- ---------------------------------------------------------------------------
grant select on public.reviews to authenticated;
grant insert (booking_id, rating, comment, tags) on public.reviews to authenticated;
grant update (provider_reply) on public.reviews to authenticated;

create policy reviews_select_own on public.reviews for select to authenticated
  using (customer_id = auth.uid() or provider_id = auth.uid() or public.is_admin());
create policy reviews_insert_customer on public.reviews for insert to authenticated
  with check (customer_id = auth.uid());
create policy reviews_reply_provider on public.reviews for update to authenticated
  using (provider_id = auth.uid()) with check (provider_id = auth.uid());

-- ---------------------------------------------------------------------------
-- favourites, notifications, preferences
-- ---------------------------------------------------------------------------
grant select, delete on public.favorites to authenticated;
grant insert (customer_id, provider_id) on public.favorites to authenticated;
create policy favorites_select_own on public.favorites for select to authenticated using (customer_id = auth.uid());
create policy favorites_insert_own on public.favorites for insert to authenticated with check (customer_id = auth.uid());
create policy favorites_delete_own on public.favorites for delete to authenticated using (customer_id = auth.uid());

grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy notifications_select_own on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_update_own on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select on public.notification_preferences to authenticated;
grant update (email_bookings, email_reminders, email_marketing, sms_reminders, push_bookings) on public.notification_preferences to authenticated;
create policy prefs_select_own on public.notification_preferences for select to authenticated using (user_id = auth.uid());
create policy prefs_update_own on public.notification_preferences for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- credits & referrals: read-only for the owner
-- ---------------------------------------------------------------------------
grant select on public.credit_ledger to authenticated;
create policy credit_ledger_select_own on public.credit_ledger for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

grant select on public.referrals to authenticated;
create policy referrals_select_own on public.referrals for select to authenticated
  using (referrer_id = auth.uid() or referred_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- disputes: participants read; created via service
-- ---------------------------------------------------------------------------
grant select on public.disputes to authenticated;
create policy disputes_select on public.disputes for select to authenticated
  using (opened_by = auth.uid() or public.is_booking_participant(booking_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- admin-only reads
-- ---------------------------------------------------------------------------
grant select on public.email_outbox, public.commission_rules, public.search_events,
              public.waitlist_signups, public.audit_log to authenticated;
create policy email_outbox_admin on public.email_outbox for select to authenticated using (public.is_admin());
create policy commission_rules_admin on public.commission_rules for select to authenticated using (public.is_admin());
create policy search_events_admin on public.search_events for select to authenticated using (public.is_admin());
create policy waitlist_admin on public.waitlist_signups for select to authenticated using (public.is_admin());
create policy audit_log_admin on public.audit_log for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Restricted views (owner rights, security barrier; filter by auth.uid()).
-- ---------------------------------------------------------------------------
create view public.provider_bookings with (security_barrier = true) as
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
    as customer_completed_count
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

create view public.public_reviews with (security_barrier = true) as
select
  r.id, r.provider_id, r.rating, r.comment, r.tags, r.provider_reply, r.provider_replied_at, r.created_at,
  case
    when nullif(pr.first_name, '') is null then null
    else pr.first_name || coalesce(' ' || left(nullif(pr.last_name, ''), 1) || '.', '')
  end as author_name,
  b.service_name
from public.reviews r
join public.profiles pr on pr.id = r.customer_id
join public.bookings b on b.id = r.booking_id
join public.providers pv on pv.id = r.provider_id
where r.is_published and pv.status = 'approved';

revoke all on public.public_reviews from anon, authenticated;
grant select on public.public_reviews to anon, authenticated;
