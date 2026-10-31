import { BookingListRow, RequestPanel } from "@/components/pro/bookings";
import { ProHeader, ProPage } from "@/components/pro/page";
import { ButtonLink } from "@/components/ui/button";
import { PaginationLabel } from "@/components/ui/data";
import { EmptyState } from "@/components/ui/feedback";
import { TabLinks } from "@/components/ui/tabs";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { countProBookingTabs, getProviderTerms, listProBookingsTab, type ProBookingTab } from "@/server/services/pro-ext";

export const metadata = { title: "Termine" };

const TABS: { slug: string; tab: ProBookingTab; label: string }[] = [
  { slug: "anfragen", tab: "requests", label: "Anfragen" },
  { slug: "bevorstehend", tab: "upcoming", label: "Bevorstehend" },
  { slug: "vergangen", tab: "past", label: "Vergangen" },
  { slug: "storniert", tab: "cancelled", label: "Storniert" },
];

const EMPTY: Record<ProBookingTab, { title: string; body: string }> = {
  requests: { title: "Keine offenen Anfragen.", body: "Neue Anfragen erscheinen hier – mit der Zeit, die dir zum Antworten bleibt." },
  upcoming: { title: "Noch keine Termine.", body: "Sobald Kundschaft bei dir bucht, findest du deine Termine hier." },
  past: { title: "Noch keine vergangenen Termine.", body: "Abgeschlossene Termine und deine Verdienste findest du hier und unter Einnahmen." },
  cancelled: { title: "Keine Stornierungen.", body: "Abgelehnte, abgelaufene und stornierte Termine landen hier." },
};

const PAGE_SIZE = 20;

export default async function ProBookingsPage({ searchParams }: PageProps<"/pro/termine">) {
  const session = await requireRole("provider", "/pro/termine");
  const sp = await searchParams;
  const [counts, terms] = await Promise.all([countProBookingTabs(session), getProviderTerms()]);
  const slug = typeof sp.tab === "string" ? sp.tab : counts.requests > 0 ? "anfragen" : "bevorstehend";
  const current = TABS.find((t) => t.slug === slug) ?? TABS[1];
  const page = Math.max(1, Number(typeof sp.seite === "string" ? sp.seite : 1) || 1);
  const list = await listProBookingsTab(session, current.tab, 1, PAGE_SIZE * page);
  const now = Date.now();
  const empty = EMPTY[current.tab];
  const shown = list.items.length;

  return (
    <ProPage>
      <ProHeader title="Termine" description="Anfragen beantworten, Termine starten und abschließen." />
      <div className="flex flex-col gap-6">
        <TabLinks
          label="Termine filtern"
          items={TABS.map((t) => ({
            href: `${routes.pro.bookings()}?tab=${t.slug}`,
            label: t.label,
            count: t.tab === "requests" || t.tab === "upcoming" ? counts[t.tab] : undefined,
            active: t.slug === current.slug,
          }))}
        />
        {shown === 0 ? (
          <div className="rounded-card bg-surface-raised px-5 shadow-raised lg:px-8">
            <EmptyState className="py-8!" seed={`pro-termine-${current.tab}`} title={empty.title}>
              {empty.body}
            </EmptyState>
          </div>
        ) : current.tab === "requests" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {list.items.map((b) => (
              <RequestPanel key={b.id} booking={b} headingLevel="h2" serverNow={now} windowHours={terms.requestResponseHours} />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-card bg-surface-raised shadow-raised">
            <div className="hidden items-center gap-4 border-b border-line bg-surface/60 px-5 py-2.5 type-label-s text-ink-muted md:flex">
              <span className="w-13 shrink-0">Datum</span>
              <span className="flex-1">Termin</span>
              <span className="w-36 shrink-0">Status</span>
              <span className="w-24 shrink-0 text-right">Auszahlung</span>
              <span aria-hidden className="w-4 shrink-0" />
            </div>
            <ul className="divide-y divide-line">
              {list.items.map((b) => (
                <BookingListRow key={b.id} booking={b} now={now} />
              ))}
            </ul>
          </div>
        )}
        {shown > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <PaginationLabel from={1} to={shown} total={list.total} />
            {shown < list.total ? (
              <ButtonLink href={`${routes.pro.bookings()}?tab=${current.slug}&seite=${page + 1}`} variant="secondary" scroll={false}>
                Weitere anzeigen
              </ButtonLink>
            ) : null}
          </div>
        ) : null}
      </div>
    </ProPage>
  );
}
