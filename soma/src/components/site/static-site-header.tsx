import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Container } from "@/components/ui/layout";
import { BRAND_TAGLINE } from "@/lib/brand";
import { routes } from "@/lib/routes";

const LINKS = [
  { href: routes.explore(), label: "Entdecken" },
  { href: routes.categories(), label: "Behandlungen" },
  { href: "/staedte", label: "Städte" },
  { href: routes.forPros(), label: "Für Profis" },
];

/**
 * The marketing header as server markup, for the root 404 (src/app/not-found.tsx). The root not-found tree is part of
 * every route's payload, so a client <SiteHeader/> there loaded its chunk (≈ 11 KB gz) on every page, `/` included.
 * Same look at rest as <SiteHeader/> (transparent, micro wordmark, the three links, „Anmelden“, „Termin finden“);
 * below lg the menu is a native disclosure with the same links and actions. No session read: the page stays static.
 */
export function StaticSiteHeader() {
  return (
    <header className="sticky top-0 z-(--z-header) h-(--header-height) bg-transparent">
      <Container className="flex h-full items-center justify-between gap-6">
        <Link href="/" aria-label="SOMA, zur Startseite" className="-mx-2 inline-flex min-h-touch items-center rounded-control px-2 focus-ring">
          <Wordmark />
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          <nav aria-label="Hauptnavigation">
            <ul className="flex items-center gap-1">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="relative inline-flex h-10 items-center rounded-full px-4 type-label text-ink transition-colors duration-fast pressable focus-ring hover:bg-surface-sunken"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <span aria-hidden className="h-5 w-px bg-line-mid" />
          <div className="flex items-center gap-2">
            <ButtonLink href={routes.login()} variant="ghost">
              Anmelden
            </ButtonLink>
            <ButtonLink href="/#termin">Termin finden</ButtonLink>
          </div>
        </div>

        {/* Closed: the menu button in the header. Open: a full-screen Bone layer with its own header row (as the
            client MobileMenu's dialog), the button stays in place as „close“. */}
        <details className="group lg:hidden open:fixed open:inset-0 open:z-(--z-overlay) open:flex open:flex-col open:bg-surface open:[&::details-content]:flex open:[&::details-content]:min-h-0 open:[&::details-content]:flex-1 open:[&::details-content]:flex-col">
          <summary
            aria-label="Menü"
            title="Menü"
            className="-mr-2.5 inline-flex size-touch shrink-0 cursor-pointer list-none items-center justify-center rounded-full text-ink pressable focus-ring hover:bg-surface-sunken active:bg-surface-pressed group-open:absolute group-open:top-[calc((var(--header-height)-var(--spacing-touch))/2)] group-open:right-[calc(var(--space-gutter)-0.625rem)] group-open:mr-0 [&::-webkit-details-marker]:hidden"
          >
            <Icon icon={Menu} size={24} className="group-open:hidden" />
            <Icon icon={X} size={24} className="hidden group-open:block" />
          </summary>
          <div className="flex h-(--header-height) shrink-0 items-center px-(--space-gutter)">
            <Link href="/" aria-label="SOMA, zur Startseite" className="-mx-2 inline-flex min-h-touch items-center rounded-control px-2 focus-ring">
              <Wordmark />
            </Link>
          </div>
          <nav aria-label="Hauptnavigation" className="min-h-0 flex-1 overflow-y-auto px-(--space-gutter) pt-8 pb-8">
            <ul className="flex flex-col">
              {[...LINKS, { href: routes.help(), label: "Hilfe" }].map((l) => (
                <li key={l.href} className="border-b border-line/80 last:border-b-0">
                  <Link href={l.href} className="group/l flex min-h-16 items-center justify-between gap-4 rounded-control py-2 type-display-s transition-colors duration-fast focus-ring">
                    {l.label}
                    <Icon
                      icon={ArrowUpRight}
                      size={20}
                      className="text-ink-muted transition-[translate,color] duration-base ease-arrive group-hover/l:translate-x-0.5 group-hover/l:-translate-y-0.5 group-hover/l:text-ink"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex shrink-0 flex-col gap-3 px-(--space-gutter) pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <ButtonLink href="/#termin" size="l" block>
              Termin finden
            </ButtonLink>
            <ButtonLink href={routes.login()} variant="secondary" size="l" block>
              Anmelden
            </ButtonLink>
            <p lang="en" className="pt-3 text-center type-accent text-[1.25rem] leading-snug text-ink-muted">
              {BRAND_TAGLINE}
            </p>
          </div>
        </details>
      </Container>
    </header>
  );
}
