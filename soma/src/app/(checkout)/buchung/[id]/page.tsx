import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { getBookingForCustomer } from "@/server/services/bookings";
import { REVIEW_TAG_OPTIONS } from "@/server/services/reviews";
import { searchProviders } from "@/server/services/search";
import type { CustomerBookingDTO, ProviderSearchResult, Session } from "@/server/dto";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { Container, Overline } from "@/components/ui/layout";
import { CheckLine, PriceBreakdown, type PriceLine } from "@/components/ui/summary";
import { Rating, Stars } from "@/components/ui/trust";
import { RebookButton } from "@/components/site/account-rebook";
import { CancelBooking } from "@/components/site/checkout-cancel";
import { ReportProblem } from "@/components/site/checkout-dispute";
import { DevPayButton } from "@/components/site/checkout-pay";
import { RoofLineDraw } from "@/components/site/checkout-roofline";
import { ProviderRow } from "@/components/site/provider-row";
import { ReviewComposer } from "@/components/site/review-composer";
import {
  dayLabel,
  deadlineText,
  EVENT_LABELS,
  LOCATION_LABELS,
  NBSP,
  paymentLabel,
  scheduleLines,
  withStop,
} from "@/components/site/checkout-format";
import { berlinDateKey, formatDateLong, formatDay, formatDayShort, formatDuration, formatPriceExact, formatTime } from "@/lib/format";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Ihre Buchung", robots: { index: false, follow: false } };

function respondByText(iso: string | null): string {
  if (!iso) return "in Kürze";
  const d = dayLabel(iso);
  return `${d === "Heute" ? "" : `${d === "Morgen" ? "morgen" : d}, `}${formatTime(iso)}${NBSP}Uhr`;
}

function Hero({ b }: { b: CustomerBookingDTO }) {
  const first = b.provider.displayName;
  const when = `${formatDay(b.startsAt)} um ${formatTime(b.startsAt)}${NBSP}Uhr`;
  let title: string;
  let body: string;
  let line: "draw" | "static" = "static";
  switch (b.status) {
    case "confirmed":
      title = "Bestätigt.";
      body = `${first} kommt am ${when} zu Ihnen.`;
      line = "draw";
      break;
    case "requested":
      title = `Angefragt – Antwort bis ${respondByText(b.respondBy).replace(/[\s\u00a0]Uhr$/, "")}`;
      body = `${withStop(`Ihre Anfrage ist bei ${first}`)} Die Antwort kommt bis spätestens ${respondByText(b.respondBy)} – belastet wird erst nach der Zusage.`;
      break;
    case "pending_payment":
      title = b.canPay ? "Zahlung ausstehend." : "Reservierung abgelaufen.";
      body = b.canPay
        ? `Der Termin ist bis ${b.holdExpiresAt ? `${formatTime(b.holdExpiresAt)}${NBSP}Uhr` : "in Kürze"} für Sie reserviert. Schließen Sie die Zahlung ab, um ihn zu sichern.`
        : "Die Zahlung wurde nicht rechtzeitig abgeschlossen. Es wurde nichts belastet.";
      break;
    case "in_progress":
      title = "Die Behandlung läuft.";
      body = `${first} ist bei Ihnen. Eine gute Behandlung.`;
      break;
    case "completed":
      title = "Abgeschlossen.";
      body = `Ihr Termin bei ${first} am ${formatDateLong(b.startsAt)} ist abgeschlossen.`;
      break;
    case "cancelled":
      title = "Storniert.";
      body =
        b.cancelledBy === "provider"
          ? `${first} musste den Termin leider absagen. Sie erhalten den vollen Betrag zurück.`
          : b.cancellationFeeCents > 0
            ? `Der Termin wurde storniert. Stornogebühr ${formatPriceExact(b.cancellationFeeCents)}, erstattet ${formatPriceExact(b.refundCents)}.`
            : "Der Termin wurde storniert. Es fallen keine Kosten an.";
      break;
    case "declined":
      title = "Leider abgesagt.";
      body = `${first} kann diesen Termin nicht wahrnehmen. Es wurde nichts belastet.`;
      break;
    case "expired":
      title = "Abgelaufen.";
      body = b.confirmedAt ? "Diese Buchung ist abgelaufen." : "Die Anfrage wurde nicht rechtzeitig bestätigt. Es wurde nichts belastet.";
      break;
    case "no_show":
      title = "Nicht angetroffen.";
      body = "Die Fachkraft hat Sie zum vereinbarten Termin nicht angetroffen. Es gilt die volle Stornogebühr.";
      break;
  }
  return (
    <header className="flex flex-col gap-4">
      <p className="type-caption text-ink-muted">
        Buchung <span className="code-ref text-ink">{b.reference}</span>
      </p>
      <div className="flex flex-col gap-3">
        {line === "draw" ? <RoofLineDraw /> : <span aria-hidden className="block h-0.5 w-6 bg-ink" />}
        <h1 className="type-display-m">{title}</h1>
      </div>
      <p className="max-w-reading type-body-l text-ink-muted">{body}</p>
    </header>
  );
}

