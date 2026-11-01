import { startProgress } from "./progress";
import { NARROW_QUERY, REDUCED_QUERY, type MotionTier } from "./tier";

/**
 * Navigation awareness (spec § 5, § 11.3), loaded after hydration in every tier. Observers only, no layout reads on
 * scroll except the mobile header's scrollY. It writes on <html>:
 * - `data-chapter-active` (01–10): the chapter under a line at 40 % of the viewport; dispatches `soma:chapter`;
 * - `data-header-theme` (light · dark): the innermost `[data-header-theme]` under the header's middle line;
 * - `data-dock` (shown · hidden): the dock rules of § 5.6, see `dockHidden()`;
 * - `data-header-hidden` (< 1024, lite tier): hide on scroll-down after 400 px, back on any 8 px scroll-up;
 * - `data-header-logo="hidden"`: one logo per view, while ≥ 30 % of chapter 10 (the lockup) is in view.
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
      activate();
    },
    { rootMargin: "-40% 0px -59% 0px" },
    chapters,
  );

  /* 2. Header theme ----------------------------------------------------------------------------------------------- */
  const header = document.querySelector<HTMLElement>(".lp-header");
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
    const mid = Math.round((header?.offsetHeight ?? 68) / 2);
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
  const dock = document.querySelector<HTMLElement>(".lp-dock");
  const zones = Array.from(document.querySelectorAll<HTMLElement>("[data-dock-hide]"));
  const zoneHides = new Map<Element, boolean>();
  for (const t of new Set(zones.map((z) => Number(z.dataset.dockHide) || 0))) {
    observe(
      (entries) => {
        for (const e of entries) zoneHides.set(e.target, e.isIntersecting && e.intersectionRatio >= t - 0.001);
        later();
      },
      { threshold: t > 0 ? [0, t] : [0] },
      zones.filter((z) => (Number(z.dataset.dockHide) || 0) === t),
    );
  }
  // The hero: from the moment the arch's Ortszeile enters the viewport until the booking card has scrolled out
  // (< 25 % left at the top), the dock stays down. It never covers the Ortszeile, and it does not pop up for the
  // short stretch of lead text between the Ortszeile and the card (the card itself is the booking entry there).
  const hero = document.getElementById("bei-dir");
  const heroCaption = hero?.querySelector("figure figcaption");
  const heroEntry = hero?.querySelector<HTMLElement>("[data-dock-hide]");
  let heroHides = false;
  if (hero && heroCaption && heroEntry) {
    // Recomputed from fresh rects whenever any of the three crosses a threshold: a jump from the top straight to a
    // far chapter crosses the hero's edge even when the entry itself goes from "not in view" to "not in view".
    observe(
      () => {
        const vh = window.innerHeight;
        const cap = heroCaption.getBoundingClientRect();
        const r = heroEntry.getBoundingClientRect();
        const visible = r.height ? (Math.min(r.bottom, vh) - Math.max(r.top, 0)) / r.height : 0;
        heroHides = cap.top < vh && !(r.top < 0 && visible < 0.25);
        later();
      },
      { threshold: [0, 0.25] },
      [hero, heroCaption, heroEntry],
    );
  }
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
    focusInDock = !!dock?.contains(t);
    focusInHeader = !!header?.contains(t);
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
    // At once, not on the next frame: when a dialog closes, focus goes back to its opener (often the dock's own
    // chapter button), which must be visible again by then.
    cancelAnimationFrame(frame);
    apply();
  });
  dialogs.observe(document.body, { attributes: true, attributeFilter: ["open"], subtree: true });
  stops.push(() => dialogs.disconnect());

  const dockHidden = () => {
    if (focusInDock) return false; // never pull the dock away from under the keyboard user
    if (dialogOpen || (field && !fieldLeft)) return true;
    if (heroHides) return true;
    for (const hide of zoneHides.values()) if (hide) return true;
    return false;
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

  /* 5. One logo per view: the header's micro wordmark steps back while the closing lockup is in view -------------- */
  let logoHidden = false;
  observe(
    (entries) => {
      logoHidden = entries[entries.length - 1].intersectionRatio >= 0.3;
      later();
    },
    { threshold: [0, 0.3] },
    [document.getElementById("soma")],
  );

  /* Writes, once per frame ----------------------------------------------------------------------------------------- */
  function apply() {
    frame = 0;
    set("headerTheme", theme());
    set("dock", dockHidden() ? "hidden" : "shown");
    set("headerHidden", headerHidden && !focusInHeader && !dialogOpen ? "" : null);
    set("headerLogo", logoHidden ? "hidden" : null);
  }

  return () => {
    for (const stop of stops) stop();
  };
}
