import Link from "next/link";
import { ChevronRight, ExternalLink, LogOut, MapPinned, Settings, ShieldCheck, Star, Tag, type LucideIcon } from "lucide-react";
import { AvatarUpload, PortfolioManager } from "@/components/pro/media-upload";
import { ProHeader, ProPage, ProSection } from "@/components/pro/page";
import { ProfileForm } from "@/components/pro/profile-form";
import { CardSection, IconTile } from "@/components/pro/ui";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatPrice, plural } from "@/lib/format";
import { AiLabel } from "@/components/ui/ai-label";
import { Portrait } from "@/components/ui/avatar";
import { Rating, VerifiedBadge } from "@/components/ui/trust";

import { languageLabel } from "@/components/pro/labels";
import { routes } from "@/lib/routes";
import { signOutAction } from "@/server/actions/auth";
import { requireRole } from "@/server/auth/guards";
import { getOnboardingState, getProProfile, listMyReviews, listProServices } from "@/server/services/pro";
import { listMyPortfolio } from "@/server/services/pro-ext";
import { listCategories } from "@/server/services/catalog";

export const metadata = { title: "Profil" };

export default async function ProProfilePage() {
  const session = await requireRole("provider", "/pro/profil");
  const [profile, portfolio, services, onboarding, categories, reviews] = await Promise.all([
    getProProfile(session),
    listMyPortfolio(session),
    listProServices(session),
    getOnboardingState(session),
    listCategories(),
    listMyReviews(session, 1),
  ]);
  const active = services.filter((s) => s.isActive);
  const offeredCats = categories.filter((c) => active.some((s) => s.categoryId === c.id));
  const docsDone = onboarding.steps.find((s) => s.key === "documents")?.done ?? false;
  const publicHref = profile.status === "approved" ? routes.provider(profile.slug) : null;
  const fromCents = active.length ? Math.min(...active.map((s) => s.priceCents)) : null;

  const hub: { href: string; label: string; meta: string; icon: LucideIcon; tone?: "warning" }[] = [
    { href: routes.pro.services(), label: "Leistungen & Preise", meta: plural(active.length, "Leistung", "Leistungen"), icon: Tag },
    { href: routes.pro.area(), label: "Einsatzgebiet", meta: profile.basePostalCode ? `${profile.basePostalCode} · ${profile.serviceRadiusKm} km` : "Noch nicht festgelegt", icon: MapPinned },
    {
      href: routes.pro.verification(),
      label: "Verifizierung",
      meta: docsDone ? "Dokumente vollständig" : `${plural(onboarding.missingDocuments.length, "Dokument fehlt", "Dokumente fehlen")}`,
      icon: ShieldCheck,
      tone: docsDone ? undefined : "warning",
    },
    { href: routes.pro.reviews(), label: "Bewertungen", meta: reviews.ratingCount ? plural(reviews.ratingCount, "Bewertung", "Bewertungen") : "Antworten und Überblick", icon: Star },
    { href: routes.pro.settings(), label: "Einstellungen", meta: "Buchungsmodus, Benachrichtigungen, Einladungslink", icon: Settings },
  ];

  return (
    <ProPage>
      <ProHeader
        title="Profil"
        description="So sieht dich die Kundschaft. Ein klares Foto, eine ehrliche Beschreibung und echte Arbeiten schaffen Vertrauen."
        actions={
          publicHref ? (
            <ButtonLink href={publicHref} variant="secondary" icon={<Icon icon={ExternalLink} />}>
              Öffentliches Profil
            </ButtonLink>
          ) : null
        }
      />

      <nav aria-label="Profil-Bereiche" className="lg:hidden">
        <ul className="divide-y divide-line overflow-hidden rounded-card bg-surface-raised shadow-raised">
          {hub.map((h) => (
            <li key={h.href}>
              <Link href={h.href} className="group flex min-h-16 items-center gap-3.5 px-4 py-3 transition-colors duration-fast focus-ring hover:bg-surface-tint">
                <IconTile icon={h.icon} tone={h.tone ?? "neutral"} size={40} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="type-body-s font-[560] text-ink">{h.label}</span>
                  <span className="truncate type-caption text-ink-muted">{h.meta}</span>
                </span>
                <Icon icon={ChevronRight} size={16} className="text-ink-muted transition-transform duration-fast group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
          <li>
            <form action={signOutAction}>
              <button type="submit" className="flex min-h-14 w-full items-center gap-3.5 px-4 py-3 text-left type-body-s font-[560] text-ink-muted transition-colors focus-ring hover:bg-surface-tint hover:text-ink">
                <IconTile icon={LogOut} size={40} />
                Abmelden
              </button>
            </form>
          </li>
        </ul>
      </nav>

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
          <CardSection id="foto" title="Foto" description="Dein Porträt in Suche und Profil.">
            <AvatarUpload avatarUrl={profile.avatarUrl} name={profile.displayName} />
          </CardSection>
          <CardSection id="ueber" title="Über dich">
            <ProfileForm profile={profile} />
          </CardSection>
        </div>
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-5">
          <section className="flex flex-col gap-3 lg:sticky lg:top-6" aria-labelledby="vorschau">
            <h2 id="vorschau" className="flex items-center gap-2 type-overline text-ink-muted">
              Vorschau in der Suche
            </h2>
            <div className="rounded-card">
              <div className="flex flex-col gap-4 rounded-card bg-surface-raised p-4 shadow-float sm:p-5">
                <div className="flex gap-4">
                  <Portrait src={profile.avatarUrl} name={profile.displayName} sizes="88px" className="w-[88px] shrink-0" />
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="flex items-center gap-1.5 type-heading-m">
                      <span className="truncate">{profile.displayName}</span>
                      {profile.status === "approved" ? <VerifiedBadge /> : null}
                    </p>
                    {reviews.ratingCount ? <Rating avg={reviews.ratingAvg} count={reviews.ratingCount} /> : null}
                    <p className="type-caption text-ink-muted">
                      {[offeredCats.map((c) => c.name).join(", "), profile.yearsExperience ? `${plural(profile.yearsExperience, "Jahr", "Jahre")} Erfahrung` : null]
                        .filter(Boolean)
                        .join(" · ") || "Noch keine Leistungen"}
                    </p>
                    <AiLabel src={profile.avatarUrl} />
                  </div>
                </div>
                <p className="line-clamp-2 type-body-s text-ink">{profile.headline ?? <span className="text-ink-muted">Noch keine Kurzbeschreibung</span>}</p>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                  <p className="flex flex-wrap gap-1.5">
                    {profile.languages.map((l) => (
                      <span key={l} className="inline-flex h-6 items-center rounded-full bg-surface-sunken px-2.5 type-caption text-ink-muted">
                        {languageLabel(l)}
                      </span>
                    ))}
                  </p>
                  {fromCents != null ? (
                    <p className="type-label-s text-ink num">
                      <span className="font-normal text-ink-muted">ab </span>
                      {formatPrice(fromCents)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
            <p className="type-caption text-ink-muted">Änderungen an Foto, Name und Kurzbeschreibung erscheinen hier sofort nach dem Speichern.</p>
          </section>
        </div>
      </div>

      <ProSection id="portfolio" title="Portfolio" description={`${portfolio.length} von 24 Bildern. Zeig echte Arbeiten – keine Stockfotos.`}>
        <PortfolioManager items={portfolio} categories={offeredCats.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))} />
      </ProSection>
    </ProPage>
  );
}
