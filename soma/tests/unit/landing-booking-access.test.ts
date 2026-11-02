import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * openBooking() with lazy surfaces (audit-1 PT-1): a request made before BookingBar / BookingSheet mount is queued,
 * the loader is asked to mount, and the surface opens on registration; without a surface it falls back to the hero.
 */
type Access = typeof import("@/components/landing/booking/booking-access");
let access: Access;
let desktop = true;
const focused: string[] = [];

beforeAll(async () => {
  const win = new EventTarget() as EventTarget & Record<string, unknown>;
  Object.assign(win, {
    innerHeight: 800,
    matchMedia: (q: string) => ({ matches: q.includes("min-width") ? desktop : false }),
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
  });
  const hero = {
    getBoundingClientRect: () => ({ top: 2000, bottom: 2100, height: 100 }), // far below the viewport
    scrollIntoView: () => focused.push("scroll"),
    querySelector: () => ({ focus: () => focused.push("hero-plz") }),
  };
  vi.stubGlobal("window", win);
  vi.stubGlobal("CustomEvent", class extends Event {
    detail: unknown;
    constructor(type: string, init?: { detail?: unknown }) {
      super(type);
      this.detail = init?.detail;
    }
  });
  vi.stubGlobal("document", { getElementById: (id: string) => (id === "termin" ? hero : null), documentElement: { dataset: {} } });
  access = await import("@/components/landing/booking/booking-access");
});

afterEach(() => {
  access.resetBookingAccess();
  focused.length = 0;
  desktop = true;
  vi.useRealTimers();
});

describe("openBooking with lazy surfaces", () => {
  it("opens a mounted surface for the viewport at once", () => {
    const bar = vi.fn();
    access.registerBookingSurface("bar", bar);
    access.openBooking({ source: "header" });
    expect(bar).toHaveBeenCalledWith({ source: "header" });
  });

  it("queues a request until the surface registers, and calls the loader", () => {
    const load = vi.fn();
    access.setBookingSurfaceLoader(load);
    desktop = false;
    access.openBooking({ source: "dock", categorySlug: "massage" });
    expect(load).toHaveBeenCalledTimes(1);
    const sheet = vi.fn();
    access.registerBookingSurface("sheet", sheet);
    expect(sheet).toHaveBeenCalledWith({ source: "dock", categorySlug: "massage" });
    expect(focused).toEqual([]);
  });

  it("routes a raw soma:booking:open event the same way", () => {
    const bar = vi.fn();
    access.registerBookingSurface("bar", bar);
    window.dispatchEvent(new CustomEvent(access.BOOKING_OPEN_EVENT, { detail: { source: "raw" } }));
    expect(bar).toHaveBeenCalledWith({ source: "raw" });
  });

  it("falls back to the hero entry when nothing registers in time", () => {
    vi.useFakeTimers();
    (window as unknown as Record<string, unknown>).setTimeout = globalThis.setTimeout;
    (window as unknown as Record<string, unknown>).clearTimeout = globalThis.clearTimeout;
    access.setBookingSurfaceLoader(() => undefined);
    access.openBooking({ source: "ch04" });
    expect(focused).toEqual([]);
    vi.advanceTimersByTime(access.SURFACE_WAIT_MS + 10);
    expect(focused).toEqual(["scroll", "hero-plz"]);
  });

  it("without a loader or surface, falls back at once", () => {
    access.openBooking({ source: "overlay" });
    expect(focused).toEqual(["scroll", "hero-plz"]);
  });
});
