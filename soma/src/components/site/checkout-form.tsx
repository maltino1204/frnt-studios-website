"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Checkbox, Input, RadioRow, Switch, Textarea } from "@/components/ui/field";
import { SegmentedControl } from "@/components/ui/segmented";
import { CheckLine, PriceBreakdown, StepIndicator, type PriceLine } from "@/components/ui/summary";
import { Rating } from "@/components/ui/trust";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { berlinDateKey, formatDistance, formatDuration, formatPrice, formatPriceExact, formatTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import { updateProfileAction } from "@/server/actions/account";
import { confirmDevPaymentAction, createBookingAction, loadAvailabilityAction, quoteBookingAction } from "@/server/actions/booking";
import { checkoutSignInAction, checkoutSignUpAction } from "@/server/actions/checkout-ext";
import type { AddressDTO, CreateBookingInput, LocationKind, QuoteDTO } from "@/server/dto";
import { dayLabel, deadlineText, LOCATION_LABELS, NBSP, scheduleLines, slotChipLabel } from "./checkout-format";
import { ModeLabel } from "./provider-row";

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

function Section({ id, title, description, children, aside }: { id: string; title: string; description?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titel`} className={cn("flex scroll-mt-24 flex-col gap-5", id !== "uebersicht" && "border-t border-line pt-8")}>
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id={`${id}-titel`} className="type-heading-m">
            {title}
          </h2>
          {description ? <p className="type-body-s text-ink-muted">{description}</p> : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
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
  const [contact, setContact] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", acceptTerms: false, marketing: false });
  const [login, setLogin] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, startLogin] = useTransition();
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [taken, setTaken] = useState<string[] | null>(null);

  const isMassage = props.categorySlug === "massage";
  const price = quote.price;
  const endsAt = quote.endsAt;
  const freeUntil = quote.cancellation.freeUntil;
  const freeNow = !!freeUntil && new Date(freeUntil).getTime() > Date.now();
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
    if (!quote.withinServiceArea) e.area = `Diese Adresse liegt außerhalb des Einsatzgebiets von ${provider.name}.`;
    if (!customer) {
      if (mode === "login") e.login = "Bitte melden Sie sich an oder legen Sie ein neues Konto an.";
      else {
        if (!contact.firstName.trim()) e.firstName = "Bitte geben Sie Ihren Vornamen an.";
        if (!contact.lastName.trim()) e.lastName = "Bitte geben Sie Ihren Nachnamen an.";
        if (!EMAIL.test(contact.email.trim())) e.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
        if (!PHONE.test(contact.phone.trim())) e.phone = "Bitte geben Sie eine gültige Mobilnummer an.";
        if (contact.password.length < 10) e.password = "Mindestens 10 Zeichen.";
        if (!contact.acceptTerms) e.acceptTerms = "Bitte akzeptieren Sie die AGB und die Datenschutzerklärung.";
      }
    } else if (phone.trim() && !PHONE.test(phone.trim())) e.customerPhone = "Bitte geben Sie eine gültige Mobilnummer an.";
    if (!consent) e.consent = "Bitte bestätigen Sie, dass die Behandlung vor Ablauf der Widerrufsfrist beginnen darf.";
    return e;
  }, [choice, addr, kind, quote.withinServiceArea, provider.name, customer, mode, contact, phone, consent]);

  const ORT_KEYS = ["street", "houseNumber", "city", "hotel", "company", "area"];
  const KONTAKT_KEYS = ["login", "firstName", "lastName", "email", "phone", "password", "acceptTerms", "customerPhone"];
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
    startSubmit(async () => {
      if (!customer) {
        const r = await checkoutSignUpAction({
          firstName: contact.firstName, lastName: contact.lastName, email: contact.email, phone: contact.phone,
          password: contact.password, acceptTerms: contact.acceptTerms, marketingOptIn: contact.marketing, inviteCode,
        });
        if (!r.ok) {
          setServerError(r.error);
          setFieldErrors(r.fieldErrors ?? {});
          scrollTo("kontakt");
          return;
        }
      } else if (phone.trim()) {
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
        await handleFailure(res.error, res.fieldErrors);
        return;
      }
      if (res.data.paymentProvider === "dev") {
        const paid = await confirmDevPaymentAction(res.data.bookingId);
        if (!paid.ok) toast.show(paid.error, { kind: "error" });
      }
      router.push(routes.booking(res.data.bookingId));
    });
  };

  const summaryAddress = savedChosen
    ? `${savedChosen.street} ${savedChosen.houseNumber}, ${savedChosen.postalCode} ${savedChosen.city}`
    : addr.street && addr.houseNumber
      ? `${addr.street} ${addr.houseNumber}, ${postalCode} ${addr.city}`
      : `${postalCode}${props.cityName ? ` ${props.cityName}` : ""}`;

  const lines: PriceLine[] = [
    { label: "Behandlung", detail: `${quote.serviceName} · ${formatDuration(quote.durationMinutes)}`, cents: price.servicePriceCents },
    { label: "Anfahrt", detail: quote.withinServiceArea ? formatDistance(quote.distanceKm) : undefined, cents: price.travelFeeCents },
    ...(price.serviceFeeCents > 0 ? [{ label: "Servicegebühr", cents: price.serviceFeeCents }] : []),
    ...(price.discountCents > 0 ? [{ label: "Guthaben", cents: price.discountCents, kind: "credit" as const }] : []),
  ];

  const cta = (
    <div className="flex flex-col gap-2">
      {showErrors && Object.keys(errors).length ? (
        <p role="alert" className="type-caption text-danger">
          Bitte prüfen Sie die markierten Angaben.
        </p>
      ) : null}
      <Button size="l" block onClick={submit} loading={submitting} disabled={!quote.withinServiceArea || !!taken} className="num">
        {ctaLabel}
      </Button>
      <p className="text-center type-caption text-ink-muted">
        {isRequest ? `Belastung erst nach Bestätigung durch ${provider.name}.` : "Sofort bestätigt. Sie erhalten die Bestätigung per E-Mail."}
      </p>
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-6">
      <div className="flex min-w-0 flex-col gap-8 lg:col-span-7">
        <div className="flex flex-col gap-3">
          <h1 className="type-display-s">{isRequest ? "Termin anfragen." : "Termin buchen."}</h1>
          <p className="type-body-s text-ink-muted">
            {isRequest
              ? `${provider.name} bestätigt Anfragen in der Regel innerhalb weniger Stunden. Bis dahin ist der Termin für Sie reserviert.`
              : "Prüfen Sie Ihre Angaben. Der Termin ist sofort bestätigt."}
          </p>
        </div>
        <div className="lg:sticky lg:top-0 lg:z-10 lg:-mx-1 lg:bg-surface lg:px-1 lg:py-3">
          <StepIndicator steps={[...STEPS]} current={current} onStepClick={(i) => scrollTo(STEP_IDS[i])} />
        </div>

        {taken ? (
          <section aria-live="assertive" className="flex flex-col gap-4 bg-surface-raised p-5 md:p-6">
            <span aria-hidden className="block h-0.5 w-6 bg-ink" />
            <h2 className="type-display-s">Dieser Termin wurde gerade vergeben.</h2>
            <p className="type-body-s text-ink-muted">
              {taken.length
                ? `Jemand war einen Moment schneller. Diese Zeiten sind bei ${provider.name} noch frei – Ihre Angaben bleiben erhalten:`
                : `Jemand war einen Moment schneller. In den nächsten 7${NBSP}Tagen ist bei ${provider.name} leider nichts mehr frei.`}
            </p>
            {taken.length ? (
              <ul className="flex flex-wrap gap-2">
                {taken.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => chooseNewSlot(s)}
                      className="inline-flex h-touch items-center rounded-xs border border-line bg-surface-raised px-4 type-label num text-ink transition-colors duration-fast hover:border-ink"
                    >
                      {slotChipLabel(s, true)}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <Link href={routes.search({ plz: postalCode, kategorie: props.categorySlug ?? undefined })} className="self-start type-label-s text-accent underline underline-offset-[0.2em]">
              Andere Profis in Ihrer Nähe
            </Link>
          </section>
        ) : null}

        {/* Übersicht */}
        <Section id="uebersicht" title="Übersicht">
          <div className="flex items-start gap-4">
            <Avatar src={provider.avatarUrl} name={provider.name} size={48} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="type-heading-m">{provider.name}</p>
                <Link href={props.changeHref} className="type-label-s text-accent underline underline-offset-[0.2em] hover:text-accent-hover">
                  Ändern
                </Link>
              </div>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Rating avg={provider.ratingAvg} count={provider.ratingCount} />
                <span aria-hidden className="text-ink-muted">
                  ·
                </span>
                <ModeLabel mode={quote.bookingMode} />
              </p>
            </div>
          </div>
          <dl className="flex flex-col divide-y divide-line border-t border-line">
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="type-body-s text-ink-muted">Behandlung</dt>
              <dd className="text-right type-body-s text-ink">{quote.serviceName}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="type-body-s text-ink-muted">Termin</dt>
              <dd className="text-right type-body-s text-ink num">{`${dayLabel(quote.startsAt)} · ${formatTime(quote.startsAt)}–${formatTime(endsAt)}`}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="type-body-s text-ink-muted">Dauer</dt>
              <dd className="text-right type-body-s text-ink num">{formatDuration(quote.durationMinutes)}</dd>
            </div>
          </dl>
        </Section>

        {/* Ort */}
        <Section id="ort" title="Ort" description="Wo dürfen wir Sie besuchen?">
          <SegmentedControl
            name="kind"
            label="Art des Ortes"
            options={[
              { value: "home", label: "Zuhause" },
              { value: "hotel", label: "Hotel" },
              { value: "office", label: "Büro" },
            ]}
            value={savedChosen ? (savedChosen.kind === "other" ? "home" : savedChosen.kind) : kind}
            onChange={(v) => {
              setKind(v as LocationKind);
              if (savedChosen && savedChosen.kind !== v) {
                setChoice("new");
                requote({ addressId: null, useCredits });
              }
            }}
          />

          {addresses.length ? (
            <fieldset className="flex flex-col">
              <legend className="mb-1 type-label-s text-ink">Gespeicherte Adressen</legend>
              <div className="flex flex-col border-y border-line">
                {addresses.map((a) => (
                  <RadioRow
                    key={a.id}
                    name="address"
                    value={a.id}
                    checked={choice === a.id}
                    onChange={() => {
                      setChoice(a.id);
                      setKind(a.kind === "other" ? "home" : a.kind);
                      requote({ addressId: a.id, useCredits });
                    }}
                    label={`${a.label ?? LOCATION_LABELS[a.kind]}${a.isDefault ? " · Standard" : ""}`}
                    description={`${a.street} ${a.houseNumber}, ${a.postalCode} ${a.city}${a.details ? ` · ${a.details}` : ""}`}
                  />
                ))}
                <RadioRow
                  name="address"
                  value="new"
                  checked={choice === "new"}
                  onChange={() => {
                    setChoice("new");
                    requote({ addressId: null, useCredits });
                  }}
                  label="Neue Adresse"
                  description={`In ${postalCode}${props.cityName ? ` ${props.cityName}` : ""}`}
                />
              </div>
            </fieldset>
          ) : null}

          {choice === "new" ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-3">
                <Input label="Straße" autoComplete="address-line1" value={addr.street} onChange={(e) => set("street", e.target.value)} error={err("street")} maxLength={120} />
                <Input label="Nr." autoComplete="address-line2" value={addr.houseNumber} onChange={(e) => set("houseNumber", e.target.value)} error={err("houseNumber")} maxLength={12} />
              </div>
              <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
                <Input label="PLZ" value={postalCode} readOnly aria-readonly className="[&_input]:bg-surface-sunken" hint={<Link href={props.changePlzHref} className="text-accent underline underline-offset-[0.2em]">Ändern</Link>} />
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
              {customer || mode === "signup" ? (
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
        </Section>

        {/* Kontakt */}
        <Section id="kontakt" title="Kontakt" description={customer ? undefined : "Mit Ihrem Konto sehen Sie Ihre Termine jederzeit und können sie selbst verwalten."}>
          {customer ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5 border-y border-line py-3">
                <p className="type-body-s text-ink">{`Angemeldet als ${[customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.email}`}</p>
                <p className="type-caption text-ink-muted">{`${customer.email}${customer.phone ? ` · ${customer.phone}` : ""}`}</p>
              </div>
              {!customer.phone ? (
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
          ) : mode === "signup" ? (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Vorname" autoComplete="given-name" value={contact.firstName} onChange={(e) => setContact({ ...contact, firstName: e.target.value })} error={err("firstName")} />
                <Input label="Nachname" autoComplete="family-name" value={contact.lastName} onChange={(e) => setContact({ ...contact, lastName: e.target.value })} error={err("lastName")} />
              </div>
              <Input label="E-Mail" type="email" autoComplete="email" inputMode="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} error={err("email")} />
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
              <Input
                label="Passwort"
                type="password"
                autoComplete="new-password"
                hint="Mindestens 10 Zeichen."
                value={contact.password}
                onChange={(e) => setContact({ ...contact, password: e.target.value })}
                error={err("password")}
              />
              <Checkbox
                checked={contact.acceptTerms}
                onChange={(e) => setContact({ ...contact, acceptTerms: e.target.checked })}
                error={err("acceptTerms")}
                label={
                  <>
                    Ich akzeptiere die{" "}
                    <Link href={routes.terms()} className="text-accent underline underline-offset-[0.2em]" target="_blank">
                      AGB
                    </Link>{" "}
                    und habe die{" "}
                    <Link href={routes.privacy()} className="text-accent underline underline-offset-[0.2em] hyphens-none" target="_blank">
                      Datenschutzerklärung
                    </Link>{" "}
                    gelesen.
                  </>
                }
              />
              <Checkbox
                checked={contact.marketing}
                onChange={(e) => setContact({ ...contact, marketing: e.target.checked })}
                label="Ich möchte gelegentlich Neuigkeiten und Angebote von SOMA erhalten."
                description="Optional, per Newsletter. Jederzeit abbestellbar."
              />
              <div className="flex flex-wrap items-center gap-x-2 border-t border-line pt-4">
                <span className="type-body-s text-ink-muted">Schon Kundin oder Kunde?</span>
                <Button variant="link" className="type-label-s" onClick={() => setMode("login")}>
                  Ich habe bereits ein Konto
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Input label="E-Mail" type="email" autoComplete="email" inputMode="email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
              <Input label="Passwort" type="password" autoComplete="current-password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
              {loginError ? <Notice kind="danger">{loginError}</Notice> : showErrors && errors.login ? <Notice kind="warning">{errors.login}</Notice> : null}
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="secondary" onClick={doLogin} loading={loggingIn}>
                  Anmelden und fortfahren
                </Button>
                <Link href="/passwort-vergessen" className="type-label-s text-accent underline underline-offset-[0.2em]" target="_blank">
                  Passwort vergessen?
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 border-t border-line pt-4">
                <span className="type-body-s text-ink-muted">Neu bei SOMA?</span>
                <Button variant="link" className="type-label-s" onClick={() => setMode("signup")}>
                  Konto beim Buchen anlegen
                </Button>
              </div>
            </div>
          )}
        </Section>

        {/* Zahlung */}
        <Section id="zahlung" title="Zahlung">
          {quote.paymentProvider === "dev" ? (
            <Notice kind="warning" title="Testmodus – es wird keine echte Zahlung ausgeführt">
              {isRequest
                ? `Beim Anfragen wird eine Testzahlung (Visa${NBSP}••••${NBSP}4242) nur reserviert. Belastet wird erst, wenn die Fachkraft zusagt.`
                : `Beim Buchen wird eine Testzahlung (Visa${NBSP}••••${NBSP}4242) simuliert. Es fließt kein Geld.`}
            </Notice>
          ) : (
            <Notice kind="info" title="Sichere Kartenzahlung">
              Die Zahlungsdaten geben Sie im nächsten Schritt bei unserem Zahlungsdienstleister Stripe ein.
            </Notice>
          )}
          {customer && quote.creditsAvailableCents > 0 ? (
            <div className="border-y border-line">
              <Switch
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
        </Section>

        {/* Preis & Bedingungen */}
        <section id="preis" aria-labelledby="preis-titel" className="flex scroll-mt-24 flex-col gap-5 border-t border-line pt-8">
          <h2 id="preis-titel" className="type-heading-m">
            Preis & Bedingungen
          </h2>
          <div aria-live="polite" aria-busy={quoting || undefined} className={cn("transition-opacity duration-fast", quoting && "opacity-60")}>
            <PriceBreakdown
              lines={lines}
              totalCents={price.totalCents}
              notes={[
                ...(isRequest ? [<CheckLine key="req">{`Bis zur Zusage von ${provider.name} jederzeit kostenlos stornierbar.`}</CheckLine>] : []),
                freeNow && freeUntil ? (
                  <CheckLine key="free">{`Kostenlos stornierbar bis ${deadlineText(freeUntil)}.`}</CheckLine>
                ) : (
                  <span key="nofree" className="text-ink">Für diesen kurzfristigen Termin gelten bereits Stornogebühren.</span>
                ),
                <span key="agent">{`SOMA vermittelt; Vertragspartner ist ${provider.name} (selbstständige Fachkraft).`}</span>,
              ]}
            />
          </div>
          <details className="group border-y border-line">
            <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-4 type-label-s text-ink">
              Stornobedingungen im Detail
              <Icon icon={ChevronDown} className="text-ink-muted transition-transform duration-base group-open:rotate-180" />
            </summary>
            <ul className="flex flex-col gap-1.5 pb-4">
              {scheduleLines(quote.cancellation.schedule).map((l) => (
                <li key={l} className="type-caption text-ink-muted num">
                  {l}
                </li>
              ))}
              <li className="type-caption text-ink-muted">Sagt die Fachkraft ab, erhalten Sie den vollen Betrag zurück.</li>
            </ul>
          </details>
          {/* ⚖ LEGAL REVIEW: consent wording for § 356 Abs. 4 BGB (express request to start before the withdrawal period ends). */}
          <Checkbox
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            error={err("consent")}
            label="Ich verlange ausdrücklich, dass die Fachkraft vor Ablauf der Widerrufsfrist mit der Behandlung beginnt. Mir ist bekannt, dass ich mein Widerrufsrecht bei vollständiger Erbringung der Leistung verliere."
            description={
              <>
                Pflichtangabe nach §{NBSP}356 Abs.{NBSP}4 BGB.{" "}
                <Link href="/widerruf" target="_blank" className="text-accent underline underline-offset-[0.2em]">
                  Widerrufsbelehrung
                </Link>
              </>
            }
          />
          <p className="type-caption text-ink-muted">
            Mit Klick auf „{isRequest ? "Zahlungspflichtig anfragen" : "Zahlungspflichtig buchen"}“ schließen Sie einen kostenpflichtigen Vertrag mit {provider.name} ab; es gelten die{" "}
            <Link href={routes.terms()} target="_blank" className="text-accent underline underline-offset-[0.2em]">
              AGB
            </Link>
            .
          </p>
          {serverError ? <Notice kind="danger">{serverError}</Notice> : null}
        </section>
      </div>

      {/* Desktop summary */}
      <aside aria-label="Zusammenfassung" className="hidden lg:col-span-5 lg:block">
        <div className="sticky top-8 ml-6 flex flex-col gap-5 border border-line bg-surface-raised p-6">
          <div className="flex items-center gap-3">
            <Avatar src={provider.avatarUrl} name={provider.name} size={48} />
            <div className="min-w-0">
              <p className="type-heading-s">{provider.name}</p>
              <p className="truncate type-caption text-ink-muted">{`${quote.serviceName} · ${formatDuration(quote.durationMinutes)}`}</p>
            </div>
          </div>
          <dl className="flex flex-col divide-y divide-line border-y border-line">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="type-body-s text-ink-muted">Termin</dt>
              <dd className="text-right type-body-s num">{`${dayLabel(quote.startsAt)}, ${formatTime(quote.startsAt)}–${formatTime(endsAt)}`}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="type-body-s text-ink-muted">Ort</dt>
              <dd className="min-w-0 text-right type-body-s">
                <span className="block">{LOCATION_LABELS[savedChosen?.kind ?? kind]}</span>
                <span className="block truncate text-ink-muted">{summaryAddress}</span>
              </dd>
            </div>
          </dl>
          <div aria-live="polite" className={cn("flex items-baseline justify-between gap-4 transition-opacity duration-fast", quoting && "opacity-60")}>
            <p className="type-heading-m">Gesamtpreis</p>
            <p className="type-heading-m num">{formatPriceExact(price.totalCents)}</p>
          </div>
          {isRequest ? (
            <CheckLine>Bis zur Zusage kostenlos stornierbar.</CheckLine>
          ) : freeNow && freeUntil ? (
            <CheckLine>{`Kostenlos stornierbar bis ${deadlineText(freeUntil)}.`}</CheckLine>
          ) : (
            <p className="type-caption text-ink-muted">Kurzfristiger Termin: Es gelten bereits Stornogebühren.</p>
          )}
          {cta}
        </div>
      </aside>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-(--z-sticky-cta) bg-surface-raised px-(--space-gutter) pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-bar lg:hidden">
        {cta}
      </div>
    </div>
  );
}
