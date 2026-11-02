import { startProgress } from "./progress";
import { NARROW_QUERY, REDUCED_QUERY, type MotionTier } from "./tier";

/**
 * Navigation awareness (spec § 5, § 11.3), loaded after hydration in every tier. Observers only, no layout reads on
 * scroll except the mobile header's scrollY. It writes on <html>:
 * - `data-chapter-active` (01–10): the chapter under a line at 40 % of the viewport; dispatches `soma:chapter`;
 * - `data-header-theme` (light · dark): the innermost `[data-header-theme]` under the header's middle line;
 * - `data-dock` (shown · hidden): on phones a booking control is always in view (audit 1, I-4): the dock shows
 *   unless the hero entry's submit or chapter 10's search CTA is actually visible, a focused field is in view, or a
 *   non-modal dialog is open (see `dockHidden()`);
 * - `data-header-hidden` (< 1024, lite tier): hide on scroll-down after 400 px, back on any 8 px scroll-up;
 * - `data-header-logo="hidden"`: one logo per view, while the closing lockup is in view and showing.
 * Elements other components may mount late (the dock, overlay and booking surfaces, PT-1) are looked up when used.
 * The index arch's progress fallback (progress.ts) starts here too.
 */

const HEADER_HIDE_AFTER = 400;
const HEADER_UP_DELTA = 8;
/** Fields that open the virtual keyboard (the dock would sit on top of it). */
const FIELD =
  'textarea, select, [contenteditable=""], [contenteditable="true"], input:not([type="button"], [type="submit"], [type="reset"], [type="checkbox"], [type="radio"], [type="range"], [type="color"], [type="file"], [type="image"], [type="hidden"])';
/**
 * Open dialogs that hide the dock here. Booking surfaces hide it through Conversion's `html[data-booking-open]`. A
 * modal dialog (the chapter overlay) already covers the dock in the top layer and makes it inert; the dock stays
 * visible underneath, so that the platform can hand focus back to the dock button that opened it.
 */
const OTHER_DIALOG = "dialog[open]:not(:modal):not([data-booking-surface]):not(:has([data-booking-surface]))";

type RootKey = "chapterActive" | "headerTheme" | "headerHidden" | "headerLogo" | "dock";

