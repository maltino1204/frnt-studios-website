import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/server/auth/guards";
import { listCustomerBookings } from "@/server/services/bookings";
import type { BookingListItemDTO } from "@/server/dto";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/layout";
import { TabLinks } from "@/components/ui/tabs";
import { AccountBookingRow } from "@/components/site/account-booking-row";
import { RebookButton } from "@/components/site/account-rebook";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Termine" };

type SP = Record<string, string | string[] | undefined>;
const TABS = ["bevorstehend", "vergangen", "storniert"] as const;
type Tab = (typeof TABS)[number];
const CANCELLED = new Set(["cancelled", "declined", "expired"]);

export default async function TerminePage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await requireRole("customer", "/konto/termine");
  const sp = await searchParams;
  const raw = Array.isArray(sp.ansicht) ? sp.ansicht[0] : sp.ansicht;
  const tab: Tab = TABS.includes(raw as Tab) ? (raw as Tab) : "bevorstehend";
  const [upcoming, past] = await Promise.all([listCustomerBookings(session, "upcoming", 1, 50), listCustomerBookings(session, "past", 1, 100)]);
  const done = past.items.filter((b) => !CANCELLED.has(b.status));
  const cancelled = past.items.filter((b) => CANCELLED.has(b.status));
  const list: BookingListItemDTO[] = tab === "bevorstehend" ? upcoming.items : tab === "vergangen" ? done : cancelled;
  const href = (t: Tab) => (t === "bevorstehend" ? routes.account.bookings() : `${routes.account.bookings()}?ansicht=${t}`);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Termine" description="Ihre Buchungen und Anfragen auf einen Blick." className="pb-0" />
      <TabLinks
        label="Termine filtern"
        items={[
          { href: href("bevorstehend"), label: "Bevorstehend", count: upcoming.total, active: tab === "bevorstehend" },
          { href: href("vergangen"), label: "Vergangen", active: tab === "vergangen" },
          { href: href("storniert"), label: "Storniert", active: tab === "storniert" },
        ]}
      />
      {list.length ? (
        <ul className="flex flex-col" aria-label={`${tab[0].toUpperCase()}${tab.slice(1)} Termine`}>
          {list.map((b) => (
            <AccountBookingRow
              key={b.id}
              b={b}
              actions={
                tab === "bevorstehend" ? undefined : (
                  <>
                    <RebookButton bookingId={b.id} size="s" />
                    {b.canReview ? (
                      <ButtonLink href={`${routes.booking(b.id)}#bewerten`} variant="ghost" size="s">
                        Bewerten
                      </ButtonLink>
                    ) : null}
                  </>
                )
              }
            />
          ))}
        </ul>
      ) : tab === "bevorstehend" ? (
        <EmptyState title="Noch keine Termine." action={<ButtonLink href={routes.search()}>Behandlung finden</ButtonLink>}>
          Sobald Sie buchen, finden Sie Ihre Termine hier.
        </EmptyState>
      ) : tab === "vergangen" ? (
        <EmptyState title="Noch keine vergangenen Termine.">Abgeschlossene Termine erscheinen hier – mit einem Tipp buchen Sie sie erneut.</EmptyState>
      ) : (
        <EmptyState title="Keine stornierten Termine.">
          Stornierte, abgelehnte und abgelaufene Buchungen sehen Sie hier.{" "}
          <Link href={routes.account.bookings()} className="text-accent underline underline-offset-[0.2em]">
            Zu den anstehenden Terminen
          </Link>
        </EmptyState>
      )}
    </div>
  );
}
