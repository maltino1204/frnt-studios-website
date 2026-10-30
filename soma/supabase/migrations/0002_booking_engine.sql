-- =============================================================================
-- SOMA 0002 — booking engine guards (the database is the final guard).
--
-- * validate_booking_slot      provider approved, offering valid, weekly hours
--                              (Europe/Berlin), time off, lead time, max advance
-- * enforce_booking_transition state machine + immutable snapshot columns
-- * log_booking_event          booking_events history, completed counter
-- * reviews                    only for completed bookings, provider aggregates
-- * credit_ledger              balance can never become negative
-- * provider status events     verification audit trail
--
-- Errors are raised with a stable message code (SOMA_*) that the TypeScript
-- layer maps to friendly German messages (src/server/db/errors.ts).
-- seed_mode() lets the trusted seed/maintenance connection write historical
-- data; API roles can never enable it.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- State machine (mirrors src/server/domain/booking-state.ts)
-- ---------------------------------------------------------------------------
create or replace function public.booking_transition_allowed(p_from public.booking_status, p_to public.booking_status)
returns boolean
language sql immutable
set search_path = ''
as $$
  select (p_from::text || '>' || p_to::text) = any (array[
    'pending_payment>requested', 'pending_payment>confirmed', 'pending_payment>expired', 'pending_payment>cancelled',
    'requested>confirmed', 'requested>declined', 'requested>expired', 'requested>cancelled',
    'confirmed>in_progress', 'confirmed>completed', 'confirmed>no_show', 'confirmed>cancelled',
    'in_progress>completed', 'in_progress>cancelled'
  ])
$$;

-- ---------------------------------------------------------------------------
-- validate_booking_slot (BEFORE INSERT)
-- ---------------------------------------------------------------------------
create or replace function public.validate_booking_slot() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_provider     public.providers%rowtype;
  v_offering     public.provider_services%rowtype;
  v_service      public.services%rowtype;
  v_customer     public.profiles%rowtype;
  v_local_start  timestamp;
  v_local_end    timestamp;
begin
  select * into v_provider from public.providers where id = new.provider_id;
  if not found then
    raise exception 'SOMA_PROVIDER_NOT_BOOKABLE' using errcode = 'P0001';
  end if;

  if public.seed_mode() then
    new.blocked_range := coalesce(
      new.blocked_range,
      tstzrange(new.starts_at, new.ends_at + make_interval(mins => v_provider.travel_buffer_minutes), '[)')
    );
    return new;
  end if;

  if v_provider.status <> 'approved' then
    raise exception 'SOMA_PROVIDER_NOT_BOOKABLE' using errcode = 'P0001';
  end if;

  select * into v_customer from public.profiles where id = new.customer_id;
  if not found or v_customer.role <> 'customer' or v_customer.blocked_at is not null then
    raise exception 'SOMA_CUSTOMER_INVALID' using errcode = 'P0001';
  end if;

  select * into v_offering from public.provider_services where id = new.provider_service_id;
  select * into v_service from public.services where id = v_offering.service_id;
  if v_offering.id is null
     or v_offering.provider_id <> new.provider_id
     or not v_offering.is_active
     or v_offering.service_id <> new.service_id
     or v_offering.duration_minutes <> new.duration_minutes
     or v_service.category_id <> new.category_id
     or not v_service.is_active then
    raise exception 'SOMA_OFFERING_INVALID' using errcode = 'P0001';
  end if;

  if new.booking_mode <> v_provider.booking_mode then
    raise exception 'SOMA_OFFERING_INVALID' using errcode = 'P0001', detail = 'booking_mode snapshot mismatch';
  end if;

  if new.ends_at <> new.starts_at + make_interval(mins => new.duration_minutes) then
    raise exception 'SOMA_INVALID_RANGE' using errcode = 'P0001';
  end if;

  if new.starts_at < now() + make_interval(mins => v_provider.lead_time_minutes) then
    raise exception 'SOMA_LEAD_TIME' using errcode = 'P0001';
  end if;

  if new.starts_at > now() + make_interval(days => v_provider.max_advance_days) then
    raise exception 'SOMA_TOO_FAR_AHEAD' using errcode = 'P0001';
  end if;

  -- Weekly hours are wall-clock times in Europe/Berlin (DST-safe: compare local timestamps).
  v_local_start := new.starts_at at time zone 'Europe/Berlin';
  v_local_end   := new.ends_at at time zone 'Europe/Berlin';
  if not exists (
    select 1
    from public.provider_weekly_hours h
    where h.provider_id = new.provider_id
      and h.weekday = extract(isodow from v_local_start)::smallint
      and (v_local_start::date + h.start_time) <= v_local_start
      and (v_local_start::date + h.end_time) >= v_local_end
  ) then
    raise exception 'SOMA_OUTSIDE_HOURS' using errcode = 'P0001';
  end if;

  -- [starts_at, ends_at + travel buffer): never set by the client.
  new.blocked_range := tstzrange(new.starts_at, new.ends_at + make_interval(mins => v_provider.travel_buffer_minutes), '[)');

  if exists (
    select 1 from public.provider_time_off t
    where t.provider_id = new.provider_id and t.period && new.blocked_range
  ) then
    raise exception 'SOMA_TIME_OFF' using errcode = 'P0001';
  end if;

  return new;
