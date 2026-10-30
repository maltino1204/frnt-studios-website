import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { AgendaRow, RequestPanel } from "@/components/pro/bookings";
import { InviteCard } from "@/components/pro/invite-card";
import { firstNameOf, formatPercent, PROVIDER_STATUS_LABEL } from "@/components/pro/labels";
import { AsideLink, ProPage, ProSection } from "@/components/pro/page";
import { greetingFor } from "@/components/pro/time";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { StatGrid, StatTile } from "@/components/ui/data";
import { Icon } from "@/components/ui/icon";
import { Rating } from "@/components/ui/trust";
import { cn } from "@/lib/cn";
import { formatDay, formatPrice, formatRating, plural } from "@/lib/format";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import type { OnboardingStepDTO } from "@/server/dto";
import { listProviderBookings } from "@/server/services/bookings";
import { getProDashboard, getProSettings } from "@/server/services/pro";
import { getProviderTerms } from "@/server/services/pro-ext";

export const metadata = { title: "Heute" };

const STEP_HREF: Record<OnboardingStepDTO["key"], string> = {
  profile: routes.pro.profile(),
  services: routes.pro.services(),
  area: routes.pro.area(),
  hours: `${routes.pro.calendar()}?ansicht=arbeitszeiten`,
  documents: routes.pro.verification(),
  payout: routes.pro.earnings(),
};

