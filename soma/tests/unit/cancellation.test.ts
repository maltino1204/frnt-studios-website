import { describe, expect, it } from "vitest";
import {
  applicableTier,
  computeCancellation,
  computeNoShowFee,
  freeCancellationUntil,
  GRACE_LABEL,
  isInGracePeriod,
  parsePolicy,
  policySchedule,
  type CancellableBooking,
} from "@/server/domain/cancellation";
import { splitRetainedAmounts } from "@/server/domain/pricing";

// SOMA Standard (docs/architecture.md §5.5), deliberately unsorted to test parsing.
const policy = parsePolicy({
  tiers: [
    { min_hours_before: 2, fee_percent: 50, travel_fee_retained: false },
    { min_hours_before: 24, fee_percent: 0, travel_fee_retained: false },
    { min_hours_before: 0, fee_percent: 100, travel_fee_retained: true },
  ],
  no_show_fee_percent: 100,
  provider_cancellation: "full_refund",
  grace_minutes: 15,
  fee_basis: "service_price",
});

const MIN = 60_000;
const HOUR = 60 * MIN;
const start = new Date("2026-11-10T15:00:00Z");
// Booked well before the 24-h deadline unless a test says otherwise.
const created = new Date(start.getTime() - 5 * 24 * HOUR);
// 80 € treatment + 15 € travel = 95 €
const booking = (over: Partial<CancellableBooking> = {}): CancellableBooking => ({
  status: "confirmed",
  startsAt: start,
  createdAt: created,
  servicePriceCents: 8000,
  travelFeeCents: 1500,
  serviceFeeCents: 0,
  discountCents: 0,
  totalCents: 9500,
  cancellationPolicy: policy,
  ...over,
});
const at = (hoursBefore: number, minutes = 0) => new Date(start.getTime() - hoursBefore * HOUR - minutes * MIN);

describe("policy parsing", () => {
  it("sorts tiers, keeps travel flags and grace, rejects empty policies", () => {
    expect(policy.tiers.map((t) => [t.min_hours_before, t.fee_percent, t.travel_fee_retained])).toEqual([
      [24, 0, false],
      [2, 50, false],
      [0, 100, true],
    ]);
    expect(policy.grace_minutes).toBe(15);
    expect(policy.fee_basis).toBe("service_price");
    expect(() => parsePolicy({ tiers: [] })).toThrow();
  });
  it("reads legacy snapshots: no grace, travel kept only in 100 % tiers", () => {
    const legacy = parsePolicy({ tiers: [{ min_hours_before: 24, fee_percent: 0 }, { min_hours_before: 2, fee_percent: 50 }, { min_hours_before: 0, fee_percent: 100 }], no_show_fee_percent: 100 });
    expect(legacy.grace_minutes).toBe(0);
    expect(legacy.tiers.map((t) => t.travel_fee_retained)).toEqual([false, false, true]);
  });
});

describe("customer cancellation tiers", () => {
  it("is free at exactly 24 h before", () => {
    expect(computeCancellation(booking(), at(24), "customer")).toEqual({
      feeCents: 0,
      refundCents: 9500,
      feePercent: 0,
      travelFeeRetained: false,
      retainedServiceCents: 0,
      retainedTravelCents: 0,
      inGracePeriod: false,
      tierLabel: "Kostenlose Stornierung",
    });
  });
  it("charges 50 % of the service price just inside 24 h and at exactly 2 h; travel refunded", () => {
    expect(computeCancellation(booking(), at(23, 59), "customer").feeCents).toBe(4000);
    expect(computeCancellation(booking(), at(2), "customer")).toMatchObject({
      feeCents: 4000,
      refundCents: 5500,
      feePercent: 50,
      travelFeeRetained: false,
      retainedServiceCents: 4000,
      retainedTravelCents: 0,
      tierLabel: "50 % des Behandlungspreises, Anfahrt wird erstattet",
    });
  });
  it("charges 100 % of the service price plus travel inside 2 h and after the start", () => {
    expect(computeCancellation(booking(), at(1, 59), "customer")).toMatchObject({ feeCents: 9500, refundCents: 0, travelFeeRetained: true, retainedTravelCents: 1500 });
    expect(computeCancellation(booking(), at(-1), "customer").feeCents).toBe(9500);
    expect(applicableTier(policy, start, at(-5)).fee_percent).toBe(100);
  });
  it("never charges the customer service fee", () => {
    const out = computeCancellation(booking({ serviceFeeCents: 300, totalCents: 9800 }), at(10), "customer");
    expect(out.feeCents).toBe(4000);
    expect(out.refundCents).toBe(5800);
    expect(computeCancellation(booking({ serviceFeeCents: 300, totalCents: 9800 }), at(1), "customer")).toMatchObject({ feeCents: 9500, refundCents: 300 });
  });
  it("applies the percentage to the cash part when credits were redeemed", () => {
    const out = computeCancellation(booking({ discountCents: 2000, totalCents: 7500 }), at(10), "customer");
    expect(out.feeCents).toBe(3000); // 50 % of (80 € − 20 € credit)
    expect(out.retainedServiceCents).toBe(4000); // commission basis: 50 % of the treatment
  });
  it("is always free for requested bookings and holds", () => {
    expect(computeCancellation(booking({ status: "requested" }), at(1), "customer").feeCents).toBe(0);
    expect(computeCancellation(booking({ status: "pending_payment" }), at(1), "customer").feeCents).toBe(0);
  });
  it("refunds fully when the provider or the system cancels", () => {
    expect(computeCancellation(booking(), at(1), "provider")).toMatchObject({ feeCents: 0, refundCents: 9500 });
    expect(computeCancellation(booking(), at(1), "system").feeCents).toBe(0);
  });
});

