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
 * The hero arch's `sizes` (spec § 4.1.2); the same string is used for the preload and to prefetch the other places.
 *
 * Width-only on purpose (audit-4 N4-2). Below 1024 the arch is capped to the first view (landing.css, "The arch's
 * first view below 1024"), which depends on the viewport's height, and audit-3 M-5 wrote that cap into `sizes`
 * (`svh`, `clamp()`). But Chromium's preload scanner evaluates viewport-height units and height media queries against
 * the screen height, while the DOM uses the viewport (measured: 428 × 746 in a 926 px screen, `sizes="100vh"`: the
 * scanner fetched 1000w, the <img> 800w). With any height in `sizes` the scanner's speculative request and the <img>
 * (and the preload) pick different widths whenever the browser's chrome takes room, which is always on a phone, and
 * the photo downloads twice. So `sizes` names the arch's uncapped width below 1024: never smaller than the arch shown,
 * one request everywhere. On high-DPR phones it is mostly the same file as with the cap (1080w).
 */
export function heroSizes(): string {
  return [
    "(min-width: 1440px) 628px",
    "(min-width: 1280px) 45vw",
    "(min-width: 1024px) 37vw",
    // 768–1023: one centred column of at most 36rem inside the 32 px gutters
    "(min-width: 768px) min(100vw - 64px, 576px)",
    "calc(100vw - 40px)",
  ].join(", ");
}
