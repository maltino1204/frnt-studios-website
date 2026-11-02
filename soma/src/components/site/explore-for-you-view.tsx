"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CalendarCheck, Heart, Info } from "lucide-react";
import { AiLabel } from "@/components/ui/ai-label";
import { Portrait } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Container } from "@/components/ui/layout";
import { routes } from "@/lib/routes";
import type { ForYouDTO, ForYouRebookDTO } from "@/server/services/explore";
import { RebookButton } from "./account-rebook";
import { lastTimeText } from "./checkout-format";
import { accentLinkClass } from "./discovery-styles";
import { ExploreCard, ExploreProviderCard } from "./explore-cards";
import { FOR_YOU_WHY_HREF, slotText } from "./explore-copy";
import { ExploreRail, ExploreSectionHeader } from "./explore-rail";

type On = Extract<ForYouDTO, { state: "on" }>;

/**
 * The „Für dich“ rails (loaded as their own chunk by ForYouSlot): Wieder buchen (one-tap rebook), Passend zu deinen
 * Buchungen, Neu in deiner Nähe. Only what is real: a rail without data is left out, and a quiet line says what
 * would make the section useful.
 */
export function ForYouView({ data }: { data: On }) {
  const plz = data.place ? `${data.place.postalCode} ${data.place.city}` : null;
  const nothing = data.rebook.length === 0 && data.matching.length === 0 && data.nearbyNew.length === 0;
  return (
    <section id="fuer-dich" aria-labelledby="fuer-dich-titel" className="animate-fade-in pb-(--space-section)">
      <Container>
        <ExploreSectionHeader
          id="fuer-dich-titel"
          overline="Für dich"
          title={data.firstName ? `Für dich, ${data.firstName}` : "Für dich"}
          lead={plz ? `Aus deinen Buchungen, deinen Favoriten und deiner Adresse in ${plz}.` : "Aus deinen Buchungen und deinen Favoriten."}
          aside={
            <Link href={FOR_YOU_WHY_HREF} className={`${accentLinkClass} -my-2`}>
              <Icon icon={Info} size={16} />
              Warum sehe ich das?
            </Link>
          }
        />
        <div className="flex flex-col gap-10 md:gap-14">
          {data.rebook.length ? (
            <Rail id="fy-wieder" title="Wieder buchen" lead="Deine Profis – gleiche Behandlung, die Uhrzeit wählst du.">
              <ExploreRail label="Wieder buchen" columns={3}>
                {data.rebook.map((r) => (
                  <RebookCard key={r.key} item={r} />
                ))}
              </ExploreRail>
            </Rail>
          ) : null}
          {data.matching.length ? (
            <Rail id="fy-passend" title="Passend zu deinen Buchungen" lead={`Aus den Kategorien, die du gebucht hast – von Profis, die nach ${plz} kommen.`}>
              <ExploreRail label="Passend zu deinen Buchungen">
                {data.matching.map((c) => (
                  <ExploreCard key={c.key} card={c} headingLevel="h4" />
                ))}
              </ExploreRail>
            </Rail>
          ) : null}
          {data.nearbyNew.length ? (
            <Rail id="fy-neu" title="Neu in deiner Nähe" lead={`Seit Kurzem auf SOMA und für ${plz} buchbar.`}>
              <ExploreRail label="Neu in deiner Nähe">
                {data.nearbyNew.map((p) => (
                  <ExploreProviderCard key={p.providerId} provider={p} postalCode={data.place?.postalCode} />
                ))}
              </ExploreRail>
            </Rail>
          ) : null}
          <Hint data={data} nothing={nothing} />
        </div>
      </Container>
    </section>
  );
}

function Rail({ id, title, lead, children }: { id: string; title: string; lead: string; children: ReactNode }) {
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 id={id} className="type-heading-m text-ink">
          {title}
        </h3>
        <p className="type-body-s text-ink-muted">{lead}</p>
      </div>
      {children}
    </div>
  );
}

function RebookCard({ item: r }: { item: ForYouRebookDTO }) {
  const profile = routes.provider(r.provider.slug);
  return (
    <article aria-labelledby={`${r.key}-name`} className="flex w-full flex-col gap-4 rounded-card bg-surface-raised p-4 shadow-raised">
      <div className="flex items-start gap-3.5">
        <Portrait src={r.provider.avatarUrl} name={r.provider.displayName} sizes="64px" shape="oval" className="w-16 shrink-0" />
        <div className="flex min-w-0 flex-col gap-1 pt-1">
          <h4 id={`${r.key}-name`} className="flex min-w-0 items-center gap-1.5 type-heading-s">
            <Link href={profile} className="-my-1 truncate rounded-control py-1 focus-ring hover:underline hover:decoration-1 hover:underline-offset-4">
              {r.provider.displayName}
            </Link>
            {r.isFavorite ? <Icon icon={Heart} size={14} className="shrink-0 fill-ink text-ink" aria-hidden={false} aria-label="Favorit" role="img" /> : null}
          </h4>
          <p className="type-caption text-ink-muted">
            {r.serviceName && r.lastAt ? `${r.serviceName} · zuletzt ${lastTimeText(r.lastAt)}` : "In deinen Favoriten"}
            {r.provider.cityName ? ` · ${r.provider.cityName}` : ""}
          </p>
          <AiLabel src={r.provider.avatarUrl} />
        </div>
      </div>
      {r.nextSlot ? (
        <p className="inline-flex items-start gap-1.5 type-caption text-ink num">
          <Icon icon={CalendarCheck} size={14} className="mt-px shrink-0" />
          {`Nächster freier Termin: ${slotText(r.nextSlot)}`}
        </p>
      ) : null}
      <div className="mt-auto">
        {r.bookingId ? (
          <RebookButton bookingId={r.bookingId} size="s" label={`Wieder bei ${r.provider.displayName.split(" ")[0]} buchen`} className="w-full" />
        ) : (
          <ButtonLink href={profile} variant="secondary" size="s" block iconRight={<Icon icon={ArrowRight} size={16} />}>
            Profil ansehen
          </ButtonLink>
        )}
      </div>
    </article>
  );
}

/** What is missing for better suggestions, in one calm line (never a nag). */
function Hint({ data, nothing }: { data: On; nothing: boolean }) {
  let text: string | null = null;
  let link: { href: string; label: string } | null = null;
  if (nothing && !data.place) {
    text = "Sobald du eine Adresse gespeichert oder gebucht hast, findest du hier Vorschläge aus deinen eigenen Buchungen.";
    link = { href: routes.account.addresses(), label: "Adresse speichern" };
  } else if (!data.place) {
    text = "Mit einer gespeicherten Adresse zeigen wir dir auch passende Behandlungen und neue Profis in deiner Nähe – mit freien Terminen.";
    link = { href: routes.account.addresses(), label: "Adresse speichern" };
  } else if (!data.hasHistory) {
    text = "Nach deiner ersten Buchung schlagen wir dir hier Behandlungen vor, die dazu passen.";
    link = { href: routes.categories(), label: "Behandlungen ansehen" };
  } else if (nothing) {
    text = "Gerade haben wir keine passenden Vorschläge mit freien Terminen in den nächsten 7 Tagen.";
    link = { href: routes.search({ plz: data.place.postalCode }), label: "Freie Termine finden" };
  }
  if (!text || !link) return null;
  return (
    <p className="flex flex-col gap-1 border-y border-line py-4 type-body-s text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <span>{text}</span>
      <Link href={link.href} className={`${accentLinkClass} -my-2 shrink-0`}>
        {link.label}
        <Icon icon={ArrowRight} size={16} />
      </Link>
    </p>
  );
}
