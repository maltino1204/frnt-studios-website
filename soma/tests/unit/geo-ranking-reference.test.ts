import { describe, expect, it } from "vitest";
import { haversineKm, isValidPostalCode, isWithinRadius, roundKm } from "@/server/domain/geo";
import { bayesianRating, newProBoost, profileCompleteness, rankScore, sortRanked, timeFitScore } from "@/server/domain/ranking";
import { generateBookingReference, generateStartCode, isBookingReference, isStartCode, randomCode } from "@/server/domain/reference";

describe("geo", () => {
  it("computes haversine distances", () => {
    const berlin = { lat: 52.52, lng: 13.405 };
    const hamburg = { lat: 53.5511, lng: 9.9937 };
    expect(haversineKm(berlin, berlin)).toBe(0);
    expect(haversineKm(berlin, hamburg)).toBeGreaterThan(250);
    expect(haversineKm(berlin, hamburg)).toBeLessThan(260);
    expect(roundKm(3.14159)).toBe(3.14);
    expect(isWithinRadius(berlin, { lat: 52.6, lng: 13.405 }, 9)).toBe(true);
    expect(isWithinRadius(berlin, { lat: 52.6, lng: 13.405 }, 8.5)).toBe(false);
    expect(isValidPostalCode("10115")).toBe(true);
    expect(isValidPostalCode("1011")).toBe(false);
  });
});

describe("ranking", () => {
  const now = new Date("2026-11-01T10:00:00Z");
  it("shrinks ratings towards the prior", () => {
    expect(bayesianRating(null, 0)).toBeCloseTo(4.6);
    expect(bayesianRating(5, 1)).toBeCloseTo((5 * 4.6 + 5) / 6);
    expect(bayesianRating(4.9, 200)).toBeGreaterThan(bayesianRating(5, 2));
  });
  it("scores time fit, proximity and new-pro boost", () => {
    expect(timeFitScore(null, now)).toBe(0);
    expect(timeFitScore(now, now)).toBe(1);
    expect(timeFitScore(new Date(now.getTime() + 3 * 3_600_000), now, now)).toBeCloseTo(0.5);
    expect(newProBoost(0, now, now)).toBe(1);
    expect(newProBoost(5, now, now)).toBe(0);
    expect(newProBoost(0, new Date("2026-09-01T00:00:00Z"), now)).toBe(0);
    expect(profileCompleteness({ hasAvatar: true, bioLength: 200, portfolioCount: 3, languageCount: 2 })).toBe(1);
  });
  it("ranks a closer, better rated, instant provider higher", () => {
    const common = { radiusKm: 10, now, completedCount: 20, approvedAt: new Date("2025-01-01"), profileCompleteness: 1, firstSlot: now };
    const a = rankScore({ ...common, ratingAvg: 4.9, ratingCount: 40, distanceKm: 2, instant: true });
    const b = rankScore({ ...common, ratingAvg: 4.2, ratingCount: 40, distanceKm: 8, instant: false });
    expect(a).toBeGreaterThan(b);
  });
  it("sorts by the requested order", () => {
    const items = [
      { id: "a", score: 0.5, firstSlot: "2026-11-02T10:00:00Z", totalPriceCents: 9000, ratingAvg: 4.9, ratingCount: 50 },
      { id: "b", score: 0.9, firstSlot: "2026-11-03T10:00:00Z", totalPriceCents: 7000, ratingAvg: 4.1, ratingCount: 10 },
      { id: "c", score: 0.7, firstSlot: null, totalPriceCents: 8000, ratingAvg: null, ratingCount: 0 },
    ];
    expect(sortRanked(items, "recommended").map((i) => i.id)).toEqual(["b", "c", "a"]);
    expect(sortRanked(items, "earliest").map((i) => i.id)).toEqual(["a", "b", "c"]);
    expect(sortRanked(items, "price_asc").map((i) => i.id)).toEqual(["b", "c", "a"]);
    expect(sortRanked(items, "rating").map((i) => i.id)).toEqual(["a", "c", "b"]);
  });
});

describe("reference codes", () => {
  it("generates valid booking references and start codes", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(isBookingReference(generateBookingReference())).toBe(true);
      expect(isStartCode(generateStartCode())).toBe(true);
    }
    expect(isBookingReference("sm-7kx4q2")).toBe(true);
    expect(isBookingReference("SM-7KX4Q0")).toBe(false); // 0 is not in the alphabet
  });
  it("is deterministic with an injected random source", () => {
    expect(randomCode(4, () => 0)).toBe("2222");
    expect(generateStartCode(() => 7)).toBe("0007");
  });
});

import { findHealthClaims } from "@/server/domain/content-lint";

describe("HWG content lint", () => {
  it("flags healing claims and protected titles, accepts wellness wording", () => {
    expect(findHealthClaims("Meine Massage lindert Rückenschmerzen.").map((c) => c.hint)).toContain("Linderungsversprechen");
    expect(findHealthClaims("Ausgebildete Physiotherapeutin")).toHaveLength(2);
    expect(findHealthClaims("Entspannende, wohltuende Wellnessmassage für Körper und Seele.")).toEqual([]);
    expect(findHealthClaims(null)).toEqual([]);
  });
});
