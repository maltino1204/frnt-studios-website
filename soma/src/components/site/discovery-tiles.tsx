import Link from "next/link";
import { Portrait } from "@/components/ui/avatar";
import { Photo } from "@/components/ui/photo";
import { Rating, VerifiedBadge } from "@/components/ui/trust";
import { cn } from "@/lib/cn";
import { images } from "@/lib/images";
import { routes } from "@/lib/routes";
import type { CategoryDTO } from "@/server/dto";
import type { DiscoveryProviderDTO } from "@/server/services/site-ext";
import { fromPrice } from "./discovery-copy";

/** Category tile: 4:5 image with the tone fallback, label below (never a bordered card). */
export function CategoryTile({
  category,
  href,
  meta,
  sizes = "(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 44vw",
  priority,
}: {
  category: Pick<CategoryDTO, "slug" | "name" | "tagline" | "imagePath">;
  href?: string;
  meta?: string | null;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <Link href={href ?? routes.category(category.slug)} className="group flex flex-col gap-3 rounded-xs focus-visible:outline-offset-4">
      <Photo
        src={category.imagePath ?? images.category(category.slug)}
        alt=""
        tone={category.slug}
        word={category.name}
        wordSize="s"
        sizes={sizes}
        priority={priority}
        className="aspect-[4/5] w-full"
      />
      <span className="flex flex-col gap-1">
        <span className="type-heading-m text-ink underline-offset-4 decoration-1 group-hover:underline">{category.name}</span>
        {(meta ?? category.tagline) ? <span className="type-body-s text-ink-muted">{meta ?? category.tagline}</span> : null}
      </span>
    </Link>
  );
}

/** Editorial portrait card for provider rails: 4:5 portrait, name, category · city, rating. */
export function ProviderPortraitCard({
  provider,
  categorySlug,
  showFromPrice,
  sizes = "(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 44vw",
}: {
  provider: DiscoveryProviderDTO;
  /** highlight this category in the meta line */
  categorySlug?: string;
  /** "ab"-prices are only allowed on category and SEO pages (PAngV) */
  showFromPrice?: boolean;
  sizes?: string;
}) {
  const cat = provider.categories.find((c) => c.slug === categorySlug) ?? provider.categories[0];
  const meta = [cat?.name, provider.cityName].filter(Boolean).join(" · ");
  const price = showFromPrice ? fromPrice(provider.fromPriceCents) : null;
  return (
    <Link href={routes.provider(provider.slug)} className="group flex flex-col gap-3 rounded-xs focus-visible:outline-offset-4">
      <Portrait src={provider.avatarUrl} name={provider.displayName} ratio="4/5" sizes={sizes} />
      <span className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5">
          <span className="truncate type-heading-m text-ink underline-offset-4 decoration-1 group-hover:underline">{provider.displayName}</span>
          <VerifiedBadge />
        </span>
        {meta ? <span className="truncate type-body-s text-ink-muted">{meta}</span> : null}
        <span className="flex items-center justify-between gap-3">
          <Rating avg={provider.ratingAvg} count={provider.ratingCount} />
          {price ? <span className="type-label-s text-ink num">{price}</span> : null}
        </span>
      </span>
    </Link>
  );
}

/** Provider list row for SEO pages (not the /suche row: no slots, no prices incl. travel). */
export function ProviderListRow({ provider, categorySlug, className }: { provider: DiscoveryProviderDTO; categorySlug?: string; className?: string }) {
  const ordered = [...provider.categories].sort((a, b) => Number(b.slug === categorySlug) - Number(a.slug === categorySlug));
  const cats = ordered.map((c) => c.name).join(", ");
  const price = fromPrice(provider.fromPriceCents);
  return (
    <li className={cn("border-b border-line", className)}>
      <Link href={routes.provider(provider.slug)} className="group flex items-start gap-4 py-4 md:gap-5">
        <Portrait src={provider.avatarUrl} name={provider.displayName} sizes="72px" className="w-[4.5rem] shrink-0" />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate type-heading-m text-ink underline-offset-4 decoration-1 group-hover:underline">{provider.displayName}</span>
            <VerifiedBadge />
          </span>
          <Rating avg={provider.ratingAvg} count={provider.ratingCount} />
          {provider.headline ? <span className="line-clamp-2 type-body-s text-ink-muted">{provider.headline}</span> : null}
          <span className="type-caption text-ink-muted">
            {cats}
            {provider.bookingMode === "instant" ? " · Sofort bestätigt" : " · Auf Anfrage"}
          </span>
        </span>
        {price ? (
          <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
            <span className="type-label font-semibold text-ink num">{price}</span>
            <span className="type-caption text-ink-muted">zzgl. Anfahrt</span>
          </span>
        ) : null}
      </Link>
    </li>
  );
}
