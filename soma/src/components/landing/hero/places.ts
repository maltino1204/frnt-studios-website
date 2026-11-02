import { PLACE_LINES } from "@/components/site/discovery-copy";

/** The hero figure's id (the place switch's `aria-controls`); here, so the server fallback can use it too. */
export const HERO_FIGURE_ID = "hero-ort";

export type PlaceId = "zuhause" | "hotel" | "buero";

export type Place = {
  id: PlaceId;
  /** place switch label (copy deck toggles) */
  label: string;
  src: string;
  /** object-position in the arch (spec § 4.1.2, verified in spec-assets/crops-hero-places.jpg) */
  focal: string;
  alt: string;
  /** Ortszeile (copy deck § 01) */
  place: string;
  /** city whose real example PLZ the Wo? field shows for this place (`listCityPostalExamples()`) */
  citySlug: string;
};

/**
 * The hero's three places (spec § 4.1.2). Zu Hause is asset A1 (derived 4:5 crop); Hotel and Büro use the interim v2
 * editorial photos (3:2) until A2 / A3 exist.
 */
export const PLACES: readonly Place[] = [
  {
    id: "zuhause",
    label: "Zu Hause",
    // A1: the 4:5 crop of hero-mobile.jpg with the 50% 45% focal baked in (scripts/landing/derive-hero.mjs).
    src: "/images/landing/hero-home-4x5.jpg",
    focal: "50% 50%",
    alt: "Ein Profi massiert am Vormittag den Rücken einer Person auf einer Massageliege, in einem sonnigen Berliner Altbauzimmer mit hohen Fenstern.",
    place: PLACE_LINES.home,
    citySlug: "berlin",
  },
  {
    id: "hotel",
    label: "Im Hotel",
    src: "/images/editorial/hotel-v2.jpg",
    focal: "72% 50%",
    alt: "Ein Profi massiert am Nachmittag einen Gast in einer Hotelsuite; hinter dem Fenster die Frankfurter Skyline.",
    place: PLACE_LINES.hotel,
    citySlug: "frankfurt",
  },
  {
    id: "buero",
    label: "Im Büro",
    src: "/images/editorial/office-v2.jpg",
    focal: "60% 45%",
    alt: "Nackenmassage auf einem Massagestuhl in einem Besprechungsraum mit Glaswänden, dahinter der Hamburger Hafen.",
    place: PLACE_LINES.office,
    citySlug: "hamburg",
  },
];

/**
 * The hero arch's `sizes` (spec § 4.1.2); the same string is used to prefetch the other places.
 *
 * From 1024 the arch is a grid column. Below 1024 it is capped to the first view (landing.css, "The arch's first view
 * below 1024"; audit-2 RT-8 / RT-12), so its width depends on the viewport's height too: the entries below 1024 repeat
 * that cap, the same arithmetic with `clamp()` standing in for its `sign()`, and the LCP photo is fetched for the
 * width it is shown at (audit-3 M-5). The cap is written in `vh`, not the CSS's `svh`: Chromium does not evaluate
 * `svh` in a preload link's `imagesizes` (it falls through to the uncapped entry), so the preload and the <img> picked
 * different candidates and the photo loaded twice below 1024 (audit-4 N4-2). With `vh` (≥ svh, so never smaller than the arch shown) both pick the same one.
 * Each capped entry is followed by the uncapped width for the same range, which a browser that cannot evaluate min()
 * or clamp() in `sizes` falls back to (then it fetches as before).
 * `ribbon`: the demo ribbon above the header (DEMO_MODE, 47 px on phones, 33 px at 768–1023) moves the arch down.
 * Keep it in step with the cap in landing.css.
 */
export function heroSizes(ribbon: boolean): string {
  // < 768: the arch starts at `top` = header 60 + hero padding 12 + head ≤ 222 + figure margin 28 (+ ribbon); under it
  // the Ortszeile, 12 px of air and the dock (108 px; 125 px below 400 px, where the Ortszeile takes two lines). Capped
  // width 0.8 × (100svh − top − under). While the natural Ortszeile lies below the fold (top + 1.25 × (100vw − 40px)
  // + 12px ≥ 100svh) the arch keeps its natural width: the clamp() term is then large and min() picks the column.
  const top = 322 + (ribbon ? 47 : 0);
  const natural = `clamp(0px, (125vw + ${top + 12 - 50}px - 100vh) * 1000, 99999px)`;
  const phone = (under: number) => `min(100vw - 40px, 80vh - ${r1(0.8 * (top + under))}px + ${natural})`;
  // 768–1023: one centred column (max 36rem); the arch starts at 292px + 10.9vw (+ ribbon), and the Ortszeile, the
  // entry up to its CTA and 12 px of air take 311 px under it: capped width 0.8 × (rest − 311px), rest = 100svh − start.
  // Where less than 300 px of arch would remain (rest ≤ 611px), the arch takes the rest of the first view, at least
  // 300 px (0.8 × max(300px, rest)); the clamp() term switches between the two.
  const start = 292 + (ribbon ? 33 : 0);
  const tablet =
    `min(100vw - 64px, 576px, max(80vh - 8.72vw - ${r1(0.8 * (start + 311))}px, ` +
    `max(240px, 80vh - 8.72vw - ${r1(0.8 * start)}px) - clamp(0px, (100vh - 10.9vw - ${start + 611}px) * 1000, 99999px)))`;
  return [
    "(min-width: 1440px) 628px",
    "(min-width: 1280px) 45vw",
    "(min-width: 1024px) 37vw",
    `(min-width: 768px) ${tablet}`,
    "(min-width: 768px) 68vw",
    `(max-width: 399px) ${phone(125)}`,
    "(max-width: 399px) calc(100vw - 40px)",
    phone(108),
    "calc(100vw - 40px)",
  ].join(", ");
}
/** One decimal, no trailing ".0". */
const r1 = (n: number) => String(Math.round(n * 10) / 10);
