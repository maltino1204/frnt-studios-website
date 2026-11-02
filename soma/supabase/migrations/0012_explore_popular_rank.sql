-- =============================================================================
-- SOMA 0012 — „Beliebt in <Stadt>“ without booking counts (review R9, 2026-11-02)
--
-- explore_popular_services() (0011) returned booking_count to anon/authenticated. With the public anon key
-- anyone could read booking volumes per service and city, and differencing over time would show single
-- bookings. /ranking#entdecken promises „keine Zahlen“. The function now returns only the order
-- (service_id, rank). The floors (≥ 5 bookings in the city, ≥ 3 per service) and the window are unchanged.
-- 0011 stays as applied; the return type changes, so the function is dropped and created again.
-- =============================================================================

drop function if exists public.explore_popular_services(text, integer, integer, integer, integer);

create function public.explore_popular_services(
  p_city_slug text,
  p_days integer default 90,
  p_min_city integer default 5,
  p_min_service integer default 3,
  p_limit integer default 8
) returns table (service_id uuid, rank integer)
language sql stable
security definer
set search_path = ''
as $$
  with b as (
    select bk.service_id
    from public.bookings bk
    join public.postal_codes pc on pc.postal_code = bk.postal_code
    where pc.city_slug = p_city_slug
      and bk.status in ('confirmed', 'in_progress', 'completed')
      and bk.created_at >= now() - make_interval(days => least(greatest(coalesce(p_days, 90), 30), 180))
  ),
  total as (select count(*) as n from b),
  ranked as (
    select s.id, count(*) as n, s.sort_order
    from b
    join public.services s on s.id = b.service_id and s.is_active
    join public.categories c on c.id = s.category_id and c.is_active
    where (select n from total) >= greatest(coalesce(p_min_city, 5), 5)
    group by s.id, s.sort_order
    having count(*) >= greatest(coalesce(p_min_service, 3), 3)
  )
  select r.id, (row_number() over (order by r.n desc, r.sort_order, r.id))::int
  from ranked r
  order by 2
  limit least(greatest(coalesce(p_limit, 8), 1), 12)
$$;

comment on function public.explore_popular_services(text, integer, integer, integer, integer) is
  '„Beliebt in <Stadt>“: services in order (rank 1 = most booked), never counts. Floors: ≥ 5 per city, ≥ 3 per service.';

revoke execute on function public.explore_popular_services(text, integer, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.explore_popular_services(text, integer, integer, integer, integer) to anon, authenticated;
