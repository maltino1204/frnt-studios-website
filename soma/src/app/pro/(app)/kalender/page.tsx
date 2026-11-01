import Link from "next/link";
import { CalendarOff, ChevronLeft, ChevronRight, Clock, Inbox, Users } from "lucide-react";
import { WeekGrid, WeekList, weekFigures } from "@/components/pro/calendar";
import { ProHeader, ProPage } from "@/components/pro/page";
import { addDaysKey, berlinDateKey, berlinToIso } from "@/components/pro/time";
import { TimeOffEditor } from "@/components/pro/time-off-editor";
import { WeeklyHoursEditor } from "@/components/pro/weekly-hours-editor";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { TabLinks } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { formatDayShort } from "@/lib/format";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { getProCalendar, listTimeOff } from "@/server/services/pro";

export const metadata = { title: "Kalender" };

const VIEWS = [
  { slug: "uebersicht", label: "Übersicht" },
  { slug: "arbeitszeiten", label: "Arbeitszeiten" },
  { slug: "abwesenheiten", label: "Abwesenheiten" },
] as const;

const weekHref = (offset: number) => `${routes.pro.calendar()}${offset ? `?woche=${offset}` : ""}`;

export default async function ProCalendarPage({ searchParams }: PageProps<"/pro/kalender">) {
  const session = await requireRole("provider", "/pro/kalender");
  const sp = await searchParams;
  const view = VIEWS.find((v) => v.slug === sp.ansicht)?.slug ?? "uebersicht";
  const offset = Math.max(-12, Math.min(26, Math.trunc(Number(typeof sp.woche === "string" ? sp.woche : 0)) || 0));
  const now = Date.now();
  // A rolling week that starts today: the first column is always the day you are in.
  const monday = addDaysKey(berlinDateKey(now), offset * 7);
  const [cal, timeOff] = await Promise.all([getProCalendar(session, monday, 7), view === "abwesenheiten" ? listTimeOff(session) : Promise.resolve(null)]);
  const data = { monday, weeklyHours: cal.weeklyHours, timeOff: cal.timeOff, bookings: cal.bookings, now };
  const figures = weekFigures(data);
  const sunday = addDaysKey(monday, 6);

  return (
    <ProPage>
      <ProHeader
        title="Kalender"
        description="Deine Arbeitszeiten bestimmen, wann Kundschaft dich buchen kann. Abwesenheiten blockieren einzelne Tage."
        actions={
          view === "uebersicht" ? (
            <ButtonLink href={`${routes.pro.calendar()}?ansicht=abwesenheiten`} variant="secondary" icon={<Icon icon={CalendarOff} />} className="max-md:hidden">
              Abwesenheit eintragen
            </ButtonLink>
          ) : null
        }
      />
      <div className="flex flex-col gap-6">
        <TabLinks
          label="Kalender-Ansicht"
          items={VIEWS.map((v) => ({ href: `${routes.pro.calendar()}?ansicht=${v.slug}`, label: v.label, active: v.slug === view }))}
        />

        {view === "uebersicht" ? (
          <>
            {cal.weeklyHours.length === 0 ? (
              <Notice kind="warning" title="Noch keine Arbeitszeiten.">
                Ohne Arbeitszeiten bist du nicht buchbar. <a href={`${routes.pro.calendar()}?ansicht=arbeitszeiten`}>Arbeitszeiten eintragen</a>
              </Notice>
            ) : null}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <nav aria-label="Zeitraum wechseln" className="flex items-center gap-1 rounded-full bg-surface-raised p-1 shadow-raised">
                  <Link href={weekHref(offset - 1)} aria-label="Vorherige 7 Tage" className="inline-flex size-9 items-center justify-center rounded-full text-ink transition-colors duration-fast pressable focus-ring hover:bg-surface-sunken">
                    <Icon icon={ChevronLeft} size={18} />
                  </Link>
                  <Link
                    href={weekHref(0)}
                    aria-current={offset === 0 ? "date" : undefined}
                    className={cn("inline-flex h-9 items-center rounded-full px-3.5 type-label-s transition-colors duration-fast pressable focus-ring", offset === 0 ? "bg-ink text-ink-inverse shadow-ink" : "text-ink hover:bg-surface-sunken")}
                  >
                    Heute
                  </Link>
                  <Link href={weekHref(offset + 1)} aria-label="Nächste 7 Tage" className="inline-flex size-9 items-center justify-center rounded-full text-ink transition-colors duration-fast pressable focus-ring hover:bg-surface-sunken">
                    <Icon icon={ChevronRight} size={18} />
                  </Link>
                </nav>
                <div className="flex flex-col">
                  <h2 className="type-heading-m">{offset === 0 ? "Nächste 7 Tage" : offset > 0 ? `In ${offset} ${offset === 1 ? "Woche" : "Wochen"}` : `Vor ${-offset} ${offset === -1 ? "Woche" : "Wochen"}`}</h2>
                  <p className="type-caption text-ink-muted num">
                    {formatDayShort(berlinToIso(monday, "12:00"))} – {formatDayShort(berlinToIso(sunday, "12:00"))}
                  </p>
                </div>
              </div>
              <ul className="flex flex-wrap gap-2" aria-label="Zeitraum in Zahlen">
                <Figure icon={Users} label={`${figures.appts} ${figures.appts === 1 ? "Termin" : "Termine"}`} />
                {figures.requests ? <Figure icon={Inbox} label={`${figures.requests} ${figures.requests === 1 ? "Anfrage" : "Anfragen"}`} tone="warning" /> : null}
                <Figure icon={Clock} label={`${figures.bookableHours.toLocaleString("de-DE")} Std. buchbar`} />
              </ul>
            </div>

            <WeekGrid data={data} />
            <WeekList data={data} />
          </>
        ) : view === "arbeitszeiten" ? (
          <div className="max-w-[48rem]">
            <WeeklyHoursEditor initial={cal.weeklyHours} />
          </div>
        ) : (
          <TimeOffEditor entries={timeOff ?? []} />
        )}
      </div>
    </ProPage>
  );
}

function Figure({ icon, label, tone }: { icon: typeof Users; label: string; tone?: "warning" }) {
  return (
    <li className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 type-label-s num", tone === "warning" ? "bg-warning-soft text-warning" : "bg-surface-raised text-ink shadow-raised")}>
      <Icon icon={icon} size={16} className={cn("size-3.5!", tone ? undefined : "text-ink-muted")} />
      {label}
    </li>
  );
}
