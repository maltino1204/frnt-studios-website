/**
 * Booking access, always one action away (docs/landing/LANDING_DESIGN_SPEC.md § 5.5; INTEGRATION.md C4).
 * Owner: Conversion & Integration. Stable API for the Frontend and Motion developers:
 *
 *   openBooking({ source: "header" | "dock" | "overlay" | "ch03" | …, categorySlug? })
 *     1. the hero entry (#termin) is ≥ 25 % in view  → focus its PLZ field (no scroll, no overlay);
 *     2. ≥ 1024 px → <BookingBar/>, < 1024 px → <BookingSheet/>:
 *        - mounted: it opens at once;
 *        - not mounted yet (lazy, audit-1 PT-1): the request is queued, the loader set with `setBookingSurfaceLoader()`
 *          is called, and the surface opens as soon as it registers (BookingBar / BookingSheet register on mount);
 *        - nothing registers within 5 s (chunk failed, no loader): fallback 3;
 *     3. scroll to #termin and focus its PLZ (the no-surface fallback).
 *   A raw `window` event `soma:booking:open` { source, categorySlug? } from anyone is routed the same way.
 *
 *   Lazy loading (Frontend, nav/surfaces.ts): call `setBookingSurfaceLoader(mountSurfaces)` once; then `openBooking()`
 *   works at any time, before or after the dialogs mount. Awaiting `mountSurfaces()` first is fine too.
 *
 *   Markup: use <BookingLink source="…"> from ./booking-link (an <a href="#termin">, so it works without JS).
 *   While a bar or sheet is open, <html data-booking-open="bar|sheet"> is set (Motion: hide the dock).
 */

export const BOOKING_OPEN_EVENT = "soma:booking:open";
/** The existing preselection event of `pickInBookingEntry` (site/booking-entry.tsx). */
export const BOOKING_PICK_EVENT = "soma:booking-entry:set";
export const HERO_ENTRY_ID = "termin";
export const BAR_ENTRY_ID = "termin-leiste";
export const SHEET_ENTRY_ID = "termin-sheet";
/** Same breakpoint as the header CTA and BookingEntry's desktop popovers. */
export const DESKTOP_QUERY = "(min-width: 64rem)";
/** Hero entry visibility above which the request focuses the hero instead of opening a surface (spec § 5.5, § 5.6). */
export const HERO_VISIBLE_RATIO = 0.25;

export type BookingSource = string;
export type BookingOpenDetail = { source: BookingSource; categorySlug?: string };
export type BookingSurface = "bar" | "sheet";

const surfaces = new Map<BookingSurface, (detail: BookingOpenDetail) => void>();
let routerInstalled = false;
let loader: (() => unknown) | null = null;
/** One queued request (the latest wins) while the surface for its viewport is not mounted yet. */
let pending: { surface: BookingSurface; detail: BookingOpenDetail; timer: number } | null = null;
/** How long a queued request waits for its surface before falling back to the hero entry. */
export const SURFACE_WAIT_MS = 5000;

/**
 * Called by BookingBar / BookingSheet on mount with their open function; returns the unregister function.
 * A request queued for this surface opens it immediately.
 */
export function registerBookingSurface(surface: BookingSurface, open: (detail: BookingOpenDetail) => void): () => void {
  surfaces.set(surface, open);
  installBookingRouter();
  if (pending?.surface === surface) {
    const { detail, timer } = pending;
    pending = null;
    window.clearTimeout(timer);
    open(detail);
  }
  return () => {
    if (surfaces.get(surface) === open) surfaces.delete(surface);
  };
}

/** Lazy surfaces: the function that mounts BookingBar / BookingSheet (called when a request needs one). */
export function setBookingSurfaceLoader(load: (() => unknown) | null): void {
  loader = load;
  installBookingRouter();
}

