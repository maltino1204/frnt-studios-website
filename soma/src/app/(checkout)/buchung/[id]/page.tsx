import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, CalendarPlus, CalendarX2, ChevronRight, CircleCheck, CirclePlay, ClipboardList, Clock, CreditCard, Hourglass, MapPin, StickyNote, type LucideIcon } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { getBookingForCustomer } from "@/server/services/bookings";
import { REVIEW_TAG_OPTIONS } from "@/server/services/reviews";
import { searchProviders } from "@/server/services/search";
import type { CustomerBookingDTO, ProviderSearchResult, SearchInput, Session } from "@/server/dto";
import { AuraBackground } from "@/components/ui/aura";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Notice, Status } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { Container } from "@/components/ui/layout";
import { SuccessCheck } from "@/components/ui/success";
import { CheckLine, PriceBreakdown, type PriceLine } from "@/components/ui/summary";
import { GlassPanel } from "@/components/ui/surface";
import { Rating, Stars } from "@/components/ui/trust";
import { cn } from "@/lib/cn";
import { RebookButton } from "@/components/site/account-rebook";
import { CancelBooking } from "@/components/site/checkout-cancel";
import { ConfirmHaptic } from "@/components/site/checkout-confirmation";
import { ReportProblem } from "@/components/site/checkout-dispute";
import { DevPayButton } from "@/components/site/checkout-pay";
import { ProviderRow } from "@/components/site/provider-row";
import { ReviewComposer } from "@/components/site/review-composer";
import { prepNote } from "@/components/site/discovery-copy";
import {
  dayLabel,
  deadlineText,
  EVENT_LABELS,
  freeUntilFor,
  LOCATION_LABELS,
  NBSP,
  nbspDate,
  paymentLabel,
  scheduleLines,
  statusTone,
  withStop,
} from "@/components/site/checkout-format";
import { berlinDateKey, formatDateLong, formatDay, formatDayShort, formatDuration, formatPriceExact, formatTime } from "@/lib/format";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Deine Buchung", robots: { index: false, follow: false } };

function respondByText(iso: string | null): string {
  if (!iso) return "in Kürze";
  const d = dayLabel(iso);
  return `${d === "Heute" ? "" : `${d === "Morgen" ? "morgen" : d}, `}${formatTime(iso)}${NBSP}Uhr`;
}

function heroCopy(b: CustomerBookingDTO): { title: string; body: string } {
  const first = b.provider.displayName;
  const when = `${nbspDate(formatDay(b.startsAt))} um ${formatTime(b.startsAt)}${NBSP}Uhr`;
  switch (b.status) {
    case "confirmed":
      return { title: "Bestätigt.", body: `${first} kommt am ${when} zu dir.` };
    case "requested":
      return {
        title: `Angefragt – Antwort bis ${respondByText(b.respondBy).replace(/[\s\u00a0]Uhr$/, "")}`,
        body: `${withStop(`Deine Anfrage ist bei ${first}`)} Die Antwort kommt bis spätestens ${respondByText(b.respondBy)} – belastet wird erst nach der Zusage.`,
      };
    case "pending_payment":
      return b.canPay
        ? {
            title: "Zahlung ausstehend.",
            body: `Der Termin ist bis ${b.holdExpiresAt ? `${formatTime(b.holdExpiresAt)}${NBSP}Uhr` : "in Kürze"} für dich reserviert. Schließ die Zahlung ab, um ihn zu sichern.`,
          }
        : { title: "Reservierung abgelaufen.", body: "Die Zahlung wurde nicht rechtzeitig abgeschlossen. Es wurde nichts belastet." };
    case "in_progress":
      return { title: "Die Behandlung läuft.", body: `${first} ist bei dir. Wir wünschen dir eine schöne Behandlung.` };
    case "completed":
      return { title: "Abgeschlossen.", body: `Dein Termin bei ${first} am ${nbspDate(formatDateLong(b.startsAt))} ist abgeschlossen.` };
    case "cancelled":
      return {
        title: "Storniert.",
        body:
          b.cancelledBy === "provider"
            ? `${first} musste den Termin leider absagen. Dir entstehen keine Kosten.`
            : b.cancellationFeeCents > 0
              ? `Der Termin wurde storniert. Stornogebühr ${formatPriceExact(b.cancellationFeeCents)}, freigegeben ${formatPriceExact(b.refundCents)}.`
              : "Der Termin wurde storniert. Es fallen keine Kosten an.",
      };
    case "declined":
      return { title: "Leider abgesagt.", body: `${first} kann diesen Termin nicht wahrnehmen. Es wurde nichts belastet.` };
    case "expired":
      return { title: "Abgelaufen.", body: b.confirmedAt ? "Diese Buchung ist abgelaufen." : "Die Anfrage wurde nicht rechtzeitig bestätigt. Es wurde nichts belastet." };
    case "no_show":
      return { title: "Nicht angetroffen.", body: `${first} hat dich zum vereinbarten Termin nicht angetroffen. Es gilt die volle Stornogebühr.` };
  }
}

