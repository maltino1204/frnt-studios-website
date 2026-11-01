import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ToneFill } from "@/components/ui/motif";
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
    <Container className="grid gap-12 py-(--space-section) lg:grid-cols-12 lg:items-center lg:gap-6">
      <div className="flex flex-col gap-6 lg:col-span-6">
        <Overline>Fehler 404</Overline>
        <h1 className="type-display-l">
          Hier ist niemand. <em>Noch nicht.</em>
        </h1>
        <p className="max-w-[32rem] type-body-l text-ink-muted">
          Diese Seite gibt es nicht oder nicht mehr. Vielleicht ist der Link veraltet – deine Behandlung findest du über die Startseite.
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
      <div className="flex flex-col gap-4 lg:col-span-5 lg:col-start-8">
        {/* An empty doorstep: the category wash with a Paper card that names the missing page. Decorative. */}
        <div aria-hidden className="relative isolate flex h-56 items-center justify-center overflow-hidden rounded-panel shadow-float md:h-64">
          <ToneFill seed="404" tone="brows-lashes" arch={false} />
          <span className="relative z-[3] flex flex-col items-center gap-1 rounded-card bg-surface-raised px-8 py-5 shadow-float">
            <span className="type-display-m num">404</span>
            <span className="type-caption text-ink">Seite nicht gefunden</span>
          </span>
        </div>
        <nav aria-label="Weiter zu">
          <ul className="flex flex-col divide-y divide-line rounded-card bg-surface-raised px-2 shadow-raised">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="group flex min-h-14 items-center justify-between gap-4 rounded-control px-3 py-3 type-heading-m focus-ring">
                  {l.label}
                  <Icon icon={ArrowRight} className="text-ink-muted transition-[translate,color] duration-base ease-settle group-hover:translate-x-0.5 group-hover:text-ink" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </Container>
  );
}