end
$$;

-- ---------------------------------------------------------------------------
-- enforce_booking_transition (BEFORE INSERT OR UPDATE)
-- ---------------------------------------------------------------------------
create or replace function public.enforce_booking_transition() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'pending_payment' and not public.seed_mode() then
      raise exception 'SOMA_INVALID_TRANSITION' using errcode = 'P0001', detail = 'new bookings start in pending_payment';
    end if;
    return new;
  end if;

  if not public.seed_mode() then
    -- The price/time snapshot is immutable once the booking exists.
    if (new.customer_id, new.provider_id, new.provider_service_id, new.service_id, new.starts_at, new.ends_at,
        new.blocked_range, new.service_price_cents, new.travel_fee_cents, new.service_fee_cents,
        new.discount_cents, new.total_cents, new.reference, new.booking_mode, new.start_code,
        new.cancellation_policy)
       is distinct from
       (old.customer_id, old.provider_id, old.provider_service_id, old.service_id, old.starts_at, old.ends_at,
        old.blocked_range, old.service_price_cents, old.travel_fee_cents, old.service_fee_cents,
        old.discount_cents, old.total_cents, old.reference, old.booking_mode, old.start_code,
        old.cancellation_policy) then
      raise exception 'SOMA_BOOKING_IMMUTABLE' using errcode = 'P0001';
    end if;
  end if;

  if new.status is distinct from old.status then
    if not public.seed_mode() then
      if not public.booking_transition_allowed(old.status, new.status) then
        raise exception 'SOMA_INVALID_TRANSITION' using errcode = 'P0001',
          detail = format('%s -> %s', old.status, new.status);
      end if;
      if new.status = 'in_progress' and now() < old.starts_at - interval '30 minutes' then
        raise exception 'SOMA_TOO_EARLY' using errcode = 'P0001', detail = 'start';
      end if;
      if new.status = 'no_show' and now() < old.starts_at + interval '15 minutes' then
        raise exception 'SOMA_TOO_EARLY' using errcode = 'P0001', detail = 'no_show';
      end if;
      if new.status = 'completed' and now() < old.starts_at then
        raise exception 'SOMA_TOO_EARLY' using errcode = 'P0001', detail = 'complete';
      end if;
    end if;

    case new.status
      when 'confirmed' then new.confirmed_at := coalesce(new.confirmed_at, now());
      when 'in_progress' then new.started_at := coalesce(new.started_at, now());
      when 'completed' then new.completed_at := coalesce(new.completed_at, now());
      when 'cancelled', 'declined', 'expired', 'no_show' then new.cancelled_at := coalesce(new.cancelled_at, now());
      else null;
    end case;
  end if;

  new.updated_at := now();
  return new;
end
$$;

create trigger bookings_10_enforce_transition
before insert or update on public.bookings
for each row execute function public.enforce_booking_transition();

create trigger bookings_20_validate_slot
before insert on public.bookings
for each row execute function public.validate_booking_slot();

-- ---------------------------------------------------------------------------
-- booking_events + completed counter (AFTER INSERT OR UPDATE OF status)
-- ---------------------------------------------------------------------------
create or replace function public.log_booking_event() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_actor  uuid;
  v_role   public.actor_role;
  v_note   text;
  v_at     timestamptz := now();
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return null;
  end if;

  v_actor := coalesce(nullif(current_setting('soma.actor_id', true), '')::uuid, auth.uid());
  v_role  := coalesce(nullif(current_setting('soma.actor_role', true), ''), 'system')::public.actor_role;
  v_note  := nullif(current_setting('soma.event_note', true), '');

  if public.seed_mode() then
    v_at := coalesce(
      case new.status
        when 'completed' then new.completed_at
        when 'confirmed' then new.confirmed_at
        when 'in_progress' then new.started_at
        when 'pending_payment' then new.created_at
        else new.cancelled_at
      end,
      new.created_at, now());
  end if;

  insert into public.booking_events (booking_id, from_status, to_status, actor_id, actor_role, note, created_at)
  values (new.id, case when tg_op = 'UPDATE' then old.status end, new.status, v_actor, v_role, v_note, v_at);

  if new.status = 'completed' and (tg_op = 'INSERT' or old.status <> 'completed') then
    update public.providers set completed_count = completed_count + 1 where id = new.provider_id;
  end if;

  return null;
