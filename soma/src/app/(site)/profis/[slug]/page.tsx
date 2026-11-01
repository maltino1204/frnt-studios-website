import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getSession } from "@/server/auth/guards";
import { listAddresses } from "@/server/services/account";
import { quoteBooking } from "@/server/services/bookings";
import { getProviderAvailability, getProviderProfile, todayBerlin } from "@/server/services/providers";
import { listProviderReviews } from "@/server/services/reviews";
import type { ProviderProfileDTO, SlotsByDayDTO } from "@/server/dto";
import { BRAND_NAME, SITE_URL } from "@/lib/brand";
import { formatDateLong, formatDistance, formatPrice, formatPriceExact, plural } from "@/lib/format";
import { resolveImage } from "@/lib/images";
import { routes } from "@/lib/routes";
import { Check, CalendarCheck2, Clock3 } from "lucide-react";
import { Portrait } from "@/components/ui/avatar";
import { Notice } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { Container, Overline } from "@/components/ui/layout";
import { ToneFill } from "@/components/ui/motif";
import { Photo } from "@/components/ui/photo";
import { Rating } from "@/components/ui/trust";
import { FavoriteButton } from "@/components/site/favorite-button";
import { ModeLabel } from "@/components/site/provider-row";
import { ReviewList } from "@/components/site/review-list";
import { languageName, policySummary } from "@/components/site/checkout-format";
import { InlineBooking, OfferingList, ProfileBookingProvider, type TravelInfo } from "./_components/profile-booking";
import { Bio, VerifiedSheetButton } from "./_components/profile-bits";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || null;

const loadProfile = cache(async (slug: string, invite: string | null) => {
  const session = await getSession();
  return getProviderProfile(slug, session?.role === "customer" ? session.userId : null, invite ? { inviteCode: invite } : {});
});

function primaryCategory(p: ProviderProfileDTO) {
  return p.offerings[0] ? { slug: p.offerings[0].categorySlug, name: p.offerings[0].categoryName } : null;
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const p = await loadProfile(slug, one(sp.einladung)).catch(() => null);
  if (!p) return { title: "Profil nicht gefunden", robots: { index: false } };
  const cat = primaryCategory(p);
  const title = `${p.displayName} – ${cat?.name ?? "Beauty & Wellness"}${p.cityName ? ` in ${p.cityName}` : ""}`;
  const description =
    (p.bio ?? p.headline ?? `${p.displayName} kommt zu Ihnen nach Hause, ins Hotel oder ins Büro.`).slice(0, 155) +
    ((p.bio?.length ?? 0) > 155 ? "…" : "");
  const img = resolveImage(p.avatarUrl);
  return {
    title,
    description,
    alternates: { canonical: routes.provider(p.slug) },
    openGraph: { title: `${title} · ${BRAND_NAME}`, description, type: "profile", images: img ? [{ url: img }] : undefined },
  };
}

function travelExplanation(p: ProviderProfileDTO): string {
  const { baseCents, includedKm, perKmCents } = p.travelFee;
  if (baseCents === 0 && perKmCents === 0) return "Die Anfahrt ist im Preis enthalten.";
  const parts: string[] = [];
  if (baseCents > 0) parts.push(`Anfahrtspauschale ${formatPriceExact(baseCents)}${includedKm > 0 ? `, inklusive ${includedKm.toLocaleString("de-DE")} km` : ""}`);
  else if (includedKm > 0) parts.push(`Die ersten ${includedKm.toLocaleString("de-DE")} km sind inklusive`);
  if (perKmCents > 0) parts.push(`danach ${formatPriceExact(perKmCents)} je weiteren Kilometer`);
  return `${parts.join("; ")}. Der Endpreis inklusive Anfahrt steht vor der Buchung fest.`;
}

