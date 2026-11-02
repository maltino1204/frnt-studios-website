import { describe, expect, it } from "vitest";
import {
  collectionLabel,
  durationsText,
  EDITORIAL_LABEL,
  exploreSearchHref,
  itemCountLabel,
  priceText,
  SPONSORED_LABEL,
} from "@/components/site/explore-copy";
import {
  collectionStatus,
  interleave,
  POPULAR_MIN_CITY_BOOKINGS,
  POPULAR_MIN_SERVICE_BOOKINGS,
  priceFrom,
  visibleRating,
} from "@/server/domain/explore";

const NBSP = " ";

describe("collection labels (UWG § 5a Abs. 4, DSA Art. 26)", () => {
  it("labels editorial collections „Von SOMA ausgewählt“ and says no one pays", () => {
    const l = collectionLabel({ isSponsored: false, sponsorName: null });
    expect(l).toMatchObject({ kind: "editorial", text: "Von SOMA ausgewählt" });
    expect(l.info).toMatch(/redaktionelle Auswahl/);
    expect(l.info).toMatch(/Niemand bezahlt/);
    expect(EDITORIAL_LABEL).toBe("Von SOMA ausgewählt");
  });
  it("labels sponsored collections „Anzeige“ and names the sponsor", () => {
    const l = collectionLabel({ isSponsored: true, sponsorName: " Studio Beispiel GmbH " });
    expect(l).toEqual({ kind: "sponsored", text: "Anzeige", info: "Bezahlte Platzierung im Auftrag von Studio Beispiel GmbH." });
    expect(SPONSORED_LABEL).toBe("Anzeige");
    // a sponsored flag always wins over the editorial label, even without a name
    expect(collectionLabel({ isSponsored: true, sponsorName: null }).text).toBe("Anzeige");
  });
});

describe("collection status (same predicate as the RLS policy)", () => {
  const now = new Date("2026-11-02T12:00:00Z");
  it("draft, scheduled, live, ended", () => {
    expect(collectionStatus({ isPublished: false, activeFrom: null, activeUntil: null }, now)).toBe("draft");
    expect(collectionStatus({ isPublished: true, activeFrom: null, activeUntil: null }, now)).toBe("live");
    expect(collectionStatus({ isPublished: true, activeFrom: "2026-11-03T00:00:00Z", activeUntil: null }, now)).toBe("scheduled");
    expect(collectionStatus({ isPublished: true, activeFrom: "2026-11-01T00:00:00Z", activeUntil: "2026-11-02T12:00:00Z" }, now)).toBe("ended");
    expect(collectionStatus({ isPublished: true, activeFrom: "2026-11-02T12:00:00Z", activeUntil: "2026-11-02T12:00:01Z" }, now)).toBe("live");
  });
});

describe("selection helpers", () => {
  it("interleaves categories so a rail is varied", () => {
    expect(interleave([["m1", "m2", "m3"], ["n1"], ["b1", "b2"]], 5)).toEqual(["m1", "n1", "b1", "m2", "b2"]);
    expect(interleave([[], ["x"]], 3)).toEqual(["x"]);
    expect(interleave([["a", "b"]], 1)).toEqual(["a"]);
  });
  it("shows ratings only from three real reviews", () => {
    expect(visibleRating(4.86, 12)).toEqual({ avg: 4.86, count: 12 });
    expect(visibleRating("4.5", 3)).toEqual({ avg: 4.5, count: 3 });
    expect(visibleRating(5, 2)).toBeNull();
    expect(visibleRating(null, 10)).toBeNull();
  });
  it("derives „ab“ prices from real prices only", () => {
    expect(priceFrom([8900, 12500])).toEqual({ cents: 8900, from: true });
    expect(priceFrom([5400, 5400])).toEqual({ cents: 5400, from: false });
    expect(priceFrom([])).toBeNull();
    expect(priceText({ cents: 8900, from: true })).toBe(`ab${NBSP}89${NBSP}€`);
    expect(priceText({ cents: 5450, from: false })).toBe(`54,50${NBSP}€`);
  });
  it("keeps the popularity floors at 5 per city and 3 per service", () => {
    expect(POPULAR_MIN_CITY_BOOKINGS).toBe(5);
    expect(POPULAR_MIN_SERVICE_BOOKINGS).toBe(3);
  });
});

describe("copy and links", () => {
  it("links category items into /suche with the existing params", () => {
    expect(exploreSearchHref("make-up", { zeit: "mittags" })).toBe("/suche?kategorie=make-up&zeit=mittags");
    expect(exploreSearchHref("massage", { plz: "10435", leistung: "sportmassage", datum: "2026-11-14", zeit: "abends" })).toBe(
      "/suche?plz=10435&kategorie=massage&leistung=sportmassage&datum=2026-11-14&zeit=abends",
    );
  });
  it("formats counts and durations with non-breaking spaces", () => {
    expect(itemCountLabel(1)).toBe(`1${NBSP}Behandlung`);
    expect(itemCountLabel(6)).toBe(`6${NBSP}Behandlungen`);
    expect(durationsText([90, 60, 60])).toBe(`60${NBSP}/${NBSP}90${NBSP}Min.`);
    expect(durationsText([])).toBe("");
  });
});
