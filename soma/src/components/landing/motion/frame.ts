import type { MotionTier } from "./tier";

/**
 * Shared plumbing of the motion runtime: one passive scroll listener and one rAF per frame for every scroll-linked
 * scene, run as all reads first, then all writes (no layout thrash). A scene only takes part while it is near the
 * viewport (an IntersectionObserver adds and removes its job), so offscreen scenes cost nothing.
 */
export type Job = { read: () => void; write: () => void };
export type Stop = () => void;

export type MotionContext = {
  tier: MotionTier;
  /** scenes upgraded to their full-tier layout or mask this page view (`data-scene-ready`, written last) */
  ready: Set<Element>;
  /** below the viewport at start-up, from one layout snapshot taken before any write */
  below: (el: Element) => boolean;
  /** CSS scroll-driven animations are available (and used) for the scroll-linked masks and tones */
  timeline: boolean;
  /** run `job` on every scroll frame while `el` is within one viewport of the screen */
  whileNear: (el: Element, job: Job) => Stop;
  /** collect a stop function for the runtime's teardown */
  onStop: (stop: Stop) => void;
};

export function createContext(tier: MotionTier, ready: Set<Element>, below: (el: Element) => boolean): MotionContext & { stop: Stop } {
  const jobs = new Set<Job>();
  const stops: Stop[] = [];
  let raf = 0;
  const run = () => {
    raf = 0;
    for (const j of jobs) j.read();
    for (const j of jobs) j.write();
  };
  const kick = () => {
    if (!raf && jobs.size) raf = requestAnimationFrame(run);
  };
  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", kick);

  return {
    tier,
    ready,
    below,
    timeline: typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()"),
    whileNear(el, job) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries[entries.length - 1].isIntersecting) jobs.add(job);
          else jobs.delete(job);
          kick();
        },
        { rootMargin: "100% 0px" },
      );
      io.observe(el);
      return () => {
        io.disconnect();
        jobs.delete(job);
      };
    },
    onStop: (stop) => stops.push(stop),
    stop() {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      cancelAnimationFrame(raf);
      jobs.clear();
      for (const s of stops.splice(0)) s();
    },
  };
}

export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Below the viewport: the page has not reached it yet (the only place a reveal may hide anything, spec § 8.2). */
export function isBelow(el: Element, vh = window.innerHeight): boolean {
  // Measure the chapter while it is far away: inside a content-visibility: auto chapter (04–06) a descendant's box
  // would force that chapter's skipped layout.
  const chapter = el.closest("[data-chapter]");
  if (chapter && chapter.getBoundingClientRect().top >= vh) return true;
  return el.getBoundingClientRect().top >= vh;
}

/** Sets or clears an attribute only when it changes. */
export function attr(el: Element, name: string, value: string | null) {
  if (value === null) {
    if (el.hasAttribute(name)) el.removeAttribute(name);
  } else if (el.getAttribute(name) !== value) el.setAttribute(name, value);
}