export default async function ProfilPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  const [{ slug }, sp, session] = await Promise.all([params, searchParams, getSession()]);
  const invite = one(sp.einladung);
  const profile = await loadProfile(slug, invite);
  if (!profile) notFound();

  const today = todayBerlin();
  const leistung = one(sp.leistung);
  const dauer = Number(one(sp.dauer)) || null;
  const datumRaw = one(sp.datum);
  const datum = datumRaw && /^\d{4}-\d{2}-\d{2}$/.test(datumRaw) && datumRaw >= today ? datumRaw : null;
  const matches = (o: ProviderProfileDTO["offerings"][number]) =>
    !!leistung && (o.serviceSlug === leistung || o.serviceId === leistung || o.providerServiceId === leistung);
  const offering =
    profile.offerings.find((o) => matches(o) && (!dauer || o.durationMinutes === dauer)) ??
    profile.offerings.find(matches) ??
    profile.offerings[0] ??
    null;

  const isCustomer = session?.role === "customer";
  let plz = one(sp.plz);
  if (plz && !/^\d{5}$/.test(plz)) plz = null;
  if (!plz && isCustomer) {
    const addresses = await listAddresses(session).catch(() => []);
    plz = addresses.find((a) => a.isDefault)?.postalCode ?? addresses[0]?.postalCode ?? null;
  }

  const [days, reviews] = await Promise.all([
    offering ? getProviderAvailability(profile.providerId, offering.providerServiceId, today, 14).catch((): SlotsByDayDTO[] => []) : Promise.resolve([] as SlotsByDayDTO[]),
    (async () => {
      const page = Math.max(1, Number(one(sp.bewertungen)) || 1);
      return page > 1 ? listProviderReviews(profile.providerId, page, 5) : profile.reviews;
    })(),
  ]);

  let travel: TravelInfo | null = null;
  if (plz && offering) {
    const anySlot = days.flatMap((d) => d.slots)[0] ?? new Date(Date.now() + 86_400_000).toISOString();
    try {
      const q = await quoteBooking({ providerServiceId: offering.providerServiceId, startsAt: anySlot, postalCode: plz }, null);
      travel = { postalCode: plz, feeCents: q.price.travelFeeCents, within: q.withinServiceArea, distanceKm: q.distanceKm };
    } catch {
      travel = null;
    }
  }

  const cat = primaryCategory(profile);
  const firstName = profile.displayName.split(" ")[0];
  const facts = [
    profile.languages.length ? { label: "Sprachen", value: profile.languages.map(languageName).join(", ") } : null,
    profile.yearsExperience ? { label: "Erfahrung", value: plural(profile.yearsExperience, "Jahr", "Jahre") } : null,
    { label: "Ausstattung", value: "Bringt alles Nötige mit" },
    profile.approvedAt ? { label: "Auf SOMA seit", value: formatDateLong(profile.approvedAt).replace(/^\d+\. /, "") } : null,
  ].filter((f): f is { label: string; value: string } => !!f);

  const reviewHref = (page: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      const val = one(v);
      if (val && k !== "bewertungen") q.set(k, val);
    }
    if (page > 1) q.set("bewertungen", String(page));
    const s = q.toString();
    return `${routes.provider(profile.slug)}${s ? `?${s}` : ""}#bewertungen`;
  };

  const minPrice = profile.offerings.length ? Math.min(...profile.offerings.map((o) => o.priceCents)) : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.displayName,
    description: profile.headline ?? undefined,
    url: `${SITE_URL}${routes.provider(profile.slug)}`,
    image: resolveImage(profile.avatarUrl) ?? undefined,
    jobTitle: cat?.name,
    knowsLanguage: profile.languages,
    areaServed: profile.cityName ? { "@type": "City", name: profile.cityName } : undefined,
    makesOffer: profile.offerings.map((o) => ({
      "@type": "Offer",
      priceCurrency: "EUR",
      price: (o.priceCents / 100).toFixed(2),
      itemOffered: { "@type": "Service", name: o.serviceName, serviceType: o.categoryName, areaServed: profile.cityName ?? undefined },
    })),
    ...(profile.reviews.ratingCount > 0 && profile.reviews.ratingAvg
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: profile.reviews.ratingAvg.toFixed(1), reviewCount: profile.reviews.ratingCount, bestRating: 5, worstRating: 1 } }
      : {}),
  };

  const metaLine = `${cat?.name ?? "Beauty & Wellness"}${profile.cityName ? ` · ${profile.cityName}` : ""}`;

  const pill = "inline-flex h-touch items-center gap-1.5 rounded-full px-3.5 type-label-s text-ink";
  const hero = (
    <header className="grid gap-6 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:items-end sm:gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
      {/* The portrait in the SOMA arch (brand § 5.3: 3:4 profile header); the person's wash while it loads. */}
      <Portrait
        src={profile.avatarUrl}
        name={profile.displayName}
        ratio="3/4"
        shape="arch"
        sizes="(min-width: 1024px) 240px, (min-width: 640px) 176px, 144px"
        priority
        className="w-36 shrink-0 sm:w-full"
      />
      <div className="flex min-w-0 flex-col gap-5 sm:pb-1">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <Overline>{metaLine}</Overline>
            <FavoriteButton
              providerId={profile.providerId}
              providerName={profile.displayName}
              initial={profile.isFavorite}
              canToggle={isCustomer}
              withLabel
              className="-mt-3 ring-1 ring-line-control ring-inset"
            />
          </div>
          <h1 className="type-display-m">{profile.displayName}</h1>
          {profile.headline ? <p className="type-lead text-ink-muted">{profile.headline}</p> : null}
        </div>
        {/* Trust row: facts as words with icons, never colour alone. */}
        <ul className="flex flex-wrap items-center gap-2" aria-label="Auf einen Blick">
          <li>
            <VerifiedSheetButton name={firstName} qualifications={profile.verifiedQualifications ?? []} />
          </li>
          <li>
            <a href="#bewertungen" className={`${pill} ring-1 ring-line-mid ring-inset pressable focus-ring hover:bg-surface-sunken`}>
              <Rating avg={profile.ratingAvg} count={profile.ratingCount} size={16} />
            </a>
          </li>
          <li className={`${pill} bg-surface-sunken`}>
            <ModeLabel mode={profile.bookingMode} className="type-label-s" />
          </li>
          {profile.completedCount > 0 ? (
            <li className={`${pill} bg-surface-sunken num`}>
              <Icon icon={CalendarCheck2} size={14} />
              {`${profile.completedCount.toLocaleString("de-DE")} Termine über ${BRAND_NAME}`}
            </li>
          ) : null}
        </ul>
      </div>
    </header>
  );

  const content = (
    <div className="flex flex-col gap-14 lg:gap-16">
      {profile.inviteValid ? (
        <Notice kind="info" title={`Persönliche Einladung von ${profile.displayName}`}>
          Sie buchen über den Link Ihrer Fachkraft. Preise und Bedingungen sind dieselben.
        </Notice>
      ) : null}

      <section aria-labelledby="ueber" className="flex flex-col gap-5">
        <h2 id="ueber" className="type-heading-l">{`Über ${firstName}`}</h2>
        {profile.bio ? <Bio text={profile.bio} /> : null}
        <dl className="grid grid-cols-2 gap-3">
          {facts.map((f) => (
            <div key={f.label} className="flex min-w-0 flex-col gap-1 rounded-tile bg-surface-raised px-4 py-3.5 shadow-raised">
              <dt className="type-caption text-ink-muted">{f.label}</dt>
              <dd className="type-label text-ink num">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="leistungen" className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h2 id="leistungen" className="type-heading-l">
            Leistungen & Preise
          </h2>
          <p className="type-body-s text-ink-muted">
            {travel?.within
              ? `Endpreise inklusive Anfahrt nach ${travel.postalCode}.`
              : minPrice != null
                ? "Preise der Behandlung. Mit Ihrer Postleitzahl sehen Sie den Endpreis inklusive Anfahrt."
                : null}
          </p>
        </div>
        {profile.offerings.length ? <OfferingList /> : <p className="type-body-s text-ink-muted">{`${firstName} bietet gerade keine buchbaren Leistungen an.`}</p>}
      </section>

      {profile.portfolio.length ? (
        <section aria-labelledby="arbeiten" className="flex flex-col gap-5">
          <h2 id="arbeiten" className="type-heading-l">
            Arbeiten
          </h2>
          <ul className="grid grid-cols-3 gap-2 sm:gap-3">
            {profile.portfolio.slice(0, 9).map((item, i) => (
              <li key={item.id} className="min-w-0">
                <Photo
                  src={item.url}
                  alt={item.caption ?? `Arbeit von ${profile.displayName}, Bild ${i + 1}`}
                  tone={cat?.slug ?? "massage"}
                  seed={`${profile.slug}:${item.id}`}
                  ratio="1/1"
                  sizes="(min-width: 1024px) 200px, 33vw"
                  className="rounded-tile shadow-raised"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section id="bewertungen" aria-labelledby="bewertungen-titel" className="flex scroll-mt-28 flex-col gap-5">
        <h2 id="bewertungen-titel" className="type-heading-l">
          Bewertungen
        </h2>
        <ReviewList reviews={reviews} providerName={profile.displayName} pageHref={reviewHref} />
      </section>

      <section aria-labelledby="gebiet" className="flex flex-col gap-5">
        <h2 id="gebiet" className="type-heading-l">
          Einsatzgebiet & Anfahrt
        </h2>
        <div className="grid overflow-hidden rounded-card bg-surface-raised shadow-raised sm:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="flex flex-col gap-3 p-5 md:p-6">
            <p className="type-body text-ink">
              {`${firstName} kommt im Umkreis von ${profile.serviceRadiusKm.toLocaleString("de-DE")} km${profile.cityName ? ` in ${profile.cityName}` : ""} zu Ihnen – nach Hause, ins Hotel oder ins Büro.`}
            </p>
            <p className="type-body-s text-ink-muted">{travelExplanation(profile)}</p>
            {travel ? (
              <p className={travel.within ? "type-label-s text-ink num" : "type-label-s text-warning"}>
                {travel.within
                  ? `Für ${travel.postalCode}: ${formatDistance(travel.distanceKm)} · Anfahrt ${formatPrice(travel.feeCents)}`
                  : `${travel.postalCode} liegt außerhalb des Einsatzgebiets.`}
              </p>
            ) : null}
            <p className="type-caption text-ink-muted">Den genauen Standort von Profis zeigen wir aus Datenschutzgründen nicht an.</p>
          </div>
          {/* Abstract radius on the category wash: never a map, never a location. */}
          <div aria-hidden className="relative isolate hidden min-h-40 items-center justify-center overflow-hidden sm:flex">
            <ToneFill tone={cat?.slug} seed={`${profile.slug}:gebiet`} arch={false} />
            <span className="absolute size-36 rounded-full border border-ink/20" />
            <span className="absolute size-20 rounded-full border border-ink/30" />
            <span className="relative inline-flex h-7 items-center rounded-full bg-surface-raised px-3 type-label-s text-ink shadow-raised num">
              {`${profile.serviceRadiusKm.toLocaleString("de-DE")} km`}
            </span>
          </div>
        </div>
      </section>

      <section aria-labelledby="storno" className="flex flex-col gap-5">
        <h2 id="storno" className="type-heading-l">
          Stornierung
        </h2>
        <ul className="flex flex-col divide-y divide-line rounded-card bg-surface-raised px-5 shadow-raised">
          {policySummary(profile.cancellationPolicy).map((l, i) => (
            <li key={l} className="flex items-start gap-3 py-3.5 type-body-s text-ink">
              <span
                aria-hidden
                className={i === 0 ? "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success-soft text-success" : "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink-muted"}
              >
                <Icon icon={i === 0 ? Check : Clock3} size={12} strokeWidth={2.25} />
              </span>
              {l}
            </li>
          ))}
        </ul>
        <p className="type-caption text-ink-muted">
          Anfragen sind bis zur Zusage kostenlos stornierbar. Die genaue Frist sehen Sie vor der Buchung.{" "}
          <Link href="/stornierung" className="text-ink underline decoration-line-strong underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">
            Stornobedingungen
          </Link>
        </p>
      </section>

      <p className="type-caption text-ink-muted">
        {`${BRAND_NAME} vermittelt. Vertragspartner für die Behandlung ist ${profile.displayName} als selbstständige Fachkraft.`}
      </p>
    </div>
  );

  const body = (
    <div className="mt-10 lg:mt-14 lg:grid lg:grid-cols-12 lg:gap-6">
      <div className="min-w-0 lg:col-span-7">{content}</div>
      {offering ? (
        <aside aria-labelledby="termin-titel" className="hidden lg:col-span-5 lg:block lg:pl-4">
          <section
            id="termin"
            className="sticky top-[calc(var(--header-height)+1.5rem)] flex max-h-[calc(100svh-var(--header-height)-3rem)] scroll-mt-28 flex-col gap-5 overflow-y-auto overscroll-contain rounded-card bg-surface-raised p-5 shadow-float xl:p-6 lg:[&_[role=radiogroup]_.grid]:grid-cols-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="termin-titel" className="type-heading-l">
                Termin wählen
              </h2>
              <ModeLabel mode={profile.bookingMode} className="type-label-s" />
            </div>
            <InlineBooking />
          </section>
        </aside>
      ) : null}
    </div>
  );

  return (
    <div className="pb-28 lg:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container width="content" className="pt-4 pb-16 md:pt-6 lg:pt-8 lg:pb-24">
        {hero}
        {offering ? (
          <ProfileBookingProvider
            providerId={profile.providerId}
            providerName={profile.displayName}
            providerSlug={profile.slug}
            offerings={profile.offerings}
            initialOfferingId={offering.providerServiceId}
            initialDays={days}
            initialDate={datum}
            policy={profile.cancellationPolicy}
            initialTravel={travel}
            inviteCode={profile.inviteValid ? (invite ?? undefined) : undefined}
          >
            {body}
          </ProfileBookingProvider>
        ) : (
          body
        )}
      </Container>
    </div>
  );
}
