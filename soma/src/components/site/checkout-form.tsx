"use client";

import Link from "next/link";
import { BedDouble, Building2, CalendarDays, ChevronDown, CircleAlert, Clock, House, KeyRound, MapPin, Plus, UserRound, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Checkbox, Input, Switch, Textarea } from "@/components/ui/field";
import { Overline } from "@/components/ui/layout";
import { SegmentedControl } from "@/components/ui/segmented";
import { CheckLine, PriceBreakdown, type PriceLine } from "@/components/ui/summary";
import { Rating } from "@/components/ui/trust";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { berlinDateKey, formatDistance, formatDuration, formatPrice, formatPriceExact, formatTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import { updateProfileAction } from "@/server/actions/account";
import { confirmDevPaymentAction, createBookingAction, loadAvailabilityAction, quoteBookingAction } from "@/server/actions/booking";
import { checkoutSignInAction, checkoutSignUpAction } from "@/server/actions/checkout-ext";
import type { AddressDTO, CreateBookingInput, LocationKind, QuoteDTO } from "@/server/dto";
import { dayLabel, deadlineShort, deadlineText, freeUntilFor, graceSentence, LOCATION_LABELS, NBSP, scheduleLines, slotChipLabel, slotTileClasses, withStop } from "./checkout-format";
import { CheckoutStepper, MorphText, OptionCard, PaymentTile, StepCard } from "./checkout-parts";
import { MetaLine, ModeLabel } from "./provider-row";
import { StripePaymentSheet } from "./checkout-stripe";

export type CheckoutCustomer = { firstName: string | null; lastName: string | null; email: string; phone: string | null };

export type CheckoutFormProps = {
  quote: QuoteDTO;
  categorySlug: string | null;
  provider: { name: string; slug: string; avatarUrl: string | null; ratingAvg: number | null; ratingCount: number };
  /** PLZ of the search; a new address is locked to it */
  postalCode: string;
  cityName: string | null;
  customer: CheckoutCustomer | null;
  addresses: AddressDTO[];
  initialAddressId: string | null;
  inviteCode?: string;
  rebookedFromId?: string;
  /** profile link (with service + PLZ) to change time or service */
  changeHref: string;
  /** search link to change the PLZ */
  changePlzHref: string;
};

type AddrFields = {
  street: string;
  houseNumber: string;
  city: string;
  floor: string;
  bell: string;
  hotel: string;
  room: string;
  reception: string;
  company: string;
  desk: string;
  hints: string;
  table: boolean;
  save: boolean;
};

const STEPS = ["Übersicht", "Ort", "Kontakt", "Zahlung"] as const;
const STEP_IDS = ["uebersicht", "ort", "kontakt", "zahlung"] as const;
const KIND_ICON = { home: House, hotel: BedDouble, office: Building2, other: MapPin } as const;
/** Morphing caption while the booking runs: each phase names the step that is actually happening. */
type Phase = "konto" | "reservieren" | "zahlung" | "weiter";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9 ()/-]{6,24}$/;

function composeDetails(kind: LocationKind, a: AddrFields): string | undefined {
  const parts: string[] = [];
  if (kind === "home") {
    if (a.floor.trim()) parts.push(`Etage: ${a.floor.trim()}`);
    if (a.bell.trim()) parts.push(`Klingel: ${a.bell.trim()}`);
  } else if (kind === "hotel") {
    parts.push(`Hotel: ${a.hotel.trim()}`);
    if (a.room.trim()) parts.push(`Zimmer: ${a.room.trim()}`);
    if (a.reception.trim()) parts.push(`Name an der Rezeption: ${a.reception.trim()}`);
  } else if (kind === "office") {
    parts.push(`Firma: ${a.company.trim()}`);
    if (a.desk.trim()) parts.push(`Empfang/Etage: ${a.desk.trim()}`);
  }
  const s = parts.join(" · ").slice(0, 300);
  return s || undefined;
}

/**
 * Request mode (N6): the concrete answer deadline when the server previews it
 * (`respondByPreview`, same rule as the booking: business hours 08–21), otherwise the window.
 */
function requestIntro(providerName: string, quote: QuoteDTO): string {
  const preview = quote.respondByPreview ?? null;
  const when = preview
    ? `bis ${deadlineShort(preview)}`
    : `innerhalb von ${quote.requestResponseHours}${NBSP}${quote.requestResponseHours === 1 ? "Stunde" : "Stunden"} (zwischen 8 und 21${NBSP}Uhr)`;
  return `${providerName} antwortet ${when} – belastet wird erst nach der Zusage. Bis dahin ist der Termin für Sie reserviert.`;
}

/** Confirmation URL; `?konto=neu` tells a fresh guest that the "Passwort festlegen" e-mail is on its way. */
function bookingUrl(bookingId: string, guest: { claimEmailSent: boolean } | null): string {
  return guest?.claimEmailSent ? `${routes.booking(bookingId)}?konto=neu` : routes.booking(bookingId);
}

