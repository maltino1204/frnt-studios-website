import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { Container } from "@/components/ui/layout";
import { cn } from "@/lib/cn";
import { BRAND_DESCRIPTOR, BRAND_NAME, BRAND_TAGLINE, SUPPORT_EMAIL } from "@/lib/brand";
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

/** Footer on Linen (brand § 9.3): the micro wordmark, the tagline in Newsreader Italic, quiet link columns. */
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
        { href: routes.pro.onboarding(), label: "Profi werden" },
        { href: routes.forPros(), label: `${BRAND_NAME} für Profis` },
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
        { href: "/agb-profis", label: "AGB für Profis" },
        { href: "/widerruf", label: "Widerrufsbelehrung" },
        { href: `${routes.privacy()}#cookies`, label: "Cookie-Einstellungen" },
      ],
    },
  ];

  return (
    <footer className="relative isolate cv-auto overflow-clip bg-surface-sunken pt-16 pb-10 text-ink [--cv-size:1100px] md:pt-24 lg:[--cv-size:560px]">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-6">
          <div className="flex flex-col gap-5 lg:col-span-4">
            <Link href="/" aria-label={`${BRAND_NAME}, zur Startseite`} className="-mx-2 inline-flex min-h-touch items-center self-start rounded-control px-2 focus-ring">
              <Wordmark title={null} className="h-[18px] lg:h-5" />
            </Link>
            <p lang="en" className="max-w-[16ch] type-accent text-[1.75rem] leading-[1.1] text-ink lg:text-[2rem]">
              {BRAND_TAGLINE}
            </p>
          </div>
          {/* The link style lives once on the nav (not on ~50 links), which keeps every page's HTML and RSC payload smaller (A5-9). */}
          <nav
            aria-label="Fußzeile"
            className={cn(
              "grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-5",
              "[&_a]:inline-flex [&_a]:min-h-touch [&_a]:items-center [&_a]:rounded-control [&_a]:py-1 [&_a]:type-body-s [&_a]:break-words [&_a]:text-ink-muted [&_a]:transition-colors [&_a]:duration-fast [&_a]:focus-ring [&_a]:hover:text-ink lg:[&_a]:min-h-8",
            )}
          >
            {columns.map((col) => (
              <div key={col.title} className="flex min-w-0 flex-col gap-3">
                <h2 className="type-label-s text-ink">{col.title}</h2>
                <ul className="flex flex-col lg:gap-0.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-16 flex flex-col gap-2 border-t border-line-mid pt-6 md:flex-row md:items-center md:justify-between">
          <p className="inline-flex items-center gap-2 type-caption text-ink-muted">
            © {new Date().getFullYear()} {BRAND_NAME} · {BRAND_DESCRIPTOR}
          </p>
          <p className="type-caption text-ink-muted">
            {BRAND_NAME} vermittelt Termine. Vertragspartner für die Behandlung ist der jeweilige Profi.
          </p>
        </div>
      </Container>
    </footer>
  );
}
