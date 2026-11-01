import { describe, expect, it } from "vitest";
import { formatClock, formatDayShort, formatDistance, formatDuration, formatPrice, formatSlotRange } from "@/lib/format";

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
});