export function CheckoutForm(props: CheckoutFormProps) {
  const { provider, customer, addresses, postalCode, inviteCode } = props;
  const router = useRouter();
  const toast = useToast();
  const [quote, setQuote] = useState(props.quote);
  const [useCredits, setUseCredits] = useState(false);
  const [quoting, startQuote] = useTransition();
  const [submitting, startSubmit] = useTransition();

  // Server re-render (e.g. after logging in): take the fresh quote.
  useEffect(() => {
    setQuote(props.quote);
    setUseCredits(false);
  }, [props.quote]);

  const initialSaved = addresses.find((a) => a.id === props.initialAddressId) ?? null;
  const [choice, setChoice] = useState<string>(initialSaved?.id ?? "new");
  const [kind, setKind] = useState<LocationKind>(initialSaved?.kind === "other" ? "home" : (initialSaved?.kind ?? "home"));
  const [addr, setAddr] = useState<AddrFields>({
    street: "", houseNumber: "", city: props.cityName ?? "", floor: "", bell: "", hotel: "", room: "", reception: "", company: "", desk: "", hints: "", table: false, save: true,
  });
  const set = <K extends keyof AddrFields>(k: K, v: AddrFields[K]) => setAddr((a) => ({ ...a, [k]: v }));

  // After an inline login the saved addresses arrive: preselect the matching one if nothing was typed.
  const hadAddresses = useRef(addresses.length > 0);
  useEffect(() => {
    if (hadAddresses.current || addresses.length === 0) return;
    hadAddresses.current = true;
    const match = addresses.find((a) => a.id === props.initialAddressId);
    if (match && choice === "new" && !addr.street && !addr.houseNumber) {
      setChoice(match.id);
      setKind(match.kind === "other" ? "home" : match.kind);
    }
  }, [addresses, props.initialAddressId, choice, addr.street, addr.houseNumber]);

  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [contact, setContact] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [login, setLogin] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState<string | null>(null);
  /** an account that already exists for the guest's e-mail (R16: offer the inline login) */
  const [existingEmail, setExistingEmail] = useState<string | null>(null);
  /** guest account created in this checkout (kept if the booking itself has to be retried) */
  const [guest, setGuest] = useState<{ email: string; claimEmailSent: boolean } | null>(null);
  const [loggingIn, startLogin] = useTransition();
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [taken, setTaken] = useState<string[] | null>(null);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [stripeStep, setStripeStep] = useState<{ bookingId: string; clientSecret: string | null; guest: { claimEmailSent: boolean } | null } | null>(null);

  const isMassage = props.categorySlug === "massage";
  const price = quote.price;
  const endsAt = quote.endsAt;
  // Tier deadline (24 h before) and the Bedenkzeit after booking are shown separately:
  // the quote's freeUntil already includes the Bedenkzeit for short-notice slots.
  const freeUntil = freeUntilFor(quote.cancellation.policy, quote.startsAt);
  const freeNow = !!freeUntil && new Date(freeUntil).getTime() > Date.now();
  const grace = quote.bookingMode === "instant" ? graceSentence(quote.cancellation.policy) : null;
  const isRequest = quote.bookingMode === "request";
  const savedChosen = choice !== "new" ? addresses.find((a) => a.id === choice) ?? null : null;

  const requote = (next: { addressId: string | null; useCredits: boolean; startsAt?: string }) => {
    setServerError(null);
    startQuote(async () => {
      const res = await quoteBookingAction({
        providerServiceId: quote.providerServiceId,
        startsAt: next.startsAt ?? quote.startsAt,
        ...(next.addressId ? { addressId: next.addressId } : { postalCode }),
        useCredits: next.useCredits,
        inviteCode,
      });
      if (res.ok) setQuote(res.data);
      else setServerError(res.error);
    });
  };

  // --- validation -----------------------------------------------------------
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (choice === "new") {
      if (addr.street.trim().length < 2) e.street = "Bitte geben Sie die Straße an.";
      if (!addr.houseNumber.trim()) e.houseNumber = "Bitte geben Sie die Hausnummer an.";
      if (addr.city.trim().length < 2) e.city = "Bitte geben Sie den Ort an.";
      if (kind === "hotel" && !addr.hotel.trim()) e.hotel = "Bitte geben Sie den Namen des Hotels an.";
      if (kind === "office" && !addr.company.trim()) e.company = "Bitte geben Sie die Firma an.";
    }
    if (!quote.withinServiceArea) e.area = withStop(`Diese Adresse liegt außerhalb des Einsatzgebiets von ${provider.name}`);
    if (!customer && !guest) {
      if (mode === "login") e.login = "Bitte melden Sie sich an oder legen Sie ein neues Konto an.";
      else {
        if (!contact.firstName.trim()) e.firstName = "Bitte geben Sie Ihren Vornamen an.";
        if (!contact.lastName.trim()) e.lastName = "Bitte geben Sie Ihren Nachnamen an.";
        if (!EMAIL.test(contact.email.trim())) e.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
        if (!PHONE.test(contact.phone.trim())) e.phone = "Bitte geben Sie eine gültige Mobilnummer an.";
      }
    } else if (phone.trim() && !PHONE.test(phone.trim())) e.customerPhone = "Bitte geben Sie eine gültige Mobilnummer an.";
    if (!consent) e.consent = "Bitte bestätigen Sie, dass die Behandlung vor Ablauf der Widerrufsfrist beginnen darf.";
    return e;
  }, [choice, addr, kind, quote.withinServiceArea, provider.name, customer, guest, mode, contact, phone, consent]);

  const ORT_KEYS = ["street", "houseNumber", "city", "hotel", "company", "area"];
  const KONTAKT_KEYS = ["login", "firstName", "lastName", "email", "phone", "customerPhone"];
  const valid = [true, !ORT_KEYS.some((k) => errors[k]), !KONTAKT_KEYS.some((k) => errors[k]), !errors.consent];
  const current = valid.indexOf(false) === -1 ? STEPS.length - 1 : valid.indexOf(false);
  const err = (k: string) => (showErrors ? (errors[k] ?? fieldErrors[k] ?? null) : (fieldErrors[k] ?? null));
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const totalLabel = formatPrice(price.totalCents);
  const ctaLabel = `${isRequest ? "Zahlungspflichtig anfragen" : "Zahlungspflichtig buchen"} · ${totalLabel}`;

  const doLogin = () => {
    setLoginError(null);
    if (!EMAIL.test(login.email.trim()) || !login.password) {
      setLoginError("Bitte geben Sie E-Mail-Adresse und Passwort ein.");
      return;
    }
    startLogin(async () => {
      const res = await checkoutSignInAction(login);
      if (!res.ok) {
        setLoginError(res.error);
        return;
      }
      toast.show(`Willkommen zurück${res.data.firstName ? `, ${res.data.firstName}` : ""}. Ihre Auswahl ist erhalten geblieben.`);
      router.refresh();
    });
  };

  const handleFailure = async (error: string, fe?: Record<string, string>) => {
    const check = await quoteBookingAction({
      providerServiceId: quote.providerServiceId,
      startsAt: quote.startsAt,
      ...(choice !== "new" ? { addressId: choice } : { postalCode }),
      useCredits,
      inviteCode,
    });
    if (check.ok && !check.data.slotAvailable) {
      const avail = await loadAvailabilityAction({ providerId: quote.providerId, providerServiceId: quote.providerServiceId, from: berlinDateKey(), days: 7 });
      const next = avail.ok ? avail.data.flatMap((d) => d.slots).filter((s) => s !== quote.startsAt).slice(0, 6) : [];
      setTaken(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setServerError(error);
    setFieldErrors(fe ?? {});
  };

  const chooseNewSlot = (start: string) => {
    setTaken(null);
    const url = new URL(window.location.href);
    url.searchParams.set("start", start);
    window.history.replaceState(null, "", url.toString());
    requote({ addressId: choice !== "new" ? choice : null, useCredits, startsAt: start });
  };

  const submit = () => {
    setServerError(null);
    setFieldErrors({});
    if (Object.keys(errors).length) {
      setShowErrors(true);
      const firstInvalid = valid.findIndex((v) => !v);
      scrollTo(STEP_IDS[firstInvalid === -1 ? 3 : firstInvalid]);
      return;
    }
    setPhase(!customer && !guest ? "konto" : "reservieren");
    startSubmit(async () => {
      let createdGuest = guest;
      if (!customer && !guest) {
        const r = await checkoutSignUpAction({
          firstName: contact.firstName, lastName: contact.lastName, email: contact.email, phone: contact.phone, inviteCode,
        });
        if (!r.ok) {
          setPhase(null);
          setServerError(r.error);
          setFieldErrors(r.fieldErrors ?? {});
          scrollTo("kontakt");
          return;
        }
        if (r.data.kind === "exists") {
          setPhase(null);
          // Known e-mail: switch to the inline login, keep everything typed so far.
          setExistingEmail(r.data.email);
          setLogin({ email: r.data.email, password: "" });
          setLoginError(null);
          setMode("login");
          scrollTo("kontakt");
          return;
        }
        createdGuest = { email: r.data.email, claimEmailSent: r.data.claimEmailSent };
        setGuest(createdGuest);
        setPhase("reservieren");
      } else if (customer && phone.trim()) {
        const fd = new FormData();
        fd.set("firstName", customer.firstName ?? "");
        fd.set("lastName", customer.lastName ?? "");
        fd.set("phone", phone.trim());
        await updateProfileAction(null, fd);
      }
      const notes = [
        addr.hints.trim() ? `Hinweise zur Anfahrt: ${addr.hints.trim()}` : "",
        isMassage && addr.table ? "Platz für eine Massageliege (ca. 2 × 3 m) ist vorhanden." : "",
      ]
        .filter(Boolean)
        .join("\n");
      const address: CreateBookingInput["address"] =
        choice !== "new"
          ? { addressId: choice }
          : {
              kind, street: addr.street.trim(), houseNumber: addr.houseNumber.trim(), postalCode, city: addr.city.trim(),
              details: composeDetails(kind, addr), label: LOCATION_LABELS[kind], save: addr.save,
            };
      const res = await createBookingAction({
        providerServiceId: quote.providerServiceId,
        startsAt: quote.startsAt,
        address,
        notes: notes || undefined,
        useCredits,
        inviteCode,
        rebookedFromId: props.rebookedFromId,
      });
      if (!res.ok) {
        setPhase(null);
        await handleFailure(res.error, res.fieldErrors);
        return;
      }
      if (res.data.paymentProvider === "stripe") {
        setPhase(null);
        // Production: collect the card in Stripe's Payment Element; the webhook confirms the booking.
        setStripeStep({ bookingId: res.data.bookingId, clientSecret: res.data.paymentClientSecret, guest: createdGuest });
        return;
      }
      setPhase("zahlung");
      const paid = await confirmDevPaymentAction(res.data.bookingId);
      if (!paid.ok) toast.show(paid.error, { kind: "error" });
      else setPhase("weiter");
      router.push(bookingUrl(res.data.bookingId, createdGuest));
    });
  };


  const shownKind: LocationKind = savedChosen ? (savedChosen.kind === "other" ? "home" : savedChosen.kind) : kind;
  const summaryAddress = savedChosen
    ? `${savedChosen.street} ${savedChosen.houseNumber}, ${savedChosen.postalCode} ${savedChosen.city}`
    : addr.street && addr.houseNumber
      ? `${addr.street} ${addr.houseNumber}, ${postalCode} ${addr.city}`
      : `${postalCode}${props.cityName ? ` ${props.cityName}` : ""}`;

  const lines: PriceLine[] = [
    { label: <span className="hyphens-none">Behandlung</span>, detail: `${quote.serviceName} · ${formatDuration(quote.durationMinutes)}`, cents: price.servicePriceCents },
    { label: <span className="hyphens-none">Anfahrt</span>, detail: quote.withinServiceArea ? formatDistance(quote.distanceKm) : undefined, cents: price.travelFeeCents },
    ...(price.serviceFeeCents > 0 ? [{ label: <span className="hyphens-none">Servicegebühr</span>, cents: price.serviceFeeCents }] : []),
    ...(price.discountCents > 0 ? [{ label: <span className="hyphens-none">Guthaben</span>, cents: price.discountCents, kind: "credit" as const }] : []),
  ];

  const idleCaption = isRequest ? withStop(`Belastung erst nach Bestätigung durch ${provider.name}`) : "Sofort bestätigt. Sie erhalten die Bestätigung per E-Mail.";
  const phaseCaption: Record<Phase, string> = {
    konto: "Ihr Kundenkonto wird angelegt …",
    reservieren: isRequest ? "Ihre Anfrage wird gesendet …" : "Ihr Termin wird reserviert …",
    zahlung: quote.paymentProvider === "dev" ? "Testzahlung wird autorisiert …" : "Zahlung wird vorbereitet …",
    weiter: isRequest ? "Anfrage gesendet. Einen Moment …" : "Bestätigt. Einen Moment …",
  };

  const cta = (
    <div className="flex flex-col gap-2.5">
      {showErrors && Object.keys(errors).length ? (
        <p role="alert" className="flex animate-fade-in items-center justify-center gap-1.5 type-caption text-danger">
          <Icon icon={CircleAlert} size={14} className="shrink-0" />
          Bitte prüfen Sie die markierten Angaben.
        </p>
      ) : null}
      <Button variant="accent" size="l" block onClick={submit} loading={submitting} disabled={!quote.withinServiceArea || !!taken} className="num">
        {ctaLabel}
      </Button>
      <p className="text-center type-caption text-ink-muted">
        <MorphText text={submitting && phase ? phaseCaption[phase] : idleCaption} />
      </p>
    </div>
  );

  const cancellationLines = (
    <div className="flex flex-col gap-2">
      {isRequest ? <CheckLine>{`Bis zur Zusage von ${provider.name} jederzeit kostenlos stornierbar.`}</CheckLine> : null}
      {freeNow && freeUntil ? <CheckLine>{`Kostenlos stornierbar bis ${deadlineText(freeUntil)}.`}</CheckLine> : null}
      {grace ? <CheckLine>{grace}</CheckLine> : null}
      {!freeNow ? (
        <p className="type-caption text-ink">
          {grace ? "Danach gelten für diesen kurzfristigen Termin bereits Stornogebühren." : "Für diesen kurzfristigen Termin gelten bereits Stornogebühren."}
        </p>
      ) : null}
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-8">
      <div className="flex min-w-0 flex-col gap-4 md:gap-5 lg:col-span-7">
        <div className="flex flex-col gap-3 pb-2">
          <Overline>{isRequest ? "Ihre Anfrage" : "Ihre Buchung"}</Overline>
          <h1 className="type-display-s">{isRequest ? "Termin anfragen." : "Termin buchen."}</h1>
          <p className="max-w-reading type-body-s text-ink-muted">
            {isRequest ? requestIntro(provider.name, quote) : "Prüfen Sie Ihre Angaben. Der Termin ist sofort bestätigt."}
          </p>
        </div>
        <CheckoutStepper steps={STEPS} current={current} onStepClick={(i) => scrollTo(STEP_IDS[i])} className="lg:sticky lg:top-[calc(var(--header-height)+0.75rem)] lg:z-10" />

        {taken ? (
          <section aria-live="assertive" className="relative isolate flex flex-col gap-4 overflow-clip rounded-card bg-surface-raised p-5 shadow-float ring-1 ring-warning/20 ring-inset md:p-7">
            <h2 className="type-display-s">Dieser Termin wurde gerade vergeben.</h2>
            <p className="type-body-s text-ink-muted">
              {taken.length
                ? `Jemand war einen Moment schneller. Diese Zeiten sind bei ${provider.name} noch frei – Ihre Angaben bleiben erhalten:`
                : `Jemand war einen Moment schneller. In den nächsten 7${NBSP}Tagen ist bei ${provider.name} leider nichts mehr frei.`}
            </p>
            {taken.length ? (
              <ul className="flex flex-wrap gap-2 stagger-rise">
                {taken.map((s) => (
                  <li key={s}>
                    <button type="button" onClick={() => chooseNewSlot(s)} className={slotTileClasses}>
                      {slotChipLabel(s, true)}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <Link href={routes.search({ plz: postalCode, kategorie: props.categorySlug ?? undefined })} className="self-start rounded-control type-label-s text-ink underline decoration-line-strong underline-offset-[0.2em] hover:text-link-hover hover:decoration-current focus-ring">
              Andere Profis in Ihrer Nähe
            </Link>
          </section>
        ) : null}

        {/* 1 · Übersicht */}
        <StepCard
          id="uebersicht"
          index={0}
          done={valid[0]}
          title="Übersicht"
          aside={
            <ButtonLink href={props.changeHref} variant="secondary" size="s" className="shrink-0">
              Ändern
            </ButtonLink>
          }
        >
          <div className="flex items-center gap-4">
            <Avatar src={provider.avatarUrl} name={provider.name} size={48} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="type-heading-s">{provider.name}</p>
              <MetaLine>
                <Rating avg={provider.ratingAvg} count={provider.ratingCount} />
                <ModeLabel mode={quote.bookingMode} />
              </MetaLine>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-tile bg-surface-sunken p-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] sm:gap-x-6">
            <div className="col-span-2 flex min-w-0 flex-col gap-1 sm:col-span-1">
              <dt className="type-caption text-ink-muted hyphens-none">Behandlung</dt>
              <dd className="type-label text-ink">{quote.serviceName}</dd>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <dt className="flex items-center gap-1.5 type-caption text-ink-muted hyphens-none">
                <Icon icon={CalendarDays} size={14} />
                Termin
              </dt>
              <dd className="type-label text-ink num">
                {dayLabel(quote.startsAt)}
                <span className="block text-ink-muted">{`${formatTime(quote.startsAt)}–${formatTime(endsAt)}`}</span>
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="flex items-center gap-1.5 type-caption text-ink-muted hyphens-none">
                <Icon icon={Clock} size={14} />
                Dauer
              </dt>
              <dd className="type-label text-ink num">{formatDuration(quote.durationMinutes)}</dd>
            </div>
          </dl>
        </StepCard>

        {/* 2 · Ort */}
        <StepCard id="ort" index={1} done={valid[1]} title="Ort" description="Wo dürfen wir Sie besuchen?">
          <SegmentedControl
            name="kind"
            label="Art des Ortes"
            options={(["home", "hotel", "office"] as const).map((k) => ({
              value: k,
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Icon icon={KIND_ICON[k]} size={16} className="hidden min-[360px]:block" />
                  {LOCATION_LABELS[k]}
                </span>
              ),
            }))}
            value={shownKind}
            onChange={(v) => {
              setKind(v as LocationKind);
              if (savedChosen && savedChosen.kind !== v) {
                setChoice("new");
                requote({ addressId: null, useCredits });
              }
            }}
          />

          {addresses.length ? (
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2.5 type-label-s text-ink">Gespeicherte Adressen</legend>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {addresses.map((a) => {
                  const name = a.label ?? LOCATION_LABELS[a.kind];
                  return (
                    <OptionCard
                      key={a.id}
                      name="address"
                      value={a.id}
                      checked={choice === a.id}
                      onChange={() => {
                        setChoice(a.id);
                        setKind(a.kind === "other" ? "home" : a.kind);
                        requote({ addressId: a.id, useCredits });
                      }}
                      icon={KIND_ICON[a.kind]}
                      title={name}
                      badge={a.isDefault ? <Badge size="s" tone="accent">Standard</Badge> : null}
                      accessibleName={`${name}${a.isDefault ? " · Standard" : ""}`}
                      description={
                        <>
                          <span className="block num">{`${a.street} ${a.houseNumber}, ${a.postalCode} ${a.city}`}</span>
                          {a.details ? <span className="line-clamp-1">{a.details}</span> : null}
                        </>
                      }
                    />
                  );
                })}
                <OptionCard
                  name="address"
                  value="new"
                  checked={choice === "new"}
                  onChange={() => {
                    setChoice("new");
                    requote({ addressId: null, useCredits });
                  }}
                  icon={Plus}
                  dashed
                  title="Neue Adresse"
                  accessibleName="Neue Adresse"
                  description={`In ${postalCode}${props.cityName ? ` ${props.cityName}` : ""}`}
                />
              </div>
            </fieldset>
          ) : null}

          {choice === "new" ? (
            <div className="flex animate-fade-in flex-col gap-4">
              <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-3">
                <Input label="Straße" autoComplete="address-line1" value={addr.street} onChange={(e) => set("street", e.target.value)} error={err("street")} maxLength={120} />
                <Input label="Nr." autoComplete="address-line2" value={addr.houseNumber} onChange={(e) => set("houseNumber", e.target.value)} error={err("houseNumber")} maxLength={12} />
              </div>
              <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
                <Input label="PLZ" value={postalCode} readOnly aria-readonly className="[&_input]:bg-surface-sunken" hint={<Link href={props.changePlzHref} className="-my-1 inline-block py-1 text-ink underline decoration-line-strong underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">Ändern</Link>} />
                <Input label="Ort" autoComplete="address-level2" value={addr.city} onChange={(e) => set("city", e.target.value)} error={err("city")} maxLength={80} />
              </div>
              {kind === "home" ? (
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Etage" optional placeholder="z. B. 3. OG" value={addr.floor} onChange={(e) => set("floor", e.target.value)} maxLength={30} />
                  <Input label="Klingelname" optional value={addr.bell} onChange={(e) => set("bell", e.target.value)} maxLength={60} />
                </div>
              ) : kind === "hotel" ? (
                <div className="flex flex-col gap-4">
                  <Input label="Hotelname" value={addr.hotel} onChange={(e) => set("hotel", e.target.value)} error={err("hotel")} maxLength={80} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Zimmernr." optional hint="Falls schon bekannt" value={addr.room} onChange={(e) => set("room", e.target.value)} maxLength={20} />
                    <Input label="Name an der Rezeption" optional value={addr.reception} onChange={(e) => set("reception", e.target.value)} maxLength={60} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Input label="Firma" autoComplete="organization" value={addr.company} onChange={(e) => set("company", e.target.value)} error={err("company")} maxLength={80} />
                  <Input label="Empfang oder Etage" optional value={addr.desk} onChange={(e) => set("desk", e.target.value)} maxLength={60} />
                </div>
              )}
              {customer || guest || mode === "signup" ? (
                <Checkbox label="Adresse für künftige Buchungen speichern" checked={addr.save} onChange={(e) => set("save", e.target.checked)} />
              ) : null}
            </div>
          ) : null}

          <Textarea
            label="Hinweise zur Anfahrt"
            optional
            rows={2}
            placeholder="z. B. Parken im Hof, Aufzug vorhanden, eine Katze im Haushalt"
            value={addr.hints}
            onChange={(e) => set("hints", e.target.value)}
            maxLength={400}
          />
          {isMassage ? (
            <Checkbox
              label="Es ist Platz für eine Massageliege (ca. 2 × 3 m)."
              description="Die Fachkraft bringt Liege, Tücher und Öle mit."
              checked={addr.table}
              onChange={(e) => set("table", e.target.checked)}
            />
          ) : null}

          {!quote.withinServiceArea ? (
            <Notice kind="danger" title="Außerhalb des Einsatzgebiets">
              {`${provider.name} fährt leider nicht bis ${savedChosen?.postalCode ?? postalCode}. `}
              <Link href={routes.search({ plz: savedChosen?.postalCode ?? postalCode, kategorie: props.categorySlug ?? undefined })}>Profis in der Nähe dieser Adresse finden</Link>
            </Notice>
          ) : null}
        </StepCard>

        {/* 3 · Kontakt */}
        <StepCard
          id="kontakt"
          index={2}
          done={valid[2]}
          title="Kontakt"
          description={customer || guest ? undefined : mode === "signup" ? "Für Ihre Bestätigung und Rückfragen am Termintag. Ein Passwort brauchen Sie dafür nicht." : undefined}
        >
          {customer || guest ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3.5 rounded-tile bg-surface-sunken p-3.5">
                <Avatar name={customer ? [customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.email : [contact.firstName, contact.lastName].filter(Boolean).join(" ")} size={40} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="type-label text-ink">
                    {customer
                      ? `Angemeldet als ${[customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.email}`
                      : `Konto angelegt für ${[contact.firstName, contact.lastName].filter(Boolean).join(" ")}`}
                  </p>
                  <p className="truncate type-caption text-ink-muted">
                    {customer ? `${customer.email}${customer.phone ? ` · ${customer.phone}` : ""}` : `${guest!.email}${contact.phone ? ` · ${contact.phone}` : ""}`}
                  </p>
                </div>
                <span className="hidden sm:block">
                  <Badge tone="success" size="s" dot>
                    {customer ? "Angemeldet" : "Angelegt"}
                  </Badge>
                </span>
              </div>
              {customer && !customer.phone ? (
                <Input
                  label="Mobilnummer"
                  optional
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+49 151 23456789"
                  hint="Für kurzfristige Rückfragen der Fachkraft am Termintag."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={err("customerPhone")}
                />
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <SegmentedControl
                name="kontakt-modus"
                label="Wie möchten Sie fortfahren?"
                value={mode}
                onChange={(v) => {
                  if (v === "signup") setExistingEmail(null);
                  setMode(v as "signup" | "login");
                }}
                options={[
                  { value: "signup", label: "Neu bei SOMA" },
                  { value: "login", label: "Ich habe ein Konto" },
                ]}
              />
              {mode === "signup" ? (
                <div key="signup" className="flex animate-fade-in flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Vorname" autoComplete="given-name" value={contact.firstName} onChange={(e) => setContact({ ...contact, firstName: e.target.value })} error={err("firstName")} />
                    <Input label="Nachname" autoComplete="family-name" value={contact.lastName} onChange={(e) => setContact({ ...contact, lastName: e.target.value })} error={err("lastName")} />
                  </div>
                  <Input
                    label="E-Mail"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    hint="Hierhin schicken wir die Bestätigung und den Link, mit dem Sie später ein Passwort festlegen."
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    error={err("email")}
                  />
                  <Input
                    label="Mobilnummer"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="+49 151 23456789"
                    hint="Nur für Rückfragen zu Ihrem Termin. Wir geben sie erst nach der Bestätigung an die Fachkraft weiter."
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    error={err("phone")}
                  />
                  <div className="flex gap-3 rounded-tile bg-surface-sunken p-3.5">
                    <Icon icon={UserRound} size={18} className="mt-px shrink-0 text-ink-muted" />
                    <p className="type-caption text-ink-muted">
                      Mit der Buchung legen wir ein Kundenkonto für Sie an. Es gelten die{" "}
                      <Link href={routes.terms()} className="text-ink underline decoration-line-strong underline-offset-[0.2em] hover:text-link-hover hover:decoration-current" target="_blank">
                        AGB
                      </Link>
                      ; wie wir Ihre Daten verarbeiten, steht in der{" "}
                      <Link href={routes.privacy()} className="text-ink underline decoration-line-strong underline-offset-[0.2em] hover:text-link-hover hover:decoration-current hyphens-none" target="_blank">
                        Datenschutzerklärung
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              ) : (
                <div key="login" className="flex animate-fade-in flex-col gap-4">
                  {existingEmail ? (
                    <Notice kind="info" title="Sie haben schon ein Konto.">
                      {`Mit ${existingEmail} gibt es bereits ein Kundenkonto. Bitte melden Sie sich an – Ihre Auswahl bleibt erhalten.`}
                    </Notice>
                  ) : null}
                  <Input label="E-Mail" type="email" autoComplete="email" inputMode="email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
                  <Input label="Passwort" type="password" autoComplete="current-password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
                  {loginError ? <Notice kind="danger">{loginError}</Notice> : showErrors && errors.login ? <Notice kind="warning">{errors.login}</Notice> : null}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <Button variant="secondary" onClick={doLogin} loading={loggingIn} icon={<Icon icon={KeyRound} />}>
                      Anmelden und fortfahren
                    </Button>
                    <Link href="/passwort-vergessen" className="rounded-control type-label-s text-ink underline decoration-line-strong underline-offset-[0.2em] hover:text-link-hover hover:decoration-current focus-ring" target="_blank">
                      Passwort vergessen?
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </StepCard>

        {/* 4 · Zahlung */}
        <StepCard id="zahlung" index={3} done={valid[3]} title="Zahlung">
          {quote.paymentProvider === "dev" ? (
            <PaymentTile
              title={`Visa${NBSP}••••${NBSP}4242`}
              meta="Testkarte · simulierte Zahlung"
              badge={
                <Badge tone="warning" size="s" dot>
                  Test
                </Badge>
              }
              noticeTitle="Testmodus – es wird keine echte Zahlung ausgeführt"
              notice={
                isRequest
                  ? `Beim Anfragen wird eine Testzahlung (Visa${NBSP}••••${NBSP}4242) nur reserviert. Belastet wird erst, wenn die Fachkraft zusagt.`
                  : `Beim Buchen wird eine Testzahlung (Visa${NBSP}••••${NBSP}4242) simuliert. Es fließt kein Geld.`
              }
            />
          ) : (
            <PaymentTile stripe title="Kartenzahlung" meta="Die Zahlungsdaten geben Sie im nächsten Schritt bei unserem Zahlungsdienstleister Stripe ein." />
          )}
          {customer && quote.creditsAvailableCents > 0 ? (
            <div className="flex items-center gap-3 rounded-tile bg-surface-sunken pr-4 pl-3.5">
              <span aria-hidden className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-ink shadow-raised">
                <Icon icon={Wallet} size={16} />
              </span>
              <Switch
                className="flex-1"
                label="SOMA-Guthaben verwenden"
                description={`${formatPriceExact(quote.creditsAvailableCents)} verfügbar`}
                checked={useCredits}
                disabled={quoting}
                onChange={(e) => {
                  setUseCredits(e.target.checked);
                  requote({ addressId: choice !== "new" ? choice : null, useCredits: e.target.checked });
                }}
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-2 border-t border-line pt-3">
            {/* ⚖ LEGAL REVIEW: consent wording for § 356 Abs. 4 BGB (express request to start before the withdrawal period ends). */}
            <Checkbox
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              error={err("consent")}
              label="Ich verlange ausdrücklich, dass die Fachkraft vor Ablauf der Widerrufsfrist mit der Behandlung beginnt. Mir ist bekannt, dass ich mein Widerrufsrecht bei vollständiger Erbringung der Leistung verliere."
              description={
                <>
                  Pflichtangabe nach §{NBSP}356 Abs.{NBSP}4 BGB.{" "}
                  <Link href="/widerruf" target="_blank" className="text-ink underline decoration-line-strong underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">
                    Widerrufsbelehrung
                  </Link>
                </>
              }
            />
            <p className="type-caption text-ink-muted">
              Mit Klick auf „{isRequest ? "Zahlungspflichtig anfragen" : "Zahlungspflichtig buchen"}“ schließen Sie einen kostenpflichtigen Vertrag mit {provider.name} ab; es gelten die{" "}
              <Link href={routes.terms()} target="_blank" className="text-ink underline decoration-line-strong underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">
                AGB
              </Link>
              .
            </p>
          </div>
          {serverError ? <Notice kind="danger">{serverError}</Notice> : null}
        </StepCard>
      </div>

      {/* Summary: in the flow on phones, a sticky premium card on desktop. */}
      <aside aria-label="Zusammenfassung" className="mt-4 min-w-0 md:mt-5 lg:col-span-5 lg:mt-0">
        <div className="lg:sticky lg:top-[calc(var(--header-height)+0.75rem)]">
          <section id="preis" aria-labelledby="preis-titel" className="relative isolate flex scroll-mt-24 flex-col gap-5 overflow-clip rounded-card bg-surface-raised p-5 shadow-float md:p-7">
            <div className="flex items-center gap-3.5">
              <Avatar src={provider.avatarUrl} name={provider.name} size={48} />
              <div className="min-w-0">
                <p className="type-heading-s">{provider.name}</p>
                <p className="truncate type-caption text-ink-muted">{`${quote.serviceName} · ${formatDuration(quote.durationMinutes)}`}</p>
              </div>
            </div>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-3 type-body-s text-ink">
                <Icon icon={CalendarDays} size={18} className="mt-px shrink-0 text-ink-muted" />
                <span className="num">{`${dayLabel(quote.startsAt)}, ${formatTime(quote.startsAt)}–${formatTime(endsAt)}`}</span>
              </li>
              <li className="flex items-start gap-3 type-body-s text-ink">
                <Icon icon={KIND_ICON[savedChosen?.kind ?? kind]} size={18} className="mt-px shrink-0 text-ink-muted" />
                <span className="min-w-0">
                  {LOCATION_LABELS[savedChosen?.kind ?? kind]}
                  <span className="block truncate type-caption text-ink-muted">{summaryAddress}</span>
                </span>
              </li>
            </ul>
            <div className="flex flex-col gap-3 border-t border-dashed border-line-mid pt-5">
              <h2 id="preis-titel" className="type-label-s text-ink-muted">
                Preis & Bedingungen
              </h2>
              <div aria-live="polite" aria-busy={quoting || undefined} className={cn("transition-[opacity,filter] duration-base ease-standard", quoting && "opacity-50 blur-[1px]")}>
                <PriceBreakdown
                  lines={lines}
                  totalCents={price.totalCents}
                  notes={[<span key="vat">{quote.vatNote}</span>, <span key="agent">{`SOMA vermittelt; Vertragspartner ist ${provider.name} (selbstständige Fachkraft).`}</span>]}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1 rounded-tile bg-surface-sunken px-3.5 pt-3.5">
              {cancellationLines}
              <details className="group">
                <summary className="-mx-1 flex min-h-touch cursor-pointer list-none items-center justify-between gap-4 rounded-control px-1 type-label-s text-ink focus-ring">
                  Stornobedingungen im Detail
                  <Icon icon={ChevronDown} size={18} className="text-ink-muted transition-transform duration-base ease-spring group-open:rotate-180" />
                </summary>
                <ul className="flex animate-fade-in flex-col gap-1.5 pb-3.5">
                  {scheduleLines(quote.cancellation.schedule).map((l) => (
                    <li key={l} className="type-caption text-ink-muted num">
                      {l}
                    </li>
                  ))}
                  <li className="type-caption text-ink-muted">Sagt die Fachkraft ab, erhalten Sie den vollen Betrag zurück.</li>
                </ul>
              </details>
            </div>
            <div className="hidden lg:block">{cta}</div>
          </section>
        </div>
      </aside>

      {/* Mobile sticky CTA: glass Paper bar above the safe area (one of the two CTA copies is ever visible). */}
      <div className="fixed inset-x-0 bottom-0 z-(--z-sticky-cta) glass-strong px-(--space-gutter) pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-bar lg:hidden">
        {cta}
      </div>

      {stripeStep ? (
        <StripePaymentSheet
          clientSecret={stripeStep.clientSecret}
          bookingUrl={bookingUrl(stripeStep.bookingId, stripeStep.guest)}
          ctaLabel={ctaLabel}
          onClose={() => router.push(bookingUrl(stripeStep.bookingId, stripeStep.guest))}
        />
      ) : null}
    </div>
  );
}
