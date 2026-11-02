import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bell, CalendarDays, ChevronRight, Clock, Gift, Heart, LogOut, MapPin, ShieldCheck, Wallet, type LucideIcon } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { signOutAction } from "@/server/actions/auth";
import { getCreditSummary, getReferralInfo } from "@/server/services/account";
import { getBookingForCustomer, listCustomerBookings, listRebookSuggestions } from "@/server/services/bookings";
import { countUnreadNotifications } from "@/server/services/notifications";
import { AiLabel } from "@/components/ui/ai-label";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { CountPill, EmptyState, Status } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { FormattedNumber } from "@/components/ui/number";
import { RebookButton } from "@/components/site/account-rebook";
import { ACCOUNT_SECTIONS } from "@/components/site/account-sections";
import { dayLabel, lastTimeText, statusTone } from "@/components/site/checkout-format";
import { formatPrice, formatTime } from "@/lib/format";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Übersicht" };

function greeting(now = new Date()): string {
  const h = Number(new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", hour12: false }).format(now));
  return h < 11 ? "Guten Morgen" : h < 18 ? "Guten Tag" : "Guten Abend";
}

const SECTION_ICONS: Record<string, LucideIcon> = {
  [routes.account.bookings()]: CalendarDays,
  [routes.account.favorites()]: Heart,
  [routes.account.addresses()]: MapPin,
  [routes.account.profile()]: ShieldCheck,
  [routes.account.credits()]: Gift,
  [routes.account.notifications()]: Bell,
};

export default async function KontoPage() {
  const session = await requireRole("customer", "/konto");
  const [upcoming, rebook, credits, referral, unread] = await Promise.all([
    listCustomerBookings(session, "upcoming", 1, 3),
    // F11: the last completed booking per provider, straight from the server.
    listRebookSuggestions(session, 3),
    getCreditSummary(session),
    getReferralInfo(session).catch(() => null),
    countUnreadNotifications(session).catch(() => 0),
  ]);
  const next = upcoming.items[0] ?? null;
  // The Start-Code lives on the booking detail; only confirmed bookings carry one.
  const nextDetail = next && next.status === "confirmed" ? await getBookingForCustomer(session, next.id).catch(() => null) : null;
  const startCode = nextDetail?.startCode ?? null;
  const name = session.firstName ?? session.email;

  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <header className="flex items-center gap-4">
        <Avatar name={name} size={48} />
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="type-display-s">{`${greeting()}${session.firstName ? `, ${session.firstName}` : ""}.`}</h1>
          <p className="truncate type-body-s text-ink-muted">{session.email}</p>
        </div>
      </header>

      <section aria-labelledby="naechster" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="naechster" className="type-heading-m">
            Nächster Termin
          </h2>
          {upcoming.total > 1 ? (
            <Link href={routes.account.bookings()} className="-my-3.5 inline-flex min-h-touch items-center rounded-control type-label-s text-ink underline decoration-line-strong decoration-1 underline-offset-[0.2em] hover:text-link-hover hover:decoration-current focus-ring">
              {`Alle ${upcoming.total} anstehenden Termine`}
            </Link>
          ) : null}
        </div>
        {next ? (
          <Link
            href={routes.booking(next.id)}
            className="group relative isolate grid gap-6 overflow-clip rounded-panel bg-surface-raised p-5 shadow-raised lift focus-ring sm:p-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-8"
          >
            <span className="flex min-w-0 flex-col gap-4">
              <span className="flex flex-wrap items-center gap-2">
                <Status tone={statusTone(next.status)}>{next.statusLabel}</Status>
              </span>
              <span className="flex flex-col gap-1.5">
                <span className="type-heading-l text-ink num">{dayLabel(next.startsAt)}</span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 type-body-s text-ink-muted num">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon icon={Clock} size={16} />
                    {`${formatTime(next.startsAt)}–${formatTime(next.endsAt)}`}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon icon={MapPin} size={16} />
                    {next.city}
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-3">
                <Avatar src={next.providerAvatarUrl} name={next.providerName} size={40} />
                <span className="flex min-w-0 flex-col">
                  <span className="type-label text-ink">{next.serviceName}</span>
                  <span className="type-caption text-ink-muted">{`bei ${next.providerName}`}</span>
                  <AiLabel src={next.providerAvatarUrl} />
                </span>
              </span>
            </span>
            <span className="flex flex-col gap-4 md:items-end">
              {startCode ? (
                <span className="flex flex-col gap-2.5 rounded-card bg-surface-raised p-4 shadow-float">
                  <span className="type-overline text-ink-muted">Start-Code</span>
                  <span aria-hidden className="flex gap-1.5 stagger-rise">
                    {startCode.split("").map((d, i) => (
                      <span key={i} className="inline-flex h-12 w-10 items-center justify-center rounded-tile bg-surface-raised type-heading-l text-ink shadow-raised num">
                        {d}
                      </span>
                    ))}
                  </span>
                  <span className="sr-only">{startCode.split("").join(" ")}</span>
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 type-label-s text-ink">
                Details ansehen
                <Icon icon={ArrowRight} size={16} className="transition-transform duration-fast group-hover:translate-x-0.5" />
              </span>
            </span>
          </Link>
        ) : (
          <div className="rounded-card bg-surface-raised px-5 shadow-raised md:px-7">
            <EmptyState title="Noch keine Termine." seed="konto-termine" action={<ButtonLink href={routes.explore()}>Behandlungen entdecken</ButtonLink>} className="py-7">
              Wenn du buchst, findest du hier Zeit, Ort, Start-Code und Stornofrist.
            </EmptyState>
          </div>
        )}
      </section>

      {rebook.length ? (
        <section aria-labelledby="erneut" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="erneut" className="type-heading-m">
              Erneut buchen
            </h2>
            <p className="type-body-s text-ink-muted">Gleicher Profi, gleiche Behandlung – mit einem Tipp.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rebook.map((b) => (
              <li key={b.id} className="flex min-w-0 flex-col gap-4 rounded-card bg-surface-raised p-4 shadow-raised md:p-5">
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar src={b.providerAvatarUrl} name={b.providerName} size={40} />
                  <div className="min-w-0">
                    <p className="line-clamp-2 type-label text-ink">{b.serviceName}</p>
                    <p className="mt-0.5 type-caption text-ink-muted">{`bei ${b.providerName} · zuletzt ${lastTimeText(b.startsAt)}`}</p>
                    <AiLabel src={b.providerAvatarUrl} className="mt-0.5" />
                  </div>
                </div>
                <div className="mt-auto">
                  <RebookButton bookingId={b.id} size="s" label="Erneut buchen" className="w-full" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <section aria-labelledby="guthaben" className="flex flex-col justify-between gap-5 rounded-card bg-surface-raised p-5 shadow-raised md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h2 id="guthaben" className="type-label-s text-ink-muted">
                SOMA-Guthaben
              </h2>
              <p className="type-stat">
                <FormattedNumber value={credits.balanceCents / 100} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} suffix={"\u00a0€"} />
              </p>
            </div>
            <span aria-hidden className="inline-flex size-10 items-center justify-center rounded-full bg-surface-sunken text-ink-muted">
              <Icon icon={Wallet} size={18} />
            </span>
          </div>
          <p className="type-caption text-ink-muted">Wird dir bei der nächsten Buchung automatisch angeboten.</p>
        </section>
        <section aria-labelledby="empfehlen" className="relative isolate flex flex-col justify-between gap-5 overflow-clip rounded-card bg-surface-raised p-5 shadow-raised md:p-6">
          <div className="flex flex-col gap-1.5">
            <h2 id="empfehlen" className="type-label-s text-ink-muted">
              Freunde einladen
            </h2>
            <p className="type-heading-m text-balance">
              {referral ? `${formatPrice(referral.rewardCents)} für dich, ${formatPrice(referral.welcomeCents)} für deine Freunde.` : "Lade Freunde zu SOMA ein."}
            </p>
          </div>
          <ButtonLink href={routes.account.credits()} variant="secondary" size="s" className="self-start" iconRight={<Icon icon={ArrowRight} />}>
            Weiterempfehlen
          </ButtonLink>
        </section>
      </div>

      <nav aria-label="Kontobereiche" className="flex flex-col gap-3 lg:hidden">
        <ul className="flex flex-col overflow-hidden rounded-card bg-surface-raised shadow-raised">
          {ACCOUNT_SECTIONS.slice(1).map((s) => {
            const I = SECTION_ICONS[s.href] ?? ChevronRight;
            return (
              <li key={s.href} className="border-b border-line last:border-b-0">
                <Link href={s.href} className="flex min-h-14 items-center justify-between gap-4 px-4 type-body text-ink transition-colors duration-fast focus-ring active:bg-surface-sunken">
                  <span className="flex items-center gap-3">
                    <span aria-hidden className="inline-flex size-8 items-center justify-center rounded-full bg-surface-sunken text-ink-muted">
                      <Icon icon={I} size={16} />
                    </span>
                    {s.label}
                    {s.href === routes.account.notifications() && unread ? <CountPill accent>{unread}</CountPill> : null}
                  </span>
                  <Icon icon={ChevronRight} className="text-ink-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
        <form action={signOutAction}>
          <button type="submit" className="inline-flex min-h-touch items-center gap-2 rounded-full px-3 type-label text-ink-muted pressable focus-ring hover:bg-ink/[0.04] hover:text-ink">
            <Icon icon={LogOut} />
            Abmelden
          </button>
        </form>
      </nav>
    </div>
  );
}
