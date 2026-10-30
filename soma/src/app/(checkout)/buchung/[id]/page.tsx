import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarPlus } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { getBookingForCustomer } from "@/server/services/bookings";
import { REVIEW_TAG_OPTIONS } from "@/server/services/reviews";
import { searchProviders } from "@/server/services/search";
import type { CustomerBookingDTO, ProviderSearchResult, SearchInput, Session } from "@/server/dto";
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

type Alternatives = {
  results: ProviderSearchResult[];
  /** what the shown rows offer: the same service, similar ones in the category, or both */
  scope: "service" | "category" | "mixed";
  /** every row is for the booking's day */
  sameDay: boolean;
  searchHref: string;
  date: string | null;
};

/** Declined, expired or cancelled by the provider: the customer still needs a treatment. */
function needsAlternatives(b: CustomerBookingDTO): boolean {
  return b.status === "declined" || b.status === "expired" || (b.status === "cancelled" && b.cancelledBy === "provider");
}

const MAX_ALTERNATIVES = 3;

/**
 * Alternatives after a dead end (R8), filled in this order up to three providers: same
 * service on the same day, same service within the next days, same category on the same
 * day, same category within the next days. Always returns the search link (plz,
 * kategorie, datum) for the "Andere Profis finden" CTA.
 */
async function alternativesFor(session: Session, b: CustomerBookingDTO): Promise<Alternatives | null> {
  if (!needsAlternatives(b)) return null;
  const date = Date.parse(b.startsAt) > Date.now() ? berlinDateKey(b.startsAt) : null;
  const searchHref = routes.search({ plz: b.location.postalCode, kategorie: b.categorySlug, datum: date ?? undefined });
  const attempts: Array<{ scope: "service" | "category"; sameDay: boolean; input: SearchInput }> = [];
  const base = { postalCode: b.location.postalCode, pageSize: 6 } as const;
  for (const scope of ["service", "category"] as const) {
    const what = scope === "service" ? { serviceId: b.serviceId } : { categorySlug: b.categorySlug };
    if (date) attempts.push({ scope, sameDay: true, input: { ...base, ...what, date } });
    attempts.push({ scope, sameDay: false, input: { ...base, ...what } });
  }
  const results: ProviderSearchResult[] = [];
  const scopes = new Set<"service" | "category">();
  let sameDay = true;
  for (const a of attempts) {
    if (results.length >= MAX_ALTERNATIVES) break;
    try {
      const res = await searchProviders(a.input, session, { logDemand: false });
      for (const r of res.results) {
        if (results.length >= MAX_ALTERNATIVES) break;
        if (r.providerId === b.provider.id || results.some((x) => x.providerId === r.providerId)) continue;
        results.push(r);
        scopes.add(a.scope);
        if (!a.sameDay) sameDay = false;
      }
    } catch (e) {
      console.error("[buchung] alternatives search failed", e);
    }
  }
  const scope = scopes.size > 1 ? "mixed" : scopes.has("category") ? "category" : "service";
  return { results, scope, sameDay: results.length > 0 && sameDay, searchHref, date: results.length > 0 && sameDay ? date : null };
}

function alternativesCaption(alt: Alternatives, b: CustomerBookingDTO): string {
  const label = alt.sameDay && alt.date ? dayLabel(alt.date) : null;
  const when = label === "Heute" ? "heute" : label === "Morgen" ? "morgen" : label ? `am ${label}` : "in den nächsten Tagen";
  const what = alt.scope === "service" ? b.serviceName : alt.scope === "mixed" ? `${b.serviceName} und ähnliche Behandlungen` : "Ähnliche Behandlungen";
  return `${what} in ${b.location.postalCode}, ${when} – mit einem Tipp direkt buchen.`;
}

