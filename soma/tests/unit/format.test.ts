import { describe, expect, it } from "vitest";
import { berlinDateKey, formatClock, formatDayShort, formatDistance, formatDuration, formatPrice, formatSlotRange } from "@/lib/format";

const NBSP = " ";

describe("format (de-DE, Europe/Berlin)", () => {
  it("keeps a short date together with non-breaking spaces (guideline §3, A5-12)", () => {
    const d = new Date("2026-11-01T09:00:00Z");
    expect(formatDayShort(d)).toBe(`So.,${NBSP}1.${NBSP}Nov.`);
    expect(formatDayShort(d)).not.toMatch(/ /);
  });

  it("uses the short date in slot ranges", () => {
    expect(formatSlotRange("2026-11-06T13:30:00Z", "2026-11-06T14:30:00Z")).toBe(`Fr.,${NBSP}6.${NBSP}Nov. · 14:30–15:30`);
  });

  it("joins numbers and units with a non-breaking space (brand/BRAND_VOICE.md § 4)", () => {
    expect(formatDuration(60)).toBe(`60${NBSP}Min.`);
    expect(formatDuration(150)).toBe(`2${NBSP}Std. 30${NBSP}Min.`);
    expect(formatDistance(2.35)).toBe(`2,4${NBSP}km`);
    expect(formatClock("2026-11-06T17:30:00Z")).toBe(`18:30${NBSP}Uhr`);
    expect(formatPrice(5400)).toBe(`54${NBSP}€`);
  });

  it("berlinDateKey equals the Intl Europe/Berlin calendar day at every hour 2020–2035, incl. both DST switches", () => {
    const intl = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" });
    const start = Date.UTC(2020, 0, 1);
    const end = Date.UTC(2036, 0, 1);
    let mismatches = 0;
    for (let t = start; t < end; t += 3_600_000) {
      for (const off of [0, 59 * 60_000 + 59_000]) if (berlinDateKey(t + off) !== intl.format(t + off)) mismatches++;
    }
    expect(mismatches).toBe(0);
    // minutes around the switches themselves (01:00 UTC, last Sundays of March and October)
    for (const iso of ["2026-03-29T00:59:59Z", "2026-03-29T01:00:00Z", "2026-10-25T00:59:59Z", "2026-10-25T01:00:00Z", "2026-10-24T22:00:00Z", "2026-10-24T21:59:59Z"]) {
      expect(berlinDateKey(iso)).toBe(intl.format(new Date(iso)));
    }
    expect(() => berlinDateKey("invalid")).toThrow(RangeError);
  });
});
