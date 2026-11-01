import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, CircleCheck, UsersRound, Wallet } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { getCreditSummary, getReferralInfo } from "@/server/services/account";
import { AuraBackground } from "@/components/ui/aura";
import { EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { Overline, PageHeader } from "@/components/ui/layout";
import { StatGrid, StatTile } from "@/components/ui/data";
import { CountUp } from "@/components/ui/motion";
import { ReferralShare } from "@/components/site/account-referral";
import { SITE_URL } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { formatDateLong, formatPrice, formatPriceExact } from "@/lib/format";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Guthaben & Empfehlen" };

const EURO = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

export default async function GuthabenPage() {
  const session = await requireRole("customer", "/konto/guthaben");
  const [credits, referral] = await Promise.all([getCreditSummary(session), getReferralInfo(session)]);
  const url = referral.shareUrl.startsWith("http") ? referral.shareUrl : `${SITE_URL}${referral.shareUrl}`;
  const reward = formatPrice(referral.rewardCents);
  const welcome = formatPrice(referral.welcomeCents);
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader title="Guthaben & Empfehlen" description="Guthaben wird bei Ihrer nächsten Buchung automatisch angeboten." className="pb-0" />

      <section aria-labelledby="stand" className="flex items-center justify-between gap-4 rounded-card bg-surface-raised p-5 shadow-raised md:p-7">
        <div className="flex flex-col gap-1.5">
          <h2 id="stand" className="type-label-s text-ink-muted">
            Verfügbares Guthaben
          </h2>
          <p className="type-stat">
            <CountUp value={credits.balanceCents / 100} format={EURO} suffix={" €"} />
          </p>
        </div>
        <span aria-hidden className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink">
          <Icon icon={Wallet} size={22} />
        </span>
      </section>

      <section aria-labelledby="empfehlen" className="relative isolate flex flex-col gap-7 overflow-clip rounded-panel bg-surface-raised p-5 shadow-raised sm:p-8 lg:p-10">
        <AuraBackground variant="section" placement="full" fade="none" />
        <div className="flex flex-col gap-3">
          <Overline>Empfehlen</Overline>
          <h2 id="empfehlen" className="max-w-[34rem] type-display-s">{`Empfehlen Sie SOMA: ${reward} für Sie, ${welcome} für alle, die Sie einladen.`}</h2>
          <p className="max-w-reading type-body-s text-ink-muted">
            {`Wer sich mit Ihrem Link registriert, erhält ${welcome} Startguthaben. Sie bekommen ${reward}, sobald die erste Buchung abgeschlossen ist.`}
          </p>
        </div>
        <div className="max-w-[34rem]">
          <ReferralShare code={referral.code} url={url} text={`Ich buche Beauty & Wellness bei mir zu Hause über SOMA. Mit meinem Link erhältst du ${welcome} Startguthaben:`} />
        </div>
      </section>

      <StatGrid className="lg:grid-cols-3!">
        <StatTile label="Eingeladen" icon={<Icon icon={UsersRound} size={16} />} value={<CountUp value={referral.invitedCount} />} hint="Mit Ihrem Link registriert" />
        <StatTile label="Gebucht" icon={<Icon icon={CircleCheck} size={16} />} value={<CountUp value={referral.rewardedCount} />} hint="Erste Buchung abgeschlossen" />
        <StatTile
          label="Verdient"
          icon={<Icon icon={Wallet} size={16} />}
          value={<CountUp value={referral.earnedCents / 100} format={referral.earnedCents % 100 ? EURO : { maximumFractionDigits: 0 }} suffix={" €"} />}
          hint="Als Guthaben gutgeschrieben"
          className="col-span-2 lg:col-span-1"
        />
      </StatGrid>

      <section aria-labelledby="verlauf" className="flex flex-col gap-4">
        <h2 id="verlauf" className="type-heading-m">
          Verlauf
        </h2>
        {credits.entries.length ? (
          <ul className="flex flex-col overflow-hidden rounded-card bg-surface-raised shadow-raised">
            {credits.entries.map((e) => {
              const plus = e.amountCents >= 0;
              return (
                <li key={e.id} className="flex items-center gap-3.5 border-b border-line px-4 py-3.5 last:border-b-0 md:px-5">
                  <span aria-hidden className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full", plus ? "bg-success-soft text-success" : "bg-surface-sunken text-ink-muted")}>
                    <Icon icon={plus ? ArrowDownLeft : ArrowUpRight} size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="type-body-s text-ink">{e.reasonLabel}</p>
                    <p className="type-caption text-ink-muted">
                      {formatDateLong(e.createdAt)}
                      {e.note ? ` · ${e.note}` : ""}
                      {e.bookingId ? (
                        <>
                          {" · "}
                          <Link href={routes.booking(e.bookingId)} className="text-ink underline decoration-line-strong underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">
                            Buchung
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <p className={cn("shrink-0 type-label num", plus ? "text-success" : "text-ink")}>
                    {`${plus ? "+" : "−"}${formatPriceExact(Math.abs(e.amountCents))}`}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-card bg-surface-raised px-5 shadow-raised md:px-7">
            <EmptyState title="Noch kein Guthaben." seed="konto-guthaben" className="py-8">
              Guthaben aus Empfehlungen und Gutschriften erscheint hier.
            </EmptyState>
          </div>
        )}
      </section>
    </div>
  );
}
