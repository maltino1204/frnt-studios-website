import { describe, expect, it } from "vitest";
import { computePrice, computeTravelFee, resolveCommission, roundToFiftyCents, splitRetainedAmounts, type CommissionRule } from "@/server/domain/pricing";

const rule = (over: Partial<CommissionRule>): CommissionRule => ({
  scope: "global", categoryId: null, providerId: null, rate: 0.2, repeatClientRate: 0.12, ownClientRate: 0.05, isActive: true, ...over,
});

describe("travel fee", () => {
  const cfg = { baseCents: 500, includedKm: 3, perKmCents: 80 };
  it("charges only the base within the included distance (boundary inclusive)", () => {
    expect(computeTravelFee(0, cfg)).toBe(500);
    expect(computeTravelFee(3, cfg)).toBe(500);
  });
  it("adds started kilometres beyond the included distance", () => {
    expect(computeTravelFee(3.01, cfg)).toBe(600); // 500 + 1*80 = 580 → 600
    expect(computeTravelFee(5.2, cfg)).toBe(750); // 500 + 3*80 = 740 → 750
  });
  it("rounds to 50 cents", () => {
    expect(roundToFiftyCents(574)).toBe(550);
    expect(roundToFiftyCents(575)).toBe(600);
    expect(computeTravelFee(10, { baseCents: 0, includedKm: 0, perKmCents: 33 })).toBe(350);
  });
  it("rejects invalid distances", () => {
    expect(() => computeTravelFee(-1, cfg)).toThrow();
  });
});

describe("price breakdown", () => {
  it("computes totals, commission on the service only, payout incl. travel", () => {
    const p = computePrice({ servicePriceCents: 8900, travelFeeCents: 600, serviceFeeCents: 0, availableCreditsCents: 0, useCredits: false, commissionRate: 0.2 });
    expect(p).toMatchObject({ totalCents: 9500, commissionCents: 1780, providerPayoutCents: 7720, discountCents: 0 });
  });
  it("applies credits up to the service price only", () => {
    const p = computePrice({ servicePriceCents: 4000, travelFeeCents: 500, serviceFeeCents: 100, availableCreditsCents: 9000, useCredits: true, commissionRate: 0.12 });
    expect(p.discountCents).toBe(4000);
    expect(p.totalCents).toBe(600);
    expect(p.providerPayoutCents).toBe(4000 - 480 + 500);
  });
  it("ignores credits when not requested", () => {
    expect(computePrice({ servicePriceCents: 4000, travelFeeCents: 0, serviceFeeCents: 0, availableCreditsCents: 1500, useCredits: false, commissionRate: 0.2 }).discountCents).toBe(0);
  });
  it("rounds commission half up", () => {
    expect(computePrice({ servicePriceCents: 4525, travelFeeCents: 0, serviceFeeCents: 0, availableCreditsCents: 0, useCredits: false, commissionRate: 0.2 }).commissionCents).toBe(905);
    expect(computePrice({ servicePriceCents: 4513, travelFeeCents: 0, serviceFeeCents: 0, availableCreditsCents: 0, useCredits: false, commissionRate: 0.12 }).commissionCents).toBe(542);
  });
  it("splits retained amounts: commission on the service share only, travel to the provider", () => {
    expect(splitRetainedAmounts(5000, 0, 0.2)).toEqual({ commissionCents: 1000, providerPayoutCents: 4000 });
    expect(splitRetainedAmounts(5000, 1200, 0.2)).toEqual({ commissionCents: 1000, providerPayoutCents: 5200 });
  });
});

describe("commission resolution", () => {
  const rules = [
    rule({}),
    rule({ scope: "category", categoryId: "cat-hair", rate: 0.15, repeatClientRate: 0.1, ownClientRate: 0.03 }),
    rule({ scope: "provider", providerId: "pro-vip", rate: 0.1, repeatClientRate: 0.08, ownClientRate: 0.02 }),
    rule({ scope: "provider", providerId: "pro-old", rate: 0.01, isActive: false }),
  ];
  const ctx = { providerId: "pro-1", categoryId: "cat-nails", isOwnClient: false, isRepeatClient: false };

  it("falls back to the global rule (base tier 20 %)", () => {
    expect(resolveCommission(rules, ctx)).toEqual({ rate: 0.2, tier: "base", ruleScope: "global" });
  });
  it("prefers a category rule over global and a provider rule over both", () => {
    expect(resolveCommission(rules, { ...ctx, categoryId: "cat-hair" }).rate).toBe(0.15);
    expect(resolveCommission(rules, { ...ctx, providerId: "pro-vip", categoryId: "cat-hair" }).rate).toBe(0.1);
  });
  it("ignores inactive rules", () => {
    expect(resolveCommission(rules, { ...ctx, providerId: "pro-old" }).rate).toBe(0.2);
  });
  it("orders tiers own_client → repeat → base", () => {
    expect(resolveCommission(rules, { ...ctx, isRepeatClient: true })).toMatchObject({ rate: 0.12, tier: "repeat" });
    expect(resolveCommission(rules, { ...ctx, isOwnClient: true, isRepeatClient: true })).toMatchObject({ rate: 0.05, tier: "own_client" });
    expect(resolveCommission(rules, { ...ctx, categoryId: "cat-hair", isOwnClient: true })).toMatchObject({ rate: 0.03, tier: "own_client" });
  });
  it("uses the provider override for the base tier only", () => {
    expect(resolveCommission(rules, { ...ctx, providerRateOverride: 0.18 })).toEqual({ rate: 0.18, tier: "base", ruleScope: "override" });
    expect(resolveCommission(rules, { ...ctx, providerRateOverride: 0.18, isRepeatClient: true }).rate).toBe(0.12);
  });
  it("throws without any active rule", () => {
    expect(() => resolveCommission([], ctx)).toThrow();
  });
});

import { formatEuroCents, includedVatCents, vatNote } from "@/server/domain/pricing";

describe("VAT notes (PAngV / § 19 UStG)", () => {
  const nb = (s: string) => s.replace(/ /g, " ");
  it("computes the contained 19 % VAT on the gross total, rounded to cents", () => {
    expect(includedVatCents(7917)).toBe(1264); // 79,17 € → 12,64 €
    expect(includedVatCents(11900)).toBe(1900);
    expect(includedVatCents(9500)).toBe(1517); // 95 − 79,83… = 15,168 → 15,17
    expect(includedVatCents(1)).toBe(0);
    expect(includedVatCents(0)).toBe(0);
    expect(includedVatCents(-500)).toBe(0);
  });
  it("formats euro amounts the German way", () => {
    expect(formatEuroCents(1264)).toBe(nb("12,64 €"));
    expect(formatEuroCents(123456)).toBe(nb("1.234,56 €"));
    expect(formatEuroCents(5)).toBe(nb("0,05 €"));
  });
  it("builds the note per VAT mode", () => {
    expect(vatNote("regular", 7917)).toBe("inkl. 19 % MwSt. (enthalten: 12,64 €)");
    expect(vatNote("small_business", 7917)).toBe("Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.");
    expect(vatNote("regular", 0)).toBe("inkl. 19 % MwSt. (enthalten: 0,00 €)");
  });
});
