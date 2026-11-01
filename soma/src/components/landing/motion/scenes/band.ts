import { attr, isBelow, type MotionContext, type Stop } from "../frame";

/**
 * 08 · Für Profis, the photo band (spec § 4.8, ≥ 1024): the band photo settles on entry (scale 1.04 → 1, 900 ms
 * `ease-settle`), full tier only; the headline clauses arrive through the generic reveals. The band has no mask: it
 * is the one chapter without an arch. Below 1024 the photo sits in an arch and rises like the others.
 */
export function startBand(ctx: MotionContext): Stop {
  if (ctx.tier !== "full") return () => {};
  const photo = document.querySelector<HTMLElement>('[data-scene="band"] [data-reveal="settle"]');
  const band = photo?.closest<HTMLElement>('[data-scene="band"]');
  if (!photo || !band || !photo.getClientRects().length || !isBelow(band)) return () => {};
  attr(photo, "data-reveal-state", "pending");
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries[entries.length - 1].isIntersecting) return;
      io.disconnect();
      attr(photo, "data-reveal-state", "in");
    },
    { threshold: 0.15 },
  );
  io.observe(band);
  return () => {
    io.disconnect();
    photo.removeAttribute("data-reveal-state");
  };
}
