import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/server/auth/guards";
import { isServiceError } from "@/server/errors";
import { getProfile, listAddresses } from "@/server/services/account";
import { listCustomerBookings, quoteBooking } from "@/server/services/bookings";
import { lookupPostalCode } from "@/server/services/catalog";
import { getProviderAvailability, getProviderProfile, todayBerlin } from "@/server/services/providers";
import type { AddressDTO, QuoteDTO } from "@/server/dto";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Container } from "@/components/ui/layout";
import { CheckoutForm, type CheckoutCustomer } from "@/components/site/checkout-form";
import { CheckoutPlzForm } from "@/components/site/checkout-plz-form";
import { slotChipLabel } from "@/components/site/checkout-format";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Termin buchen", robots: { index: false, follow: false } };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || null;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function checkoutHref(p: { angebot: string; start: string; plz?: string | null; adresse?: string | null; einladung?: string | null; von?: string | null }) {
  const base = routes.checkout({ angebot: p.angebot, start: p.start, plz: p.plz ?? undefined, adresse: p.adresse ?? undefined });
  const extra = new URLSearchParams();
  if (p.einladung) extra.set("einladung", p.einladung);
  if (p.von) extra.set("von", p.von);
  const e = extra.toString();
  return e ? `${base}&${e}` : base;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main id="inhalt" className="flex-1">
      <Container width="content" className="pt-8 pb-16 lg:pt-12 lg:pb-24">
        {children}
      </Container>
    </main>
  );
}

