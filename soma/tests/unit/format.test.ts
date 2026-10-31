import { describe, expect, it } from "vitest";
import { formatDayShort, formatSlotRange } from "@/lib/format";

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
});
