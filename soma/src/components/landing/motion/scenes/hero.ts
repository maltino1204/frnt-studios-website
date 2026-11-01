import { ease } from "../reveal";
import type { MotionContext, Stop } from "../frame";

/**
 * 01 · Bei dir, the „Ortswechsel“ (spec § 4.1.5). The room swap itself is CSS on the Frontend's layer states
 * (`[data-place-layer][data-state="entering"]` rises into the arch, the incoming Ortszeile arrives), so it works
 * before this runtime loads. This adds the one piece CSS cannot do: the 14 × 7 arch mark slides from the old label
 * to the new one (FLIP, 220 ms `ease-standard`). Rapid changes cancel the running slide; nothing queues.
 */
export function startHero(_ctx: MotionContext): Stop {
  const scene = document.querySelector<HTMLElement>('[data-scene="hero-place"]');
  if (!scene) return () => {};
  const current = () => scene.querySelector<HTMLElement>('[data-place-mark="on"]');
  let on = current();
  let slide: Animation | null = null;
  const mo = new MutationObserver(() => {
    const next = current();
    if (!next || next === on) return;
    const from = on?.getBoundingClientRect();
    const to = next.getBoundingClientRect();
    on = next;
    slide?.cancel();
    if (!from?.width) return;
    slide = next.animate([{ translate: `${from.left - to.left}px ${from.top - to.top}px` }, { translate: "0 0" }], {
      duration: 220,
      easing: ease("standard"),
    });
  });
  mo.observe(scene, { subtree: true, attributes: true, attributeFilter: ["data-place-mark"] });
  return () => {
    mo.disconnect();
    slide?.cancel();
  };
}
