import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { listFavorites } from "@/server/services/account";
import { AiLabel } from "@/components/ui/ai-label";
import { Portrait } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/layout";
import { Rating, VerifiedBadge } from "@/components/ui/trust";
import { FavoriteButton } from "@/components/site/favorite-button";
import { MetaLine, ModeLabel } from "@/components/site/provider-row";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Favoriten" };

export default async function FavoritenPage() {
  const session = await requireRole("customer", "/konto/favoriten");
  const favorites = await listFavorites(session);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Favoriten" description="Deine Profis, gespeichert für das nächste Mal." className="pb-0" />
      {favorites.length ? (
        <ul className="grid gap-3 md:grid-cols-2 md:gap-4">
          {favorites.map((f) => (
            <li key={f.providerId} className="flex min-w-0 flex-col gap-4 rounded-card bg-surface-raised p-4 shadow-raised transition-[box-shadow,translate] duration-base ease-settle has-[a:hover]:-translate-y-px has-[a:hover]:shadow-float md:p-5">
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4">
                <Link href={routes.provider(f.slug)} tabIndex={-1} aria-hidden className="block w-[5.5rem]">
                  <Portrait src={f.avatarUrl} name={f.displayName} sizes="88px" className="rounded-tile shadow-raised" />
                </Link>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="-mt-2 -mr-2 flex items-start justify-between gap-1">
                    <h2 className="flex min-w-0 items-center gap-1.5 pt-2 type-heading-s">
                      <Link href={routes.provider(f.slug)} className="-my-1 truncate rounded-control py-1 focus-ring hover:underline hover:underline-offset-4">
                        {f.displayName}
                      </Link>
                      <VerifiedBadge className="shrink-0" />
                    </h2>
                    <FavoriteButton providerId={f.providerId} providerName={f.displayName} initial canToggle />
                  </div>
                  <MetaLine className="-mt-1">
                    <Rating avg={f.ratingAvg} count={f.ratingCount} />
                    <ModeLabel mode={f.bookingMode} />
                  </MetaLine>
                  <AiLabel src={f.avatarUrl} />
                  {f.headline ? <p className="line-clamp-2 type-body-s text-ink-muted">{f.headline}</p> : null}
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between gap-4 border-t border-line pt-3">
                <p className="inline-flex min-w-0 items-center gap-1.5 truncate type-caption text-ink-muted">
                  {f.cityName ? (
                    <>
                      <Icon icon={MapPin} size={14} className="shrink-0" />
                      {f.cityName}
                    </>
                  ) : null}
                </p>
                <ButtonLink href={routes.provider(f.slug)} size="s" variant="secondary" iconRight={<Icon icon={ArrowRight} />}>
                  Termin wählen
                </ButtonLink>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-card bg-surface-raised px-5 shadow-raised md:px-7">
          <EmptyState title="Noch keine Favoriten." seed="konto-favoriten" action={<ButtonLink href={routes.explore()}>Profis entdecken</ButtonLink>} className="py-8">
            Tipp bei einem Profil auf das Herz – dann findest du es hier wieder.
          </EmptyState>
        </div>
      )}
    </div>
  );
}
