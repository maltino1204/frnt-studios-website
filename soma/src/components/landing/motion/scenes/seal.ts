import { attr, clamp01, type MotionContext, type Stop } from "../frame";

/** The brand sequence runs 0–1980 ms (spec § 4.10); `done` hands back to the static final frame after it. */
const SEQUENCE_MS = 2300;
/** The mask is square once this share of the band has entered (CSS `animation-range: entry 0% entry 40%`). */
const MASK_RANGE = 0.4;

/**
 * 10 · SOMA, „O-Schluss“ (spec § 4.10, Appendix A).
 * - Full tier, once ready: an Oxblood arch mask opens from the bottom centre (24cqw, crown at 40 %) to a square full
 *   bleed over `entry 0 % → entry 40 %` (the spec's 60 % left the band empty too long, audit 1, I-9), on the CSS view timeline where it exists, otherwise from `--lp-scene`.
 *   Lite and none: the hard edge.
 * - Full and lite: the brand sequence plays once when the band is ≥ 40 % in view (full: the mask is then complete and
 *   no arch is visible; lite: as soon as the lockup is half in view), or once the reader is past its top: the mark
 *   draws on (the O traces from the left springline over the crown, the S follows, both fill), the wordmark settles,
 *   the rule grows, the tagline and the German line arrive. CSS keyed on
 *   `data-scene-state` (idle · active · done). Only a band the reader has not reached yet starts `idle`: a deep link
 *   lands on the final frame. The CTAs never wait.
 */
export function startSeal(ctx: MotionContext): Stop {
  const scene = document.querySelector<HTMLElement>('[data-scene="seal"]');
  if (!scene) return () => {};
  const stops: Stop[] = [];
  const ready = ctx.ready.has(scene);
  const mask = scene.querySelector<HTMLElement>('[data-arch-mask="seal"]');

  if (ready && mask && !ctx.timeline) {
    let p = 0;
    let written = -1;
    stops.push(
      ctx.whileNear(scene, {
        read() {
          const r = scene.getBoundingClientRect();
          p = r.height ? clamp01((window.innerHeight - r.top) / (MASK_RANGE * r.height)) : 1;
        },
        write() {
          if (Math.abs(p - written) < 0.0005) return;
          written = p;
          mask.style.setProperty("--lp-scene", p.toFixed(4));
        },
      }),
      () => mask.style.removeProperty("--lp-scene"),
    );
  }

  if (ctx.below(scene)) {
    attr(scene, "data-scene-state", "idle");
    // Plays once the mask is square (≥ 40 % of the band in view), or as soon as the reader is past the band's top
    // (End key, a fast fling). Lite has no mask: it plays as soon as the lockup itself is half in view. Either way
    // the band never sits empty in view for long (audit 1, I-9).
    let timer = 0;
    const play = () => {
      io.disconnect();
      attr(scene, "data-scene-state", "active");
      timer = window.setTimeout(() => attr(scene, "data-scene-state", "done"), SEQUENCE_MS);
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const band = e.target === scene;
        if (band ? e.intersectionRatio >= MASK_RANGE - 0.001 || (e.isIntersecting && e.boundingClientRect.top <= 0) : !ready && e.intersectionRatio >= 0.5)
          return play();
      }
    }, { threshold: [0, MASK_RANGE, 0.5] });
    io.observe(scene);
    const lockup = scene.querySelector(".lp-lockup");
    if (lockup) io.observe(lockup);
    stops.push(() => {
      io.disconnect();
      window.clearTimeout(timer);
      scene.removeAttribute("data-scene-state");
    });
  }

  return () => {
    for (const s of stops) s();
  };
}
