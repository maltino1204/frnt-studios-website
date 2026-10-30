import { describe, expect, it } from "vitest";
import {
  assertTransition,
  assertTransitionTiming,
  BOOKING_STATUSES,
  BookingTransitionError,
  canTransition,
  addBusinessMinutes,
  businessMinutesBetween,
  computeRespondBy,
  earliestRequestStart,
  hasSufficientResponseWindow,
  isBlocking,
  isTransitionAllowed,
  MIN_RESPONSE_WINDOW_MINUTES,
  responseWindowMinutes,
} from "@/server/domain/booking-state";

describe("booking state machine", () => {
  it("allows the documented happy paths", () => {
    expect(canTransition("pending_payment", "requested", "system")).toBe(true);
    expect(canTransition("pending_payment", "confirmed", "system")).toBe(true);
    expect(canTransition("requested", "confirmed", "provider")).toBe(true);
    expect(canTransition("confirmed", "in_progress", "provider")).toBe(true);
    expect(canTransition("in_progress", "completed", "provider")).toBe(true);
    expect(canTransition("confirmed", "completed", "system")).toBe(true);
  });

  it("rejects transitions outside the graph", () => {
    expect(() => assertTransition("completed", "confirmed", "admin")).toThrow(BookingTransitionError);
    expect(() => assertTransition("cancelled", "confirmed", "system")).toThrow(/not_allowed/);
    expect(() => assertTransition("requested", "in_progress", "provider")).toThrow();
    expect(isTransitionAllowed("declined", "requested")).toBe(false);
  });

  it("enforces the actor", () => {
    expect(() => assertTransition("requested", "confirmed", "customer")).toThrow(/actor/);
    expect(() => assertTransition("pending_payment", "confirmed", "customer")).toThrow(/actor/);
    expect(() => assertTransition("requested", "declined", "customer")).toThrow(/actor/);
    expect(() => assertTransition("in_progress", "cancelled", "customer")).toThrow(/actor/);
    expect(() => assertTransition("confirmed", "cancelled", "customer")).not.toThrow();
  });

  it("terminal states have no exits", () => {
    for (const from of ["completed", "cancelled", "declined", "expired", "no_show"] as const) {
      for (const to of BOOKING_STATUSES) expect(isTransitionAllowed(from, to)).toBe(false);
    }
    expect(isBlocking("requested")).toBe(true);
    expect(isBlocking("expired")).toBe(false);
  });

  it("guards timing for start, no-show and completion", () => {
    const startsAt = new Date("2026-11-10T15:00:00Z");
    const endsAt = new Date("2026-11-10T16:00:00Z");
    const ctx = (iso: string) => ({ startsAt, endsAt, now: new Date(iso) });
    expect(() => assertTransitionTiming("confirmed", "in_progress", "provider", ctx("2026-11-10T14:29:59Z"))).toThrow(/too_early/);
    expect(() => assertTransitionTiming("confirmed", "in_progress", "provider", ctx("2026-11-10T14:30:00Z"))).not.toThrow();
    expect(() => assertTransitionTiming("confirmed", "no_show", "provider", ctx("2026-11-10T15:14:00Z"))).toThrow();
    expect(() => assertTransitionTiming("confirmed", "no_show", "provider", ctx("2026-11-10T15:15:00Z"))).not.toThrow();
    expect(() => assertTransitionTiming("confirmed", "completed", "provider", ctx("2026-11-10T14:59:00Z"))).toThrow();
  });

  it("caps respond_by at two hours before the start and never before the request", () => {
    const now = new Date("2026-11-10T08:00:00Z"); // 09:00 Berlin
    expect(computeRespondBy(now, new Date("2026-11-12T08:00:00Z"), 12).toISOString()).toBe("2026-11-10T20:00:00.000Z"); // 09:00 + 12 h = 21:00 Berlin
    expect(computeRespondBy(now, new Date("2026-11-10T14:00:00Z"), 12).toISOString()).toBe("2026-11-10T12:00:00.000Z"); // start − 2 h
    expect(computeRespondBy(now, new Date("2026-11-10T09:30:00Z"), 12).toISOString()).toBe(now.toISOString());
  });
});