export function startNav(tier: MotionTier): () => void {
  const root = document.documentElement;
  const stops: Array<() => void> = [startProgress()];
  const set = (key: RootKey, value: string | null) => {
    if (value === null) delete root.dataset[key];
    else if (root.dataset[key] !== value) root.dataset[key] = value;
  };
  const observe = (cb: IntersectionObserverCallback, opts: IntersectionObserverInit, targets: Array<Element | null>) => {
    const o = new IntersectionObserver(cb, opts);
    for (const t of targets) if (t) o.observe(t);
    stops.push(() => o.disconnect());
    return o;
  };
  const listen = (target: EventTarget, type: string, fn: EventListener, opts?: AddEventListenerOptions) => {
    target.addEventListener(type, fn, opts);
    stops.push(() => target.removeEventListener(type, fn, opts));
  };
  let frame = 0;
  const later = () => {
    if (!frame) frame = requestAnimationFrame(apply);
  };
  stops.push(() => cancelAnimationFrame(frame));

  /** A modal dialog (the chapter overlay) covers the page and makes it inert: nothing here can change what is seen. */
  let modalOpen = !!document.querySelector("dialog:modal");

  /* 1. Active chapter --------------------------------------------------------------------------------------------- */
  const chapters = Array.from(document.querySelectorAll<HTMLElement>("main section[data-chapter]"));
  const onLine = new Set<Element>();
  let active = "";
  const activate = () => {
    let el = chapters.filter((c) => onLine.has(c)).pop();
    if (!el) {
      // Between chapters or in the footer: the last chapter that started above the line.
      const line = window.innerHeight * 0.4;
      el = chapters.filter((c) => c.getBoundingClientRect().top <= line).pop() ?? chapters[0];
    }
    const nn = el?.dataset.chapter;
    if (!el || !nn || nn === active) return;
    active = nn;
    set("chapterActive", nn);
    window.dispatchEvent(new CustomEvent("soma:chapter", { detail: { n: Number(nn), id: el.id, name: el.dataset.chapterName ?? "" } }));
  };
  observe(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) onLine.add(e.target);
        else onLine.delete(e.target);
      }
      // Behind a modal (the chapter overlay hides the page while it is open) the page does not move: skip the
      // fallback's layout read, the observer reports again when the page shows.
      if (!modalOpen) activate();
    },
    { rootMargin: "-40% 0px -59% 0px" },
    chapters,
  );

  /* 2. Header theme ----------------------------------------------------------------------------------------------- */
  const header = () => document.querySelector<HTMLElement>(".lp-header");
  const themed = Array.from(document.querySelectorAll<HTMLElement>("[data-header-theme]")).filter((el) => el !== root);
  const depth = new Map<Element, number>();
  for (const el of themed) {
    let d = 0;
    for (let p: Element | null = el; p; p = p.parentElement) d++;
    depth.set(el, d);
  }
  const underHeader = new Set<Element>();
  let themeIO: IntersectionObserver | null = null;
  let themeTimer = 0;
  const watchTheme = () => {
    themeIO?.disconnect();
    underHeader.clear();
    // A 1 px line through the middle of the header: the innermost themed element on it decides.
    const mid = Math.round((header()?.offsetHeight ?? 68) / 2);
    themeIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) underHeader.add(e.target);
          else underHeader.delete(e.target);
        }
        later();
      },
      { rootMargin: `-${mid}px 0px -${Math.max(0, window.innerHeight - mid - 1)}px 0px` },
    );
    for (const el of themed) themeIO.observe(el);
  };
  watchTheme();
  listen(window, "resize", () => {
    window.clearTimeout(themeTimer);
    themeTimer = window.setTimeout(watchTheme, 150);
  });
  stops.push(() => {
    themeIO?.disconnect();
    window.clearTimeout(themeTimer);
  });
  const theme = () => {
    let best: Element | null = null;
    for (const el of underHeader) if (!best || depth.get(el)! >= depth.get(best)!) best = el;
    return (best as HTMLElement | null)?.dataset.headerTheme === "dark" ? "dark" : "light";
  };

  /* 3. Dock rules (< 1024; harmless above, where the dock is display: none) ---------------------------------------- */
  // The booking controls that stand in for the dock while they are actually visible (≥ 90 % of the control in the
  // viewport): the hero entry's submit and chapter 10's search CTA, inside the `[data-dock-hide]` zones. Measured
  // from fresh rects on each scroll frame, but only while their chapter is near the viewport, so a component that
  // re-mounts (lazy booking UI) is always the one measured. The footer's zone is not a booking control: the dock
  // stays over it, and the footer's bottom padding keeps the legal row clear of it (spec § 4.10).
  const CONTROL = '[data-dock-hide] :is(button[type="submit"], a[href^="/suche"])';
  const nearSections = new Set<Element>();
  let controlInView = false;
  observe(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) nearSections.add(e.target);
        else nearSections.delete(e.target);
      }
      later();
    },
    { rootMargin: "50% 0px" },
    [document.getElementById("bei-dir"), document.getElementById("soma")],
  );
  const measureControls = () => {
    controlInView = false;
    const vh = window.innerHeight;
    for (const section of nearSections) {
      for (const el of section.querySelectorAll(CONTROL)) {
        const r = el.getBoundingClientRect();
        if (r.height > 0 && (Math.min(r.bottom, vh) - Math.max(r.top, 0)) / r.height >= 0.9) controlInView = true;
      }
    }
  };
  listen(window, "scroll", () => nearSections.size && later(), { passive: true });
  listen(window, "resize", later);
  // A focused text field hides the dock (the virtual keyboard) until the reader scrolls that field out of view:
  // Android keeps focus when the keyboard is dismissed with the back gesture, and the dock must come back then.
  let field: Element | null = null;
  let fieldSeen = false;
  let fieldLeft = false;
  let fieldIO: IntersectionObserver | null = null;
  const watchField = (el: Element | null) => {
    if (el === field) return;
    fieldIO?.disconnect();
    field = el;
    fieldSeen = fieldLeft = false;
    if (!el) return;
    fieldIO = new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      if (e.isIntersecting) fieldSeen = true;
      fieldLeft = fieldSeen && !e.isIntersecting;
      later();
    });
    fieldIO.observe(el);
  };
  stops.push(() => fieldIO?.disconnect());
  let focusInDock = false;
  let focusInHeader = false;
  const onFocus = (e: Event) => {
    const t = e.target as Element;
    watchField(t.matches?.(FIELD) && !t.closest("dialog") ? t : null);
    focusInDock = !!document.querySelector(".lp-dock")?.contains(t);
    focusInHeader = !!header()?.contains(t);
    later();
  };
  listen(document, "focusin", onFocus);
  listen(document, "focusout", (e) => {
    if ((e as FocusEvent).relatedTarget) return; // focusin follows
    watchField(null);
    focusInDock = focusInHeader = false;
    later();
  });
  let dialogOpen = !!document.querySelector(OTHER_DIALOG);
  const dialogs = new MutationObserver(() => {
    dialogOpen = !!document.querySelector(OTHER_DIALOG);
    const modal = !!document.querySelector("dialog:modal");
    const opened = modal && !modalOpen;
    modalOpen = modal;
    // While a modal opens, measuring the page would force the style and layout of everything behind it inside the
    // tap that opened it (≈ 70 ms at 4× CPU; audit-1 PT-1): the state is brought up to date when it closes.
    if (opened) return;
    // At once, not on the next frame: when a dialog closes, focus goes back to its opener (often the dock's own
    // chapter button), which must be visible again by then.
    cancelAnimationFrame(frame);
    apply();
  });
  dialogs.observe(document.body, { attributes: true, attributeFilter: ["open"], subtree: true });
  stops.push(() => dialogs.disconnect());

  const dockHidden = () => {
    if (focusInDock) return false; // never pull the dock away from under the keyboard user
    return dialogOpen || (!!field && !fieldLeft) || controlInView;
  };

  /* 4. Mobile header: hide on scroll (lite tier, < 1024, never with reduced motion) ------------------------------- */
  const narrow = matchMedia(NARROW_QUERY);
  const reduced = matchMedia(REDUCED_QUERY);
  let headerHidden = false;
  if (tier === "lite") {
    let lastY = window.scrollY;
    let peak = lastY;
    const onScroll = () => {
      const y = window.scrollY;
      if (!narrow.matches || reduced.matches || y <= HEADER_HIDE_AFTER || focusInHeader || dialogOpen) {
        headerHidden = false;
        peak = y;
      } else if (y > lastY) {
        headerHidden = true;
        peak = y;
      } else if (peak - y >= HEADER_UP_DELTA) {
        headerHidden = false;
      }
      lastY = y;
      later();
    };
    listen(window, "scroll", onScroll, { passive: true });
  }

  /* 5. One logo per view: the header's micro wordmark steps back while the closing lockup is in view and showing --- */
  // (not while the seal still waits to play: then the band shows no logo, and the header keeps its own)
  const seal = document.querySelector<HTMLElement>('#soma [data-scene="seal"]');
  let lockupInView = false;
  observe(
    (entries) => {
      lockupInView = entries[entries.length - 1].intersectionRatio >= 0.3;
      later();
    },
    { threshold: [0, 0.3] },
    [seal?.querySelector(".lp-lockup") ?? null],
  );
  if (seal) {
    const states = new MutationObserver(later);
    states.observe(seal, { attributes: true, attributeFilter: ["data-scene-state"] });
    stops.push(() => states.disconnect());
  }

  /* Writes, once per frame ----------------------------------------------------------------------------------------- */
  function apply() {
    frame = 0;
    if (modalOpen) return; // behind a modal dialog (see `dialogs`); applied again when it closes
    if (nearSections.size) measureControls(); // reads first
    else controlInView = false;
    set("headerTheme", theme());
    set("dock", dockHidden() ? "hidden" : "shown");
    set("headerHidden", headerHidden && !focusInHeader && !dialogOpen ? "" : null);
    set("headerLogo", lockupInView && seal?.dataset.sceneState !== "idle" ? "hidden" : null);
  }

  return () => {
    for (const stop of stops) stop();
  };
}
