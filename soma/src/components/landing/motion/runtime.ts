import { createContext, isBelow, type Stop } from "./frame";
import { startReveals } from "./reveal";
import { startDoorway } from "./scenes/doorway";
import { startHero } from "./scenes/hero";
import { startScreens } from "./scenes/screens";
import { startStage } from "./scenes/stage";
import { startTone } from "./scenes/tone";
import { startWalkthrough } from "./scenes/walkthrough";
import { startBand } from "./scenes/band";
import { startSeal } from "./scenes/seal";
import type { MotionTier } from "./tier";

/** Scenes whose full-tier layout or mask changes the page: they upgrade only while still below the viewport. */
const UPGRADABLE = '[data-scene="doorway"], [data-scene="walkthrough"], [data-scene="dusk"], [data-scene="stage"], [data-scene="dawn"], [data-scene="seal"]';

/**
 * The motion runtime (spec § 10.4: ≤ 12 KB gz, imported after idle or the first scroll, full and lite tiers only).
 * 1. Upgrade (spec § 8.1, full tier only): every scene in UPGRADABLE whose top is still below the viewport gets
 *    `data-scene-ready`, which switches on its pinned layout or scroll-linked mask. A scene already in or above the
 *    viewport keeps its lite layout for this page view, so the upgrade never shifts what the reader sees.
 * 2. Reveals and scenes start; each returns its teardown. All reads happen before all writes.
 */
export function startRuntime(tier: MotionTier): Stop {
  performance.mark("lp-motion:start");
  const ctx = createContext(tier);
  const vh = window.innerHeight;
  const ready = tier === "full" ? Array.from(document.querySelectorAll<HTMLElement>(UPGRADABLE)).filter((el) => isBelow(el, vh)) : [];
  for (const el of ready) el.setAttribute("data-scene-ready", "");

  for (const start of [startReveals, startHero, startDoorway, startWalkthrough, startTone, startStage, startScreens, startBand, startSeal]) {
    ctx.onStop(start(ctx));
  }
  performance.measure("lp-motion:init", "lp-motion:start");

  return () => {
    ctx.stop();
    for (const el of ready) el.removeAttribute("data-scene-ready");
  };
}
