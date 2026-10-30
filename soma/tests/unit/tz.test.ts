import { describe, expect, it } from "vitest";
import { addDays, isoWeekdayOf, isValidLocalDate, offsetMinutes, parseTimeOfDay, toWallClock, wallTimeToInstant } from "@/server/domain/tz";

describe("tz (Europe/Berlin)", () => {
  it("knows winter and summer offsets", () => {
    expect(offsetMinutes(new Date("2026-01-15T12:00:00Z"))).toBe(60);
    expect(offsetMinutes(new Date("2026-07-15T12:00:00Z"))).toBe(120);
  });

  it("converts wall time to instants on normal days", () => {
    expect(wallTimeToInstant("2026-11-02", 9 * 60).instant.toISOString()).toBe("2026-11-02T08:00:00.000Z");
    expect(wallTimeToInstant("2026-07-01", 9 * 60).instant.toISOString()).toBe("2026-07-01T07:00:00.000Z");
    expect(wallTimeToInstant("2026-07-01", 1440).instant.toISOString()).toBe("2026-07-01T22:00:00.000Z");
  });

  it("flags the spring-forward gap (last Sunday of March)", () => {
    const gap = wallTimeToInstant("2027-03-28", 2 * 60 + 30);
    expect(gap.exists).toBe(false);
    const before = wallTimeToInstant("2027-03-28", 60 + 30);
    expect(before.exists).toBe(true);
    expect(before.instant.toISOString()).toBe("2027-03-28T00:30:00.000Z");
    expect(wallTimeToInstant("2027-03-28", 3 * 60).instant.toISOString()).toBe("2027-03-28T01:00:00.000Z");
  });

  it("resolves the fall-back overlap (last Sunday of October) to the first occurrence", () => {
    const amb = wallTimeToInstant("2026-10-25", 2 * 60 + 30);
    expect(amb.ambiguous).toBe(true);
    expect(amb.instant.toISOString()).toBe("2026-10-25T00:30:00.000Z");
    expect(wallTimeToInstant("2026-10-25", 3 * 60).instant.toISOString()).toBe("2026-10-25T02:00:00.000Z");
  });

  it("maps instants to local wall clock and ISO weekday", () => {
    const wc = toWallClock(new Date("2026-10-25T23:30:00Z"));
    expect(wc).toEqual({ date: "2026-10-26", minutes: 30, isoWeekday: 1 });
    expect(isoWeekdayOf("2026-10-25")).toBe(7);
  });

  it("handles date helpers", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-03-01", -1)).toBe("2027-02-28");
    expect(isValidLocalDate("2026-02-30")).toBe(false);
    expect(isValidLocalDate("2026-02-28")).toBe(true);
    expect(parseTimeOfDay("24:00")).toBe(1440);
    expect(parseTimeOfDay("09:30:00")).toBe(570);
    expect(() => parseTimeOfDay("25:00")).toThrow();
  });
});
