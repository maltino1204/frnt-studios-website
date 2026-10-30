-- =============================================================================
-- SOMA 0003 — auth hook (handle_new_user), is_admin(), RLS helper functions and
-- the public availability read (busy ranges without personal data).
-- =============================================================================

-- Random code from an unambiguous alphabet (no 0/O, 1/I/L).
create or replace function public.random_code(p_len int) returns text
language plpgsql volatile
set search_path = ''
as $$
declare
  v_alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  v_out text := '';
begin
  for i in 1..p_len loop
    v_out := v_out || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
  end loop;
  return v_out;
end
$$;

-- ASCII slug fragment: "Zoë Müller" -> "zoe-mueller".
create or replace function public.slugify(p_text text) returns text
language sql immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(
    translate(
      replace(replace(replace(replace(lower(coalesce(p_text, '')), 'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'ß', 'ss'),
      'áàâãåçéèêëíìîïıñóòôõøúùûýÿšžłćńśźżğş',
      'aaaaaceeeeiiiiinooooouuuyyszlcnszzgs'
    ),
    '[^a-z0-9]+', '-', 'g'
  ))
$$;

-- ---------------------------------------------------------------------------
-- handle_new_user: standard Supabase pattern. Creates profile, notification
-- preferences, the provider shell (role=provider), referral + welcome credit,
-- and the provider-invite client link.  Role is restricted to customer/provider.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta        jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role        public.app_role := case when v_meta ->> 'role' = 'provider' then 'provider' else 'customer' end;
  v_first       text := nullif(trim(left(v_meta ->> 'first_name', 80)), '');
  v_last        text := nullif(trim(left(v_meta ->> 'last_name', 80)), '');
  v_prefix      text;
  v_code        text;
  v_referrer    uuid;
  v_inviter     uuid;
  v_welcome     int;
  v_slug_base   text;
  v_slug        text;
begin
  v_prefix := upper(left(regexp_replace(public.slugify(v_first), '[^a-z]', '', 'g'), 6));
  if char_length(v_prefix) < 2 then
    v_prefix := 'SOMA';
  end if;
  loop
    v_code := v_prefix || public.random_code(4);
    exit when not exists (select 1 from public.profiles where referral_code = v_code);
  end loop;

  if v_role = 'customer' and nullif(v_meta ->> 'referral_code', '') is not null then
    select id into v_referrer from public.profiles
    where referral_code = upper(trim(v_meta ->> 'referral_code')) and role = 'customer';
  end if;

  insert into public.profiles (id, role, first_name, last_name, referral_code, referred_by, marketing_opt_in)
  values (new.id, v_role, v_first, v_last, v_code, v_referrer,
          coalesce((v_meta ->> 'marketing_opt_in')::boolean, false));

  insert into public.notification_preferences (user_id) values (new.id);

  if v_role = 'provider' then
    v_slug_base := public.slugify(concat_ws('-', v_first, left(v_last, 1)));
    if char_length(v_slug_base) < 3 then
      v_slug_base := 'profi';
    end if;
    loop
      v_slug := v_slug_base || '-' || lower(public.random_code(4));
      exit when not exists (select 1 from public.providers where slug = v_slug);
    end loop;
    loop
      v_code := public.random_code(8);
      exit when not exists (select 1 from public.providers where invite_code = v_code);
    end loop;
    insert into public.providers (id, slug, invite_code, display_name, status)
    values (
      new.id, v_slug, v_code,
      coalesce(concat_ws(' ', v_first, case when v_last is not null then left(v_last, 1) || '.' end), 'Neuer Profi'),
      'draft'
    );
  end if;

  if v_referrer is not null then
    insert into public.referrals (referrer_id, referred_id) values (v_referrer, new.id);
    select coalesce((value #>> '{}')::int, 0) into v_welcome
    from public.platform_settings where key = 'referral_welcome_cents';
    if coalesce(v_welcome, 0) > 0 then
      insert into public.credit_ledger (user_id, amount_cents, reason, note)
      values (new.id, v_welcome, 'referral_welcome', 'Willkommensguthaben (Empfehlung)');
    end if;
  end if;

  if v_role = 'customer' and nullif(v_meta ->> 'provider_invite_code', '') is not null then
    select id into v_inviter from public.providers
    where invite_code = upper(trim(v_meta ->> 'provider_invite_code'));
    if v_inviter is not null then
      insert into public.provider_client_links (provider_id, customer_id, source)
      values (v_inviter, new.id, 'provider_invite')
      on conflict do nothing;
    end if;
  end if;

  return new;
end
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Authorization helpers used inside RLS policies (SECURITY DEFINER so policies
-- don't recurse through other tables' RLS).
-- ---------------------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and blocked_at is null
  )
$$;

create or replace function public.is_booking_customer(p_booking uuid) returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.bookings where id = p_booking and customer_id = auth.uid())
$$;

create or replace function public.is_booking_participant(p_booking uuid) returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.bookings
    where id = p_booking and (customer_id = auth.uid() or provider_id = auth.uid())
  )
$$;

-- ---------------------------------------------------------------------------
-- Busy ranges for availability. Returns only time ranges (no customer data):
-- live holds, requested/confirmed/in_progress bookings (blocked_range incl.
-- travel buffer) and time off.  Approved providers only, unless the caller is
-- that provider or an admin.
-- ---------------------------------------------------------------------------
create or replace function public.provider_busy_ranges(p_provider_ids uuid[], p_from timestamptz, p_to timestamptz)
returns table (provider_id uuid, starts_at timestamptz, ends_at timestamptz, kind text)
language sql stable
security definer
set search_path = ''
as $$
  with allowed as (
    select p.id from public.providers p
    where p.id = any (p_provider_ids)
      and (p.status = 'approved' or p.id = auth.uid() or public.is_admin())
  ),
  win as (
    select tstzrange(p_from, least(p_to, p_from + interval '200 days'), '[)') as r
  )
  select b.provider_id, lower(b.blocked_range), upper(b.blocked_range), 'booking'
  from public.bookings b, win
  where b.provider_id in (select id from allowed)
    and b.blocked_range && win.r
    and (b.status in ('requested', 'confirmed', 'in_progress')
         or (b.status = 'pending_payment' and b.hold_expires_at > now()))
  union all
  select t.provider_id, lower(t.period), upper(t.period), 'time_off'
  from public.provider_time_off t, win
  where t.provider_id in (select id from allowed)
    and t.period && win.r
$$;
