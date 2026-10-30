import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/server/auth/guards";
import { listFavorites } from "@/server/services/account";
import { Portrait } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
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
      <PageHeader title="Favoriten" description="Ihre Profis – für den nächsten Termin mit einem Tipp." className="pb-0" />
      {favorites.length ? (
        <ul className="flex flex-col border-t border-line">
          {favorites.map((f) => (
            <li key={f.providerId} className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 border-b border-line py-4">
              <Link href={routes.provider(f.slug)} tabIndex={-1} aria-hidden className="block size-[72px]">
                <Portrait src={f.avatarUrl} name={f.displayName} sizes="72px" />
              </Link>
              <div className="flex min-w-0 flex-col gap-1">
                <div className="-mt-2.5 -mr-2.5 flex items-start justify-between gap-2">
                  <h2 className="flex min-w-0 items-center gap-1.5 pt-2.5 type-heading-m">
                    <Link href={routes.provider(f.slug)} className="truncate hover:underline hover:underline-offset-4">
                      {f.displayName}
                    </Link>
                    <VerifiedBadge className="shrink-0" />
                  </h2>
                  <FavoriteButton providerId={f.providerId} providerName={f.displayName} initial canToggle />
                </div>
                <MetaLine className="-mt-1.5">
                  <Rating avg={f.ratingAvg} count={f.ratingCount} />
                  <ModeLabel mode={f.bookingMode} />
                </MetaLine>
                {f.headline ? <p className="truncate type-body-s text-ink-muted">{f.headline}</p> : null}
                <div className="flex items-center justify-between gap-4 pt-1">
                  <p className="type-caption text-ink-muted">{f.cityName ?? ""}</p>
                  <ButtonLink href={routes.provider(f.slug)} size="s" variant="secondary">
                    Termin wählen
                  </ButtonLink>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Noch keine Favoriten." action={<ButtonLink href={routes.search()}>Profis entdecken</ButtonLink>}>
          Tippen Sie auf das Herz bei einer Fachkraft, um sie hier zu speichern.
        </EmptyState>
      )}
    </div>
  );
}