export default async function ProTodayPage() {
  const session = await requireRole("provider", "/pro");
  const [dash, upcoming, settings, terms] = await Promise.all([
    getProDashboard(session),
    listProviderBookings(session, "upcoming", 1, 6),
    getProSettings(session),
    getProviderTerms(),
  ]);
  const now = Date.now();
  const first = firstNameOf(dash.displayName) || session.firstName || "";
  const todayIds = new Set(dash.today.map((b) => b.id));
  const next = upcoming.items.filter((b) => !todayIds.has(b.id)).slice(0, 3);
  const agenda = dash.today.filter((b) => b.status !== "requested");
  const steps = dash.onboarding.steps;
  const done = steps.filter((s) => s.done).length;
  const percent = Math.round((done / Math.max(1, steps.length)) * 100);
  const openSteps = steps.filter((s) => !s.done);
  const approved = dash.status === "approved";

  const summary = [
    dash.openRequests.length ? plural(dash.openRequests.length, "offene Anfrage", "offene Anfragen") : null,
    agenda.length ? `${plural(agenda.length, "Termin", "Termine")} heute` : "heute keine Termine",
    dash.upcomingCount ? `${dash.upcomingCount} bevorstehend` : null,
  ].filter(Boolean);

  return (
    <ProPage>
      <header className="flex flex-col gap-2">
        <p className="type-overline text-ink-muted">{formatDay(new Date())}</p>
        <h1 className="type-display-s" suppressHydrationWarning>
          {greetingFor()}
          {first ? `, ${first}.` : "."}
        </h1>
        <p className="type-body-s text-ink-muted">{summary.join(" · ")}</p>
      </header>

      {!approved ? (
        <Notice kind={dash.status === "suspended" ? "danger" : "warning"} title={`Status: ${PROVIDER_STATUS_LABEL[dash.status]}`}>
          {dash.status === "suspended" ? (
            <>Dein Profil ist pausiert und erscheint nicht in der Suche. {dash.onboarding.lastDecisionNote ? `Hinweis: ${dash.onboarding.lastDecisionNote}` : "Bei Fragen hilft dir der SOMA-Support."}</>
          ) : (
            <>
              Wir prüfen dein Profil und deine Dokumente – meist innerhalb von 48 Stunden. Bis zur Freischaltung bist du in der Suche noch nicht sichtbar.{" "}
              <Link href={routes.pro.onboarding()}>Status ansehen</Link>
            </>
          )}
        </Notice>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-10 lg:col-span-7">
          {dash.openRequests.length ? (
            <ProSection
              id="anfragen"
              title={`Offene Anfragen (${dash.openRequests.length})`}
              aside={dash.openRequests.length > 2 ? <AsideLink href={`${routes.pro.bookings()}?tab=anfragen`}>Alle ansehen</AsideLink> : null}
            >
              <div className="flex flex-col gap-3">
                {dash.openRequests.slice(0, 2).map((b) => (
                  <RequestPanel key={b.id} booking={b} />
                ))}
              </div>
            </ProSection>
          ) : null}

          <ProSection id="heute" title="Heute" aside={<AsideLink href={routes.pro.calendar()}>Kalender</AsideLink>}>
            {agenda.length ? (
              <ul className="border-y border-line">
                {agenda.map((b) => (
                  <AgendaRow key={b.id} booking={b} now={now} />
                ))}
              </ul>
            ) : (
              <EmptyState
                className="py-2!"
                title="Heute ist frei."
                action={
                  <ButtonLink href={`${routes.pro.calendar()}?ansicht=arbeitszeiten`} variant="secondary">
                    Arbeitszeiten prüfen
                  </ButtonLink>
                }
              >
                {next.length ? "Dein nächster Termin steht unten." : "Halte deine Arbeitszeiten aktuell, damit Kundschaft dich buchen kann."}
              </EmptyState>
            )}
          </ProSection>

          {next.length ? (
            <ProSection id="naechste" title="Als Nächstes" aside={<AsideLink href={routes.pro.bookings()}>Alle Termine</AsideLink>}>
              <ul className="border-y border-line">
                {next.map((b) => (
                  <AgendaRow key={b.id} booking={b} showDate now={now} />
                ))}
              </ul>
            </ProSection>
          ) : null}
        </div>

        <aside className="flex flex-col gap-10 lg:col-span-5" aria-label="Überblick">
          <ProSection id="zahlen" title="Diese Woche" aside={<AsideLink href={routes.pro.earnings()}>Einnahmen</AsideLink>}>
            <StatGrid className="lg:grid-cols-2!">
              <StatTile label="Verdient" value={formatPrice(dash.weekEarningsCents)} hint="abgeschlossene Termine" />
              <StatTile
                label="Bewertung"
                value={dash.ratingAvg && dash.ratingCount >= 3 ? formatRating(dash.ratingAvg) : "—"}
                hint={dash.ratingCount >= 3 ? plural(dash.ratingCount, "Bewertung", "Bewertungen") : <Rating avg={dash.ratingAvg} count={dash.ratingCount} />}
              />
              <StatTile label="Bevorstehend" value={dash.upcomingCount.toLocaleString("de-DE")} hint="bestätigte Termine" />
              <StatTile label="Abgeschlossen" value={dash.completedCount.toLocaleString("de-DE")} hint="seit Start" />
            </StatGrid>
          </ProSection>

          <section className="flex flex-col gap-4 border border-line bg-surface-raised p-5 lg:p-6" aria-labelledby="profil-title">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="profil-title" className="type-heading-m">
                Profil
              </h2>
              <span className="type-label num text-ink">{percent} % vollständig</span>
            </div>
            <div className="flex gap-1" aria-hidden>
              {steps.map((s) => (
                <span key={s.key} className={cn("h-0.5 flex-1", s.done ? "bg-ink" : "bg-line")} />
              ))}
            </div>
            {openSteps.length ? (
              <ul className="flex flex-col">
                {openSteps.map((s) => (
                  <li key={s.key} className="border-b border-line last:border-b-0">
                    <Link href={STEP_HREF[s.key]} className="flex min-h-touch items-center justify-between gap-3 type-body-s text-ink hover:text-accent">
                      {s.label}
                      <Icon icon={ArrowRight} size={16} className="text-ink-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 type-body-s text-ink-muted">
                <Icon icon={Check} size={16} className="text-success" />
                Alles eingerichtet. Ein aktuelles Portfolio hilft bei der Buchung.
              </p>
            )}
          </section>

          <InviteCard inviteUrl={settings.inviteUrl} ownClientRateLabel={terms.commission ? formatPercent(terms.commission.ownClientRate) : "5 %"} compact />
        </aside>
      </div>
    </ProPage>
  );
}
