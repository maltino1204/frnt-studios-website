import { ease } from "../reveal";
import type { MotionContext, Stop } from "../frame";

/**
 * 07 · Deine Buchung (spec § 4.7). The screen's move to the callout's region (480 ms `ease-arrive`; lite 320 ms)
 * and the crossfade between screen files (220 ms) are CSS transitions on the Frontend's static positions. This adds
 * what has to restart on every tab change: the region ring fades in over 160 ms once the move has mostly landed
 * (from 320 ms; lite 160 ms), and the active line under the chips (< 1024) crossfades in 220 ms.
 */
export function startScreens(ctx: MotionContext): Stop {
  const scene = document.querySelector<HTMLElement>('[data-scene="screens"]');
  if (!scene) return () => {};
  const ring = scene.querySelector<HTMLElement>("[data-screen-ring]");
  const line = scene.querySelector<HTMLElement>(".lp-screens-active-line");
  const running: Animation[] = [];
  let last = scene.dataset.active;
  const mo = new MutationObserver(() => {
    if (scene.dataset.active === last) return;
    last = scene.dataset.active;
    for (const a of running.splice(0)) a.cancel();
    if (ring) {
      running.push(
        ring.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: ctx.tier === "full" ? 320 : 160, easing: ease("standard"), fill: "backwards" }),
      );
    }
    if (line?.offsetParent) running.push(line.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: ease("standard") }));
  });
  mo.observe(scene, { attributes: true, attributeFilter: ["data-active"] });
  return () => {
    mo.disconnect();
    for (const a of running.splice(0)) a.cancel();
  };
}
