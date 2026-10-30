import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, LogOut } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { signOutAction } from "@/server/actions/auth";
import { getCreditSummary } from "@/server/services/account";
import { listCustomerBookings } from "@/server/services/bookings";
import { countUnreadNotifications } from "@/server/services/notifications";
import type { BookingListItemDTO } from "@/server/dto";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { CountPill, EmptyState, Status } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { RebookButton } from "@/components/site/account-rebook";
import { ACCOUNT_SECTIONS } from "@/components/site/account-sections";
import { dayLabel, lastTimeText, statusTone } from "@/components/site/checkout-format";
import { formatPriceExact, formatTime } from "@/lib/format";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Übersicht" };

function greeting(now = new Date()): string {
  const h = Number(new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", hour12: false }).format(now));
  return h < 11 ? "Guten Morgen" : h < 18 ? "Guten Tag" : "Guten Abend";
}

export default async function KontoPage() {
  const session = await requireRole("customer", "/konto");
  const [upcoming, past, credits, unread] = await Promise.all([
    listCustomerBookings(session, "upcoming", 1, 3),
    listCustomerBookings(session, "past", 1, 30),
    getCreditSummary(session),
    countUnreadNotifications(session).catch(() => 0),
  ]);
  const next = upcoming.items[0] ?? null;
  // One rebook suggestion per provider, from completed appointments.
  const seen = new Set<string>();
  const rebook: BookingListItemDTO[] = [];
  for (const b of past.items) {
    if (b.status !== "completed" || seen.has(b.providerSlug)) continue;
    seen.add(b.providerSlug);
    rebook.push(b);
    if (rebook.length === 3) break;
  }

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <h1 className="type-display-s">{`${greeting()}${session.firstName ? `, ${session.firstName}` : ""}.`}</h1>
        <p className="type-body-s text-ink-muted">{session.email}</p>
      </header>

      <section aria-labelledby="naechster" className="flex flex-col gap-4">
        <h2 id="naechster" className="type-heading-m">
          Nächster Termin
        </h2>
        {next ? (
          <Link href={routes.booking(next.id)} className="group flex flex-col gap-4 border border-line bg-surface-raised p-5 transition-colors duration-fast hover:border-ink md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="type-display-s num">{`${dayLabel(next.startsAt)}, ${formatTime(next.startsAt)}`}</p>
                <p className="type-body-s text-ink-muted">{`${next.serviceName} · ${next.city}`}</p>
              </div>
              <Status tone={statusTone(next.status)}>{next.statusLabel}</Status>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
              <span className="flex items-center gap-3">
                <Avatar src={next.providerAvatarUrl} name={next.providerName} size={32} />
                <span className="type-label">{next.providerName}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 type-label-s text-ink">
                Details <Icon icon={ArrowRight} size={16} />
              </span>
            </div>
          </Link>
        ) : (
          <EmptyState title="Noch keine Termine." action={<ButtonLink href={routes.search()}>Behandlung finden</ButtonLink>} className="py-2">
            Sobald Sie buchen, finden Sie Ihre Termine hier.
          </EmptyState>
        )}
        {upcoming.total > 1 ? (
          <Link href={routes.account.bookings()} className="self-start type-label-s text-accent underline decoration-1 underline-offset-[0.2em] hover:text-accent-hover">
            {`Alle ${upcoming.total} anstehenden Termine`}
          </Link>
        ) : null}
      </section>

      {rebook.length ? (
        <section aria-labelledby="erneut" className="flex flex-col gap-4">
          <h2 id="erneut" className="type-heading-m">
            Erneut buchen
          </h2>
          <ul className="flex flex-col border-t border-line">
            {rebook.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-4 border-b border-line py-4">
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar src={b.providerAvatarUrl} name={b.providerName} size={40} />
                  <div className="min-w-0">
                    <p className="type-label">{b.serviceName}</p>
                    <p className="mt-0.5 type-caption text-ink-muted">{`bei ${b.providerName} · zuletzt ${lastTimeText(b.startsAt)}`}</p>
                  </div>
                </div>
                <RebookButton bookingId={b.id} size="s" label="Erneut buchen" className="shrink-0" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="guthaben" className="flex items-center justify-between gap-4 border-y border-line py-5">
        <div>
          <h2 id="guthaben" className="type-label-s text-ink-muted">
            SOMA-Guthaben
          </h2>
          <p className="type-stat">{formatPriceExact(credits.balanceCents)}</p>
        </div>
        <ButtonLink href={routes.account.credits()} variant="secondary" size="s">
          Weiterempfehlen
        </ButtonLink>
      </section>

      <nav aria-label="Kontobereiche" className="flex flex-col lg:hidden">
        <ul className="flex flex-col border-t border-line">
          {ACCOUNT_SECTIONS.slice(1).map((s) => (
            <li key={s.href}>
              <Link href={s.href} className="flex min-h-touch items-center justify-between gap-4 border-b border-line py-3 type-body text-ink">
                <span className="flex items-center gap-2">
                  {s.label}
                  {s.href === routes.account.notifications() && unread ? <CountPill accent>{unread}</CountPill> : null}
                </span>
                <Icon icon={ChevronRight} className="text-ink-muted" />
              </Link>
            </li>
          ))}
        </ul>
        <form action={signOutAction} className="pt-4">
          <button type="submit" className="inline-flex min-h-touch items-center gap-2 type-label text-ink-muted hover:text-ink">
            <Icon icon={LogOut} />
            Abmelden
          </button>
        </form>
      </nav>
    </div>
  );
}
