import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { AuraBackground } from "@/components/ui/aura";
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

/** Light footer with a faint aura (design-guideline v2 §8 "Footer"). */
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
    <footer className="relative isolate overflow-clip border-t border-line bg-surface pt-16 pb-10 text-ink md:pt-24">
      <AuraBackground variant="subtle" placement="left" fade="bottom" animate={false} className="opacity-70" />
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-6">
          <div className="flex flex-col gap-5 lg:col-span-4">
            <Link href="/" aria-label={`${BRAND_NAME}, zur Startseite`} className="-mx-2 inline-flex min-h-touch items-center self-start rounded-control px-2 focus-ring">
              <Wordmark className="h-6 lg:h-6" />
            </Link>
            <p className="max-w-[16ch] type-accent text-[1.75rem] leading-[1.1] text-ink lg:text-[2rem]">{BRAND_TAGLINE}</p>
          </div>
          <nav aria-label="Fußzeile" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-5">
            {columns.map((col) => (
              <div key={col.title} className="flex min-w-0 flex-col gap-3">
                <h2 className="type-label-s text-ink">{col.title}</h2>
                <ul className="flex flex-col lg:gap-0.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="inline-flex min-h-touch items-center rounded-control py-1 type-body-s break-words text-ink-muted transition-colors duration-fast hover:text-ink focus-ring lg:min-h-8"
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
          <p className="inline-flex items-center gap-2 type-caption text-ink-muted">
            <span aria-hidden className="h-0.5 w-4 rounded-full bg-aura" />© {new Date().getFullYear()} {BRAND_NAME}
          </p>
          <p className="type-caption text-ink-muted">
            {BRAND_NAME} vermittelt Termine. Vertragspartner für die Behandlung ist der jeweilige Profi.
          </p>
        </div>
      </Container>
    </footer>
  );
}
