import Link from "next/link";
import { ArrowRight, CalendarCheck2, CheckCircle2, Star, Wallet } from "lucide-react";
import { AgendaTimeline, RequestPanel } from "@/components/pro/bookings";
import { InviteCard } from "@/components/pro/invite-card";
import { firstNameOf, formatPercent, PROVIDER_STATUS_LABEL } from "@/components/pro/labels";
import { AsideLink, ProPage, ProSection } from "@/components/pro/page";
import { MoneyCount, RatingBars, weekKeyOf, weeklySeries } from "@/components/pro/stats";
import { addDaysKey, berlinDateKey, berlinToIso, greetingFor } from "@/components/pro/time";
import { ProgressRing } from "@/components/pro/ui";
import { FormattedNumber } from "@/components/ui/number";
import { ButtonLink } from "@/components/ui/button";
import { StatGrid, StatTile } from "@/components/ui/data";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { formatDay, formatRating, plural } from "@/lib/format";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import type { OnboardingStepDTO } from "@/server/dto";
import { listProviderBookings } from "@/server/services/bookings";
import { getEarnings, getProCalendar, getProDashboard, getProSettings, listMyReviews } from "@/server/services/pro";
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
  const today = berlinDateKey();
  const [dash, upcoming, settings, terms, earnings, week, reviews] = await Promise.all([
    getProDashboard(session),
    listProviderBookings(session, "upcoming", 1, 6),
    getProSettings(session),
    getProviderTerms(),
    getEarnings(session, { limit: 200 }),
    getProCalendar(session, today, 7),
    listMyReviews(session, 1),
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

  // KPI series from real data: weekly payouts and completed appointments (8 weeks), confirmed per day (next 7 days).
  const completedItems = earnings.items.filter((i) => i.completedAt);
  const payoutWeeks = weeklySeries(completedItems, 8, (i) => i.payoutCents, now);
  const countWeeks = weeklySeries(completedItems.filter((i) => i.status === "completed"), 8, () => 1, now);
  const thisMonday = weekKeyOf(now);
  const prevStart = Date.parse(berlinToIso(addDaysKey(thisMonday, -7), "00:00"));
  const prevSoFar = completedItems
    .filter((i) => {
      const t = Date.parse(i.completedAt!);
      return t >= prevStart && t <= now - 7 * 86_400_000;
    })
    .reduce((a, i) => a + i.payoutCents, 0);
  const weekDelta = prevSoFar > 0 ? Math.round(((dash.weekEarningsCents - prevSoFar) / prevSoFar) * 1000) / 10 : null;
  const perDay = Array.from({ length: 7 }, (_, d) => {
    const key = addDaysKey(today, d);
    return week.bookings.filter((b) => (b.status === "confirmed" || b.status === "in_progress") && berlinDateKey(b.startsAt) === key).length;
  });
  const showRating = dash.ratingAvg != null && dash.ratingCount >= 3;

  const summary = [
    dash.openRequests.length ? plural(dash.openRequests.length, "offene Anfrage", "offene Anfragen") : null,
    agenda.length ? `${plural(agenda.length, "Termin", "Termine")} heute` : "heute keine Termine",
    dash.upcomingCount ? `${dash.upcomingCount} bevorstehend` : null,
  ].filter(Boolean) as string[];

  return (
    <ProPage>
      <div className="relative isolate flex flex-col gap-8 lg:gap-10">
        <div aria-hidden className="pointer-events-none absolute -inset-x-(--space-gutter) -top-6 -z-10 h-[20rem] lg:-top-10 lg:h-[24rem]">

        </div>
        <header className="flex flex-col gap-2.5">
          <p className="flex items-center gap-2.5 type-overline text-ink-muted" suppressHydrationWarning>
            {formatDay(new Date())}
          </p>
          <h1 className="type-display-s" suppressHydrationWarning>
            {greetingFor()}
            {first ? `, ${first}.` : "."}
          </h1>
          <p className="type-body text-ink-muted">
            {summary.map((s, i) => (
              <span key={s}>
                {i > 0 ? <span aria-hidden> · </span> : null}
                {i === 0 && dash.openRequests.length ? (
                  <a href="#anfragen" className="rounded-control py-3 font-[520] text-ink underline decoration-line-mid decoration-1 underline-offset-[0.25em] focus-ring hover:decoration-ink">
                    {s.replace(/^./, (c) => c.toUpperCase())}
                  </a>
                ) : i === 0 ? (
                  s.replace(/^./, (c) => c.toUpperCase())
                ) : (
                  s
                )}
              </span>
            ))}
          </p>
        </header>

        {!approved ? (
          <Notice kind={dash.status === "suspended" ? "danger" : "warning"} title={`Status: ${PROVIDER_STATUS_LABEL[dash.status]}`}>
            {dash.status === "suspended" ? (
              <>Dein Profil ist pausiert und erscheint nicht in der Suche. {dash.onboarding.lastDecisionNote ? `Hinweis: ${dash.onboarding.lastDecisionNote}` : "Bei Fragen hilft dir der SOMA-Support."}</>
            ) : (
              <>
                Wir prüfen dein Profil und deine Dokumente und melden uns, sobald alles geprüft ist. Bis zur Freischaltung bist du in der Suche noch nicht sichtbar.{" "}
                <Link href={routes.pro.onboarding()}>Status ansehen</Link>
              </>
            )}
          </Notice>
        ) : null}

        <section aria-labelledby="zahlen-title" className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <h2 id="zahlen-title" className="type-heading-m">
              Diese Woche
            </h2>
            <AsideLink href={routes.pro.earnings()}>Einnahmen</AsideLink>
          </div>
          <StatGrid>
            <StatTile
              label="Verdient"
              icon={<Icon icon={Wallet} size={16} />}
              value={<MoneyCount cents={dash.weekEarningsCents} />}
              delta={weekDelta}
              deltaLabel="ggü. Vorwoche"
              hint="abgeschlossene Termine"
              deltaTone="neutral"
              spark={payoutWeeks}
              sparkLabel="Verlauf · letzte 8 Wochen"
            />
            <StatTile
              label="Bevorstehend"
              icon={<Icon icon={CalendarCheck2} size={16} />}
              value={<FormattedNumber value={dash.upcomingCount} />}
              hint="bestätigte Termine"
              spark={perDay}
              sparkLabel="Termine je Tag · nächste 7 Tage"
            />
            <StatTile
              label="Bewertung"
              icon={<Icon icon={Star} size={16} />}
              value={showRating ? <FormattedNumber value={dash.ratingAvg!} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} /> : "—"}
              hint={showRating ? plural(dash.ratingCount, "Bewertung", "Bewertungen") : "ab drei Bewertungen sichtbar"}
              sparkline={reviews.ratingCount > 0 ? <RatingBars distribution={reviews.distribution} /> : undefined}
              sparkLabel={reviews.ratingCount > 0 ? "Verteilung · 1 bis 5 Sterne" : undefined}
            />
            <StatTile
              label="Abgeschlossen"
              icon={<Icon icon={CheckCircle2} size={16} />}
              value={<FormattedNumber value={dash.completedCount} />}
              hint="seit Start"
              spark={countWeeks}
              sparkLabel="Je Woche · letzte 8 Wochen"
            />
          </StatGrid>
        </section>
      </div>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="flex min-w-0 flex-col gap-10 lg:col-span-7">
          {dash.openRequests.length ? (
            <ProSection
              id="anfragen"
              title={
                <span className="flex items-center gap-2">
                  Offene Anfragen
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-ink px-2 type-label-s text-ink-inverse num">{dash.openRequests.length}</span>
                </span>
              }
              aside={dash.openRequests.length > 2 ? <AsideLink href={`${routes.pro.bookings()}?tab=anfragen`}>Alle ansehen</AsideLink> : null}
            >
              <div className="flex flex-col gap-4">
                {dash.openRequests.slice(0, 2).map((b) => (
                  <RequestPanel key={b.id} booking={b} serverNow={now} windowHours={terms.requestResponseHours} />
                ))}
              </div>
            </ProSection>
          ) : null}

          <ProSection id="heute" title="Heute" aside={<AsideLink href={routes.pro.calendar()}>Kalender</AsideLink>}>
            {agenda.length ? (
              <AgendaTimeline bookings={agenda} now={now} label="Termine heute" />
            ) : (
              <div className="rounded-card bg-surface-raised px-5 shadow-raised lg:px-6">
                <EmptyState
                  className="py-6!"
                  seed="pro-heute-frei"
                  title="Heute ist frei."
                  action={
                    <ButtonLink href={`${routes.pro.calendar()}?ansicht=arbeitszeiten`} variant="secondary">
                      Arbeitszeiten prüfen
                    </ButtonLink>
                  }
                >
                  {next.length ? "Dein nächster Termin steht unten." : "Halte deine Arbeitszeiten aktuell, damit Kundschaft dich buchen kann."}
                </EmptyState>
              </div>
            )}
          </ProSection>

          {next.length ? (
            <ProSection id="naechste" title="Als Nächstes" aside={<AsideLink href={routes.pro.bookings()}>Alle Termine</AsideLink>}>
              <AgendaTimeline bookings={next} showDate now={now} label="Nächste Termine" />
            </ProSection>
          ) : null}
        </div>

        <aside className="flex min-w-0 flex-col gap-6 lg:col-span-5" aria-label="Überblick">
          <section className="flex flex-col gap-5 rounded-card bg-surface-raised p-5 shadow-raised lg:p-6" aria-labelledby="profil-title">
            <div className="flex items-center gap-4">
              <ProgressRing value={percent / 100} size={64} stroke={5}>
                <span className="type-label-s num text-ink">{percent} %</span>
              </ProgressRing>
              <div className="flex min-w-0 flex-col gap-0.5">
                <h2 id="profil-title" className="type-heading-m">
                  {openSteps.length ? "Profil einrichten" : "Profil vollständig"}
                </h2>
                <p className="type-body-s text-ink-muted num">
                  {done} von {steps.length} Schritten erledigt
                </p>
              </div>
            </div>
            {openSteps.length ? (
              <ul className="-mx-2 flex flex-col">
                {openSteps.map((s) => (
                  <li key={s.key}>
                    <Link href={STEP_HREF[s.key]} className="group flex min-h-touch items-center justify-between gap-3 rounded-control px-2 type-body-s text-ink transition-colors duration-fast focus-ring hover:bg-surface-tint">
                      <span className="flex items-center gap-2.5">
                        <span aria-hidden className="size-2 rounded-full bg-warning" />
                        {s.label}
                      </span>
                      <Icon icon={ArrowRight} size={16} className="text-ink-muted transition-transform duration-fast group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col gap-3 border-t border-line pt-4">
                <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {steps.map((s) => (
                    <li key={s.key} className="flex items-center gap-2 type-caption text-ink">
                      <span aria-hidden className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                        <svg viewBox="0 0 16 16" className="size-3" fill="none">
                          <path d="M4 8.4l2.5 2.4L12 5.4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="truncate">{s.label}</span>
                    </li>
                  ))}
                </ul>
                <p className="type-caption text-ink-muted">
                  Ein aktuelles Portfolio hilft bei der Buchung.{" "}
                  <Link href={`${routes.pro.profile()}#portfolio`} className={cn("font-[520] text-ink underline decoration-line-strong decoration-1 underline-offset-[0.2em] hover:text-link-hover hover:decoration-current")}>
                    Portfolio pflegen
                  </Link>
                </p>
              </div>
            )}
          </section>

          {approved ? (
            <InviteCard inviteUrl={settings.inviteUrl} ownClientRateLabel={terms.commission ? formatPercent(terms.commission.ownClientRate) : "5 %"} compact />
          ) : null}

          {showRating ? (
            <Link
              href={routes.pro.reviews()}
              className="group flex items-center justify-between gap-4 rounded-card bg-surface-raised px-5 py-4 shadow-raised lift focus-ring lg:px-6"
            >
              <span className="flex flex-col gap-0.5">
                <span className="type-label text-ink">Bewertungen</span>
                <span className="type-caption text-ink-muted num">
                  {formatRating(dash.ratingAvg!)} von 5 · {plural(dash.ratingCount, "Bewertung", "Bewertungen")}
                </span>
              </span>
              <Icon icon={ArrowRight} size={16} className="text-ink-muted transition-transform duration-fast group-hover:translate-x-0.5" />
            </Link>
          ) : null}
        </aside>
      </div>
    </ProPage>
  );
}