/** The status glyph above the headline: the drawn check on "Bestätigt.", calm icons otherwise. */
function StatusGlyph({ b }: { b: CustomerBookingDTO }) {
  if (b.status === "confirmed") return <SuccessCheck size={56} glow={false} />;
  const map: Partial<Record<CustomerBookingDTO["status"], { icon: LucideIcon; cls: string }>> = {
    requested: { icon: Hourglass, cls: "bg-warning-soft text-warning" },
    pending_payment: { icon: CreditCard, cls: "bg-warning-soft text-warning" },
    in_progress: { icon: CirclePlay, cls: "bg-surface-sunken text-ink" },
    completed: { icon: CircleCheck, cls: "bg-surface-raised text-ink" },
  };
  const m = map[b.status] ?? { icon: CalendarX2, cls: "bg-surface-raised text-ink-muted" };
  return (
    <span aria-hidden className={cn("inline-flex size-14 animate-pop items-center justify-center rounded-full shadow-raised", m.cls)}>
      <Icon icon={m.icon} size={24} />
    </span>
  );
}

/** The Start-Code, digit by digit (staggered reveal). Screen readers get the spaced digits. */
function StartCodeCard({ b }: { b: CustomerBookingDTO }) {
  if (!b.startCode) return null;
  if (b.status === "in_progress") {
    return (
      <GlassPanel as="section" aria-labelledby="startcode" className="flex flex-col gap-2 p-5 md:p-6">
        <p id="startcode" className="type-overline text-ink-muted">
          Dein Start-Code
        </p>
        <CheckLine>{b.startedAt ? `Code bestätigt um ${formatTime(b.startedAt)}${NBSP}Uhr.` : "Code bestätigt."}</CheckLine>
      </GlassPanel>
    );
  }
  return (
    <GlassPanel as="section" aria-labelledby="startcode" className="flex flex-col gap-4 p-5 md:p-6">
      <p id="startcode" className="type-overline text-ink-muted">
        Dein Start-Code
      </p>
      <p className="leading-none">
        {" "}
        <span aria-hidden className="stagger-rise">
          {b.startCode.split("").map((d, i) => (
            <span
              key={i}
              className="mr-2 inline-flex h-16 w-[3.25rem] items-center justify-center rounded-tile bg-surface-raised text-[2rem] font-[600] tracking-[-0.02em] text-ink shadow-raised num last:mr-0 sm:h-[4.5rem] sm:w-14 sm:text-[2.25rem]"
              style={{ animationDelay: `${220 + i * 90}ms` }}
            >
              {d}
            </span>
          ))}
        </span>{" "}
        <span className="sr-only">{b.startCode.split("").join(" ")}</span>
      </p>
      <p className="type-body-s text-ink-muted">
        {`Nenn diesen Code ${b.provider.displayName} an der Tür. Erst mit dem Code beginnt der Termin – so weißt du, dass die richtige Person vor dir steht.`}
      </p>
    </GlassPanel>
  );
}

