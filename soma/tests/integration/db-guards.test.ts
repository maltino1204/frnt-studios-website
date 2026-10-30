import { describe, expect, it } from "vitest";
import { ServiceError } from "@/server/errors";
import { wallTimeToInstant, addDays, localDateOf, isoWeekdayOf } from "@/server/domain/tz";
import { createBooking } from "@/server/services/bookings";
import { createCustomer, createProvider, NEW_ADDRESS, slotAtLeast, sql } from "./support/fixtures";
import { rawInsertBooking } from "./support/raw";

/** Next local date (>= 2 days ahead) with the given ISO weekday. */
function nextWeekday(weekday: number): string {
  let d = addDays(localDateOf(new Date()), 2);
  while (isoWeekdayOf(d) !== weekday) d = addDays(d, 1);
  return d;
}

describe("database guards (triggers + exclusion constraint)", () => {
  it("rejects an insert outside the weekly hours (Europe/Berlin)", async () => {
    const p = await createProvider({ weeklyHours: [{ weekday: 1, start: "09:00", end: "12:00" }] });
    const c = await createCustomer();
    const monday = nextWeekday(1);
    const ok = wallTimeToInstant(monday, 9 * 60).instant;
    await expect(rawInsertBooking(p, c, ok)).resolves.toBeTruthy();
    const tooLate = wallTimeToInstant(monday, 11 * 60 + 30).instant; // 60 min would end 12:30
    await expect(rawInsertBooking(p, c, tooLate)).rejects.toThrow(/SOMA_OUTSIDE_HOURS/);
    const tuesday = wallTimeToInstant(nextWeekday(2), 10 * 60).instant;
    await expect(rawInsertBooking(p, c, tuesday)).rejects.toThrow(/SOMA_OUTSIDE_HOURS/);
  });

  it("rejects an insert during time off", async () => {
    const p = await createProvider();
    const c = await createCustomer();
    const start = new Date(Date.now() + 48 * 3_600_000);
    start.setUTCMinutes(0, 0, 0);
    await sql()`insert into public.provider_time_off (provider_id, period, reason)
                values (${p.providerId}, tstzrange(${new Date(start.getTime() - 3_600_000)}, ${new Date(start.getTime() + 5 * 3_600_000)}), 'Urlaub')`;
    await expect(rawInsertBooking(p, c, start)).rejects.toThrow(/SOMA_TIME_OFF/);
    // the travel buffer also may not run into time off
    const justBefore = new Date(start.getTime() - 3_600_000 - 75 * 60_000); // ends 15 min before time off, buffer 30
    await expect(rawInsertBooking(p, c, justBefore)).rejects.toThrow(/SOMA_TIME_OFF/);
  });

  it("rejects an insert within the lead time", async () => {
    const p = await createProvider({ leadTimeMinutes: 180 });
    const c = await createCustomer();
    const soon = new Date(Date.now() + 2 * 3_600_000);
    soon.setUTCSeconds(0, 0);
    await expect(rawInsertBooking(p, c, soon)).rejects.toThrow(/SOMA_LEAD_TIME/);
  });

  it("rejects bookings of unapproved providers", async () => {
    const p = await createProvider({ status: "submitted" });
    const c = await createCustomer();
    await expect(rawInsertBooking(p, c, new Date(Date.now() + 24 * 3_600_000))).rejects.toThrow(/SOMA_PROVIDER_NOT_BOOKABLE/);
  });

  it("makes overlapping bookings impossible (exclusion constraint incl. travel buffer)", async () => {
    const p = await createProvider();
    const c = await createCustomer();
    const start = new Date(Date.now() + 30 * 3_600_000);
    start.setUTCMinutes(0, 0, 0);
    await rawInsertBooking(p, c, start);
    // starts 15 min after the first ends → inside the 30 min travel buffer
    await expect(rawInsertBooking(p, c, new Date(start.getTime() + 75 * 60_000))).rejects.toMatchObject({ code: "23P01" });
    // starts exactly at end + buffer → fine
    await expect(rawInsertBooking(p, c, new Date(start.getTime() + 90 * 60_000))).resolves.toBeTruthy();
  });

  it("rejects invalid status transitions and snapshot changes", async () => {
    const p = await createProvider();
    const c = await createCustomer();
    const id = await rawInsertBooking(p, c, new Date(Date.now() + 26 * 3_600_000));
    await expect(sql()`update public.bookings set status = 'completed' where id = ${id}`).rejects.toThrow(/SOMA_INVALID_TRANSITION/);
    await expect(sql()`update public.bookings set status = 'in_progress' where id = ${id}`).rejects.toThrow(/SOMA_INVALID_TRANSITION/);
    await expect(sql()`update public.bookings set total_cents = 1 where id = ${id}`).rejects.toThrow(/SOMA_BOOKING_IMMUTABLE/);
    await sql()`update public.bookings set status = 'confirmed' where id = ${id}`;
    // confirmed → in_progress only from starts_at − 30 min
    await expect(sql()`update public.bookings set status = 'in_progress' where id = ${id}`).rejects.toThrow(/SOMA_TOO_EARLY/);
    await sql()`update public.bookings set status = 'cancelled' where id = ${id}`;
    await expect(sql()`update public.bookings set status = 'confirmed' where id = ${id}`).rejects.toThrow(/SOMA_INVALID_TRANSITION/);
    const events = await sql()<{ toStatus: string }[]>`select to_status from public.booking_events where booking_id = ${id} order by created_at`;
    expect(events.map((e) => e.toStatus)).toEqual(["pending_payment", "confirmed", "cancelled"]);
  });

  it("new bookings must start in pending_payment", async () => {
    const p = await createProvider();
    const c = await createCustomer();
    const id = await rawInsertBooking(p, c, new Date(Date.now() + 40 * 3_600_000));
    const [b] = await sql()<{ status: string }[]>`select status from public.bookings where id = ${id}`;
    expect(b.status).toBe("pending_payment");
  });

  it("two concurrent createBooking calls for the same slot: exactly one succeeds", async () => {
    const p = await createProvider();
    const [a, b] = [await createCustomer(), await createCustomer()];
    const slot = await slotAtLeast(p.providerId, p.offerings.entspannungsmassage, 5);
    const attempt = (s: typeof a) => createBooking(s, { providerServiceId: p.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
    const results = await Promise.allSettled([attempt(a), attempt(b), attempt(a)]);
    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(2);
    for (const f of failed) {
      expect(f.reason).toBeInstanceOf(ServiceError);
      expect(["slot_taken", "unavailable"]).toContain((f.reason as ServiceError).code);
    }
    const [{ n }] = await sql()<{ n: number }[]>`select count(*)::int as n from public.bookings where provider_id = ${p.providerId}`;
    expect(n).toBe(1);
  });

  it("the losing insert gets the German slot-taken message", async () => {
    const p = await createProvider();
    const c = await createCustomer();
    const start = new Date(Date.now() + 50 * 3_600_000);
    start.setUTCMinutes(0, 0, 0);
    const db = sql();
    // Hold a transaction open with the first insert, race a second one against it.
    let release: () => void = () => undefined;
    const gate = new Promise<void>((r) => (release = r));
    const first = db.begin(async (tx) => {
      await tx`select 1`;
      await rawInsertBooking(p, c, start).catch(() => undefined);
      await gate;
    });
    await new Promise((r) => setTimeout(r, 50));
    const second = rawInsertBooking(p, c, start);
    release();
    await first;
    await expect(second).rejects.toMatchObject({ code: "23P01", constraint_name: "bookings_no_overlap" });
    const { mapDbError } = await import("@/server/db/errors");
    const mapped = await second.then(() => null, (e: unknown) => mapDbError(e));
    expect(mapped?.message).toBe("Dieser Termin wurde gerade vergeben. Bitte wählen Sie eine andere Uhrzeit.");
  });
});
