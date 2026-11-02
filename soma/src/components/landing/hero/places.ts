import { PLACE_LINES } from "@/components/site/discovery-copy";

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
    alt: "Ein Profi massiert am Abend den Rücken einer Person auf einer Massageliege, in einem Berliner Altbauzimmer mit hohen Fenstern.",
    place: PLACE_LINES.home,
    citySlug: "berlin",
  },
  {
    id: "hotel",
    label: "Im Hotel",
    src: "/images/editorial/hotel-v2.jpg",
    focal: "72% 50%",
    alt: "Ein Profi massiert am späten Abend einen Gast in einer Hotelsuite; hinter dem Fenster die beleuchtete Frankfurter Skyline.",
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
 * that cap, the same svh arithmetic with `clamp()` standing in for its `sign()`, and the LCP photo is fetched for the
 * width it is shown at (audit-3 M-5). Each such entry is followed by the uncapped width for the same range, which a
 * browser that cannot evaluate min() / clamp() / svh in `sizes` falls back to (then it fetches as before).
 * `ribbon`: the demo ribbon above the header (DEMO_MODE, 47 px on phones, 33 px at 768–1023) moves the arch down.
 * Keep it in step with the cap in landing.css.
 */
export function heroSizes(ribbon: boolean): string {
  // < 768: the arch starts at header 60 + hero padding 12 + head ≤ 222 + figure margin 28 (+ ribbon); under it the
  // Ortszeile, 12 px of air and the dock (108 px; 125 px below 400 px, where the Ortszeile takes two lines). While the
  // natural Ortszeile lies below the fold, the arch keeps its natural width: the clamp() term is then large.
  const top = 322 + (ribbon ? 47 : 0);
  const phone = (under: number) =>
    `min(100vw - 40px, 0.8 * (100svh - ${top + under}px) + clamp(0px, (${top + 12}px + 1.25 * (100vw - 40px) - 100svh) * 1000, 100000px))`;
  // 768–1023: one centred column (max 36rem); the arch starts at 292 px + 10.9vw (+ ribbon); the Ortszeile, the entry up
  // to its CTA and 12 px of air take 311 px under it. Where less than 300 px of arch would remain, the arch is instead
  // as tall as the rest of the first view (at least 300 px).
  const rest = `(100svh - ${292 + (ribbon ? 33 : 0)}px - 10.9vw)`;
  const tablet = `min(100vw - 64px, 576px, max(0.8 * (${rest} - 311px), 0.8 * max(300px, ${rest}) - clamp(0px, (${rest} - 611px) * 1000, 100000px)))`;
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
