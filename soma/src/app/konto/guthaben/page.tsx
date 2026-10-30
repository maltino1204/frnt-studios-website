import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/server/auth/guards";
import { getCreditSummary, getReferralInfo } from "@/server/services/account";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/layout";
import { StatGrid, StatTile } from "@/components/ui/data";
import { ReferralShare } from "@/components/site/account-referral";
import { SITE_URL } from "@/lib/brand";
import { formatDateLong, formatPrice, formatPriceExact } from "@/lib/format";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Guthaben & Empfehlen" };

export default async function GuthabenPage() {
  const session = await requireRole("customer", "/konto/guthaben");
  const [credits, referral] = await Promise.all([getCreditSummary(session), getReferralInfo(session)]);
  const url = referral.shareUrl.startsWith("http") ? referral.shareUrl : `${SITE_URL}${referral.shareUrl}`;
  const reward = formatPrice(referral.rewardCents);
  const welcome = formatPrice(referral.welcomeCents);
  return (
    <div className="flex flex-col gap-12">
      <PageHeader title="Guthaben & Empfehlen" description="Guthaben wird bei Ihrer nächsten Buchung automatisch angeboten." className="pb-0" />

      <section aria-labelledby="stand" className="flex flex-col gap-1">
        <h2 id="stand" className="type-label-s text-ink-muted">
          Verfügbares Guthaben
        </h2>
        <p className="type-stat">{formatPriceExact(credits.balanceCents)}</p>
      </section>

      <section aria-labelledby="empfehlen" className="flex flex-col gap-6 border border-line bg-surface-raised p-5 md:p-8">
        <div className="flex flex-col gap-3">
          <span aria-hidden className="block h-0.5 w-6 bg-ink" />
          <h2 id="empfehlen" className="type-display-s">{`Empfehlen Sie SOMA: ${reward} für Sie, ${welcome} für alle, die Sie einladen.`}</h2>
          <p className="max-w-reading type-body-s text-ink-muted">
            {`Wer sich mit Ihrem Link registriert, erhält ${welcome} Startguthaben. Sie bekommen ${reward}, sobald die erste Buchung abgeschlossen ist.`}
          </p>
        </div>
        <ReferralShare code={referral.code} url={url} text={`Ich buche Beauty & Wellness bei mir zu Hause über SOMA. Mit meinem Link erhältst du ${welcome} Startguthaben:`} />
        <StatGrid className="lg:grid-cols-3">
          <StatTile label="Eingeladen" value={referral.invitedCount.toLocaleString("de-DE")} />
          <StatTile label="Erste Buchung abgeschlossen" value={referral.rewardedCount.toLocaleString("de-DE")} />
          <StatTile label="Verdient" value={formatPrice(referral.earnedCents)} className="col-span-2 lg:col-span-1" />
        </StatGrid>
      </section>

      <section aria-labelledby="verlauf" className="flex flex-col gap-4">
        <h2 id="verlauf" className="type-heading-m">
          Verlauf
        </h2>
        {credits.entries.length ? (
          <ul className="flex flex-col border-t border-line">
            {credits.entries.map((e) => (
              <li key={e.id} className="flex items-baseline justify-between gap-4 border-b border-line py-3.5">
                <div className="min-w-0">
                  <p className="type-body-s text-ink">{e.reasonLabel}</p>
                  <p className="type-caption text-ink-muted">
                    {formatDateLong(e.createdAt)}
                    {e.note ? ` · ${e.note}` : ""}
                    {e.bookingId ? (
                      <>
                        {" · "}
                        <Link href={routes.booking(e.bookingId)} className="text-accent underline underline-offset-[0.2em]">
                          Buchung
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
                <p className={`shrink-0 type-label num ${e.amountCents >= 0 ? "text-success" : "text-ink"}`}>
                  {`${e.amountCents >= 0 ? "+" : "−"}${formatPriceExact(Math.abs(e.amountCents))}`}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Noch kein Guthaben." className="py-2">
            Guthaben aus Empfehlungen und Gutschriften erscheint hier.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
