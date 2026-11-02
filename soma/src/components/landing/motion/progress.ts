/**
 * The index arch's progress (spec § 1.3 B, § 11.3 `--lp-progress`): 0 at the top of the page, 1 at the end, linear,
 * in every tier ("information, not decoration"). Where CSS scroll timelines exist (and motion is not reduced) the
 * progress path runs on `animation-timeline: scroll(root)` in landing-motion.css and this does nothing. Otherwise a
 * passive, rAF-throttled scroll listener writes `--lp-progress`. It writes it on the arch glyphs themselves (header
 * index and dock), not on <html>, so a scroll frame restyles two SVGs instead of the whole document; the
 * Frontend's `.lp-progress-bar { stroke-dashoffset: calc(1 - var(--lp-progress)) }` reads it either way.
 */
export function startProgress(): () => void {
  const timeline = typeof CSS !== "undefined" && CSS.supports("animation-timeline: scroll()");
  if (timeline && !matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  // live: an arch glyph that mounts later (a lazily loaded dock) is written too
  const arches = document.getElementsByClassName("lp-progress-arch") as HTMLCollectionOf<SVGSVGElement>;

  let max = 1;
  let raf = 0;
  let last = "";
  let count = 0;
  const write = () => {
    raf = 0;
    const p = Math.min(1, Math.max(0, window.scrollY / max)).toFixed(3);
    if (p === last && arches.length === count) return;
    last = p;
    count = arches.length;
    for (const a of arches) a.style.setProperty("--lp-progress", p);
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(write);
  };
  const measure = () => {
    max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    kick();
  };
  const ro = new ResizeObserver(measure);
  ro.observe(document.body);
  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", measure);

  return () => {
    ro.disconnect();
    window.removeEventListener("scroll", kick);
    window.removeEventListener("resize", measure);
    cancelAnimationFrame(raf);
    for (const a of arches) a.style.removeProperty("--lp-progress");
  };
}
