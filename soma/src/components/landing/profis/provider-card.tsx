import Link from "next/link";
import { AiLabel } from "@/components/ui/ai-label";
import { Portrait } from "@/components/ui/avatar";
import { surfaceClasses } from "@/components/ui/surface";
import { Rating, VerifiedBadge } from "@/components/ui/trust";
import { routes } from "@/lib/routes";
import type { DiscoveryProviderDTO } from "@/server/services/site-ext";

/**
 * 06 provider card (spec § 4.6), one link to `/profis/{slug}`: the O-oval portrait, the name as identity (serif) with
 * the verified badge (only approved Profis are listed; approval means the documents were checked), up to two
 * categories · city, „Sofort bestätigt“ when true, the rating only from three reviews (no „Neu auf SOMA“ here), and
 * the AI disclosure under the meta for AI portraits („Demo-Profil · Foto KI-generiert“). Never an „ab“ price (PAngV).
 */
export function ProviderCard({ provider }: { provider: DiscoveryProviderDTO }) {
  const meta = [provider.categories.slice(0, 2).map((c) => c.name).join(", "), provider.cityName].filter(Boolean).join(" · ");
  return (
    <Link href={routes.provider(provider.slug)} prefetch={false} className={surfaceClasses({ interactive: true, className: "group flex h-full flex-col gap-4 p-3 pb-5" })}>
      <span data-reveal="arch" className="block">
        <Portrait src={provider.avatarUrl} name={provider.displayName} shape="oval" sizes="(min-width: 1024px) 22vw, 64vw" className="w-full" />
      </span>
      <span className="flex flex-col gap-1.5 px-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <h3 className="truncate type-title-serif text-ink">{provider.displayName}</h3>
          <VerifiedBadge className="shrink-0" />
        </span>
        {meta ? <span className="truncate type-body-s text-ink-muted">{meta}</span> : null}
        {provider.bookingMode === "instant" || provider.ratingCount >= 3 ? (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {provider.ratingCount >= 3 ? <Rating avg={provider.ratingAvg} count={provider.ratingCount} /> : null}
            {provider.bookingMode === "instant" ? (
              <span className="inline-flex items-center gap-1.5 type-caption font-semibold text-success">
                <span aria-hidden className="size-1.5 rounded-full bg-success" />
                Sofort bestätigt
              </span>
            ) : null}
          </span>
        ) : null}
        <AiLabel src={provider.avatarUrl} className="mt-1" />
      </span>
    </Link>
  );
}
