import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import type { ReactNode } from "react";
import { AiLabel } from "@/components/ui/ai-label";
import { Icon } from "@/components/ui/icon";
import { Container } from "@/components/ui/layout";
import { Photo } from "@/components/ui/photo";
import { routes } from "@/lib/routes";
import type { ExploreCollectionDTO } from "@/server/services/explore";
import { Breadcrumbs } from "./discovery-breadcrumbs";
import { breadcrumbLd, JsonLd } from "./discovery-json-ld";
import { accentLinkClass } from "./discovery-styles";
import { CollectionLabelTag, ExploreCard } from "./explore-cards";
import { collectionLabel, itemCountLabel, SELECTION_WHY_HREF } from "./explore-copy";

/**
 * One collection (/entdecken/[slug] and the admin preview): the label and its info text (editorial or „Anzeige“),
 * the title as the view's one serif headline, the cover in the arch with its AI label, then the items as cards that
 * link into the existing flow.
 */
export function CollectionView({ collection: c, notice }: { collection: ExploreCollectionDTO; notice?: ReactNode }) {
  const label = collectionLabel(c);
  const title = /[.!?…]$/.test(c.title) ? c.title : `${c.title}.`;
  const crumbs = [
    { name: "Start", path: routes.home() },
    { name: "Entdecken", path: routes.explore() },
    { name: c.title, path: routes.exploreCollection(c.slug) },
  ];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <section aria-labelledby="sammlung-titel" className="relative isolate overflow-clip">
        <Container className="pt-5 md:pt-7">
          <Breadcrumbs items={crumbs} />
          {notice ? <div className="pt-4">{notice}</div> : null}
        </Container>
        <Container className="grid gap-8 pt-6 pb-12 md:pt-10 lg:grid-cols-12 lg:items-end lg:gap-6 lg:pb-16">
          <div className="flex min-w-0 flex-col gap-5 lg:col-span-6">
            <CollectionLabelTag label={label} />
            <h1 id="sammlung-titel" className="type-display-m text-balance">
              {title}
            </h1>
            {c.subline ? <p className="max-w-[34rem] type-lead text-ink-muted">{c.subline}</p> : null}
            <div className="flex max-w-[34rem] flex-col gap-2 rounded-tile bg-surface-sunken px-4 py-3.5" data-testid="sammlung-hinweis">
              <p className="flex items-start gap-2.5 type-body-s text-ink">
                <Icon icon={Info} size={16} className="mt-0.5 shrink-0 text-ink-muted" />
                <span>
                  <span className="font-semibold">{label.text}.</span> {label.info}
                </span>
              </p>
              <Link href={SELECTION_WHY_HREF} className={`${accentLinkClass} -my-1.5 ml-[1.625rem] self-start type-label-s`}>
                So wählen wir aus
              </Link>
            </div>
          </div>
          <figure className="min-w-0 lg:col-span-5 lg:col-start-8">
            <Photo
              src={c.coverImage}
              alt=""
              tone={c.tone}
              priority
              shape="arch"
              ratio="4/5"
              sizes="(min-width: 1024px) 36vw, (min-width: 640px) 60vw, 88vw"
              className="mx-auto w-full max-w-[22rem] lg:max-w-[26rem]"
            />
            <figcaption className="mx-auto mt-3 max-w-[22rem] lg:max-w-[26rem]">
              <AiLabel src={c.coverImage} kind="image" />
            </figcaption>
          </figure>
        </Container>
      </section>

      <section aria-labelledby="sammlung-liste" className="pb-(--space-section)">
        <Container>
          <div className="mb-6 flex items-baseline justify-between gap-4 md:mb-8">
            <h2 id="sammlung-liste" className="type-heading-l text-ink">
              In dieser Auswahl
            </h2>
            <span className="type-label-s text-ink-muted num">{itemCountLabel(c.items.length)}</span>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6">
            {c.items.map((it) => (
              <li key={it.key} className="flex min-w-0">
                <ExploreCard card={it} headingLevel="h3" sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw" />
              </li>
            ))}
          </ul>
          <p className="mt-10 type-body-s text-ink-muted md:mt-14">
            Freie Termine und den Endpreis inklusive Anfahrt siehst du im Profil oder in der Suche, sobald du deine Postleitzahl eingibst.
          </p>
          <Link href={routes.explore()} className={`${accentLinkClass} mt-4`}>
            <Icon icon={ArrowLeft} size={16} />
            Mehr entdecken
          </Link>
        </Container>
      </section>
    </>
  );
}
