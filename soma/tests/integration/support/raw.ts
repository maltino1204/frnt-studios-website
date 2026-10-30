import { generateBookingReference } from "@/server/domain/reference";
import type { Session } from "@/server/dto";
import { getSql } from "@/server/db/client";
import type { ProviderFixture } from "./fixtures";

/** Inserts a booking directly as the DB owner (no TS guards) so the triggers are the only guard. */
export async function rawInsertBooking(p: ProviderFixture, customer: Session, startsAt: Date, slug = "entspannungsmassage") {
  const db = getSql();
  const [o] = await db<{ id: string; serviceId: string; categoryId: string; name: string; durationMinutes: number; priceCents: number; bookingMode: string }[]>`
    select ps.id, ps.service_id, s.category_id, s.name, ps.duration_minutes, ps.price_cents, p.booking_mode
    from public.provider_services ps join public.services s on s.id = ps.service_id join public.providers p on p.id = ps.provider_id
    where ps.id = ${p.offerings[slug]}`;
  const endsAt = new Date(startsAt.getTime() + o.durationMinutes * 60_000);
  const [row] = await db<{ id: string }[]>`
    insert into public.bookings (reference, customer_id, provider_id, provider_service_id, service_id, category_id, service_name,
      duration_minutes, starts_at, ends_at, blocked_range, booking_mode, address_line, postal_code, city,
      service_price_cents, total_cents, commission_rate, commission_cents, provider_payout_cents, cancellation_policy)
    values (${generateBookingReference()}, ${customer.userId}, ${p.providerId}, ${o.id}, ${o.serviceId}, ${o.categoryId}, ${o.name},
      ${o.durationMinutes}, ${startsAt}, ${endsAt}, tstzrange(${startsAt}, ${endsAt}), ${o.bookingMode}, 'Teststraße 1', '10115', 'Berlin',
      ${o.priceCents}, ${o.priceCents}, 0.2, ${Math.round(o.priceCents * 0.2)}, ${o.priceCents - Math.round(o.priceCents * 0.2)}, '{}'::jsonb)
    returning id`;
  return row.id;
}
