"use client";

import { useEffect } from "react";
import { detectTier, NARROW_QUERY, REDUCED_QUERY, tierOverride, type MotionTier } from "./tier";
import "./landing-motion.css";

type Stop = () => void;
type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (h: number) => void;
};

/** Runtime attributes the motion layer writes on <html> (spec § 11.3); removed when the landing unmounts. */
const ROOT_ATTRS = ["motion", "chapterActive", "headerTheme", "headerHidden", "headerLogo", "dock"] as const;

/**
 * The landing's motion loader (spec § 8, § 10.4), mounted once in the landing layout. After hydration it:
 * 1. detects the tier and writes `html[data-motion]` (full · lite · none);
 * 2. imports the nav observer (active chapter, header theme, dock rules, progress fallback) in every tier;
 * 3. imports the motion runtime (scenes, reveals, pins, tone fallbacks) in the full and lite tiers only, after
 *    `requestIdleCallback` (timeout 2 s) or the first scroll, whichever comes first.
 * Everything is progressive: the server-rendered page is complete without it (the `none` tier is the static page),
 * and a failed import leaves the final states in place. Narrowing below 1024 px drops a full tier to lite (the pins
 * are desktop layouts); turning on reduced motion drops any tier to none. Tiers never upgrade during a page view.
 */
export function MotionLoader() {
  useEffect(() => {
    const root = document.documentElement;
    const win = window as IdleWindow;
    let tier: MotionTier = detectTier();
    let alive = true;
    let gen = 0; // bumps on every (re)start, so a late import of a stopped generation is dropped
    let stops: Stop[] = [];
    let runtimeRequested = false;
    let idle = 0;
    let timer = 0;

    const load = (g: number) => {
      import("./nav-observer").then(
        (m) => {
          if (alive && g === gen) stops.push(m.startNav(tier));
        },
        () => {
          // The dock waits for the observer (no flash over the hero's first frame); without it, show it plainly.
          if (alive) root.dataset.dock = "shown";
        },
      );
      if (tier === "none" || !runtimeRequested) return;
      import("./runtime").then(
        (m) => {
          if (alive && g === gen) stops.push(m.startRuntime(tier));
        },
        () => {}, // the static final states remain
      );
    };

    const requestRuntime = () => {
      window.removeEventListener("scroll", requestRuntime);
      if (idle) win.cancelIdleCallback?.(idle);
      window.clearTimeout(timer);
      if (runtimeRequested || !alive) return;
      runtimeRequested = true;
      if (tier === "none") return;
      const g = gen;
      import("./runtime").then(
        (m) => {
          if (alive && g === gen) stops.push(m.startRuntime(tier));
        },
        () => {},
      );
    };

    root.dataset.motion = tier;
    load(gen);
    if (tier !== "none") {
      window.addEventListener("scroll", requestRuntime, { passive: true });
      if (win.requestIdleCallback) idle = win.requestIdleCallback(requestRuntime, { timeout: 2000 });
      else timer = window.setTimeout(requestRuntime, 1200);
    }

    // Tier changes during the page view only ever downgrade (a pinned scene never appears under the reader).
    const narrow = matchMedia(NARROW_QUERY);
    const reduce = matchMedia(REDUCED_QUERY);
    const onMedia = () => {
      if (tierOverride()) return;
      const next: MotionTier = reduce.matches ? "none" : tier === "full" && narrow.matches ? "lite" : tier;
      if (next === tier) return;
      tier = next;
      gen += 1;
      for (const stop of stops) stop();
      stops = [];
      root.dataset.motion = tier;
      load(gen);
    };
    narrow.addEventListener("change", onMedia);
    reduce.addEventListener("change", onMedia);

    return () => {
      alive = false;
      window.removeEventListener("scroll", requestRuntime);
      if (idle) win.cancelIdleCallback?.(idle);
      window.clearTimeout(timer);
      narrow.removeEventListener("change", onMedia);
      reduce.removeEventListener("change", onMedia);
      for (const stop of stops) stop();
      for (const k of ROOT_ATTRS) delete root.dataset[k];
    };
  }, []);

  return null;
}
