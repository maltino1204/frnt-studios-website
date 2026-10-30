/**
 * Test fixtures built through the real services where possible and with owner
 * SQL where the production flow would need an admin UI.
 */
import { randomUUID } from "node:crypto";
import { createLocalUser } from "@/server/auth/local";
import { loadSession } from "@/server/auth/session-store";
import { getSql, withService } from "@/server/db/client";
import type { Session } from "@/server/dto";
import { getProviderAvailability } from "@/server/services/providers";

export const sql = () => getSql();

export const uniqueEmail = (prefix: string) => `${prefix}-${randomUUID().slice(0, 8)}@test.soma`;
export const PASSWORD = "test-passwort-123";

export async function sessionFor(userId: string): Promise<Session> {
  const s = await loadSession(userId);
  if (!s) throw new Error(`no session for ${userId}`);
  return s;
}

export async function createCustomer(opts: { firstName?: string; referralCode?: string; providerInviteCode?: string } = {}): Promise<Session> {
  const id = await createLocalUser({
    email: uniqueEmail("kunde"),
    password: PASSWORD,
    firstName: opts.firstName ?? "Clara",
    lastName: "Test",
    role: "customer",
    referralCode: opts.referralCode,
    providerInviteCode: opts.providerInviteCode,
  });
  await sql()`update public.profiles set phone = '+49 170 1234567' where id = ${id}`;
  return sessionFor(id);
}

export async function createAdmin(): Promise<Session> {
  const id = await createLocalUser({ email: uniqueEmail("admin"), password: PASSWORD, firstName: "Ada", lastName: "Admin", role: "customer" });
  await sql()`update public.profiles set role = 'admin' where id = ${id}`;
  return sessionFor(id);
}

export interface WeeklyWindowInput {
  weekday: number;
  start: string;
  end: string;
}

export const ALL_DAY: WeeklyWindowInput[] = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ weekday, start: "00:00", end: "24:00" }));

export interface ProviderFixture {
  session: Session;
  providerId: string;
  /** provider_service id per service slug */
  offerings: Record<string, string>;
  inviteCode: string;
}

export async function createProvider(opts: {
  status?: "draft" | "approved" | "submitted";
  bookingMode?: "instant" | "request";
  leadTimeMinutes?: number;
  bufferMinutes?: number;
  basePostalCode?: string;
  radiusKm?: number;
  weeklyHours?: WeeklyWindowInput[];
  services?: Array<{ slug: string; priceCents?: number; durationMinutes?: number }>;
  travelFee?: { baseCents: number; includedKm: number; perKmCents: number };
} = {}): Promise<ProviderFixture> {
  const id = await createLocalUser({ email: uniqueEmail("profi"), password: PASSWORD, firstName: "Paula", lastName: "Profi", role: "provider" });
  const db = sql();
  const fee = opts.travelFee ?? { baseCents: 500, includedKm: 3, perKmCents: 50 };
  await db`
    update public.providers set
      booking_mode = ${opts.bookingMode ?? "instant"},
      lead_time_minutes = ${opts.leadTimeMinutes ?? 60},
      travel_buffer_minutes = ${opts.bufferMinutes ?? 30},
      base_postal_code = ${opts.basePostalCode ?? "10115"},
      service_radius_km = ${opts.radiusKm ?? 15},
      travel_fee_base_cents = ${fee.baseCents}, travel_fee_included_km = ${fee.includedKm}, travel_fee_per_km_cents = ${fee.perKmCents},
      headline = 'Test-Profi', bio = 'Bio'
    where id = ${id}`;
  for (const w of opts.weeklyHours ?? ALL_DAY) {
    await db`insert into public.provider_weekly_hours (provider_id, weekday, start_time, end_time) values (${id}, ${w.weekday}, ${w.start}, ${w.end})`;
  }
  const offerings: Record<string, string> = {};
  for (const s of opts.services ?? [{ slug: "entspannungsmassage" }]) {
    const [svc] = await db<{ id: string; defaultDuration: number }[]>`select id, default_duration from public.services where slug = ${s.slug}`;
    const [row] = await db<{ id: string }[]>`
      insert into public.provider_services (provider_id, service_id, duration_minutes, price_cents)
      values (${id}, ${svc.id}, ${s.durationMinutes ?? svc.defaultDuration}, ${s.priceCents ?? 8000}) returning id`;
    offerings[s.slug] = row.id;
  }
  if ((opts.status ?? "approved") !== "draft") {
    await db`update public.providers set status = ${opts.status ?? "approved"} where id = ${id}`;
  }
  const [p] = await db<{ inviteCode: string }[]>`select invite_code from public.providers where id = ${id}`;
  return { session: await sessionFor(id), providerId: id, offerings, inviteCode: p.inviteCode };
}

/** First real slot at least `minHoursAhead` from now. */
export async function slotAtLeast(providerId: string, providerServiceId: string, minHoursAhead = 0, days = 14): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const days_ = await getProviderAvailability(providerId, providerServiceId, from < today ? today : from, days);
  const min = Date.now() + minHoursAhead * 3_600_000;
  for (const d of days_) for (const s of d.slots) if (Date.parse(s) >= min) return s;
  throw new Error("no slot found");
}

/** Moves a booking in time (owner + seed mode); used to simulate an appointment that already started. */
export async function timeTravel(bookingId: string, startsAt: Date): Promise<void> {
  await withService(async (tx) => {
    await tx`select set_config('soma.seed_mode', 'on', true)`;
    await tx`
      update public.bookings b set starts_at = ${startsAt},
             ends_at = ${startsAt} + make_interval(mins => b.duration_minutes),
             blocked_range = tstzrange(${startsAt}, ${startsAt} + make_interval(mins => b.duration_minutes + 30))
      where id = ${bookingId}`;
  });
}

export const NEW_ADDRESS = { kind: "home" as const, street: "Torstraße", houseNumber: "12", postalCode: "10119", city: "Berlin", details: "3. OG, Klingel Test" };
