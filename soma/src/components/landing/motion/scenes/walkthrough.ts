import { ease } from "../reveal";
import { attr, type MotionContext, type Stop } from "../frame";

/**
 * 03 · So funktioniert’s, pin 1 (spec § 4.4), full tier once the scene is ready (the sticky layout is the Frontend's CSS):
 * - the active step is the step block crossing the viewport's centre line (one IntersectionObserver), written as
 *   `data-step` on the scene; the CSS switches vignettes (out 160 ms, in 320 ms with the inner cards on a 60 ms
 *   stagger) and, at step 3, fades the outline and raises the signature pair, its Ortszeilen and the Start-Code;
 * - the stage's arch outline draws on when the stage comes into view (640 ms `ease-arrive`). Chromium misapplies a
 *   `pathLength` dash to a non-scaling stroke, so the dash is measured in screen pixels.
 */
export function startWalkthrough(ctx: MotionContext): Stop {
  const scene = document.querySelector<HTMLElement>('[data-scene="walkthrough"]');
  if (!scene || !ctx.ready.has(scene)) return () => {};
  attr(scene, "data-step", "1");

  const steps = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) attr(scene, "data-step", e.target.getAttribute("data-step-trigger"));
    },
    { rootMargin: "-50% 0px -50% 0px" },
  );
  scene.querySelectorAll("[data-step-trigger]").forEach((el) => steps.observe(el));

  const stage = scene.querySelector<HTMLElement>("[data-stage]");
  const svg = stage?.querySelector<SVGSVGElement>('[data-reveal="draw"]');
  const path = svg?.querySelector("path");
  let draw: Animation | null = null;
  let io: IntersectionObserver | null = null;
  const reset = () => {
    draw?.cancel();
    path?.style.removeProperty("stroke-dasharray");
    path?.style.removeProperty("stroke-dashoffset");
  };
  if (stage && svg && path) {
    path.style.strokeDasharray = "0 100000"; // pending: nothing drawn (the scene is below the fold when ready)
    io = new IntersectionObserver(
      (entries) => {
        if (!entries[entries.length - 1].isIntersecting) return;
        io?.disconnect();
        const len = path.getTotalLength() * (svg.getBoundingClientRect().width / svg.viewBox.baseVal.width);
        path.removeAttribute("pathLength");
        path.style.strokeDasharray = `${len} ${len}`;
        draw = path.animate([{ strokeDashoffset: `${len}` }, { strokeDashoffset: "0" }], { duration: 640, easing: ease("arrive") });
        draw.onfinish = () => {
          reset();
          path.setAttribute("pathLength", "1");
        };
      },
      { threshold: 0.2 },
    );
    io.observe(stage);
  }

  return () => {
    steps.disconnect();
    io?.disconnect();
    reset();
    if (path && !path.hasAttribute("pathLength")) path.setAttribute("pathLength", "1");
    scene.removeAttribute("data-step");
  };
}