function installBookingRouter() {
  if (routerInstalled || typeof window === "undefined") return;
  routerInstalled = true;
  window.addEventListener(BOOKING_OPEN_EVENT, (e) => route((e as CustomEvent<BookingOpenDetail>).detail ?? { source: "event" }));
}

export function isDesktop(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches;
}

/**
 * Visible fraction (0–1) of the hero booking entry; 0 when it is not on the page. The part under the landing's sticky
 * header is not visible (since v2 the hero sits right above 02, so its entry's foot can lie under the header after a
 * jump to 02); a header that has slid away (< 1024, scroll-down) has moved its box out of the viewport.
 */
export function heroEntryRatio(): number {
  if (typeof document === "undefined") return 0;
  const el = document.getElementById(HERO_ENTRY_ID);
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  if (r.height <= 0) return 0;
  const header = document.querySelector<HTMLElement>(".lp-header")?.getBoundingClientRect().bottom ?? 0;
  const top = Math.max(r.top, header, 0);
  const bottom = Math.min(r.bottom, window.innerHeight);
  return Math.max(0, bottom - top) / r.height;
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Focus the hero entry's PLZ field; with `scroll`, bring the entry into view first. */
export function focusHeroEntry(opts: { scroll?: boolean } = {}): boolean {
  const el = document.getElementById(HERO_ENTRY_ID);
  if (!el) return false;
  if (opts.scroll) el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
  el.querySelector<HTMLInputElement>('input[name="plz"]')?.focus({ preventScroll: true });
  return true;
}

/** Selects a category in the hero entry (the existing event of `pickInBookingEntry`; it scrolls and focuses too). */
function pickInHero(categorySlug: string) {
  window.dispatchEvent(new CustomEvent(BOOKING_PICK_EVENT, { detail: { categorySlug } }));
}

function fallback(detail: BookingOpenDetail) {
  if (detail.categorySlug) pickInHero(detail.categorySlug);
  else focusHeroEntry({ scroll: true });
}

function route(detail: BookingOpenDetail) {
  if (heroEntryRatio() >= HERO_VISIBLE_RATIO) {
    if (detail.categorySlug) pickInHero(detail.categorySlug);
    else focusHeroEntry();
    return;
  }
  const surface: BookingSurface = isDesktop() ? "bar" : "sheet";
  const open = surfaces.get(surface);
  if (open) return open(detail);
  if (!loader) return fallback(detail);
  // Lazy surface: queue the request, ask the loader to mount, open on registration (or fall back after the wait).
  if (pending) window.clearTimeout(pending.timer);
  const timer = window.setTimeout(() => {
    if (pending?.timer !== timer) return;
    pending = null;
    fallback(detail);
  }, SURFACE_WAIT_MS);
  pending = { surface, detail, timer };
  try {
    void Promise.resolve(loader()).catch(() => undefined);
  } catch {
    /* the timeout falls back */
  }
}

/** Request booking access (header, dock, chapter overlay, chapter CTAs). Safe before the surfaces have mounted. */
export function openBooking(detail: BookingOpenDetail = { source: "unknown" }): void {
  if (typeof window === "undefined") return;
  installBookingRouter();
  window.dispatchEvent(new CustomEvent<BookingOpenDetail>(BOOKING_OPEN_EVENT, { detail }));
}

/** Test helper: forget registrations, the loader and any queued request. */
export function resetBookingAccess(): void {
  surfaces.clear();
  loader = null;
  if (pending) window.clearTimeout(pending.timer);
  pending = null;
}

/** Marks the page while a booking surface is open (the dock hides; spec § 5.6). */
export function setBookingOpenFlag(surface: BookingSurface | null): void {
  if (typeof document === "undefined") return;
  if (surface) document.documentElement.dataset.bookingOpen = surface;
  else delete document.documentElement.dataset.bookingOpen;
}

// Route raw `soma:booking:open` events from the moment this module loads in the browser.
if (typeof window !== "undefined") installBookingRouter();
