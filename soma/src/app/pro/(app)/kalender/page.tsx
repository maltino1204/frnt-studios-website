import { AgendaRow } from "@/components/pro/bookings";
import { WEEKDAYS } from "@/components/pro/labels";
import { ProHeader, ProPage } from "@/components/pro/page";
import { addDaysKey, berlinDateKey, berlinToIso, formatTimeOffRange, weekdayOfKey } from "@/components/pro/time";
import { TimeOffEditor } from "@/components/pro/time-off-editor";
import { WeeklyHoursEditor } from "@/components/pro/weekly-hours-editor";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { TabLinks } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { dateParts } from "@/lib/format";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { getProCalendar, listTimeOff } from "@/server/services/pro";

export const metadata = { title: "Kalender" };

const VIEWS = [
  { slug: "uebersicht", label: "Übersicht" },
  { slug: "arbeitszeiten", label: "Arbeitszeiten" },
  { slug: "abwesenheiten", label: "Abwesenheiten" },
] as const;

const DAYS = 14;

export default async function ProCalendarPage({ searchParams }: PageProps<"/pro/kalender">) {
  const session = await requireRole("provider", "/pro/kalender");
  const sp = await searchParams;
  const view = VIEWS.find((v) => v.slug === sp.ansicht)?.slug ?? "uebersicht";
  const today = berlinDateKey();
  const [cal, timeOff] = await Promise.all([getProCalendar(session, today, DAYS), view === "abwesenheiten" ? listTimeOff(session) : Promise.resolve(null)]);
  const now = Date.now();

  return (
    <ProPage>
      <ProHeader title="Kalender" description="Deine Arbeitszeiten bestimmen, wann Kundschaft dich buchen kann. Abwesenheiten blockieren einzelne Tage." />
      <div className="flex flex-col gap-8">
        <TabLinks
          label="Kalender-Ansicht"
          items={VIEWS.map((v) => ({ href: `${routes.pro.calendar()}?ansicht=${v.slug}`, label: v.label, active: v.slug === view }))}
        />

        {view === "uebersicht" ? (
          <>
            {cal.weeklyHours.length === 0 ? (
              <Notice kind="warning" title="Noch keine Arbeitszeiten.">
                Ohne Arbeitszeiten bist du nicht buchbar. <a href={`${routes.pro.calendar()}?ansicht=arbeitszeiten`}>Jetzt eintragen</a>
              </Notice>
            ) : null}
            <ol className="border-y border-line" aria-label={`Die nächsten ${DAYS} Tage`}>
              {Array.from({ length: DAYS }, (_, i) => {
                const key = addDaysKey(today, i);
                const dayStart = Date.parse(berlinToIso(key, "00:00"));
                const dayEnd = Date.parse(berlinToIso(addDaysKey(key, 1), "00:00"));
                const wd = weekdayOfKey(key);
                const hours = cal.weeklyHours.filter((h) => h.weekday === wd);
                const bookings = cal.bookings.filter((b) => {
                  const t = Date.parse(b.startsAt);
                  return t >= dayStart && t < dayEnd;
                });
                const off = cal.timeOff.filter((t) => Date.parse(t.start) < dayEnd && Date.parse(t.end) > dayStart);
                const p = dateParts(new Date(dayStart + 12 * 3_600_000));
                const isToday = i === 0;
                return (
                  <li key={key} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3 border-b border-line py-4 last:border-b-0 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-x-4">
                    <div className="relative flex flex-col items-start gap-0.5 pt-1">
                      {isToday ? <span aria-hidden className="absolute -top-1 left-0 h-0.5 w-3 bg-ink" /> : null}
                      <span className="type-caption text-ink-muted">{isToday ? "Heute" : WEEKDAYS[wd - 1].short}</span>
                      <span className="type-heading-m num">{p.day}.</span>
                      <span className="type-caption text-ink-muted">{p.month}</span>
                    </div>
                    <div className="flex min-w-0 flex-col gap-2">
                      <p className={cn("type-caption", off.length ? "text-warning" : "text-ink-muted")}>
                        {off.length
                          ? `Abwesend · ${off.map((o) => `${formatTimeOffRange(o)}${o.reason ? ` (${o.reason})` : ""}`).join(", ")}`
                          : hours.length
                            ? `Buchbar ${hours.map((h) => `${h.start}–${h.end}`).join(", ")}`
                            : "Nicht buchbar"}
                      </p>
                      {bookings.length ? (
                        <ul className="border-t border-line">
                          {bookings.map((b) => (
                            <AgendaRow key={b.id} booking={b} now={now} compact />
                          ))}
                        </ul>
                      ) : (
                        <p className="type-body-s text-ink-muted">Keine Termine</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href={`${routes.pro.calendar()}?ansicht=arbeitszeiten`} variant="secondary">
                Arbeitszeiten bearbeiten
              </ButtonLink>
              <ButtonLink href={`${routes.pro.calendar()}?ansicht=abwesenheiten`} variant="ghost">
                Abwesenheit eintragen
              </ButtonLink>
            </div>
          </>
        ) : view === "arbeitszeiten" ? (
          <div className="max-w-[46rem]">
            <WeeklyHoursEditor initial={cal.weeklyHours} />
          </div>
        ) : (
          <TimeOffEditor entries={timeOff ?? []} />
        )}
      </div>
    </ProPage>
  );
}