end
$$;

create trigger bookings_30_log_event
after insert or update of status on public.bookings
for each row execute function public.log_booking_event();

-- ---------------------------------------------------------------------------
-- Reviews: only for completed bookings of that customer; aggregates on providers
-- ---------------------------------------------------------------------------
create or replace function public.reviews_validate() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer uuid;
  v_provider uuid;
  v_status   public.booking_status;
begin
  select b.customer_id, b.provider_id, b.status into v_customer, v_provider, v_status
  from public.bookings b where b.id = new.booking_id;
  if not found or v_status <> 'completed' then
    raise exception 'SOMA_REVIEW_NOT_ALLOWED' using errcode = 'P0001';
  end if;
  -- Ownership is derived from the booking, never from the client.
  -- (API roles can only insert booking_id, rating, comment, tags — see 0004 grants.)
  new.customer_id := v_customer;
  new.provider_id := v_provider;
  return new;
end
$$;

create trigger reviews_10_validate
before insert on public.reviews
for each row execute function public.reviews_validate();

create or replace function public.reviews_guard_update() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.provider_reply is distinct from old.provider_reply then
    if old.provider_reply is not null and current_user in ('anon', 'authenticated') then
      raise exception 'SOMA_REPLY_EXISTS' using errcode = 'P0001';
    end if;
    new.provider_replied_at := case when new.provider_reply is null then null else now() end;
  end if;
  return new;
end
$$;

create trigger reviews_20_guard_update
before update on public.reviews
for each row execute function public.reviews_guard_update();

create or replace function public.refresh_provider_rating(p_provider uuid) returns void
language sql
security definer
set search_path = ''
as $$
  update public.providers p
  set rating_avg = agg.avg_rating, rating_count = agg.cnt
  from (
    select round(avg(r.rating)::numeric, 2) as avg_rating, count(*)::int as cnt
    from public.reviews r
    where r.provider_id = p_provider and r.is_published
  ) agg
  where p.id = p_provider
$$;

create or replace function public.reviews_refresh_aggregates() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_provider_rating(old.provider_id);
    return null;
  end if;
  perform public.refresh_provider_rating(new.provider_id);
  if tg_op = 'UPDATE' and old.provider_id <> new.provider_id then
    perform public.refresh_provider_rating(old.provider_id);
  end if;
  return null;
end
$$;

create trigger reviews_30_refresh_aggregates
after insert or update of rating, is_published, provider_id or delete on public.reviews
for each row execute function public.reviews_refresh_aggregates();

-- ---------------------------------------------------------------------------
-- Credits: balance never negative
-- ---------------------------------------------------------------------------
create or replace function public.credit_ledger_guard() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select coalesce(sum(amount_cents), 0) from public.credit_ledger where user_id = new.user_id) < 0 then
    raise exception 'SOMA_CREDIT_INSUFFICIENT' using errcode = 'P0001';
  end if;
  return null;
end
$$;

create trigger credit_ledger_guard
after insert on public.credit_ledger
for each row execute function public.credit_ledger_guard();

-- ---------------------------------------------------------------------------
-- Provider verification trail
-- ---------------------------------------------------------------------------
create or replace function public.providers_status_timestamps() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'approved' then
      new.approved_at := coalesce(old.approved_at, now());
    elsif new.status = 'submitted' then
      new.submitted_at := now();
    end if;
  end if;
  return new;
end
$$;

create trigger providers_status_timestamps
before update of status on public.providers
for each row execute function public.providers_status_timestamps();

create or replace function public.log_provider_status_event() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.provider_status_events (provider_id, from_status, to_status, actor_id, note)
    values (
      new.id, old.status, new.status,
      coalesce(nullif(current_setting('soma.actor_id', true), '')::uuid, auth.uid()),
      nullif(current_setting('soma.event_note', true), '')
    );
  end if;
  return null;
end
$$;

create trigger providers_log_status_event
after update of status on public.providers
for each row execute function public.log_provider_status_event();
