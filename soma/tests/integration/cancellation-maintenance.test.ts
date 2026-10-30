import { describe, expect, it } from "vitest";
import { getCreditSummary } from "@/server/services/account";
import { runBookingMaintenance } from "@/server/services/booking-maintenance";
import { cancelBooking, confirmDevPayment, createBooking, markNoShow } from "@/server/services/bookings";
import { createCustomer, createProvider, NEW_ADDRESS, slotAtLeast, sql, timeTravel } from "./support/fixtures";

async function confirmedBooking(minHoursAhead: number, opts: { useCredits?: boolean; referralCode?: string } = {}) {
  const pro = await createProvider({ leadTimeMinutes: 0, travelFee: { baseCents: 1000, includedKm: 50, perKmCents: 0 } });
  const c = await createCustomer({ referralCode: opts.referralCode });
  const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, minHoursAhead);
  const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS, useCredits: opts.useCredits });
  await confirmDevPayment(c, b.bookingId);
  return { pro, c, b, slot };
}

const payment = async (bookingId: string) =>
  (await sql()<{ status: string; capturedCents: number }[]>`select status, captured_cents from public.payments where booking_id = ${bookingId}`)[0];
const booking = async (bookingId: string) =>
  (await sql()<{ status: string; cancellationFeeCents: number; refundCents: number; providerPayoutCents: number; commissionCents: number; cancelledBy: string }[]>`
    select status, cancellation_fee_cents, refund_cents, provider_payout_cents, commission_cents, cancelled_by from public.bookings where id = ${bookingId}`)[0];

