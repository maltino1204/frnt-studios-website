import { routes } from "@/lib/routes";

/**
 * The landing's page links (spec § 5.2, § 5.4; v2: „Entdecken“ first, as in the site header). No directive: the
 * header and the overlay (client) and the static no-JS list (server) read the same values.
 */
export type PageLink = { href: string; label: string };

/** Header links from 1280 px (1024–1279 and below: in the overlay, „Menü“). „So funktioniert’s“ is chapter 03. */
export const HEADER_LINKS: readonly PageLink[] = [
  { href: routes.explore(), label: "Entdecken" },
  { href: routes.categories(), label: "Behandlungen" },
  { href: "#so-funktionierts", label: "So funktioniert’s" },
  { href: routes.forPros(), label: "Für Profis" },
  { href: routes.help(), label: "Hilfe" },
];

/** „Seiten“ in the chapter overlay and in the static chapter list (no JS). */
export const PAGE_LINKS: readonly PageLink[] = [
  { href: routes.explore(), label: "Entdecken" },
  { href: routes.categories(), label: "Behandlungen" },
  { href: routes.cities(), label: "Städte" },
  { href: routes.forPros(), label: "Für Profis" },
  { href: routes.help(), label: "Hilfe" },
];
