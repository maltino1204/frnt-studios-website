import { attr, clamp01, type MotionContext, type Stop } from "../frame";

/** Mask progress at which the three lines arrive (spec § 4.2); the statement under them comes with the third. */
const LINE_MARKS = [0.35, 0.65, 0.95, 0.95];

/**
 * 02 · Idee, „Schwelle“ (spec § 4.2, Appendix A), full tier once the scene is ready. The doorway mask widens from
 * the narrow arch inside the real doorway (l 37cqw · r 25cqw · t 9 %) to the full arch, scroll-linked over
 * `entry 30 % → entry 100 %` of the image: on the CSS view timeline where it exists, otherwise from `--lp-scene`
 * written here. The three lines are triggered (never scrubbed) as the progress crosses 0.35 / 0.65 / 0.95, the
 * statement under them with the third line (90 ms after it).
 */
export function startDoorway(ctx: MotionContext): Stop {
  const scene = document.querySelector<HTMLElement>('[data-scene="doorway"]');
  if (!scene || !ctx.ready.has(scene)) return () => {};
  const face = scene.querySelector<HTMLElement>('[data-arch-mask="doorway"]');
  if (!face) return () => {};
  const lines = Array.from(scene.querySelectorAll<HTMLElement>("[data-doorway-lines] [data-reveal-order]"));
  for (const l of lines) attr(l, "data-reveal-state", "pending");

  let p = 0;
  let written = -1;
  let shown = 0;
  const stop = ctx.whileNear(face, {
    read() {
      const r = face.getBoundingClientRect();
      p = r.height ? clamp01((window.innerHeight - 0.3 * r.height - r.top) / (0.7 * r.height)) : 1;
    },
    write() {
      if (!ctx.timeline && Math.abs(p - written) > 0.0005) {
        written = p;
        face.style.setProperty("--lp-scene", p.toFixed(4));
      }
      for (let k = 0; shown < lines.length && p >= LINE_MARKS[shown]; k++) {
        const l = lines[shown++];
        l.style.setProperty("--lp-d", `${k * 90}ms`);
        attr(l, "data-reveal-state", "in");
      }
    },
  });

  return () => {
    stop();
    face.style.removeProperty("--lp-scene");
    for (const l of lines) {
      l.removeAttribute("data-reveal-state");
      l.style.removeProperty("--lp-d");
    }
  };
}
