/**
 * Booking access, always one action away (docs/landing/LANDING_DESIGN_SPEC.md § 5.5; INTEGRATION.md C4).
 * Owner: Conversion & Integration. Stable API for the Frontend and Motion developers:
 *
 *   openBooking({ source: "header" | "dock" | "overlay" | "ch04" | …, categorySlug? })
 *     1. the hero entry (#termin) is ≥ 25 % in view  → focus its PLZ field (no scroll, no overlay);
 *     2. ≥ 1024 px and <BookingBar/> is mounted      → the bar opens under the header;
 *        < 1024 px and <BookingSheet/> is mounted     → the bottom sheet opens;
 *     3. otherwise                                   → scroll to #termin and focus its PLZ (the no-surface fallback).
 *   The request is also announced as `window` event `soma:booking:open` { source, categorySlug? }.
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

/**
 * Called by BookingBar / BookingSheet on mount with their open function; returns the unregister function.
 * The first registration installs the one `soma:booking:open` listener, so a raw event dispatched by anyone is routed
 * by the same rules as `openBooking`.
 */
export function registerBookingSurface(surface: BookingSurface, open: (detail: BookingOpenDetail) => void): () => void {
  surfaces.set(surface, open);
  installBookingRouter();
  return () => {
    if (surfaces.get(surface) === open) surfaces.delete(surface);
  };
}

function installBookingRouter() {
  if (routerInstalled || typeof window === "undefined") return;
  routerInstalled = true;
  window.addEventListener(BOOKING_OPEN_EVENT, (e) => route((e as CustomEvent<BookingOpenDetail>).detail ?? { source: "event" }));
}

export function isDesktop(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches;
}

/** Visible fraction (0–1) of the hero booking entry; 0 when it is not on the page. */
export function heroEntryRatio(): number {
  if (typeof document === "undefined") return 0;
  const el = document.getElementById(HERO_ENTRY_ID);
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  if (r.height <= 0) return 0;
  const top = Math.max(r.top, 0);
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

function route(detail: BookingOpenDetail) {
  if (heroEntryRatio() >= HERO_VISIBLE_RATIO) {
    if (detail.categorySlug) pickInHero(detail.categorySlug);
    else focusHeroEntry();
    return;
  }
  const open = surfaces.get(isDesktop() ? "bar" : "sheet");
  if (open) return open(detail);
  if (detail.categorySlug) pickInHero(detail.categorySlug);
  else focusHeroEntry({ scroll: true });
}

/** Request booking access (header, dock, chapter overlay, chapter CTAs). */
export function openBooking(detail: BookingOpenDetail = { source: "unknown" }): void {
  if (typeof window === "undefined") return;
  if (routerInstalled) window.dispatchEvent(new CustomEvent<BookingOpenDetail>(BOOKING_OPEN_EVENT, { detail }));
  else route(detail);
}

/** Marks the page while a booking surface is open (the dock hides; spec § 5.6). */
export function setBookingOpenFlag(surface: BookingSurface | null): void {
  if (typeof document === "undefined") return;
  if (surface) document.documentElement.dataset.bookingOpen = surface;
  else delete document.documentElement.dataset.bookingOpen;
}
