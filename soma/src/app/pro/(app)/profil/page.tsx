import Link from "next/link";
import { ChevronRight, ExternalLink, LogOut, MapPinned, Settings, ShieldCheck, Star, Tag, type LucideIcon } from "lucide-react";
import { AvatarUpload, PortfolioManager } from "@/components/pro/media-upload";
import { ProHeader, ProPage, ProSection } from "@/components/pro/page";
import { ProfileForm } from "@/components/pro/profile-form";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { plural } from "@/lib/format";
import { Portrait } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/trust";
import { languageLabel } from "@/components/pro/labels";
import { routes } from "@/lib/routes";
import { signOutAction } from "@/server/actions/auth";
import { requireRole } from "@/server/auth/guards";
import { getOnboardingState, getProProfile, listProServices } from "@/server/services/pro";
import { listMyPortfolio } from "@/server/services/pro-ext";
import { listCategories } from "@/server/services/catalog";

export const metadata = { title: "Profil" };

export default async function ProProfilePage() {
  const session = await requireRole("provider", "/pro/profil");
  const [profile, portfolio, services, onboarding, categories] = await Promise.all([
    getProProfile(session),
    listMyPortfolio(session),
    listProServices(session),
    getOnboardingState(session),
    listCategories(),
  ]);
  const active = services.filter((s) => s.isActive);
  const offeredCats = categories.filter((c) => active.some((s) => s.categoryId === c.id));
  const docsDone = onboarding.steps.find((s) => s.key === "documents")?.done ?? false;
  const publicHref = profile.status === "approved" ? routes.provider(profile.slug) : null;

  const hub: { href: string; label: string; meta: string; icon: LucideIcon }[] = [
    { href: routes.pro.services(), label: "Leistungen & Preise", meta: plural(active.length, "Leistung", "Leistungen"), icon: Tag },
    { href: routes.pro.area(), label: "Einsatzgebiet", meta: profile.basePostalCode ? `${profile.basePostalCode} · ${profile.serviceRadiusKm} km` : "Noch nicht festgelegt", icon: MapPinned },
    { href: routes.pro.verification(), label: "Verifizierung", meta: docsDone ? "Dokumente vollständig" : `${plural(onboarding.missingDocuments.length, "Dokument fehlt", "Dokumente fehlen")}`, icon: ShieldCheck },
    { href: routes.pro.reviews(), label: "Bewertungen", meta: "Antworten und Überblick", icon: Star },
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
        <ul className="border-y border-line">
          {hub.map((h) => (
            <li key={h.href} className="border-b border-line last:border-b-0">
              <Link href={h.href} className="flex min-h-16 items-center gap-4 py-3 pr-1 transition-colors hover:bg-surface-sunken">
                <Icon icon={h.icon} className="shrink-0 text-ink-muted" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="type-body-s font-[520] text-ink">{h.label}</span>
                  <span className="truncate type-caption text-ink-muted">{h.meta}</span>
                </span>
                <Icon icon={ChevronRight} size={16} className="text-ink-muted" />
              </Link>
            </li>
          ))}
          <li>
            <form action={signOutAction}>
              <button type="submit" className="flex min-h-14 w-full items-center gap-4 py-3 pr-1 text-left type-body-s font-[520] text-ink-muted hover:bg-surface-sunken hover:text-ink">
                <Icon icon={LogOut} className="shrink-0" />
                Abmelden
              </button>
            </form>
          </li>
        </ul>
      </nav>

      <div className="grid gap-12 lg:grid-cols-12">
        <div className="flex flex-col gap-12 lg:col-span-7">
          <ProSection id="foto" title="Foto">
            <AvatarUpload avatarUrl={profile.avatarUrl} name={profile.displayName} />
          </ProSection>
          <ProSection id="ueber" title="Über dich">
            <ProfileForm profile={profile} />
          </ProSection>
        </div>
        <div className="flex flex-col gap-6 lg:col-span-5">
          <section className="flex flex-col gap-3 lg:sticky lg:top-6" aria-labelledby="vorschau">
            <h2 id="vorschau" className="type-overline text-ink-muted">
              Vorschau in der Suche
            </h2>
            <div className="flex gap-4 border-y border-line py-4">
              <div className="w-[72px] shrink-0">
                <Portrait src={profile.avatarUrl} name={profile.displayName} sizes="72px" />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="flex items-center gap-1.5 type-heading-m">
                  {profile.displayName}
                  {profile.status === "approved" ? <VerifiedBadge /> : null}
                </p>
                <p className="type-caption text-ink-muted">
                  {[offeredCats.map((c) => c.name).join(", "), profile.yearsExperience ? `${plural(profile.yearsExperience, "Jahr", "Jahre")} Erfahrung` : null]
                    .filter(Boolean)
                    .join(" · ") || "Noch keine Leistungen"}
                </p>
                <p className="line-clamp-2 type-body-s text-ink">{profile.headline ?? <span className="text-ink-muted">Noch keine Kurzbeschreibung</span>}</p>
                <p className="type-caption text-ink-muted">{profile.languages.map(languageLabel).join(", ")}</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ProSection id="portfolio" title="Portfolio" description={`${portfolio.length} von 24 Bildern. Zeig echte Arbeiten – keine Stockfotos.`}>
        <PortfolioManager items={portfolio} categories={offeredCats.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))} />
      </ProSection>
    </ProPage>
  );
}