export default async function BuchungPage({ params, searchParams }: PageProps<"/buchung/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  // Set by the checkout after a passwordless guest sign-up (R16).
  const newAccount = sp.konto === "neu";
  const session = await requireRole("customer", routes.booking(id));
  const b = await getBookingForCustomer(session, id).catch(() => null);
  if (!b) notFound();
  const alternatives = await alternativesFor(session, b);
  const renderedAt = Date.now();

  const lines: PriceLine[] = [
    { label: <span className="hyphens-none">Behandlung</span>, detail: `${b.serviceName} · ${formatDuration(b.durationMinutes)}`, cents: b.price.servicePriceCents },
    { label: <span className="hyphens-none">Anfahrt</span>, cents: b.price.travelFeeCents },
    ...(b.price.serviceFeeCents > 0 ? [{ label: <span className="hyphens-none">Servicegebühr</span>, cents: b.price.serviceFeeCents }] : []),
    ...(b.price.discountCents > 0 ? [{ label: <span className="hyphens-none">Guthaben</span>, cents: b.price.discountCents, kind: "credit" as const }] : []),
  ];
  const active = ["requested", "confirmed", "pending_payment"].includes(b.status);
  const freeUntil = b.cancellation.freeUntil;
  const freeNow = !!freeUntil && Date.parse(freeUntil) > Date.now();
  // Bedenkzeit (R10): free within graceMinutes after booking; the booking time is its first event.
  const graceMinutes = b.cancellation.policy.graceMinutes ?? 0;
  const bookedAt = b.events.length ? Math.min(...b.events.map((e) => Date.parse(e.createdAt))) : null;
  const graceUntil = graceMinutes > 0 && bookedAt !== null ? new Date(Math.min(bookedAt + graceMinutes * 60_000, Date.parse(b.startsAt))).toISOString() : null;
  const inGrace = b.status === "confirmed" && !!graceUntil && Date.parse(graceUntil) > renderedAt;
  const profileHref = routes.provider(b.provider.slug);

  return (
    <main id="inhalt" className="flex-1">
      <Container width="content" className="flex flex-col gap-10 pt-8 pb-16 lg:gap-14 lg:pt-14 lg:pb-24">
        <Hero b={b} />

        {newAccount ? (
          <Notice kind="info" title="Ihr Kundenkonto ist angelegt." className="max-w-reading">
            {`Wir haben Ihnen eine E-Mail geschickt, um ein Passwort festzulegen. Bis dahin bleiben Sie auf diesem Gerät angemeldet und finden die Buchung unter „Meine Termine“.`}
          </Notice>
        ) : null}

        {b.status === "pending_payment" && b.canPay && b.payment?.provider === "dev" ? <DevPayButton bookingId={b.id} /> : null}

        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="flex min-w-0 flex-col gap-10 lg:col-span-7">
            {alternatives ? (
              <section aria-labelledby="alternativen" className="flex flex-col gap-2">
                <h2 id="alternativen" className="type-heading-m">
                  {alternatives.results.length ? "Diese Profis haben Zeit" : "Andere Profis in Ihrer Nähe"}
                </h2>
                <p className="type-body-s text-ink-muted">
                  {alternatives.results.length
                    ? alternativesCaption(alternatives, b)
                    : `Für ${b.serviceName} in ${b.location.postalCode} finden wir gerade keinen freien Termin. In der Suche sehen Sie alle Profis und Tage.`}
                </p>
                {alternatives.results.length ? (
                  <div className="mt-2 flex flex-col border-t border-line">
                    {alternatives.results.map((r) => (
                      <ProviderRow key={r.providerId} result={r} postalCode={b.location.postalCode} date={alternatives.date} canFavorite headingLevel="h3" />
                    ))}
                  </div>
                ) : null}
                <div className="pt-4">
                  <ButtonLink href={alternatives.searchHref} variant={alternatives.results.length ? "secondary" : "primary"} size="l" iconRight={<Icon icon={ArrowRight} />}>
                    Andere Profis finden
                  </ButtonLink>
                </div>
              </section>
            ) : null}

            {b.startCode ? (
              <section aria-labelledby="startcode" className="flex flex-col gap-3 border border-line bg-surface-raised p-5 md:p-6">
                <p id="startcode" className="type-overline text-ink-muted">
                  Ihr Start-Code
                </p>
                <p className="font-display text-[3.5rem] leading-none font-[380] tracking-[0.18em] num">
                  <span aria-hidden>{b.startCode}</span>
                  <span className="sr-only">{b.startCode.split("").join(" ")}</span>
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
                  <dt className="shrink-0 type-body-s text-ink-muted hyphens-none">Behandlung</dt>
                  <dd className="text-right type-body-s">{b.serviceName}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-6 py-3">
                  <dt className="shrink-0 type-body-s text-ink-muted hyphens-none">Wann</dt>
                  <dd className="text-right type-body-s num">
                    {`${formatDayShort(b.startsAt)} · ${formatTime(b.startsAt)}–${formatTime(b.endsAt)}`}
                    <span className="block text-ink-muted">{formatDuration(b.durationMinutes)}</span>
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-6 py-3">
                  <dt className="shrink-0 type-body-s text-ink-muted hyphens-none">Wo</dt>
                  <dd className="min-w-0 text-right type-body-s">
                    <span className="block">{LOCATION_LABELS[b.location.kind]}</span>
                    <span className="block">{b.location.addressLine}</span>
                    <span className="block num">{`${b.location.postalCode} ${b.location.city}`}</span>
                    {b.location.details ? <span className="block text-ink-muted">{b.location.details}</span> : null}
                  </dd>
                </div>
                {b.notes ? (
                  <div className="flex items-baseline justify-between gap-6 py-3">
                    <dt className="shrink-0 type-body-s text-ink-muted hyphens-none">Hinweise</dt>
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
                {inGrace ? <p className="type-caption text-ink-muted">{`In den ersten ${graceMinutes}${NBSP}Minuten nach der Buchung immer kostenlos stornierbar.`}</p> : null}
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
                    graceUntil={graceUntil}
                    graceMinutes={graceMinutes}
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
