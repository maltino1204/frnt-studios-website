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
import { Portrait } from "@/components/ui/avatar";
import { Notice } from "@/components/ui/feedback";
import { Container, FactList, Overline } from "@/components/ui/layout";
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
    profile.completedCount > 0 ? { label: "Termine über SOMA", value: profile.completedCount.toLocaleString("de-DE") } : null,
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

  const content = (
    <div className="flex flex-col gap-12 lg:gap-16">
      <header className="flex flex-col gap-4">
        <Overline>{`${cat?.name ?? "Beauty & Wellness"}${profile.cityName ? ` · ${profile.cityName}` : ""}`}</Overline>
        <div className="flex items-start justify-between gap-4">
          <h1 className="type-display-m">{profile.displayName}</h1>
          <FavoriteButton providerId={profile.providerId} providerName={profile.displayName} initial={profile.isFavorite} canToggle={isCustomer} withLabel className="-mr-3 mt-0.5" />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <VerifiedSheetButton name={firstName} qualifications={profile.verifiedQualifications ?? []} />
          <a href="#bewertungen" className="inline-flex h-touch items-center hover:underline hover:underline-offset-4">
            <Rating avg={profile.ratingAvg} count={profile.ratingCount} size={16} />
          </a>
          <ModeLabel mode={profile.bookingMode} className="type-label-s" />
        </div>
        {profile.headline ? <p className="type-body-l text-ink-muted">{profile.headline}</p> : null}
        {profile.inviteValid ? (
          <Notice kind="info" title={`Persönliche Einladung von ${profile.displayName}`}>
            Sie buchen über den Link Ihrer Fachkraft. Preise und Bedingungen sind dieselben.
          </Notice>
        ) : null}
        {profile.bio ? <Bio text={profile.bio} /> : null}
        <FactList items={facts} className="border-y border-line" />
      </header>

      <section aria-labelledby="leistungen" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="leistungen" className="type-heading-m">
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

      {offering ? (
        <section id="termin" aria-labelledby="termin-titel" className="hidden scroll-mt-28 flex-col gap-4 lg:flex">
          <h2 id="termin-titel" className="type-heading-m">
            Termin wählen
          </h2>
          <InlineBooking />
        </section>
      ) : null}

      {profile.portfolio.length ? (
        <section aria-labelledby="arbeiten" className="flex flex-col gap-4">
          <h2 id="arbeiten" className="type-heading-m">
            Arbeiten
          </h2>
          <ul className="grid grid-cols-3 sm:grid-cols-4">
            {profile.portfolio.slice(0, 12).map((item, i) => (
              <li key={item.id}>
                <Photo
                  src={item.url}
                  alt={item.caption ?? `Arbeit von ${profile.displayName}, Bild ${i + 1}`}
                  tone={cat?.slug ?? "massage"}
                  ratio="1/1"
                  sizes="(min-width: 1024px) 160px, 33vw"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section id="bewertungen" aria-labelledby="bewertungen-titel" className="flex scroll-mt-28 flex-col gap-6">
        <h2 id="bewertungen-titel" className="type-heading-m">
          Bewertungen
        </h2>
        <ReviewList reviews={reviews} providerName={profile.displayName} pageHref={reviewHref} />
      </section>

      <section aria-labelledby="gebiet" className="flex flex-col gap-3">
        <h2 id="gebiet" className="type-heading-m">
          Einsatzgebiet & Anfahrt
        </h2>
        <p className="type-body text-ink">
          {`${firstName} kommt im Umkreis von ${profile.serviceRadiusKm.toLocaleString("de-DE")} km${profile.cityName ? ` in ${profile.cityName}` : ""} zu Ihnen – nach Hause, ins Hotel oder ins Büro.`}
        </p>
        <p className="type-body-s text-ink-muted">{travelExplanation(profile)}</p>
        {travel ? (
          <p className="type-body-s text-ink num">
            {travel.within
              ? `Für ${travel.postalCode}: ${formatDistance(travel.distanceKm)} · Anfahrt ${formatPrice(travel.feeCents)}`
              : `${travel.postalCode} liegt außerhalb des Einsatzgebiets.`}
          </p>
        ) : null}
        <p className="type-caption text-ink-muted">Den genauen Standort von Profis zeigen wir aus Datenschutzgründen nicht an.</p>
      </section>

      <section aria-labelledby="storno" className="flex flex-col gap-3">
        <h2 id="storno" className="type-heading-m">
          Stornierung
        </h2>
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {policySummary(profile.cancellationPolicy).map((l) => (
            <li key={l} className="py-2.5 type-body-s text-ink">
              {l}
            </li>
          ))}
        </ul>
        <p className="type-caption text-ink-muted">
          Anfragen sind bis zur Zusage kostenlos stornierbar. Die genaue Frist sehen Sie vor der Buchung.{" "}
          <Link href="/stornierung" className="text-accent underline underline-offset-[0.2em]">
            Stornobedingungen
          </Link>
        </p>
      </section>

      <p className="type-caption text-ink-muted">
        {`${BRAND_NAME} vermittelt. Vertragspartner für die Behandlung ist ${profile.displayName} als selbstständige Fachkraft.`}
      </p>
    </div>
  );

  return (
    <div className="pb-28 lg:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container width="content" className="pb-16 lg:pt-10 lg:pb-24">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="-mx-(--space-gutter) lg:col-span-5 lg:mx-0">
            <div className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
              <Portrait src={profile.avatarUrl} name={profile.displayName} ratio="4/5" sizes="(min-width: 1024px) 440px, 100vw" priority />
            </div>
          </div>
          <div className="pt-8 lg:col-span-7 lg:pt-0 lg:pl-10">
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
                {content}
              </ProfileBookingProvider>
            ) : (
              content
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
