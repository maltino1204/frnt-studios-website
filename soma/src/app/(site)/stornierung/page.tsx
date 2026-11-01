import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/ui/feedback";
import { ContentPage, ContentSection } from "@/components/site/discovery-content-page";
import { tierFeeText } from "@/components/site/checkout-format";
import { hoursLabel, policyRows } from "@/components/site/discovery-copy";
import { BRAND_NAME } from "@/lib/brand";
import { formatTime, TIME_ZONE } from "@/lib/format";
import { routes } from "@/lib/routes";
import { getPublicTerms } from "@/server/services/site-ext";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Stornierung: Bedingungen und Fristen",
  description: `So stornierst du bei ${BRAND_NAME}: Fristen und Gebühren auf einen Blick. Offene Anfragen und Absagen durch den Profi sind immer kostenlos.`,
  alternates: { canonical: "/stornierung" },
};

const weekday = new Intl.DateTimeFormat("de-DE", { timeZone: TIME_ZONE, weekday: "long" });

/** An illustrative appointment (a Friday, 18:30 Berlin time) to turn the tiers into concrete deadlines. */
const EXAMPLE_START = new Date("2026-11-13T17:30:00Z");
const at = (d: Date) => `${weekday.format(d)}, ${formatTime(d)} Uhr`;

export default async function StornierungPage() {
  const terms = await getPublicTerms();
  const policy = terms.cancellationPolicy;
  const rows = policyRows(policy);
  const tiers = [...policy.tiers].sort((a, b) => b.minHoursBefore - a.minHoursBefore);
  const graceMinutes = policy.graceMinutes ?? 0;
  const sections = [
    { id: "fristen", title: "Fristen und Gebühren" },
    { id: "beispiel", title: "Ein Beispiel" },
    { id: "sonderfaelle", title: "Immer kostenlos" },
    { id: "so-gehts", title: "So stornierst du" },
    { id: "widerruf", title: "Widerrufsrecht" },
  ];

  return (
    <ContentPage
      overline="Stornierung"
      crumb="Stornierung"
      path="/stornierung"
      title={
        <>
          Stornieren, <em>ohne Kleingedrucktes.</em>
        </>
      }
      lead={`Pläne ändern sich. Deshalb siehst du bei jeder Buchung die genaue Frist mit Datum und Uhrzeit – und hier, wie ${BRAND_NAME} grundsätzlich rechnet.`}
      sections={sections}
    >
      <ContentSection id="fristen" title="Fristen und Gebühren">
        <p>
          Maßgeblich ist der Zeitpunkt, zu dem du in deinem Konto stornierst. Die Gebühr bezieht sich auf den Preis der Behandlung; wann die Anfahrt erstattet wird, steht in jeder
          Zeile.
        </p>
        <dl className="mt-2 flex flex-col divide-y divide-line rounded-card bg-surface-raised px-5 shadow-raised">
          {graceMinutes > 0 ? (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-6 py-4">
              <dt className="type-body text-ink hyphens-none">In den ersten {graceMinutes}&nbsp;Minuten nach der Buchung</dt>
              <dd className="text-right type-label font-semibold text-success num">Kostenlos</dd>
            </div>
          ) : null}
          {rows.map((r) => (
            <div key={r.when} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-6 py-4">
              <dt className="type-body text-ink hyphens-none">{r.when}</dt>
              <dd className="text-right">
                <span className={r.feePercent <= 0 ? "block type-label font-semibold text-success num" : "block type-label font-semibold text-ink num"}>{r.fee}</span>
                {r.travel ? <span className="block type-caption text-ink-muted">{r.travel}</span> : null}
              </dd>
            </div>
          ))}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-6 py-4">
            <dt className="type-body text-ink hyphens-none">Nicht angetroffen (ohne Absage)</dt>
            <dd className="text-right">
              <span className="block type-label font-semibold text-ink num">{policy.noShowFeePercent}&nbsp;% der Behandlung</span>
              <span className="block type-caption text-ink-muted">zzgl. Anfahrt</span>
            </dd>
          </div>
        </dl>
      </ContentSection>

      <ContentSection id="beispiel" title="Ein Beispiel">
        <p>
          Dein Termin ist am <strong>{at(EXAMPLE_START)}</strong>.
        </p>
        <ul>
          {tiers.map((t, i) => {
            const until = new Date(EXAMPLE_START.getTime() - t.minHoursBefore * 3_600_000);
            const prev = tiers[i - 1];
            if (t.minHoursBefore <= 0) {
              return (
                <li key={i}>
                  Ab {prev ? at(new Date(EXAMPLE_START.getTime() - prev.minHoursBefore * 3_600_000)) : "der Buchung"}: {tierFeeText(t)}.
                </li>
              );
            }
            return (
              <li key={i}>
                Bis {at(until)}: {tierFeeText(t)}.
              </li>
            );
          })}
        </ul>
        <p>Diese Fristen stehen bei jeder Buchung schon vor dem Bezahlen in der Preisübersicht und später in der Buchungsbestätigung.</p>
      </ContentSection>

      <ContentSection id="sonderfaelle" title="Immer kostenlos">
        <ul>
          {graceMinutes > 0 ? (
            <li>
              <strong>Bedenkzeit:</strong> In den ersten {graceMinutes}{"\u00a0"}Minuten nach der Buchung stornierst du immer kostenlos, auch bei kurzfristigen Terminen.
            </li>
          ) : null}
          <li>
            <strong>Offene Anfragen:</strong> Solange dein Profi die Anfrage noch nicht bestätigt hat, ziehst du sie kostenlos zurück. Belastet wird erst nach dem Termin.
          </li>
          <li>
            <strong>Absage durch den Profi:</strong> Sagt dein Profi ab, entstehen dir keine Kosten.
          </li>
          <li>
            <strong>Reservierung:</strong> Brichst du die Zahlung ab, wird der Termin nach {terms.holdMinutes}{"\u00a0"}Minuten wieder freigegeben. Es entstehen keine Kosten.
          </li>
          <li>
            <strong>Guthaben:</strong> Eingelöstes Guthaben wird bei einer Stornierung anteilig wieder gutgeschrieben.
          </li>
        </ul>
      </ContentSection>

      <ContentSection id="so-gehts" title="So stornierst du">
        <p>
          Öffne <Link href={routes.account.bookings()}>deine Termine</Link>, wähl die Buchung und tipp auf „Termin stornieren“. Bevor du bestätigst, siehst du, was eine
          Stornierung in diesem Moment kostet. Was nicht als Gebühr anfällt, geben wir auf dem Zahlungsmittel frei, mit dem du bezahlt hast.
        </p>
        <p>
          Eine Umbuchung ist derzeit eine Stornierung mit neuer Buchung. Stornierst du früher als {hoursLabel(tiers[0]?.minHoursBefore ?? 24)} vor dem Termin, bleibt das kostenlos.
        </p>
      </ContentSection>

      <ContentSection id="widerruf" title="Widerrufsrecht">
        <Notice kind="warning" title="Rechtliche Prüfung erforderlich">
          Das Verhältnis dieser Gebühren zum gesetzlichen Widerrufsrecht bei online gebuchten Dienstleistungen (§§ 312g, 356 BGB) wird vor dem Start anwaltlich geprüft. Deine Rechte und
          das Muster-Formular findest du in der <Link href="/widerruf">Widerrufsbelehrung</Link>.
        </Notice>
      </ContentSection>
    </ContentPage>
  );
}
