import { describe, expect, it } from "vitest";
import {
  computeAvailability,
  filterSlotsByTimeOfDay,
  firstSlot,
  isSlotAvailable,
  slotsForDate,
  type AvailabilityRules,
} from "@/server/domain/availability";

const base = (over: Partial<AvailabilityRules> = {}): AvailabilityRules => ({
  durationMinutes: 60,
  bufferMinutes: 30,
  leadTimeMinutes: 180,
  maxAdvanceDays: 60,
  stepMinutes: 30,
  weeklyHours: [{ weekday: 1, start: "09:00", end: "12:00" }],
  timeOff: [],
  busy: [],
  now: new Date("2026-10-30T08:00:00Z"),
  ...over,
});

const hhmm = (iso: string) =>
  new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

describe("availability", () => {
  it("generates step-aligned slots that fit the window", () => {
    // Monday 2026-11-02, CET (+01:00)
    const day = slotsForDate("2026-11-02", base());
    expect(day.weekday).toBe(1);
    expect(day.slots.map(hhmm)).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]);
    expect(day.slots[0]).toBe("2026-11-02T08:00:00.000Z");
  });

  it("aligns odd window starts to the step and respects window end exactly", () => {
    const day = slotsForDate("2026-11-02", base({ weeklyHours: [{ weekday: 1, start: "09:10", end: "11:30" }] }));
    expect(day.slots.map(hhmm)).toEqual(["09:30", "10:00", "10:30"]);
  });

  it("supports multiple windows per day", () => {
    const day = slotsForDate(
      "2026-11-02",
      base({ weeklyHours: [{ weekday: 1, start: "15:00", end: "17:00" }, { weekday: 1, start: "08:00", end: "10:00" }] }),
    );
    expect(day.slots.map(hhmm)).toEqual(["08:00", "08:30", "09:00", "15:00", "15:30", "16:00"]);
  });

  it("returns nothing on days without weekly hours", () => {
    expect(slotsForDate("2026-11-03", base()).slots).toEqual([]);
  });

  it("keeps the travel buffer in both directions around a busy range", () => {
    // Existing booking 10:00–11:00 local with 30 min buffer → blocked 10:00–11:30 local.
    const busy = [{ start: new Date("2026-11-02T09:00:00Z"), end: new Date("2026-11-02T10:30:00Z") }];
    const day = slotsForDate("2026-11-02", base({ weeklyHours: [{ weekday: 1, start: "08:00", end: "14:00" }], busy }));
    // 08:30 would end 09:30 + 30 buffer = 10:00 → ok; 09:00 ends 10:00 + 30 → overlaps.
    expect(day.slots.map(hhmm)).toEqual(["08:00", "08:30", "11:30", "12:00", "12:30", "13:00"]);
  });

  it("applies the lead time", () => {
    // now = 08:00Z = 09:00 local on Monday 2026-11-02; lead 180 → earliest 12:00 local
    const day = slotsForDate(
      "2026-11-02",
      base({ now: new Date("2026-11-02T08:00:00Z"), weeklyHours: [{ weekday: 1, start: "09:00", end: "15:00" }] }),
    );
    expect(day.slots.map(hhmm)).toEqual(["12:00", "12:30", "13:00", "13:30", "14:00"]);
  });

  it("applies max advance days", () => {
    const rules = base({ maxAdvanceDays: 3, weeklyHours: [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ weekday, start: "09:00", end: "18:00" })) });
    const days = computeAvailability({ ...rules, fromDate: "2026-10-30", days: 6 });
    expect(days.map((d) => d.slots.length > 0)).toEqual([true, true, true, true, false, false]);
  });

  it("removes time off spanning several days", () => {
    const weeklyHours = [1, 2, 3].map((weekday) => ({ weekday, start: "09:00", end: "18:00" }));
    // Mon 2026-11-02 15:00 local → Wed 2026-11-04 10:00 local
    const timeOff = [{ start: new Date("2026-11-02T14:00:00Z"), end: new Date("2026-11-04T09:00:00Z") }];
    const days = computeAvailability({ ...base({ weeklyHours, timeOff }), fromDate: "2026-11-02", days: 3 });
    // Monday: last start whose [S, S+60+30) ends <= 15:00 is 13:30
    expect(days[0].slots.map(hhmm).at(-1)).toBe("13:30");
    expect(days[1].slots).toEqual([]);
    expect(days[2].slots.map(hhmm)[0]).toBe("10:00");
  });

  it("handles the spring-forward day (2027-03-28): gap times are skipped, offsets switch", () => {
    const rules = base({
      now: new Date("2027-03-01T00:00:00Z"),
      leadTimeMinutes: 0,
      weeklyHours: [{ weekday: 7, start: "00:00", end: "06:00" }, { weekday: 1, start: "09:00", end: "10:00" }],
    });
    const sunday = slotsForDate("2027-03-28", rules);
    expect(sunday.weekday).toBe(7);
    expect(sunday.slots.map(hhmm)).toEqual(["00:00", "00:30", "01:00", "01:30", "03:00", "03:30", "04:00", "04:30", "05:00"]);
    expect(sunday.slots).toContain("2027-03-28T00:30:00.000Z"); // 01:30 CET
    expect(sunday.slots).toContain("2027-03-28T01:00:00.000Z"); // 03:00 CEST
    // Day after: 09:00 CEST = 07:00Z
    expect(slotsForDate("2027-03-29", rules).slots).toEqual(["2027-03-29T07:00:00.000Z"]);
    // Saturday before was CET: 09:00 local would be 08:00Z
    expect(slotsForDate("2027-03-22", rules).slots).toEqual(["2027-03-22T08:00:00.000Z"]);
  });

  it("handles the fall-back day (2026-10-25): repeated hour is offered once", () => {
    const rules = base({
      now: new Date("2026-10-01T00:00:00Z"),
      leadTimeMinutes: 0,
      weeklyHours: [{ weekday: 7, start: "00:00", end: "06:00" }, { weekday: 1, start: "09:00", end: "10:00" }],
    });
    const sunday = slotsForDate("2026-10-25", rules);
    expect(sunday.slots).toHaveLength(11);
    expect(new Set(sunday.slots).size).toBe(11);
    expect(sunday.slots).toContain("2026-10-25T00:00:00.000Z"); // 02:00 CEST (first occurrence)
    expect(sunday.slots).toContain("2026-10-25T02:00:00.000Z"); // 03:00 CET
    expect(slotsForDate("2026-10-26", rules).slots).toEqual(["2026-10-26T08:00:00.000Z"]); // 09:00 CET
    expect(slotsForDate("2026-10-19", rules).slots).toEqual(["2026-10-19T07:00:00.000Z"]); // 09:00 CEST
  });

  it("validates a single start with the same rules", () => {
    const rules = base();
    expect(isSlotAvailable(new Date("2026-11-02T08:00:00Z"), rules)).toBe(true);
    expect(isSlotAvailable(new Date("2026-11-02T08:15:00Z"), rules)).toBe(false); // not on the step
    expect(isSlotAvailable(new Date("2026-11-02T10:30:00Z"), rules)).toBe(false); // would end 12:30 > 12:00
  });

  it("filters by time of day and finds the first slot", () => {
    const rules = base({ weeklyHours: [{ weekday: 1, start: "09:00", end: "20:00" }] });
    const days = computeAvailability({ ...rules, fromDate: "2026-11-02", days: 1 });
    expect(filterSlotsByTimeOfDay(days, "evening")[0].slots.map(hhmm)).toEqual(["17:00", "17:30", "18:00", "18:30", "19:00"]);
    expect(filterSlotsByTimeOfDay(days, "morning")[0].slots.map(hhmm).at(-1)).toBe("11:30");
    expect(firstSlot(days)).toBe("2026-11-02T08:00:00.000Z");
    expect(firstSlot([])).toBeNull();
  });
});
