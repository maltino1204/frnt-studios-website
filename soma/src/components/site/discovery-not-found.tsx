import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Container, Overline } from "@/components/ui/layout";
import { routes } from "@/lib/routes";

/** On-brand 404 content; the root not-found adds header/footer, (site)/not-found renders inside the site layout. */
export function NotFoundContent() {
  const links = [
    { href: routes.categories(), label: "Alle Behandlungen" },
    { href: "/staedte", label: "Städte" },
    { href: routes.help(), label: "Hilfe & häufige Fragen" },
  ];
  return (
    <Container className="grid gap-12 py-(--space-section) lg:grid-cols-12 lg:gap-6">
      <div className="flex flex-col gap-6 lg:col-span-7">
        <Overline>Fehler 404</Overline>
        <h1 className="type-display-l">
          Hier ist niemand. <em>Noch nicht.</em>
        </h1>
        <p className="max-w-[32rem] type-body-l text-ink-muted">
          Diese Seite gibt es nicht oder nicht mehr. Vielleicht hat sich die Adresse geändert – die Behandlung, die Sie suchen, finden Sie bestimmt über die Startseite.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <ButtonLink href="/#termin" size="l">
            Termin finden
          </ButtonLink>
          <ButtonLink href="/" variant="secondary" size="l">
            Zur Startseite
          </ButtonLink>
        </div>
      </div>
      <nav aria-label="Weiter zu" className="lg:col-span-4 lg:col-start-9 lg:pt-16">
        <ul className="border-t border-line">
          {links.map((l) => (
            <li key={l.href} className="border-b border-line">
              <Link href={l.href} className="group flex min-h-14 items-center justify-between gap-4 py-3 type-heading-m">
                {l.label}
                <Icon icon={ArrowRight} className="text-ink-muted transition-transform duration-fast group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Container>
  );
}
