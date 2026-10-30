import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ChipLink, ChipRow } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { Container, Overline } from "@/components/ui/layout";
import { Photo } from "@/components/ui/photo";
import { Breadcrumbs } from "@/components/site/discovery-breadcrumbs";
import { capitalize, floorsById, fromPrice, numberWord } from "@/components/site/discovery-copy";
import { breadcrumbLd, JsonLd } from "@/components/site/discovery-json-ld";
import { ServiceList } from "@/components/site/discovery-services";
import { cn } from "@/lib/cn";
import { images } from "@/lib/images";
import { routes } from "@/lib/routes";
import { listCatalog } from "@/server/services/catalog";
import { getPriceFloors } from "@/server/services/site-ext";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Behandlungen zu Hause: Massage, Nägel, Kosmetik und mehr",
  description:
    "Alle Behandlungen auf einen Blick: Massage, Maniküre, Pediküre, Kosmetik, Make-up, Haare und Brows & Lashes – von geprüften Profis bei Ihnen zu Hause, im Hotel oder im Büro.",
  alternates: { canonical: routes.categories() },
};

export default async function BehandlungenPage() {
  const [catalog, floors] = await Promise.all([listCatalog(), getPriceFloors()]);
  const fm = floorsById(floors);
  const crumbs = [
    { name: "Start", path: routes.home() },
    { name: "Behandlungen", path: routes.categories() },
  ];

  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <Container className="pt-6 md:pt-10">
        <Breadcrumbs items={crumbs} />
        <header className="flex max-w-[44rem] flex-col gap-5 pt-8 pb-10 md:pt-12 md:pb-14">
          <Overline>Behandlungen</Overline>
          <h1 className="type-display-l">
            {capitalize(numberWord(catalog.length))} Behandlungen. <em>Alle bei Ihnen.</em>
          </h1>
          <p className="max-w-[34rem] type-body-l text-ink-muted">
            Jede Leistung zeigt, ab welchem Preis sie gerade angeboten wird. Den Endpreis inklusive Anfahrt sehen Sie in der Suche für Ihre Adresse.
          </p>
        </header>
        <ChipRow label="Zu einer Behandlung springen" className="pb-2">
          {catalog.map((c) => (
            <ChipLink key={c.slug} href={`#${c.slug}`}>
              {c.name}
            </ChipLink>
          ))}
        </ChipRow>
      </Container>

      {catalog.map((c, i) => {
        const prices = c.services.map((s) => fm[s.id]).filter((n): n is number => typeof n === "number");
        const from = prices.length ? Math.min(...prices) : null;
        return (
          <section
            key={c.slug}
            id={c.slug}
            aria-labelledby={`${c.slug}-titel`}
            className={cn("scroll-mt-20 pt-12 md:pt-16", i === catalog.length - 1 && "pb-(--space-section)")}
          >
            <Container>
              <div className="grid gap-8 border-t border-line pt-10 md:pt-14 lg:grid-cols-12 lg:gap-6">
                <div className="lg:col-span-4">
                  <Link href={routes.category(c.slug)} tabIndex={-1} aria-hidden className="block lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
                    <Photo
                      src={c.imagePath ?? images.category(c.slug)}
                      alt=""
                      tone={c.slug}
                      word={c.name}
                      sizes="(min-width: 1024px) 30vw, 100vw"
                      className="aspect-[3/2] w-full lg:aspect-[4/5]"
                    />
                  </Link>
                </div>
                <div className="flex flex-col gap-8 lg:col-span-7 lg:col-start-6">
                  <div className="flex flex-col gap-4">
                    <p className="type-overline text-ink-muted num">
                      {c.services.length} Leistungen{from != null ? ` · ${fromPrice(from)}` : ""}
                    </p>
                    <h2 id={`${c.slug}-titel`} className="type-display-m">
                      {c.name}
                    </h2>
                    {c.description ? <p className="max-w-[36rem] type-body-l text-ink-muted">{c.description}</p> : null}
                    <Link
                      href={routes.category(c.slug)}
                      className="inline-flex min-h-touch items-center gap-2 self-start type-label text-accent underline decoration-1 underline-offset-[0.2em] hover:text-accent-hover"
                    >
                      Alles zu {c.name}
                      <Icon icon={ArrowRight} size={16} />
                    </Link>
                  </div>
                  <ServiceList services={c.services} floors={fm} categorySlug={c.slug} linkTo={routes.category(c.slug)} />
                </div>
              </div>
            </Container>
          </section>
        );
      })}
    </>
  );
}
