import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ChipLink, ChipRow } from "@/components/ui/chip";
import { CategoryIcon } from "@/components/brand/brand-icon";
import { Reveal } from "@/components/ui/motion";
import { accentLinkClass } from "@/components/site/discovery-styles";
import { Icon } from "@/components/ui/icon";
import { Container, Overline } from "@/components/ui/layout";
import { Photo } from "@/components/ui/photo";
import { AiLabel } from "@/components/ui/ai-label";
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
    "Alle Behandlungen auf einen Blick: Massage, Maniküre, Pediküre, Kosmetik, Make-up, Haare und Brows & Lashes – von geprüften Profis bei dir zu Hause, im Hotel oder im Büro.",
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
      <div className="relative isolate overflow-clip">
      <Container className="pt-5 md:pt-7">
        <Breadcrumbs items={crumbs} />
        <header className="flex max-w-[44rem] flex-col gap-5 pt-8 pb-10 md:pt-12 md:pb-14">
          <Overline>Behandlungen</Overline>
          <h1 className="type-display-l">
            {capitalize(numberWord(catalog.length))} Behandlungen. <em>Alle bei dir.</em>
          </h1>
          <p className="max-w-[34rem] type-body-l text-ink-muted">
            Jede Leistung zeigt, ab welchem Preis sie gerade angeboten wird. Den Endpreis inklusive Anfahrt siehst du in der Suche für deine Adresse.
          </p>
        </header>
      </Container>
      </div>
      {/* Sticky glass jump bar */}
      <div className="sticky top-(--header-height) z-20 glass-strong shadow-[0_1px_0_var(--color-line)]">
        <Container>
          <ChipRow label="Zu einer Behandlung springen" className="py-2.5">
            {catalog.map((c) => (
              <ChipLink key={c.slug} href={`#${c.slug}`}>
                <CategoryIcon slug={c.slug} size={16} />
                {c.name}
              </ChipLink>
            ))}
          </ChipRow>
        </Container>
      </div>

      {catalog.map((c, i) => {
        const prices = c.services.map((s) => fm[s.id]).filter((n): n is number => typeof n === "number");
        const from = prices.length ? Math.min(...prices) : null;
        return (
          <section
            key={c.slug}
            id={c.slug}
            aria-labelledby={`${c.slug}-titel`}
            className={cn("scroll-mt-36 pt-12 md:pt-16", i === catalog.length - 1 && "pb-(--space-section)")}
          >
            <Container>
              <Reveal className="grid gap-8 lg:grid-cols-12 lg:gap-6">
                <div className="lg:col-span-4">
                  {/* The AI label sits under the photo, outside the decorative (aria-hidden) link, so it is read. */}
                  <div className="flex flex-col gap-2 lg:sticky lg:top-[calc(var(--header-height)+5.5rem)]">
                    <Link
                      href={routes.category(c.slug)}
                      tabIndex={-1}
                      aria-hidden
                      className="block overflow-hidden rounded-panel shadow-raised transition-[translate,box-shadow] duration-base ease-settle hover:-translate-y-0.5 hover:shadow-float"
                    >
                      <Photo
                        src={c.imagePath ?? images.category(c.slug)}
                        alt=""
                        tone={c.slug}
                        word={c.name}
                        sizes="(min-width: 1024px) 30vw, 100vw"
                        className="aspect-[2/1] w-full sm:aspect-[5/2] lg:aspect-[4/5]"
                      />
                    </Link>
                    <AiLabel src={c.imagePath ?? images.category(c.slug)} kind="image" />
                  </div>
                </div>
                <div className="flex flex-col gap-8 lg:col-span-7 lg:col-start-6">
                  <div className="flex flex-col gap-4">
                    <p className="type-overline text-ink-muted num">
                      {c.services.length} Leistungen{from != null ? ` · ${fromPrice(from)}` : ""}
                    </p>
                    {/* Sans: the page's one serif headline is the h1 (brand guidelines § 4.4, audit-3 N12). */}
                    <h2 id={`${c.slug}-titel`} className="type-heading-l">
                      {c.name}
                    </h2>
                    {c.description ? <p className="max-w-[36rem] type-body-l text-ink-muted">{c.description}</p> : null}
                    <Link href={routes.category(c.slug)} className={cn(accentLinkClass, "self-start")}>
                      Alles zu {c.name}
                      <Icon icon={ArrowRight} size={16} className="transition-transform duration-base ease-settle group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                  <ServiceList services={c.services} floors={fm} categorySlug={c.slug} linkTo={routes.category(c.slug)} />
                </div>
              </Reveal>
            </Container>
          </section>
        );
      })}
    </>
  );
}