/** One group of the booking facts: a single <div> directly in the <dl> (A5-3); the icon lives in the <dt>. */
function Fact({ icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="relative flex min-w-0 min-h-9 flex-col gap-0.5 pl-12">
      <dt className="type-caption text-ink-muted hyphens-none">
        <span aria-hidden className="absolute top-0 left-0 inline-flex size-9 items-center justify-center rounded-full bg-surface-sunken text-ink-muted">
          <Icon icon={icon} size={16} />
        </span>
        {label}
      </dt>
      <dd className="type-body-s text-ink">{children}</dd>
    </div>
  );
}

function Card({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("flex flex-col gap-5 rounded-card bg-surface-raised p-5 shadow-raised md:p-7", className)} {...props} />;
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
  // Regular free tier (24 h before) without the Bedenkzeit; the Bedenkzeit is only worth a line while the tier would charge (N10).
  const tierFreeUntil = freeUntilFor(b.cancellation.policy, b.startsAt);
  const tierWouldCharge = !tierFreeUntil || Date.parse(tierFreeUntil) <= renderedAt;
  const inGrace = b.status === "confirmed" && !!graceUntil && Date.parse(graceUntil) > renderedAt && tierWouldCharge;
  const profileHref = routes.provider(b.provider.slug);
  const { title, body } = heroCopy(b);
  // Haptic only right after the booking was confirmed or sent (not on later visits).
  const sentAt = b.status === "confirmed" ? (b.confirmedAt ? Date.parse(b.confirmedAt) : null) : b.status === "requested" ? bookedAt : null;
  const fresh = sentAt !== null && renderedAt - sentAt < 120_000;
  // Calm aura for every state; the live states get the fuller wash (text stays left, away from the glow).
  const aura = ["confirmed", "requested", "in_progress"].includes(b.status) ? "hero" : ["completed", "pending_payment"].includes(b.status) ? "section" : "subtle";
  const schedule = b.status === "confirmed" ? scheduleLines(b.cancellation.schedule, renderedAt) : [];
  // Same filter as scheduleLines, so each line gets the tone of its own fee.
  const tiers = b.cancellation.schedule.filter((e) => !e.until || Date.parse(e.until) > renderedAt);
  const tierTone = (i: number) => {
    const t = tiers[i];
    if (!t) return "bg-line-strong";
    if (t.feePercent <= 0 && !t.travelFeeRetained) return "bg-success";
    return t.feePercent >= 100 ? "bg-danger/75" : "bg-warning/80";
  };
  const upcoming =
    b.status === "confirmed"
      ? { label: "Dein Termin", time: `${formatDayShort(b.startsAt)}, ${formatTime(b.startsAt)}` }
      : b.status === "requested"
        ? { label: `Antwort von ${b.provider.displayName}`, time: `bis ${respondByText(b.respondBy)}` }
        : null;

  return (
    <main id="inhalt" className="flex-1">
      <ConfirmHaptic bookingId={b.id} fresh={fresh} />
      <Container width="content" className="flex flex-col gap-5 pt-6 pb-16 md:gap-6 lg:pt-10 lg:pb-24">
        {/* Status hero: calm aura, the confirmation moment and (when confirmed) the Start-Code card. */}
        <section aria-labelledby="status-titel" className="relative isolate overflow-clip rounded-panel bg-surface-raised shadow-raised">
          {/* Muted text must stay AA (A5-15): phones stack the muted sentence over the glow, so they get the
              subtle wash without grain (grain darkens pixels); from lg the text column stays left of the glow. */}
          <AuraBackground variant="subtle" placement="right" fade="none" grain={false} className="lg:hidden" />
          <AuraBackground variant={aura} placement="right" fade="none" className="hidden lg:block" />
          <div className="grid gap-8 p-5 pt-7 sm:p-8 lg:grid-cols-12 lg:items-center lg:gap-10 lg:p-12">
            <div className={cn("flex min-w-0 flex-col gap-5", b.startCode ? "lg:col-span-7" : "lg:col-span-9")}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Status tone={statusTone(b.status)}>{b.statusLabel}</Status>
                <span className="type-caption text-ink-muted">
                  Buchung <span className="code-ref text-ink">{b.reference}</span>
                </span>
              </div>
              <div className="flex flex-col gap-4">
                <StatusGlyph b={b} />
                <h1 id="status-titel" className="type-display-m">
                  {title}
                </h1>
              </div>
              <p className="max-w-reading type-body-l text-ink-muted">{body}</p>
              {active && b.status !== "pending_payment" ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <ButtonLink href={`${routes.booking(b.id)}/kalender`} variant="secondary" icon={<Icon icon={CalendarPlus} />} prefetch={false}>
                    Zum Kalender hinzufügen
                  </ButtonLink>
                </div>
              ) : null}
              {b.status === "pending_payment" && b.canPay && b.payment?.provider === "dev" ? <DevPayButton bookingId={b.id} /> : null}
            </div>
            {b.startCode ? (
              <div className="min-w-0 lg:col-span-5">
                <StartCodeCard b={b} />
              </div>
            ) : null}
          </div>
        </section>

        {newAccount ? (
          <Notice kind="info" title="Dein Kundenkonto ist angelegt.">
            {`Wir haben dir eine E-Mail geschickt, um ein Passwort festzulegen. Bis dahin bleibst du auf diesem Gerät angemeldet und findest die Buchung unter „Meine Termine“.`}
          </Notice>
        ) : null}

        <div className="flex flex-col gap-5 md:gap-6 lg:grid lg:grid-cols-12 lg:items-start">
          <div className="flex min-w-0 flex-col gap-5 md:gap-6 lg:col-span-7">
            {alternatives ? (
              <section aria-labelledby="alternativen" className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 px-1">
                  <h2 id="alternativen" className="type-heading-m">
                    {alternatives.results.length ? "Diese Profis haben Zeit" : "Andere Profis in deiner Nähe"}
                  </h2>
                  <p className="type-body-s text-ink-muted">
                    {alternatives.results.length
                      ? alternativesCaption(alternatives, b)
                      : `Für ${b.serviceName} in ${b.location.postalCode} finden wir gerade keinen freien Termin. In der Suche siehst du alle Profis und Tage.`}
                  </p>
                </div>
                {alternatives.results.length ? (
                  <div className="flex flex-col">
                    {alternatives.results.map((r) => (
                      <ProviderRow key={r.providerId} result={r} postalCode={b.location.postalCode} date={alternatives.date} canFavorite headingLevel="h3" />
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <ButtonLink href={alternatives.searchHref} variant={alternatives.results.length ? "secondary" : "primary"} iconRight={<Icon icon={ArrowRight} />}>
                    Andere Profis finden
                  </ButtonLink>
                  {b.canRebook ? <RebookButton bookingId={b.id} variant="ghost" label={`Wieder bei ${b.provider.displayName} buchen`} /> : null}
                </div>
              </section>
            ) : null}

            <Card aria-labelledby="details">
              <h2 id="details" className="type-heading-m">
                Dein Termin
              </h2>
              <Link href={profileHref} className="group -m-2 flex items-center gap-4 rounded-tile p-2 transition-colors duration-fast focus-ring hover:bg-surface-sunken">
                <Avatar src={b.provider.avatarUrl} name={b.provider.displayName} size={48} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="type-heading-s text-ink">{b.provider.displayName}</span>
                  <Rating avg={b.provider.ratingAvg} count={b.provider.ratingCount} />
                </span>
                <Icon icon={ChevronRight} className="shrink-0 text-ink-muted transition-transform duration-fast group-hover:translate-x-0.5" />
              </Link>
              <dl className="grid gap-x-6 gap-y-5 border-t border-line pt-5 sm:grid-cols-2">
                <Fact icon={ClipboardList} label="Behandlung">
                  {b.serviceName}
                </Fact>
                <Fact icon={CalendarDays} label="Wann">
                  <span className="num">{`${formatDayShort(b.startsAt)} · ${formatTime(b.startsAt)}–${formatTime(b.endsAt)}`}</span>
                  <span className="flex items-center gap-1 text-ink-muted num">
                    <Icon icon={Clock} size={14} />
                    {formatDuration(b.durationMinutes)}
                  </span>
                </Fact>
                <Fact icon={MapPin} label="Wo">
                  <span className="block">{LOCATION_LABELS[b.location.kind]}</span>
                  <span className="block">{b.location.addressLine}</span>
                  <span className="block num">{`${b.location.postalCode} ${b.location.city}`}</span>
                  {b.location.details ? <span className="block text-ink-muted">{b.location.details}</span> : null}
                </Fact>
                {b.notes ? (
                  <Fact icon={StickyNote} label="Hinweise">
                    <span className="whitespace-pre-line">{b.notes}</span>
                  </Fact>
                ) : null}
              </dl>
              {b.canRebook && !alternatives ? (
                <div className="flex flex-wrap gap-2 border-t border-line pt-5">
                  <RebookButton bookingId={b.id} variant="secondary" label={`Wieder bei ${b.provider.displayName} buchen`} />
                </div>
              ) : null}
            </Card>

            {b.canReview ? (
              <Card aria-labelledby="bewerten" className="scroll-mt-24">
                <div className="flex flex-col gap-1">
                  <h2 id="bewerten" className="type-heading-m">
                    Bewerten
                  </h2>
                  <p className="type-body-s text-ink-muted">{`Deine Bewertung hilft anderen bei der Wahl – und ${b.provider.displayName}.`}</p>
                </div>
                <ReviewComposer bookingId={b.id} providerName={b.provider.displayName} tags={REVIEW_TAG_OPTIONS} />
              </Card>
            ) : b.review ? (
              <Card aria-labelledby="bewertung" className="gap-3">
                <h2 id="bewertung" className="type-heading-m">
                  Deine Bewertung
                </h2>
                <Stars value={b.review.rating} size={20} />
                {b.review.comment ? <p className="type-body text-ink">{b.review.comment}</p> : null}
              </Card>
            ) : null}

            {b.events.length ? (
              <Card aria-labelledby="verlauf">
                <h2 id="verlauf" className="type-heading-m">
                  Verlauf
                </h2>
                <ol className="flex flex-col">
                  {b.events.map((e, i) => {
                    const last = i === b.events.length - 1;
                    const line = !last || !!upcoming;
                    return (
                      <li key={`${e.createdAt}-${i}`} className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3.5 pb-5 last:pb-0">
                        <span aria-hidden className="relative flex justify-center">
                          {last && !upcoming ? (
                            <span className="mt-1 size-3 rounded-full bg-surface-raised shadow-[inset_0_0_0_2px_var(--color-ink),0_0_0_3px_var(--color-surface-raised)]" />
                          ) : (
                            <span className="mt-1 size-3 rounded-full bg-ink shadow-[0_0_0_3px_var(--color-surface-raised)]" />
                          )}
                          {line ? <span className="absolute top-5 bottom-[-0.75rem] w-px bg-line-mid" /> : null}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <p className="type-label text-ink">{EVENT_LABELS[e.toStatus]}</p>
                          <p className="type-caption text-ink-muted num">{`${formatDayShort(e.createdAt)}, ${formatTime(e.createdAt)}`}</p>
                          {e.note ? <p className="type-caption text-ink-muted">{e.note}</p> : null}
                        </div>
                      </li>
                    );
                  })}
                  {upcoming ? (
                    <li className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3.5">
                      <span aria-hidden className="flex justify-center">
                        <span className="mt-1 size-3 rounded-full border-[1.5px] border-dashed border-line-strong bg-surface-raised" />
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <p className="type-label text-ink-muted">{upcoming.label}</p>
                        <p className="type-caption text-ink-muted num">{upcoming.time}</p>
                      </div>
                    </li>
                  ) : null}
                </ol>
              </Card>
            ) : null}
          </div>

          <aside aria-label="Preis und Optionen" className="flex min-w-0 flex-col gap-5 md:gap-6 lg:col-span-5">
            <Card aria-labelledby="preis-titel">
              <h2 id="preis-titel" className="type-heading-m">
                Preis
              </h2>
              <PriceBreakdown
                lines={lines}
                totalCents={b.price.totalCents}
                notes={[
                  ...(b.status === "cancelled" && (b.cancellationFeeCents > 0 || b.refundCents > 0)
                    ? [<span key="refund" className="num">{`Stornogebühr ${formatPriceExact(b.cancellationFeeCents)} · Erstattung ${formatPriceExact(b.refundCents)}`}</span>]
                    : []),
                  <span key="vat">{b.vatNote}</span>,
                  <span key="agent">{withStop(`SOMA vermittelt; Vertragspartner für die Behandlung ist ${b.provider.displayName} (selbstständig)`)}</span>,
                ]}
              />
              <div className="flex items-center gap-3 rounded-tile bg-surface-sunken p-3">
                <span aria-hidden className="inline-flex h-8 w-12 shrink-0 items-center justify-center rounded-[6px] bg-surface-raised text-ink-muted shadow-raised">
                  <Icon icon={CreditCard} size={16} />
                </span>
                <p className="min-w-0 type-caption text-ink">
                  <span className="block font-[520]">{`Zahlung: ${paymentLabel(b.payment)}`}</span>
                  {b.payment?.cardLast4 ? <span className="block text-ink-muted num">{`${b.payment.cardBrand?.toUpperCase() ?? "Karte"} •••• ${b.payment.cardLast4}`}</span> : null}
                </p>
              </div>
            </Card>

            {b.canCancel || active ? (
              <Card aria-labelledby="storno-titel">
                <h2 id="storno-titel" className="type-heading-m">
                  Stornierung
                </h2>
                {b.status === "requested" ? (
                  <CheckLine>Bis zur Zusage jederzeit kostenlos zurückziehbar.</CheckLine>
                ) : freeNow && freeUntil ? (
                  <CheckLine>{`Kostenlos stornierbar bis ${deadlineText(freeUntil)}.`}</CheckLine>
                ) : null}
                {inGrace ? <p className="type-caption text-ink-muted">{`In den ersten ${graceMinutes}${NBSP}Minuten nach der Buchung immer kostenlos stornierbar.`}</p> : null}
                {schedule.length ? (
                  <ol className="flex flex-col gap-2.5 rounded-tile bg-surface-sunken p-3.5">
                    {schedule.map((l, i) => (
                      <li key={l} className="flex items-start gap-2.5 type-caption text-ink-muted num">
                        <span aria-hidden className={cn("mt-1 size-2 shrink-0 rounded-full", tierTone(i), i === 0 && "shadow-[0_0_0_3px_rgb(37_33_31/0.08)]")} />
                        <span className={cn(i === 0 && "text-ink")}>
                          {l}
                          {i === 0 ? <span className="ml-1.5 inline-flex h-[18px] items-center rounded-full bg-surface-raised px-1.5 text-[11px] font-[560] text-ink shadow-raised">jetzt</span> : null}
                        </span>
                      </li>
                    ))}
                  </ol>
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
                    tierFreeUntil={tierFreeUntil}
                  />
                ) : null}
              </Card>
            ) : null}

            {b.status === "confirmed" ? (
              <Notice kind="info" title="Vorbereitung">
                {prepNote(b.categorySlug, b.provider.displayName)}
              </Notice>
            ) : null}

            <div className="flex flex-col items-start gap-1 px-1">
              {b.canDispute ? <ReportProblem bookingId={b.id} /> : null}
              <p className="type-caption text-ink-muted">
                Fragen zur Buchung?{" "}
                <Link href={routes.help()} className="text-ink underline decoration-line-strong underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">
                  Hilfe & Kontakt
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