describe("response window within 08:00–21:00 Europe/Berlin (audit-1 R9)", () => {
  const far = new Date("2026-11-20T12:00:00Z");

  it("continues the next morning: a request at 20:30 with a 2 h window is due at 09:30", () => {
    const at2030 = new Date("2026-11-10T19:30:00Z"); // 20:30 CET
    expect(computeRespondBy(at2030, far, 2).toISOString()).toBe("2026-11-11T08:30:00.000Z"); // 09:30 CET
    expect(responseWindowMinutes(at2030, far, 2)).toBe(120);
  });

  it("starts counting at 08:00 for night requests and spans several days", () => {
    expect(computeRespondBy(new Date("2026-11-10T22:00:00Z"), far, 12).toISOString()).toBe("2026-11-11T19:00:00.000Z"); // 23:00 → next day 20:00
    expect(computeRespondBy(new Date("2026-11-10T19:00:00Z"), far, 12).toISOString()).toBe("2026-11-11T18:00:00.000Z"); // 20:00 → 1 h + 11 h → 19:00
    expect(computeRespondBy(new Date("2026-11-10T19:00:00Z"), far, 24).toISOString()).toBe("2026-11-12T17:00:00.000Z"); // 1 h + 13 h + 10 h → 18:00
  });

  it("is DST-safe (fall back 2026-10-25, spring forward 2027-03-28)", () => {
    // Sat 24 Oct 20:00 CEST, 2 h → 1 h on Saturday, 1 h from Sunday 08:00 CET
    expect(computeRespondBy(new Date("2026-10-24T18:00:00Z"), far, 2).toISOString()).toBe("2026-10-25T08:00:00.000Z");
    // Sat 27 Mar 20:30 CET, 2 h → 30 min on Saturday, 90 min from Sunday 08:00 CEST
    expect(computeRespondBy(new Date("2027-03-27T19:30:00Z"), new Date("2027-04-05T10:00:00Z"), 2).toISOString()).toBe("2027-03-28T07:30:00.000Z");
    expect(addBusinessMinutes(new Date("2027-03-28T01:30:00Z"), 60).toISOString()).toBe("2027-03-28T07:00:00.000Z"); // 03:30 CEST → 09:00 CEST
  });

  it("counts business minutes between two instants", () => {
    expect(businessMinutesBetween(new Date("2026-11-10T19:30:00Z"), new Date("2026-11-11T08:30:00Z"))).toBe(120);
    expect(businessMinutesBetween(new Date("2026-11-10T21:00:00Z"), new Date("2026-11-11T06:59:00Z"))).toBe(0);
  });

  it("requires a window of at least 30 minutes for request-mode slots", () => {
    const now = new Date("2026-11-10T19:50:00Z"); // 20:50 CET: 10 min today, 20 min tomorrow from 08:00
    expect(earliestRequestStart(now, 12)?.toISOString()).toBe("2026-11-11T09:20:00.000Z"); // 08:20 CET + 2 h
    expect(hasSufficientResponseWindow(now, new Date("2026-11-11T09:20:00Z"), 12)).toBe(true);
    expect(hasSufficientResponseWindow(now, new Date("2026-11-11T09:00:00Z"), 12)).toBe(false);
    expect(hasSufficientResponseWindow(now, new Date("2026-11-10T21:30:00Z"), 12)).toBe(false);
    expect(earliestRequestStart(now, 0)).toBeNull();
    // the O(1) threshold matches the window computation
    for (const start of ["2026-11-11T09:19:00Z", "2026-11-11T09:20:00Z", "2026-11-11T12:00:00Z", "2026-11-12T07:00:00Z"]) {
      const s = new Date(start);
      expect(hasSufficientResponseWindow(now, s, 12), start).toBe(responseWindowMinutes(now, s, 12) >= MIN_RESPONSE_WINDOW_MINUTES);
    }
  });
});