describe("Bedenkzeit (15 minutes after booking)", () => {
  // Booked 3 h before the start: the 50 % tier would apply right away without the grace window.
  const lateCreated = at(3);
  const late = booking({ createdAt: lateCreated });
  const after = (minutes: number) => new Date(lateCreated.getTime() + minutes * MIN);

  it("is free at t+14 min and exactly at t+15 min", () => {
    expect(computeCancellation(late, after(14), "customer")).toMatchObject({ feeCents: 0, refundCents: 9500, inGracePeriod: true, tierLabel: GRACE_LABEL });
    expect(computeCancellation(late, after(15), "customer").feeCents).toBe(0);
  });
  it("applies the regular tier at t+16 min", () => {
    expect(isInGracePeriod(policy, lateCreated, start, after(16))).toBe(false);
    expect(computeCancellation(late, after(16), "customer")).toMatchObject({ feeCents: 4000, inGracePeriod: false });
  });
  it("also overrides the 100 % tier for very short-notice bookings", () => {
    const veryLate = booking({ createdAt: at(1) });
    expect(computeCancellation(veryLate, new Date(at(1).getTime() + 10 * MIN), "customer").feeCents).toBe(0);
    expect(computeCancellation(veryLate, new Date(at(1).getTime() + 16 * MIN), "customer").feeCents).toBe(9500);
  });
  it("ends at the start at the latest", () => {
    const now = booking({ createdAt: new Date(start.getTime() - 5 * MIN) });
    expect(computeCancellation(now, new Date(start.getTime() + 2 * MIN), "customer").feeCents).toBe(9500);
  });
  it("does not apply to legacy snapshots without grace_minutes", () => {
    const legacy = parsePolicy({ tiers: [{ min_hours_before: 24, fee_percent: 0 }, { min_hours_before: 2, fee_percent: 50 }, { min_hours_before: 0, fee_percent: 100 }] });
    expect(computeCancellation(booking({ createdAt: lateCreated, cancellationPolicy: legacy }), after(5), "customer").feeCents).toBe(4000);
  });
});

describe("no-show", () => {
  it("charges 100 % of the service price plus the travel fee", () => {
    expect(computeNoShowFee(booking())).toMatchObject({ feeCents: 9500, refundCents: 0, retainedServiceCents: 8000, retainedTravelCents: 1500, travelFeeRetained: true });
  });
  it("uses the snapshot's no-show percentage on the service price only", () => {
    const p = parsePolicy({ ...policy, no_show_fee_percent: 50 });
    expect(computeNoShowFee(booking({ cancellationPolicy: p })).feeCents).toBe(4000 + 1500);
  });
});

describe("commission on retained amounts", () => {
  it("takes commission only from the service share; the travel fee goes fully to the provider", () => {
    expect(splitRetainedAmounts(4000, 0, 0.2)).toEqual({ commissionCents: 800, providerPayoutCents: 3200 });
    expect(splitRetainedAmounts(8000, 1500, 0.2)).toEqual({ commissionCents: 1600, providerPayoutCents: 7900 });
  });
});

describe("schedule", () => {
  it("builds a concrete schedule without a booking time", () => {
    const s = policySchedule(policy, start);
    expect(s).toHaveLength(3);
    expect(s[0]).toMatchObject({ from: null, until: "2026-11-09T15:00:00.000Z", feePercent: 0, travelFeeRetained: false });
    expect(s[1]).toMatchObject({ from: "2026-11-09T15:00:00.000Z", until: "2026-11-10T13:00:00.000Z", feePercent: 50, travelFeeRetained: false });
    expect(s[2]).toMatchObject({ from: "2026-11-10T13:00:00.000Z", until: null, feePercent: 100, travelFeeRetained: true });
    expect(freeCancellationUntil(policy, start)).toBe("2026-11-09T15:00:00.000Z");
  });
  it("keeps the 24-h deadline when the booking was made long before", () => {
    expect(policySchedule(policy, start, created)).toEqual(policySchedule(policy, start));
    expect(freeCancellationUntil(policy, start, created)).toBe("2026-11-09T15:00:00.000Z");
  });
  it("shows the Bedenkzeit when it ends after the 24-h deadline", () => {
    const bookedAt = new Date("2026-11-10T12:00:00Z"); // 3 h before the start
    const s = policySchedule(policy, start, bookedAt);
    expect(s[0]).toMatchObject({ from: null, until: "2026-11-10T12:15:00.000Z", feePercent: 0, label: GRACE_LABEL });
    expect(s[1]).toMatchObject({ from: "2026-11-10T12:15:00.000Z", until: "2026-11-10T13:00:00.000Z", feePercent: 50 });
    expect(s[2]).toMatchObject({ from: "2026-11-10T13:00:00.000Z", until: null, feePercent: 100 });
    expect(freeCancellationUntil(policy, start, bookedAt)).toBe("2026-11-10T12:15:00.000Z");
  });
  it("starts the strict tier right after the Bedenkzeit for short-notice bookings", () => {
    const bookedAt = new Date("2026-11-10T14:00:00Z"); // 1 h before
    const s = policySchedule(policy, start, bookedAt);
    expect(s).toHaveLength(2);
    expect(s[1]).toMatchObject({ from: "2026-11-10T14:15:00.000Z", until: null, feePercent: 100 });
  });
});