export default async function BuchenPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const angebot = one(sp.angebot);
  const start = one(sp.start);
  const einladung = one(sp.einladung);
  const von = one(sp.von);
  const adresseParam = one(sp.adresse);
  let plz = one(sp.plz);
  if (plz && !/^\d{5}$/.test(plz)) plz = null;

  if (!angebot || !UUID.test(angebot) || !start || Number.isNaN(Date.parse(start))) {
    return (
      <Shell>
        <EmptyState title="Kein Termin ausgewählt." action={<ButtonLink href={routes.search()}>Termin finden</ButtonLink>}>
          Wählen Sie zuerst eine Fachkraft und eine freie Uhrzeit.
        </EmptyState>
      </Shell>
    );
  }
  const startsAt = new Date(start).toISOString();

  const session = await getSession();
  if (session && session.role !== "customer") {
    return (
      <Shell>
        <EmptyState title="Mit diesem Konto ist keine Buchung möglich." action={<ButtonLink href={routes.home()}>Zur Startseite</ButtonLink>}>
          Sie sind mit einem Profi- oder Admin-Konto angemeldet. Buchungen sind nur mit einem Kundenkonto möglich.
        </EmptyState>
      </Shell>
    );
  }

  const [addresses, profile] = session
    ? await Promise.all([listAddresses(session), getProfile(session)])
    : [[] as AddressDTO[], null];

  // Which address does the quote use? Explicit ?adresse= → saved address matching the PLZ → PLZ.
  let initialAddressId: string | null = null;
  if (adresseParam && addresses.some((a) => a.id === adresseParam)) initialAddressId = adresseParam;
  else if (plz) initialAddressId = (addresses.find((a) => a.isDefault && a.postalCode === plz) ?? addresses.find((a) => a.postalCode === plz))?.id ?? null;
  else if (addresses.length) initialAddressId = (addresses.find((a) => a.isDefault) ?? addresses[0]).id;
  const chosen = addresses.find((a) => a.id === initialAddressId) ?? null;
  if (!plz && chosen) plz = chosen.postalCode;

  if (!plz) {
    return (
      <Shell>
        <div className="flex max-w-form flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 className="type-display-s">Wo findet die Behandlung statt?</h1>
            <p className="type-body-s text-ink-muted">Mit Ihrer Postleitzahl berechnen wir den Endpreis inklusive Anfahrt und prüfen das Einsatzgebiet.</p>
          </div>
          <CheckoutPlzForm angebot={angebot} start={startsAt} einladung={einladung} von={von} />
        </div>
      </Shell>
    );
  }

  let quote: QuoteDTO;
  try {
    quote = await quoteBooking({ providerServiceId: angebot, startsAt, ...(initialAddressId ? { addressId: initialAddressId } : { postalCode: plz }), inviteCode: einladung ?? undefined }, session);
  } catch (e) {
    if (isServiceError(e) && e.code === "validation") {
      return (
        <Shell>
          <div className="flex max-w-form flex-col gap-6">
            <h1 className="type-display-s">Bitte prüfen Sie die Postleitzahl.</h1>
            <CheckoutPlzForm angebot={angebot} start={startsAt} einladung={einladung} von={von} error={e.fieldErrors?.postalCode ?? e.message} initial={plz} />
          </div>
        </Shell>
      );
    }
    if (isServiceError(e)) {
      return (
        <Shell>
          <EmptyState title="Dieses Angebot ist nicht mehr verfügbar." action={<ButtonLink href={routes.search({ plz })}>Andere Profis finden</ButtonLink>}>
            {e.message}
          </EmptyState>
        </Shell>
      );
    }
    throw e;
  }

  const [provider, place] = await Promise.all([getProviderProfile(quote.providerSlug), lookupPostalCode(plz)]);
  const offering = provider?.offerings.find((o) => o.providerServiceId === quote.providerServiceId) ?? null;
  const changeHref = routes.provider(quote.providerSlug, { leistung: offering?.serviceSlug, dauer: offering?.durationMinutes, plz });

  // The customer already holds this exact slot (e.g. back button after booking): point to the booking.
  if (!quote.slotAvailable && session) {
    const mine = await listCustomerBookings(session, "upcoming", 1, 50).catch(() => null);
    const own = mine?.items.find((b) => b.providerSlug === quote.providerSlug && b.startsAt === quote.startsAt);
    if (own) {
      return (
        <Shell>
          <EmptyState title="Diesen Termin haben Sie bereits." action={<ButtonLink href={routes.booking(own.id)}>Zur Buchung</ButtonLink>}>
            {`${own.serviceName} bei ${own.providerName} – ${own.statusLabel.toLowerCase()}.`}
          </EmptyState>
        </Shell>
      );
    }
  }

  // The slot is gone (or in the past): calm message + the provider's next real slots.
  if (!quote.slotAvailable) {
    const days = await getProviderAvailability(quote.providerId, quote.providerServiceId, todayBerlin(), 7).catch(() => []);
    const next = days.flatMap((d) => d.slots).slice(0, 6);
    return (
      <Shell>
        <div className="flex max-w-reading flex-col items-start gap-5">
          <span aria-hidden className="block h-0.5 w-6 bg-ink" />
          <h1 className="type-display-s">Dieser Termin ist nicht mehr frei.</h1>
          <p className="type-body-s text-ink-muted">
            {next.length
              ? `Jemand war schneller – oder der Zeitpunkt ist nicht mehr buchbar. Diese Zeiten sind bei ${quote.providerName} für ${quote.serviceName} noch frei:`
              : `Bei ${quote.providerName} ist in den nächsten 7 Tagen leider nichts mehr frei.`}
          </p>
          {next.length ? (
            <ul className="flex flex-wrap gap-2">
              {next.map((s) => (
                <li key={s}>
                  <Link
                    href={checkoutHref({ angebot, start: s, plz, adresse: initialAddressId, einladung, von })}
                    className="inline-flex h-touch items-center rounded-xs border border-line bg-surface-raised px-4 type-label num text-ink transition-colors duration-fast hover:border-ink"
                  >
                    {slotChipLabel(s, true)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-wrap gap-3 pt-2">
            <ButtonLink href={changeHref} variant="secondary">
              Alle Zeiten ansehen
            </ButtonLink>
            <ButtonLink href={routes.search({ plz, kategorie: offering?.categorySlug })} variant="ghost">
              Andere Profis
            </ButtonLink>
          </div>
        </div>
      </Shell>
    );
  }

  const customer: CheckoutCustomer | null = profile
    ? { firstName: profile.firstName, lastName: profile.lastName, email: profile.email, phone: profile.phone }
    : null;

  return (
    <main id="inhalt" className="flex-1 pb-44 lg:pb-0">
      <Container width="content" className="pt-6 pb-16 lg:pt-12 lg:pb-24">
        <CheckoutForm
          quote={quote}
          categorySlug={offering?.categorySlug ?? null}
          provider={{
            name: quote.providerName,
            slug: quote.providerSlug,
            avatarUrl: provider?.avatarUrl ?? null,
            ratingAvg: provider?.ratingAvg ?? null,
            ratingCount: provider?.ratingCount ?? 0,
          }}
          postalCode={plz}
          cityName={place?.cityName ?? null}
          customer={customer}
          addresses={addresses}
          initialAddressId={initialAddressId}
          inviteCode={einladung ?? undefined}
          rebookedFromId={von && UUID.test(von) ? von : undefined}
          changeHref={changeHref}
          changePlzHref={routes.search({ plz, kategorie: offering?.categorySlug, leistung: offering?.serviceSlug })}
        />
      </Container>
    </main>
  );
}
