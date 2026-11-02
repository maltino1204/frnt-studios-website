/** One category of chapter 03, from `listCatalog()` and `getPriceFloors()` (real floors only). */
export type CategoryItem = {
  slug: string;
  name: string;
  /** the deck's tile line (the catalogue's tagline) */
  tagline: string | null;
  href: string;
  /** „ab 45 €“, or null when no Profi offers the category yet */
  price: string | null;
  /** up to three service names from the catalogue */
  services: string[];
  /** v2 image (resolved through `replacedBy`) and its stored focal point */
  image: string;
  focal: string;
};

/** The 03 preview arch's `sizes` (desktop index, spec § 4.3); also used to prefetch the other previews. */
export const PREVIEW_SIZES = "(min-width: 1440px) 519px, 36vw";
