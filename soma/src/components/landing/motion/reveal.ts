import { attr, type MotionContext, type Stop } from "./frame";

/** Sibling stagger (MOTION.md § 2): 90 ms, at most 6 units. */
const STAGGER = 90;
const MAX_STEPS = 5;

/** Generic targets: clause headlines and statements, arches (with their Ortszeile and Start-Code), the 02 arch in lite. */
export const REVEAL_TARGETS = 'main [data-reveal="clause"], main [data-reveal="arch"], main [data-scene="doorway"] [data-arch="frame"]';

/** Elements a scene drives itself: a ready pinned stage (04, 05) or doorway (02), the seal (10); the hero never waits. */
function owned(el: Element, ready: Set<Element>): boolean {
  if (el.closest('[data-scene="seal"], #bei-dir')) return true;
  const scene = el.closest("[data-scene]");
  if (!scene || !ready.has(scene)) return false;
  return scene.getAttribute("data-scene") === "doorway" ? el.matches('p, [data-arch="frame"]') : !!el.closest("[data-stage]");
}

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
  const targets = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_TARGETS)).filter((el) => !owned(el, ctx.ready) && ctx.below(el));
  const companions = new Map<Element, HTMLElement[]>();
  const groups = new Map<Element, HTMLElement[]>();
  const touched: HTMLElement[] = [];

  for (const el of targets) {
    if (el.dataset.reveal !== "clause") {
      const figure = el.closest("figure");
      const extra = figure ? Array.from(figure.querySelectorAll<HTMLElement>("[data-ortszeile], [data-start-code]")) : [];
      companions.set(el, extra);
    }
    // Horizontal rails are marked in the markup (SnapRail `data-rail`): reading their computed overflow here forced
    // the style and layout of the content-visibility chapters they sit in (two passes, ≈ 140 ms at 4× CPU).
    const list = el.closest("ul[data-rail]");
    if (list) {
      const g = groups.get(list) ?? [];
      g.push(el);
      groups.set(list, g);
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

  // Chromium's IntersectionObserver clips a target by its own clip-path, so a closed (pending) arch would never
  // intersect: arches are watched through their parent (the figure, card or preview column around them).
  const watched = new Map<Element, HTMLElement[]>();
  for (const el of targets) {
    const w = el.dataset.reveal === "clause" ? el : (el.parentElement ?? el);
    watched.set(w, [...(watched.get(w) ?? []), el]);
  }
  const done = new Set<Element>();
  const io = new IntersectionObserver(
    (entries) => {
      let clauses = 0;
      let others = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        for (const t of watched.get(e.target) ?? []) {
          const group = groups.get(t.closest("ul[data-rail]") as Element) ?? [t];
          group.forEach((el, i) => {
            if (done.has(el)) return;
            done.add(el);
            const n = group.length > 1 ? i : el.dataset.reveal === "clause" ? clauses++ : others++;
            mark(el, "in", Math.min(n, MAX_STEPS) * STAGGER);
          });
        }
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -5% 0px" },
  );
  for (const w of watched.keys()) io.observe(w);

  return () => {
    io.disconnect();
    for (const x of touched) {
      x.removeAttribute("data-reveal-state");
      x.style.removeProperty("--lp-d");
    }
  };
}

const eases = new Map<string, string>();

/**
 * The CSS easing tokens (MOTION.md § 2), for the few Web Animations the scenes run. Read once each and kept: a read
 * inside a tap (07 tabs) forced a style recalculation of the page (≈ 13 ms at 4× CPU). The runtime warms them up in
 * its start-up read phase.
 */
export function ease(name: "standard" | "arrive" | "settle" | "exit"): string {
  let v = eases.get(name);
  if (v === undefined) {
    v = getComputedStyle(document.documentElement).getPropertyValue(`--ease-${name}`).trim() || "ease-out";
    eases.set(name, v);
  }
  return v;
}
