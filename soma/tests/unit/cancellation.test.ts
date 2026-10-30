import { describe, expect, it } from "vitest";
import {
  applicableTier,
  computeCancellation,
  computeNoShowFee,
  freeCancellationUntil,
  parsePolicy,
  policySchedule,
  type CancellableBooking,
} from "@/server/domain/cancellation";

const policy = parsePolicy({
  tiers: [
    { min_hours_before: 2, fee_percent: 50 },
    { min_hours_before: 24, fee_percent: 0 },
    { min_hours_before: 0, fee_percent: 100 },
  ],
  no_show_fee_percent: 100,
  provider_cancellation: "full_refund",
});

const start = new Date("2026-11-10T15:00:00Z");
const booking = (over: Partial<CancellableBooking> = {}): CancellableBooking => ({
  status: "confirmed", startsAt: start, totalCents: 9500, serviceFeeCents: 0, cancellationPolicy: policy, ...over,
});
const at = (hoursBefore: number, minutes = 0) => new Date(start.getTime() - hoursBefore * 3_600_000 - minutes * 60_000);

describe("cancellation tiers", () => {
  it("sorts tiers and rejects empty policies", () => {
    expect(policy.tiers.map((t) => t.min_hours_before)).toEqual([24, 2, 0]);
    expect(() => parsePolicy({ tiers: [] })).toThrow();
  });

  it("is free at exactly 24 h before", () => {
    expect(computeCancellation(booking(), at(24), "customer")).toEqual({ feeCents: 0, refundCents: 9500, feePercent: 0, tierLabel: "Kostenlose Stornierung" });
  });
  it("charges 50 % just inside 24 h and at exactly 2 h", () => {
    expect(computeCancellation(booking(), at(23, 59), "customer").feeCents).toBe(4750);
    expect(computeCancellation(booking(), at(2), "customer")).toMatchObject({ feeCents: 4750, refundCents: 4750, tierLabel: "50 % Stornogebühr" });
  });
  it("charges 100 % inside 2 h and after the start", () => {
    expect(computeCancellation(booking(), at(1, 59), "customer").feeCents).toBe(9500);
    expect(computeCancellation(booking(), at(-1), "customer").feeCents).toBe(9500);
    expect(applicableTier(policy, start, at(-5)).fee_percent).toBe(100);
  });
  it("excludes the service fee from the fee base", () => {
    const out = computeCancellation(booking({ totalCents: 10_000, serviceFeeCents: 500 }), at(10), "customer");
    expect(out.feeCents).toBe(4750);
    expect(out.refundCents).toBe(5250);
  });
  it("is always free for requested bookings and holds", () => {
    expect(computeCancellation(booking({ status: "requested" }), at(1), "customer").feeCents).toBe(0);
    expect(computeCancellation(booking({ status: "pending_payment" }), at(1), "customer").feeCents).toBe(0);
  });
  it("refunds fully when the provider or the system cancels", () => {
    expect(computeCancellation(booking(), at(1), "provider")).toMatchObject({ feeCents: 0, refundCents: 9500 });
    expect(computeCancellation(booking(), at(1), "system").feeCents).toBe(0);
  });
  it("charges the no-show fee", () => {
    expect(computeNoShowFee(booking()).feeCents).toBe(9500);
  });
  it("builds a concrete schedule", () => {
    const s = policySchedule(policy, start);
    expect(s).toHaveLength(3);
    expect(s[0]).toMatchObject({ from: null, until: "2026-11-09T15:00:00.000Z", feePercent: 0 });
    expect(s[1]).toMatchObject({ from: "2026-11-09T15:00:00.000Z", until: "2026-11-10T13:00:00.000Z", feePercent: 50 });
    expect(s[2]).toMatchObject({ from: "2026-11-10T13:00:00.000Z", until: null, feePercent: 100 });
    expect(freeCancellationUntil(policy, start)).toBe("2026-11-09T15:00:00.000Z");
  });
});
