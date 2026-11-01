import { attr, isBelow, type MotionContext, type Stop } from "./frame";

/** Sibling stagger (MOTION.md § 2): 90 ms, at most 6 units. */
const STAGGER = 90;
const MAX_STEPS = 5;

/** Generic targets: clause headlines and statements, arches (with their Ortszeile and Start-Code), the 02 arch in lite. */
const TARGETS = 'main [data-reveal="clause"], main [data-reveal="arch"], main [data-scene="doorway"]:not([data-scene-ready]) [data-arch="frame"]';
/** Scenes that drive their own elements: a ready pinned stage (04, 05), the seal (10), the ready doorway's lines (02). */
const OWNED = '[data-scene-ready] [data-stage], [data-scene="seal"], [data-scene="doorway"][data-scene-ready] p, #bei-dir';

/**
 * Viewport reveals (spec § 8.2, § 8.3), once, never on scroll-up:
 * - clause arrival: `[data-reveal="clause"]`, its `[data-reveal-order]` units rise 10 px (640 ms; lite 480 ms);
 * - arch rise: `[data-reveal="arch"]` opens bottom-up and rises 16 px (640 ms; lite 480 ms), the photo settles
 *   (900 ms, full only), the figure's Ortszeile rises 8 px from 480 ms, and a Start-Code card in the figure rises
 *   12 px from 480 ms with its digits on the 90 ms stagger.
 * Trigger: 15 % visible. Only elements below the viewport at start-up are ever hidden (`data-reveal-state="pending"`),
 * so nothing that has been seen disappears, and without this module everything simply shows. Targets in a
 * horizontal rail (03 and 06 cards) reveal together when the rail first shows, with the 90 ms stagger (≤ 6), so a
 * card never waits for a swipe ("first view only").
 */
export function startReveals(ctx: MotionContext): Stop {
  const vh = window.innerHeight;
  const targets = Array.from(document.querySelectorAll<HTMLElement>(TARGETS)).filter((el) => !el.closest(OWNED) && isBelow(el, vh));
  const companions = new Map<Element, HTMLElement[]>();
  const groups = new Map<Element, HTMLElement[]>();
  const railCache = new Map<Element, boolean>();
  const touched: HTMLElement[] = [];

  for (const el of targets) {
    if (el.dataset.reveal !== "clause") {
      const figure = el.closest("figure");
      const extra = figure ? Array.from(figure.querySelectorAll<HTMLElement>("[data-ortszeile], [data-start-code]")) : [];
      companions.set(el, extra);
    }
    const list = el.closest("ul");
    if (list) {
      let rail = railCache.get(list);
      if (rail === undefined) {
        const ox = getComputedStyle(list).overflowX;
        rail = ox === "auto" || ox === "scroll";
        railCache.set(list, rail);
      }
      if (rail) {
        const g = groups.get(list) ?? [];
        g.push(el);
        groups.set(list, g);
      }
    }
  }

  const mark = (el: HTMLElement, state: "pending" | "in", delay?: number) => {
    for (const x of [el, ...(companions.get(el) ?? [])]) {
      if (delay !== undefined) x.style.setProperty("--lp-d", `${delay}ms`);
      attr(x, "data-reveal-state", state);
      touched.push(x);
    }
  };
  for (const el of targets) mark(el, "pending");

  const done = new Set<Element>();
  const io = new IntersectionObserver(
    (entries) => {
      let clauses = 0;
      let others = 0;
      for (const e of entries) {
        if (!e.isIntersecting || done.has(e.target)) continue;
        const group = groups.get(e.target.closest("ul") as Element) ?? [e.target as HTMLElement];
        group.forEach((el, i) => {
          if (done.has(el)) return;
          done.add(el);
          io.unobserve(el);
          const n = group.length > 1 ? i : el.dataset.reveal === "clause" ? clauses++ : others++;
          mark(el, "in", Math.min(n, MAX_STEPS) * STAGGER);
        });
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -5% 0px" },
  );
  for (const el of targets) io.observe(el);

  return () => {
    io.disconnect();
    for (const x of touched) {
      x.removeAttribute("data-reveal-state");
      x.style.removeProperty("--lp-d");
    }
  };
}

/** The CSS easing tokens, read once (MOTION.md § 2), for the few Web Animations the scenes run. */
export function ease(name: "standard" | "arrive" | "settle" | "exit"): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--ease-${name}`).trim();
  return v || "ease-out";
}
