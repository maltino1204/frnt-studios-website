import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { Container } from "@/components/ui/layout";
import { BRAND_NAME, BRAND_TAGLINE, SUPPORT_EMAIL } from "@/lib/brand";
import { routes } from "@/lib/routes";
import type { CategoryDTO, CityDTO } from "@/server/dto";
import { listCategories, listCities } from "@/server/services/catalog";

type FooterLink = { href: string; label: string };

async function loadFooterData(): Promise<{ categories: CategoryDTO[]; cities: CityDTO[] }> {
  // The footer must never take a page down with it: fall back to the static columns.
  try {
    const [categories, cities] = await Promise.all([listCategories(), listCities()]);
    return { categories, cities };
  } catch (e) {
    console.error("[site-footer] catalogue unavailable", e);
    return { categories: [], cities: [] };
  }
}

/** Night-scope footer (design-guideline §8 "Footer"). */
export async function SiteFooter() {
  const { categories, cities } = await loadFooterData();
  const columns: Array<{ title: string; links: FooterLink[] }> = [
    {
      title: "Behandlungen",
      links: [
        ...categories.map((c) => ({ href: routes.category(c.slug), label: c.name })),
        { href: routes.categories(), label: "Alle Behandlungen" },
      ],
    },
    {
      title: "Städte",
      links: [...cities.map((c) => ({ href: routes.city(c.slug), label: c.name })), { href: "/staedte", label: "Alle Städte" }],
    },
    {
      title: "Für Profis",
      links: [
        { href: routes.forPros(), label: `Profi werden bei ${BRAND_NAME}` },
        { href: routes.login(routes.pro.root()), label: "Anmelden für Profis" },
      ],
    },
    {
      title: "Hilfe",
      links: [
        { href: routes.help(), label: "Hilfe & häufige Fragen" },
        { href: "/stornierung", label: "Stornierung" },
        { href: "/ranking", label: "So sortieren wir" },
        { href: `mailto:${SUPPORT_EMAIL}`, label: SUPPORT_EMAIL },
      ],
    },
    {
      title: "Rechtliches",
      links: [
        { href: routes.imprint(), label: "Impressum" },
        { href: routes.privacy(), label: "Datenschutz" },
        { href: routes.terms(), label: "AGB" },
        { href: "/widerruf", label: "Widerrufsbelehrung" },
        { href: `${routes.privacy()}#cookies`, label: "Cookie-Einstellungen" },
      ],
    },
  ];

  return (
    <footer data-theme="night" className="bg-surface py-16 text-ink md:py-24">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-6">
          <div className="flex flex-col gap-5 lg:col-span-4">
            <Link href="/" aria-label={`${BRAND_NAME}, zur Startseite`} className="-m-2 self-start p-2">
              <Wordmark className="h-6 lg:h-6" />
            </Link>
            <p className="type-display-s italic text-ink">{BRAND_TAGLINE}</p>
          </div>
          <nav aria-label="Fußzeile" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-5">
            {columns.map((col) => (
              <div key={col.title} className="flex min-w-0 flex-col gap-4">
                <h2 className="type-overline text-ink">{col.title}</h2>
                <ul className="flex flex-col lg:gap-1">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="inline-flex min-h-touch items-center py-1 type-body-s break-words text-ink-muted transition-colors duration-fast hover:text-ink lg:min-h-8"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-16 flex flex-col gap-2 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
          <p className="type-caption text-ink-muted">© {new Date().getFullYear()} {BRAND_NAME}</p>
          <p className="type-caption text-ink-muted">
            {BRAND_NAME} vermittelt Termine. Vertragspartner für die Behandlung ist der jeweilige Profi.
          </p>
        </div>
      </Container>
    </footer>
  );
}
