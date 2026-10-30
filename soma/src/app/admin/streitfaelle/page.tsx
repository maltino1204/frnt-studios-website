import type { Metadata } from "next";
import Link from "next/link";
import { formatPriceExact, formatRelative } from "@/lib/format";
import { DisputeResolution } from "@/components/admin/dispute-resolution";
import { formatDateTime } from "@/components/admin/format";
import { DISPUTE_REASON, DISPUTE_STATUS, ROLE } from "@/components/admin/labels";
import { AdminPageHeader, MutedLink } from "@/components/admin/page";
import { hrefWith } from "@/components/admin/table";
import { EmptyState, Status } from "@/components/ui/feedback";
import { FactList } from "@/components/ui/layout";
import { TabLinks } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { listDisputes } from "@/server/services/admin";
import { getAdminBookingOps } from "@/server/services/admin-ext";

export const metadata: Metadata = { title: "Streitfälle" };

const OPEN = ["open", "investigating"];

export default async function DisputesPage({ searchParams }: { searchParams: Promise<{ ansicht?: string; fall?: string }> }) {
  const session = await requireRole("admin", routes.admin.disputes());
  const sp = await searchParams;
  const all = await listDisputes(session);
  const view = sp.ansicht === "abgeschlossen" || sp.ansicht === "alle" ? sp.ansicht : "offen";
  const items = all.filter((d) => (view === "offen" ? OPEN.includes(d.status) : view === "abgeschlossen" ? !OPEN.includes(d.status) : true));
  const selected = all.find((d) => d.id === sp.fall) ?? items[0] ?? null;
  const ops = selected ? await getAdminBookingOps(session, selected.bookingId) : null;
  const openCount = all.filter((d) => OPEN.includes(d.status)).length;
  const isOpen = selected ? OPEN.includes(selected.status) : false;

  return (
    <>
      <AdminPageHeader group="Betrieb" title="Streitfälle" description="Antwort innerhalb von 4 Stunden, Lösung innerhalb von 72 Stunden. Offene Fälle halten die Auszahlung der Buchung zurück." />
      <div className="flex flex-col gap-6">
        <TabLinks
          label="Ansicht"
          items={[
            { href: hrefWith(routes.admin.disputes(), {}, {}), label: "Offen", count: openCount, active: view === "offen" },
            { href: hrefWith(routes.admin.disputes(), {}, { ansicht: "abgeschlossen" }), label: "Abgeschlossen", active: view === "abgeschlossen" },
            { href: hrefWith(routes.admin.disputes(), {}, { ansicht: "alle" }), label: "Alle", active: view === "alle" },
          ]}
        />

        {all.length === 0 ? (
          <EmptyState title="Keine Streitfälle.">Kundschaft und Profis können innerhalb von 48 Stunden nach einem Termin einen Streitfall eröffnen.</EmptyState>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
            <nav aria-label="Streitfälle" className="min-w-0 self-start border border-line bg-surface-raised">
              {items.length === 0 ? (
                <p className="px-4 py-6 type-body-s text-ink-muted">{view === "offen" ? "Keine offenen Streitfälle." : "Keine Fälle in dieser Ansicht."}</p>
              ) : (
                <ul className="divide-y divide-line">
                  {items.map((d) => {
                    const active = selected?.id === d.id;
                    return (
                      <li key={d.id}>
                        <Link
                          href={hrefWith(routes.admin.disputes(), { ansicht: view === "offen" ? undefined : view }, { fall: d.id })}
                          aria-current={active ? "true" : undefined}
                          scroll={false}
                          className={cn(
                            "relative flex flex-col gap-1 px-4 py-3 transition-colors",
                            active ? "bg-accent-soft before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-accent" : "hover:bg-surface-sunken",
                          )}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="code-ref type-body-s font-[520]">{d.bookingReference}</span>
                            <Status tone={DISPUTE_STATUS[d.status].tone}>{DISPUTE_STATUS[d.status].label}</Status>
                          </span>
                          <span className="type-body-s text-ink">{DISPUTE_REASON[d.reason]}</span>
                          <span className="type-caption text-ink-muted">
                            {ROLE[d.openedByRole]} · {formatRelative(d.createdAt)} · {formatPriceExact(d.bookingTotalCents)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </nav>

            {selected ? (
              <article aria-labelledby="fall-title" className="flex min-w-0 flex-col gap-6 border border-line bg-surface-raised p-4 md:p-6">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <h2 id="fall-title" className="type-heading-m">
                      {DISPUTE_REASON[selected.reason]}
                    </h2>
                    <p className="type-body-s text-ink-muted num">
                      Eröffnet {formatDateTime(selected.createdAt)} von {ROLE[selected.openedByRole]}
                    </p>
                  </div>
                  <Status tone={DISPUTE_STATUS[selected.status].tone}>{DISPUTE_STATUS[selected.status].label}</Status>
                </header>

                <blockquote className="border-l border-line-strong pl-4 type-body whitespace-pre-line text-ink">{selected.description}</blockquote>

                <FactList
                  className="border-y border-line"
                  items={[
                    { label: "Buchung", value: <MutedLink href={routes.admin.booking(selected.bookingId)}><span className="code-ref">{selected.bookingReference}</span></MutedLink> },
                    { label: "Kundschaft", value: selected.customerName },
                    { label: "Profi", value: selected.providerName },
                    { label: "Buchungsbetrag", value: <span className="num">{formatPriceExact(selected.bookingTotalCents)}</span> },
                    { label: "Noch erstattbar", value: <span className="num">{formatPriceExact(ops?.refundableCents ?? 0)}</span> },
                    ...(ops?.completedAt ? [{ label: "Termin abgeschlossen", value: <span className="num">{formatDateTime(ops.completedAt)}</span> }] : []),
                    ...(!isOpen
                      ? [
                          { label: "Ergebnis", value: selected.refundCents ? <span className="num">Erstattet {formatPriceExact(selected.refundCents)}</span> : DISPUTE_STATUS[selected.status].label },
                          ...(selected.resolvedAt ? [{ label: "Abgeschlossen", value: <span className="num">{formatDateTime(selected.resolvedAt)}</span> }] : []),
                        ]
                      : []),
                  ]}
                />

                {isOpen ? (
                  <DisputeResolution
                    key={selected.id}
                    disputeId={selected.id}
                    reference={selected.bookingReference}
                    status={selected.status}
                    refundableCents={ops?.refundableCents ?? 0}
                    bookingTotalCents={selected.bookingTotalCents}
                  />
                ) : selected.resolutionNote ? (
                  <div className="flex flex-col gap-1">
                    <p className="type-label-s text-ink-muted">Begründung</p>
                    <p className="type-body-s whitespace-pre-line">{selected.resolutionNote}</p>
                  </div>
                ) : null}
              </article>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
