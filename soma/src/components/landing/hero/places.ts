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

/** The hero arch's `sizes` (spec § 4.1.2); the same string is used to prefetch the other places. */
export const HERO_SIZES =
  "(min-width: 1440px) 628px, (min-width: 1280px) 45vw, (min-width: 1024px) 37vw, (min-width: 768px) 68vw, calc(100vw - 40px)";
