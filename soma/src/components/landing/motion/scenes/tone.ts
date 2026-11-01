import { clamp01, type MotionContext, type Stop } from "../frame";

/**
 * Section tones (spec § 7): the „Abend“ (dusk, Stone → Espresso) and „Morgen“ (dawn, Espresso → Bone) spacers of
 * chapter 05, 32svh each in the full tier once ready, their colour scroll-linked over `entry 0 % → entry 100 %`.
 * CSS view timelines run it where they exist; otherwise this writes `--lp-scene` (0–1) for the color-mix fallback.
 */
export function startTone(ctx: MotionContext): Stop {
  if (ctx.timeline) return () => {};
  const spacers = Array.from(document.querySelectorAll<HTMLElement>('[data-scene="dusk"][data-scene-ready], [data-scene="dawn"][data-scene-ready]'));
  const stops = spacers.map((el) => {
    let p = 0;
    let written = -1;
    return ctx.whileNear(el, {
      read() {
        const r = el.getBoundingClientRect();
        p = r.height ? clamp01((window.innerHeight - r.top) / r.height) : 1;
      },
      write() {
        if (Math.abs(p - written) < 0.001) return;
        written = p;
        el.style.setProperty("--lp-scene", p.toFixed(3));
      },
    });
  });
  return () => {
    for (const s of stops) s();
    for (const el of spacers) el.style.removeProperty("--lp-scene");
  };
}
