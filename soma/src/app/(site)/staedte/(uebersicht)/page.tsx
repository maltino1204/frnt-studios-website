import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AuraArt, AuraBackground } from "@/components/ui/aura";
import { ChipLink } from "@/components/ui/chip";
import { Reveal } from "@/components/ui/motion";
import { Surface } from "@/components/ui/surface";
import { Icon } from "@/components/ui/icon";
import { Container, Overline } from "@/components/ui/layout";
import { Breadcrumbs } from "@/components/site/discovery-breadcrumbs";
import { numberWord } from "@/components/site/discovery-copy";
import { breadcrumbLd, JsonLd } from "@/components/site/discovery-json-ld";
import { routes } from "@/lib/routes";
import { listCategories, listCities } from "@/server/services/catalog";
import { getCoverageMatrix } from "@/server/services/site-ext";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Städte: Beauty & Wellness zu Hause",
  description: "In diesen Städten kommen geprüfte Profis für Massage, Nägel, Kosmetik, Make-up und mehr zu Ihnen nach Hause, ins Hotel oder ins Büro.",
  alternates: { canonical: "/staedte" },
};

export default async function StaedtePage() {
  const [cities, categories, coverage] = await Promise.all([listCities(), listCategories(), getCoverageMatrix()]);
  const crumbs = [
    { name: "Start", path: routes.home() },
    { name: "Städte", path: "/staedte" },
  ];

  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <div className="relative isolate overflow-clip">
        <AuraBackground placement="right" variant="section" fade="both" animate={false} />
        <Container className="pt-5 md:pt-7">
          <Breadcrumbs items={crumbs} />
          <header className="flex max-w-[44rem] flex-col gap-5 pt-8 pb-10 md:pt-12 md:pb-14">
            <Overline>Städte</Overline>
            <h1 className="type-display-l">
              Jetzt in {numberWord(cities.length)} Städten. <em>Weitere folgen.</em>
            </h1>
            <p className="max-w-[34rem] type-body-l text-ink-muted">
              Ihre Stadt fehlt? Geben Sie auf der Startseite Ihre Postleitzahl ein – wir melden uns, sobald Profis in Ihrer Gegend buchbar sind.
            </p>
          </header>
        </Container>
      </div>

      <Container className="pb-(--space-section)">
        <Reveal as="ul" stagger className="grid gap-4 md:grid-cols-2 lg:gap-6">
          {cities.map((c) => {
            const rows = categories.map((cat) => ({ cat, n: coverage.find((x) => x.citySlug === c.slug && x.categorySlug === cat.slug)?.providerCount ?? 0 }));
            const live = rows.filter((r) => r.n > 0);
            return (
              <li key={c.slug} className="min-w-0">
                <Surface className="flex h-full flex-col gap-5 p-1.5 pb-6">
                  <Link
                    href={routes.city(c.slug)}
                    className="group relative isolate flex h-32 items-end justify-between gap-4 overflow-hidden rounded-tile px-5 pb-4 focus-ring md:h-40"
                  >
                    <AuraArt seed={`stadt:${c.slug}`} tone="brows-lashes" />
                    <h2 className="relative z-[2] type-display-m text-ink">{c.name}</h2>
                    <span className="relative z-[2] inline-flex size-10 shrink-0 items-center justify-center rounded-full glass-strong glass-edge text-ink shadow-raised transition-transform duration-base ease-settle group-hover:translate-x-0.5">
                      <Icon icon={ArrowRight} size={18} />
                    </span>
                  </Link>
                  <div className="flex flex-col gap-3 px-4">
                    <p className="type-caption text-ink-muted num">
                      {c.state && c.state !== c.name ? `${c.state} · ` : ""}
                      {live.length} von {categories.length} Behandlungen
                    </p>
                    <ul className="flex flex-wrap gap-2" aria-label={`Behandlungen in ${c.name}`}>
                      {live.map((r) => (
                        <li key={r.cat.slug}>
                          <ChipLink href={routes.categoryCity(r.cat.slug, c.slug)}>{r.cat.name}</ChipLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Surface>
              </li>
            );
          })}
        </Reveal>
      </Container>
    </>
  );
}