describe("cancellation fees by tier (total 90 € = 80 € + 10 € travel)", () => {
  it("≥ 24 h before: free, authorization released", async () => {
    const { c, b } = await confirmedBooking(30);
    const r = await cancelBooking(c, b.bookingId, "Termin passt nicht");
    expect(r).toEqual({ status: "cancelled", feeCents: 0, refundCents: 9000 });
    expect(await payment(b.bookingId)).toEqual({ status: "cancelled", capturedCents: 0 });
  });

  it("between 24 h and 2 h: 50 % fee, partial capture, provider gets the fee minus commission", async () => {
    const { c, b } = await confirmedBooking(10);
    const r = await cancelBooking(c, b.bookingId);
    expect(r).toEqual({ status: "cancelled", feeCents: 4500, refundCents: 4500 });
    expect(await payment(b.bookingId)).toEqual({ status: "captured", capturedCents: 4500 });
    expect(await booking(b.bookingId)).toMatchObject({ cancellationFeeCents: 4500, commissionCents: 900, providerPayoutCents: 3600, cancelledBy: "customer" });
  });

  it("less than 2 h before: 100 % fee", async () => {
    const { c, b } = await confirmedBooking(1);
    const r = await cancelBooking(c, b.bookingId);
    expect(r.feeCents).toBe(9000);
    expect(r.refundCents).toBe(0);
  });

  it("provider cancellation: always a full refund; requested bookings are free for the customer", async () => {
    const { pro, b } = await confirmedBooking(1);
    await expect(cancelBooking(pro.session, b.bookingId)).rejects.toThrow(/Grund/);
    expect(await cancelBooking(pro.session, b.bookingId, "Krankheit")).toMatchObject({ feeCents: 0, refundCents: 9000 });
    expect((await booking(b.bookingId)).cancelledBy).toBe("provider");

    const reqPro = await createProvider({ bookingMode: "request", leadTimeMinutes: 0 });
    const c2 = await createCustomer();
    const slot = await slotAtLeast(reqPro.providerId, reqPro.offerings.entspannungsmassage, 1);
    const b2 = await createBooking(c2, { providerServiceId: reqPro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
    await confirmDevPayment(c2, b2.bookingId);
    expect((await cancelBooking(c2, b2.bookingId)).feeCents).toBe(0);
  });

  it("cannot cancel someone else's booking or twice", async () => {
    const { c, b } = await confirmedBooking(30);
    const stranger = await createCustomer();
    await expect(cancelBooking(stranger, b.bookingId)).rejects.toThrow(/nicht gefunden/);
    await cancelBooking(c, b.bookingId);
    await expect(cancelBooking(c, b.bookingId)).rejects.toMatchObject({ code: "invalid_state" });
  });

  it("returns redeemed credits proportionally to the refund", async () => {
    const ref = await createCustomer();
    const [{ referralCode }] = await sql()<{ referralCode: string }[]>`select referral_code from public.profiles where id = ${ref.userId}`;
    const free = await confirmedBooking(30, { useCredits: true, referralCode });
    expect((await getCreditSummary(free.c)).balanceCents).toBe(0);
    await cancelBooking(free.c, free.b.bookingId);
    expect((await getCreditSummary(free.c)).balanceCents).toBe(1500);

    const half = await confirmedBooking(10, { useCredits: true, referralCode });
    await cancelBooking(half.c, half.b.bookingId);
    expect((await getCreditSummary(half.c)).balanceCents).toBe(750);
  });

  it("no-show from 15 minutes after the start: 100 % fee", async () => {
    const { pro, b } = await confirmedBooking(3);
    await expect(markNoShow(pro.session, b.bookingId)).rejects.toThrow(/15 Minuten/);
    await timeTravel(b.bookingId, new Date(Date.now() - 20 * 60_000));
    expect(await markNoShow(pro.session, b.bookingId)).toEqual({ status: "no_show", feeCents: 9000 });
    expect(await payment(b.bookingId)).toEqual({ status: "captured", capturedCents: 9000 });
  });
});

describe("booking maintenance", () => {
  it("expires unpaid holds after hold_minutes and frees the slot", async () => {
    const pro = await createProvider();
    const [c, c2] = [await createCustomer(), await createCustomer()];
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 5);
    const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
    await runBookingMaintenance(new Date(Date.now() + 5 * 60_000));
    expect((await booking(b.bookingId)).status).toBe("pending_payment");
    const r = await runBookingMaintenance(new Date(Date.now() + 11 * 60_000));
    expect(r.expiredHolds).toBeGreaterThanOrEqual(1);
    expect((await booking(b.bookingId)).status).toBe("expired");
    expect((await payment(b.bookingId)).status).toBe("cancelled");
    await expect(confirmDevPayment(c, b.bookingId)).rejects.toMatchObject({ code: "invalid_state" });
    // the slot can be booked again
    await expect(createBooking(c2, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS })).resolves.toBeTruthy();
  });

  it("expires unanswered requests after respond_by and notifies the customer", async () => {
    const pro = await createProvider({ bookingMode: "request" });
    const c = await createCustomer();
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 30);
    const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
    await confirmDevPayment(c, b.bookingId);
    const [{ respondBy }] = await sql()<{ respondBy: Date }[]>`select respond_by from public.bookings where id = ${b.bookingId}`;
    expect(respondBy.getTime()).toBeLessThanOrEqual(Date.now() + 12 * 3_600_000 + 5_000);
    await runBookingMaintenance(new Date(respondBy.getTime() - 60_000));
    expect((await booking(b.bookingId)).status).toBe("requested");
    const r = await runBookingMaintenance(new Date(respondBy.getTime() + 60_000));
    expect(r.expiredRequests).toBeGreaterThanOrEqual(1);
    expect(await booking(b.bookingId)).toMatchObject({ status: "expired", cancelledBy: "system" });
    const notes = await sql()<{ type: string }[]>`select type from public.notifications where user_id = ${c.userId} order by created_at`;
    expect(notes.map((n) => n.type)).toContain("booking.expired");
    const [outbox] = await sql()<{ n: number }[]>`select count(*)::int as n from public.email_outbox where to_user_id = ${c.userId} and template = 'booking.expired'`;
    expect(outbox.n).toBe(1);
  });

  it("auto-completes 24 h after the end and sends 24 h reminders", async () => {
    const pro = await createProvider();
    const c = await createCustomer();
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 3);
    const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
    await confirmDevPayment(c, b.bookingId);
    const r1 = await runBookingMaintenance();
    expect(r1.reminders).toBeGreaterThanOrEqual(1);
    await timeTravel(b.bookingId, new Date(Date.now() - 27 * 3_600_000));
    const r2 = await runBookingMaintenance();
    expect(r2.autoCompleted).toBeGreaterThanOrEqual(1);
    expect((await booking(b.bookingId)).status).toBe("completed");
    expect((await payment(b.bookingId)).status).toBe("captured");
  });
});
