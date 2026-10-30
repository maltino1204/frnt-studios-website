import { describe, expect, it } from "vitest";
import {
  assertTransition,
  assertTransitionTiming,
  BOOKING_STATUSES,
  BookingTransitionError,
  canTransition,
  computeRespondBy,
  isBlocking,
  isTransitionAllowed,
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

  it("caps respond_by at one hour before the start", () => {
    const now = new Date("2026-11-10T08:00:00Z");
    expect(computeRespondBy(now, new Date("2026-11-12T08:00:00Z"), 12).toISOString()).toBe("2026-11-10T20:00:00.000Z");
    expect(computeRespondBy(now, new Date("2026-11-10T14:00:00Z"), 12).toISOString()).toBe("2026-11-10T13:00:00.000Z");
    expect(computeRespondBy(now, new Date("2026-11-10T08:30:00Z"), 12).toISOString()).toBe(now.toISOString());
  });
});
