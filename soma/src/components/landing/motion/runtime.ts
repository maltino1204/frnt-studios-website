import { createContext, isBelow, type Stop } from "./frame";
import { ease, REVEAL_TARGETS, startReveals } from "./reveal";
import { startHero } from "./scenes/hero";
import { startWalkthrough } from "./scenes/walkthrough";
import { startBand } from "./scenes/band";
import { startSeal } from "./scenes/seal";
import type { MotionTier } from "./tier";

/** Scenes whose full-tier layout or mask changes the page: they upgrade only while still below the viewport. */
const UPGRADABLE = '[data-scene="walkthrough"], [data-scene="seal"]';

/**
 * The motion runtime (spec § 10.4: ≤ 12 KB gz, imported after idle or the first scroll, full and lite tiers only).
 * 1. Upgrade (spec § 8.1, full tier only): every scene in UPGRADABLE whose top is still below the viewport gets
 *    `data-scene-ready`, which switches on its pinned layout or scroll-linked mask. A scene already in or above the
 *    viewport keeps its lite layout for this page view, so the upgrade never shifts what the reader sees.
 * 2. Reveals and scenes start; each returns its teardown. One layout snapshot is read before any write, so start-up
 *    forces a single layout.
 */
export function startRuntime(tier: MotionTier): Stop {
  performance.mark("lp-motion:start");
  // 1. Reads: one layout snapshot of everything that is ever asked "below the viewport?", before any write.
  const vh = window.innerHeight;
  const below = new Map<Element, boolean>();
  for (const el of document.querySelectorAll(`${UPGRADABLE}, [data-scene="band"], ${REVEAL_TARGETS}`)) below.set(el, isBelow(el, vh));
  for (const name of ["standard", "arrive", "settle", "exit"] as const) ease(name); // computed style, same snapshot
  const ready = new Set<Element>();
  if (tier === "full") for (const el of document.querySelectorAll(UPGRADABLE)) if (below.get(el)) ready.add(el);

  // 2. Writes: scenes and reveals set their start states; the upgrade attributes go last.
  const ctx = createContext(tier, ready, (el) => below.get(el) ?? isBelow(el));
  for (const start of [startReveals, startHero, startWalkthrough, startBand, startSeal]) {
    ctx.onStop(start(ctx));
  }
  for (const el of ready) el.setAttribute("data-scene-ready", "");
  performance.measure("lp-motion:init", "lp-motion:start");

  return () => {
    ctx.stop();
    for (const el of ready) el.removeAttribute("data-scene-ready");
  };
}
