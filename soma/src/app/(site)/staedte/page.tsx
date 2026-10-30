import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ChipLink } from "@/components/ui/chip";
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
      <Container className="pt-6 pb-(--space-section) md:pt-8">
        <Breadcrumbs items={crumbs} />
        <header className="flex max-w-[44rem] flex-col gap-5 pt-8 pb-12 md:pt-12 md:pb-16">
          <Overline>Städte</Overline>
          <h1 className="type-display-l">
            Jetzt in {numberWord(cities.length)} Städten. <em>Weitere folgen.</em>
          </h1>
          <p className="max-w-[34rem] type-body-l text-ink-muted">
            Ihre Stadt fehlt? Geben Sie auf der Startseite Ihre Postleitzahl ein – wir melden uns, sobald Profis in Ihrer Gegend buchbar sind.
          </p>
        </header>

        <ul className="border-t border-line">
          {cities.map((c) => {
            const rows = categories.map((cat) => ({ cat, n: coverage.find((x) => x.citySlug === c.slug && x.categorySlug === cat.slug)?.providerCount ?? 0 }));
            const live = rows.filter((r) => r.n > 0);
            return (
              <li key={c.slug} className="grid gap-5 border-b border-line py-8 md:py-10 lg:grid-cols-12 lg:gap-6">
                <div className="flex flex-col gap-1 lg:col-span-4">
                  <Link href={routes.city(c.slug)} className="group inline-flex items-center gap-3 self-start">
                    <h2 className="type-display-m underline-offset-[6px] decoration-1 group-hover:underline">{c.name}</h2>
                    <Icon icon={ArrowRight} className="shrink-0 text-ink-muted transition-transform duration-fast group-hover:translate-x-0.5" />
                  </Link>
                  <p className="type-caption text-ink-muted num">
                    {c.state} · {live.length} von {categories.length} Behandlungen
                  </p>
                </div>
                <div className="lg:col-span-8">
                  <ul className="flex flex-wrap gap-2" aria-label={`Behandlungen in ${c.name}`}>
                    {live.map((r) => (
                      <li key={r.cat.slug}>
                        <ChipLink href={routes.categoryCity(r.cat.slug, c.slug)}>{r.cat.name}</ChipLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </>
  );
}