async function alternativesFor(session: Session, b: CustomerBookingDTO): Promise<ProviderSearchResult[]> {
  if (!["declined", "expired"].includes(b.status)) return [];
  const base = { postalCode: b.location.postalCode, serviceId: b.serviceId, pageSize: 6 } as const;
  try {
    const sameDay = new Date(b.startsAt).getTime() > Date.now() ? await searchProviders({ ...base, date: berlinDateKey(b.startsAt) }, session, { logDemand: false }) : null;
    let list = sameDay?.results.filter((r) => r.providerId !== b.provider.id) ?? [];
    if (list.length === 0) list = (await searchProviders(base, session, { logDemand: false })).results.filter((r) => r.providerId !== b.provider.id);
    return list.slice(0, 3);
  } catch {
    return [];
  }
}

export default async function BuchungPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole("customer", routes.booking(id));
  const b = await getBookingForCustomer(session, id).catch(() => null);
  if (!b) notFound();
  const alternatives = await alternativesFor(session, b);
  const renderedAt = Date.now();

  const lines: PriceLine[] = [
    { label: "Behandlung", detail: `${b.serviceName} · ${formatDuration(b.durationMinutes)}`, cents: b.price.servicePriceCents },
    { label: "Anfahrt", cents: b.price.travelFeeCents },
    ...(b.price.serviceFeeCents > 0 ? [{ label: "Servicegebühr", cents: b.price.serviceFeeCents }] : []),
    ...(b.price.discountCents > 0 ? [{ label: "Guthaben", cents: b.price.discountCents, kind: "credit" as const }] : []),
  ];
  const active = ["requested", "confirmed", "pending_payment"].includes(b.status);
  const freeUntil = b.cancellation.freeUntil;
  const freeNow = !!freeUntil && Date.parse(freeUntil) > Date.now();
  const profileHref = routes.provider(b.provider.slug);

  return (
    <main id="inhalt" className="flex-1">
      <Container width="content" className="flex flex-col gap-10 pt-8 pb-16 lg:gap-14 lg:pt-14 lg:pb-24">
        <Hero b={b} />

        {b.status === "pending_payment" && b.canPay && b.payment?.provider === "dev" ? <DevPayButton bookingId={b.id} /> : null}

        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="flex min-w-0 flex-col gap-10 lg:col-span-7">
            {b.startCode ? (
              <section aria-labelledby="startcode" className="flex flex-col gap-3 border border-line bg-surface-raised p-5 md:p-6">
                <p id="startcode" className="type-overline text-ink-muted">
                  Ihr Start-Code
                </p>
                <p className="font-display text-[3.5rem] leading-none font-[380] tracking-[0.18em] num" aria-label={`Start-Code ${b.startCode.split("").join(" ")}`}>
                  {b.startCode}
                </p>
                <p className="type-body-s text-ink-muted">
                  Nennen Sie diesen Code Ihrer Fachkraft bei Ankunft. Erst mit dem Code beginnt der Termin – so wissen Sie, dass die richtige Person vor Ihnen steht.
                </p>
              </section>
            ) : null}

            <section aria-labelledby="details" className="flex flex-col gap-4">
              <h2 id="details" className="type-heading-m">
                Ihr Termin
              </h2>
              <div className="flex items-center gap-4 border-y border-line py-4">
                <Avatar src={b.provider.avatarUrl} name={b.provider.displayName} size={48} />
                <div className="min-w-0 flex-1">
                  <Link href={profileHref} className="type-heading-m hover:underline hover:underline-offset-4">
                    {b.provider.displayName}
                  </Link>
                  <p>
                    <Rating avg={b.provider.ratingAvg} count={b.provider.ratingCount} />
                  </p>
                </div>
              </div>
              <dl className="flex flex-col divide-y divide-line border-b border-line">
                <div className="flex items-baseline justify-between gap-6 py-3">
                  <dt className="type-body-s text-ink-muted">Behandlung</dt>
                  <dd className="text-right type-body-s">{b.serviceName}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-6 py-3">
                  <dt className="type-body-s text-ink-muted">Wann</dt>
                  <dd className="text-right type-body-s num">
                    {`${formatDayShort(b.startsAt)} · ${formatTime(b.startsAt)}–${formatTime(b.endsAt)}`}
                    <span className="block text-ink-muted">{formatDuration(b.durationMinutes)}</span>
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-6 py-3">
                  <dt className="type-body-s text-ink-muted">Wo</dt>
                  <dd className="min-w-0 text-right type-body-s">
                    <span className="block">{LOCATION_LABELS[b.location.kind]}</span>
                    <span className="block">{b.location.addressLine}</span>
                    <span className="block num">{`${b.location.postalCode} ${b.location.city}`}</span>
                    {b.location.details ? <span className="block text-ink-muted">{b.location.details}</span> : null}
                  </dd>
                </div>
                {b.notes ? (
                  <div className="flex items-baseline justify-between gap-6 py-3">
                    <dt className="shrink-0 type-body-s text-ink-muted">Hinweise</dt>
                    <dd className="text-right type-body-s whitespace-pre-line">{b.notes}</dd>
                  </div>
                ) : null}
              </dl>
              {active ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <ButtonLink href={`${routes.booking(b.id)}/kalender`} variant="secondary" icon={<Icon icon={CalendarPlus} />} prefetch={false}>
                    Zum Kalender hinzufügen
                  </ButtonLink>
                </div>
              ) : null}
            </section>

            {b.canReview ? (
              <section aria-labelledby="bewerten" className="flex flex-col gap-4">
                <h2 id="bewerten" className="type-heading-m">
                  Bewerten
                </h2>
                <ReviewComposer bookingId={b.id} providerName={b.provider.displayName} tags={REVIEW_TAG_OPTIONS} />
              </section>
            ) : b.review ? (
              <section aria-labelledby="bewertung" className="flex flex-col gap-2">
                <h2 id="bewertung" className="type-heading-m">
                  Ihre Bewertung
                </h2>
                <Stars value={b.review.rating} />
                {b.review.comment ? <p className="type-body text-ink">{b.review.comment}</p> : null}
              </section>
            ) : null}

            {alternatives.length ? (
              <section aria-labelledby="alternativen" className="flex flex-col gap-2">
                <h2 id="alternativen" className="type-heading-m">
                  Diese Profis haben Zeit
                </h2>
                <p className="type-body-s text-ink-muted">{`Gleiche Leistung in ${b.location.postalCode} – mit einem Tipp direkt buchen.`}</p>
                <div className="mt-2 flex flex-col border-t border-line">
                  {alternatives.map((r) => (
                    <ProviderRow key={r.providerId} result={r} postalCode={b.location.postalCode} date={null} canFavorite headingLevel="h3" />
                  ))}
                </div>
              </section>
            ) : null}

            {b.events.length ? (
              <section aria-labelledby="verlauf" className="flex flex-col gap-4">
                <h2 id="verlauf" className="type-heading-m">
                  Verlauf
                </h2>
                <ol className="flex flex-col">
                  {b.events.map((e, i) => (
                    <li key={`${e.createdAt}-${i}`} className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3 pb-4 last:pb-0">
                      <span aria-hidden className="relative flex justify-center">
                        <span className="mt-1.5 size-2 rounded-full bg-ink" />
                        {i < b.events.length - 1 ? <span className="absolute top-4 bottom-[-0.5rem] w-px bg-line" /> : null}
                      </span>
                      <div className="flex flex-col">
                        <p className="type-body-s text-ink">{EVENT_LABELS[e.toStatus]}</p>
                        <p className="type-caption text-ink-muted num">{`${formatDayShort(e.createdAt)}, ${formatTime(e.createdAt)}`}</p>
                        {e.note ? <p className="type-caption text-ink-muted">{e.note}</p> : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </div>

          <aside aria-label="Preis und Optionen" className="flex flex-col gap-10 lg:col-span-5">
            <div className="flex flex-col gap-4 lg:ml-6">
              <h2 className="type-heading-m">Preis</h2>
              <PriceBreakdown
                lines={lines}
                totalCents={b.price.totalCents}
                notes={[
                  <span key="pay" className="flex items-center gap-2 text-ink">
                    Zahlung: {paymentLabel(b.payment)}
                    {b.payment?.cardLast4 ? <span className="text-ink-muted">{`· ${b.payment.cardBrand?.toUpperCase() ?? "Karte"} •••• ${b.payment.cardLast4}`}</span> : null}
                  </span>,
                  ...(b.status === "cancelled" && (b.cancellationFeeCents > 0 || b.refundCents > 0)
                    ? [<span key="refund" className="num">{`Stornogebühr ${formatPriceExact(b.cancellationFeeCents)} · Erstattung ${formatPriceExact(b.refundCents)}`}</span>]
                    : []),
                  <span key="vat">{b.vatNote}</span>,
                  <span key="agent">{withStop(`SOMA vermittelt; Vertragspartner ist ${b.provider.displayName}`)}</span>,
                ]}
              />
            </div>

            {b.canCancel || active ? (
              <div className="flex flex-col gap-4 lg:ml-6">
                <h2 className="type-heading-m">Stornierung</h2>
                {b.status === "requested" ? (
                  <CheckLine>Bis zur Zusage jederzeit kostenlos zurückziehbar.</CheckLine>
                ) : freeNow && freeUntil ? (
                  <CheckLine>{`Kostenlos stornierbar bis ${deadlineText(freeUntil)}.`}</CheckLine>
                ) : null}
                {b.status === "confirmed" ? (
                  <ul className="flex flex-col gap-1">
                    {scheduleLines(b.cancellation.schedule).map((l) => (
                      <li key={l} className="type-caption text-ink-muted num">
                        {l}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {b.canCancel && b.cancellation.ifCancelledNow ? (
                  <CancelBooking
                    bookingId={b.id}
                    status={b.status}
                    preview={b.cancellation.ifCancelledNow}
                    schedule={b.cancellation.schedule}
                    renderedAt={renderedAt}
                    providerName={b.provider.displayName}
                  />
                ) : null}
              </div>
            ) : null}

            {b.canRebook || b.canDispute ? (
              <div className="flex flex-col items-start gap-3 lg:ml-6">
                {b.canRebook ? <RebookButton bookingId={b.id} variant="primary" size="l" label={`Wieder bei ${b.provider.displayName} buchen`} /> : null}
                {b.canDispute ? <ReportProblem bookingId={b.id} /> : null}
              </div>
            ) : null}

            {b.status === "confirmed" ? (
              <Notice kind="info" title="Vorbereitung" className="lg:ml-6">
                Halten Sie bitte etwas Platz frei und sorgen Sie für einen ruhigen Raum. Alles Weitere bringt die Fachkraft mit.
              </Notice>
            ) : null}

            <p className="type-caption text-ink-muted lg:ml-6">
              Fragen zur Buchung?{" "}
              <Link href={routes.help()} className="text-accent underline underline-offset-[0.2em]">
                Hilfe & Kontakt
              </Link>
            </p>
          </aside>
        </div>
      </Container>
    </main>
  );
}
