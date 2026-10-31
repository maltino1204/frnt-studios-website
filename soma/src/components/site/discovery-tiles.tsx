import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Portrait } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { Photo } from "@/components/ui/photo";
import { surfaceClasses } from "@/components/ui/surface";
import { Rating, VerifiedBadge } from "@/components/ui/trust";
import { cn } from "@/lib/cn";
import { images } from "@/lib/images";
import { routes } from "@/lib/routes";
import type { CategoryDTO } from "@/server/dto";
import type { DiscoveryProviderDTO } from "@/server/services/site-ext";
import { fromPrice } from "./discovery-copy";

/**
 * Category card (v2): the photo sits over the category's generative aura art
 * (it stays when the photo cannot load), inset 6 px in a level-1 card that
 * lifts on hover and springs on press.
 */
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
    <Link href={href ?? routes.category(category.slug)} className={surfaceClasses({ interactive: true, className: "group flex h-full flex-col gap-3 p-1.5 pb-4" })}>
      <Photo
        src={category.imagePath ?? images.category(category.slug)}
        alt=""
        tone={category.slug}
        word={category.name}
        wordSize="s"
        sizes={sizes}
        priority={priority}
        className="aspect-[4/5] w-full rounded-tile"
      />
      <span className="flex flex-col gap-1 px-2.5">
        <span className="flex items-center justify-between gap-2">
          <span className="type-heading-m text-ink">{category.name}</span>
          <Icon
            icon={ArrowUpRight}
            size={18}
            className="shrink-0 text-ink-muted transition-[translate,color] duration-base ease-settle group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
          />
        </span>
        {(meta ?? category.tagline) ? <span className="line-clamp-2 type-body-s text-ink-muted">{meta ?? category.tagline}</span> : null}
      </span>
    </Link>
  );
}

/** Provider card for rails: 4:5 portrait (photo or aura monogram) inset in a lifting card, name, category · city, rating. */
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
    <Link href={routes.provider(provider.slug)} className={surfaceClasses({ interactive: true, className: "group flex h-full flex-col gap-3 p-1.5 pb-4" })}>
      <span className="relative block">
        <Portrait src={provider.avatarUrl} name={provider.displayName} ratio="4/5" sizes={sizes} className="w-full rounded-tile" />
        {provider.bookingMode === "instant" ? (
          <span className="absolute top-2.5 left-2.5 z-[4] inline-flex h-6 items-center gap-1.5 rounded-full glass-strong glass-edge px-2.5 text-[11.5px] leading-none font-[560] text-ink shadow-raised">
            <span aria-hidden className="size-1.5 rounded-full bg-success" />
            Sofort bestätigt
          </span>
        ) : null}
      </span>
      <span className="flex flex-col gap-1.5 px-2.5">
        <span className="flex items-center gap-1.5">
          <span className="truncate type-heading-m text-ink">{provider.displayName}</span>
          <VerifiedBadge className="shrink-0" />
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
    <li className={cn("min-w-0", className)}>
      <Link href={routes.provider(provider.slug)} className={surfaceClasses({ interactive: true, className: "group flex items-start gap-4 p-3 pr-4 md:gap-5" })}>
        <Portrait src={provider.avatarUrl} name={provider.displayName} sizes="72px" className="w-[4.5rem] shrink-0" />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate type-heading-m text-ink">{provider.displayName}</span>
            <VerifiedBadge className="shrink-0" />
          </span>
          <Rating avg={provider.ratingAvg} count={provider.ratingCount} />
          {provider.headline ? <span className="line-clamp-2 type-body-s text-ink-muted">{provider.headline}</span> : null}
          <span className="type-caption text-ink-muted">
            {cats}
            {provider.bookingMode === "instant" ? " · Sofort bestätigt" : " · Auf Anfrage"}
          </span>
        </span>
        {price ? (
          <span className="flex shrink-0 flex-col items-end gap-0.5 pt-0.5 text-right">
            <span className="type-label font-semibold text-ink num">{price}</span>
            <span className="type-caption text-ink-muted">zzgl. Anfahrt</span>
          </span>
        ) : null}
      </Link>
    </li>
  );
}
