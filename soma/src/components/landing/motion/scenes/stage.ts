import { attr, clamp01, type MotionContext, type Stop } from "../frame";

const STEPS = 6;
/** ± 3 % of the pin progress before a step changes back or forth (spec § 4.5): no flicker on a boundary. */
const HYSTERESIS = 0.03;

/**
 * 05 · Dein Ort, pin 2 (spec § 4.5), full tier once the scene is ready (the sticky stage is the Frontend's CSS).
 * The pin progress p (0–1 over the scene's extra height) picks the step, `clamp(1, 6, floor(p · 6) + 1)` with
 * hysteresis, written as `data-step`; the scene state is `idle` (not pinned yet) · `active` · `done`. Step changes are
 * triggered CSS transitions, never scrubbed: the new place rises into the arch, its line follows; the first line
 * arrives only once the stage is pinned, so it never shares a view with the chapter headline (two serif lines).
 */
export function startStage(ctx: MotionContext): Stop {
  const scene = document.querySelector<HTMLElement>('[data-scene="stage"][data-scene-ready]');
  const stage = scene?.querySelector<HTMLElement>("[data-stage]");
  if (!scene || !stage) return () => {};

  let step = 1;
  let state = "idle";
  attr(scene, "data-step", "1");
  attr(scene, "data-scene-state", "idle");

  const stop = ctx.whileNear(scene, {
    read() {
      const r = scene.getBoundingClientRect();
      const run = r.height - stage.offsetHeight;
      const p = run > 0 ? clamp01(-r.top / run) : 0;
      state = r.top > 0 ? "idle" : r.bottom > stage.offsetHeight + 1 ? "active" : "done";
      const raw = Math.min(STEPS, Math.floor(p * STEPS) + 1);
      if (raw > step && p >= (raw - 1) / STEPS + HYSTERESIS) step = raw;
      else if (raw < step && p <= step - 1 - (STEPS * HYSTERESIS) / STEPS && p < (step - 1) / STEPS - HYSTERESIS) step = raw;
    },
    write() {
      attr(scene, "data-step", String(step));
      attr(scene, "data-scene-state", state);
    },
  });

  return () => {
    stop();
    scene.removeAttribute("data-step");
    scene.removeAttribute("data-scene-state");
  };
}
