import Link from "next/link";
import { ArrowUpRight, CalendarCheck, Clock } from "lucide-react";
import { CategoryIcon } from "@/components/brand/brand-icon";
import { AiLabel } from "@/components/ui/ai-label";
import { Avatar, Portrait } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Photo } from "@/components/ui/photo";
import { surfaceClasses } from "@/components/ui/surface";
import { Rating, VerifiedBadge } from "@/components/ui/trust";
import { cn } from "@/lib/cn";
import { BRAND_NAME } from "@/lib/brand";
import { formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { ExploreCardDTO, ExploreCollectionCardDTO, ExploreProviderDTO } from "@/server/services/explore";
import { collectionLabel, durationsText, itemCountLabel, priceText, sinceText, slotText, type CollectionLabel } from "./explore-copy";

/*
 * /entdecken cards (brand § 9.3 "Service card" / "Profile card"). Presentational only (no hooks): rendered on the
 * server for the public sections and reused by the „Für dich“ client chunk. Integrity rules: prices, ratings and
 * dates are real; „Nächster freier Termin“ appears only when the availability engine computed it for the
 * customer's saved PLZ (`nextSlot`, „Für dich“ only); AI portraits keep „Demo-Profil · Foto KI-generiert“.
 */

const CARD_SIZES = "(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 78vw";

/** „Von SOMA ausgewählt“ (Linen pill) or „Anzeige“ (Paper pill with a hairline, the stronger mark). Never Oxblood. */
export function CollectionLabelTag({ label, className }: { label: CollectionLabel; className?: string }) {
  return (
    <Badge tone={label.kind === "sponsored" ? "outline" : "neutral"} className={cn(label.kind === "sponsored" && "font-semibold text-ink", className)}>
      {label.text}
    </Badge>
  );
}

function NextSlot({ iso }: { iso: string }) {
  return (
    <span className="inline-flex items-start gap-1.5 type-caption text-ink num">
      <Icon icon={CalendarCheck} size={14} className="mt-px shrink-0" />
      <span>{`Nächster freier Termin: ${slotText(iso)}`}</span>
    </span>
  );
}

function PriceRow({ endPriceCents, price, extra }: { endPriceCents?: number; price: { cents: number; from: boolean } | null; extra?: string | null }) {
  return (
    <span className="mx-1 mt-auto flex items-end justify-between gap-3 border-t border-line pt-3">
      {endPriceCents != null ? (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="type-label font-semibold text-ink num">{formatPrice(endPriceCents)}</span>
          <span className="truncate type-caption text-ink-muted">{extra ? `Endpreis inkl. Anfahrt · ${extra}` : "Endpreis inkl. Anfahrt"}</span>
        </span>
      ) : price ? (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="type-label font-semibold text-ink num">{priceText(price)}</span>
          <span className="type-caption text-ink-muted">zzgl. Anfahrt</span>
        </span>
      ) : (
        <span className="type-label-s text-ink-muted">Gerade nicht buchbar</span>
      )}
      <Icon
        icon={ArrowUpRight}
        size={18}
        className="mb-0.5 shrink-0 text-ink-muted transition-[translate,color] duration-base ease-settle group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
      />
    </span>
  );
}

/** A service or category card: the photo in a 4:3 arch, category, title, the Profi (if pinned), duration, rating, price. */
export function ExploreCard({ card, sizes = CARD_SIZES, headingLevel }: { card: ExploreCardDTO; sizes?: string; headingLevel?: "h3" | "h4" }) {
  const T = headingLevel ?? "span";
  const meta = durationsText(card.durations);
  return (
    <Link
      href={card.href}
      className={surfaceClasses({ interactive: true, className: cn("group flex w-full flex-col gap-3.5 p-3 pb-4", !card.price && card.endPriceCents == null && "opacity-90") })}
    >
      <Photo src={card.imagePath} alt="" tone={card.categorySlug} word={card.eyebrow} wordSize="s" sizes={sizes} shape="arch" ratio="4/3" className="w-full" />
      <span className="flex flex-col gap-2 px-1">
        <span className="inline-flex items-center gap-1.5 type-caption text-ink-muted">
          <CategoryIcon slug={card.categorySlug} size={16} className="shrink-0" />
          {card.eyebrow}
        </span>
        <T className="type-heading-m text-balance text-ink">{card.title}</T>
        {card.note ? <span className="line-clamp-2 type-body-s text-ink-muted">{card.note}</span> : null}
        {card.provider ? (
          <span className="flex items-center gap-2.5 pt-0.5">
            <Avatar src={card.provider.avatarUrl} name={card.provider.displayName} size={32} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate type-label-s text-ink">
                {`bei ${card.provider.displayName}`}
                {card.provider.cityName ? <span className="font-normal text-ink-muted">{` · ${card.provider.cityName}`}</span> : null}
              </span>
              <AiLabel src={card.provider.avatarUrl} />
            </span>
          </span>
        ) : null}
        {meta || card.rating ? (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 type-caption text-ink-muted">
            {meta ? (
              <span className="inline-flex items-center gap-1 num">
                <Icon icon={Clock} size={14} />
                {meta}
              </span>
            ) : null}
            {card.rating ? <Rating avg={card.rating.avg} count={card.rating.count} /> : null}
          </span>
        ) : null}
        {card.nextSlot ? <NextSlot iso={card.nextSlot} /> : null}
      </span>
      <PriceRow endPriceCents={card.endPriceCents} price={card.price} />
    </Link>
  );
}

/** Collection card: the cover in a 4:5 arch, the label (editorial or „Anzeige“), title, one line, item count. */
export function CollectionCard({ collection: c, sizes = "(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 78vw", priority }: { collection: ExploreCollectionCardDTO; sizes?: string; priority?: boolean }) {
  const label = collectionLabel(c);
  return (
    <Link href={routes.exploreCollection(c.slug)} className={surfaceClasses({ interactive: true, className: "group flex w-full flex-col gap-4 p-3 pb-5" })}>
      <Photo src={c.coverImage} alt="" tone={c.tone} sizes={sizes} priority={priority} shape="arch" ratio="4/5" className="w-full" />
      <span className="flex flex-1 flex-col gap-2 px-1">
        <CollectionLabelTag label={label} />
        <span className="type-title-serif text-ink">{c.title}</span>
        {label.kind === "sponsored" ? <span className="type-caption text-ink-muted">{label.info}</span> : null}
        {c.subline ? <span className="line-clamp-2 type-body-s text-ink-muted">{c.subline}</span> : null}
        <span className="mt-auto flex items-center justify-between gap-3 pt-1">
          <span className="type-caption text-ink-muted num">{itemCountLabel(c.itemCount)}</span>
          <Icon
            icon={ArrowUpRight}
            size={18}
            className="shrink-0 text-ink-muted transition-[translate,color] duration-base ease-settle group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
          />
        </span>
      </span>
    </Link>
  );
}

/** A Profi approved in the last 60 days: portrait in the arch with its AI label, the „Neu“ chip and the real date. */
export function ExploreProviderCard({ provider: p, postalCode, sizes = CARD_SIZES }: { provider: ExploreProviderDTO; postalCode?: string; sizes?: string }) {
  const href = p.offering
    ? routes.provider(p.slug, { leistung: p.offering.serviceSlug, dauer: p.offering.durationMinutes, plz: postalCode })
    : routes.provider(p.slug);
  const meta = [p.categories.map((c) => c.name).slice(0, 2).join(", "), p.cityName].filter(Boolean).join(" · ");
  return (
    <Link href={href} className={surfaceClasses({ interactive: true, className: "group flex w-full flex-col gap-3.5 p-3 pb-4" })}>
      <span className="flex flex-col gap-2">
        <Portrait src={p.avatarUrl} name={p.displayName} ratio="4/5" shape="arch" sizes={sizes} className="w-full" />
        <AiLabel src={p.avatarUrl} className="px-1" />
      </span>
      <span className="flex flex-col gap-1.5 px-1">
        <span className="flex flex-wrap items-center gap-2">
          <Badge tone="outline" size="s">
            Neu
          </Badge>
          <span className="type-caption text-ink-muted num">{`Auf ${BRAND_NAME} seit ${sinceText(p.approvedAt)}`}</span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate type-title-serif text-ink">{p.displayName}</span>
          <VerifiedBadge className="shrink-0" />
        </span>
        {meta ? <span className="truncate type-body-s text-ink-muted">{meta}</span> : null}
        {/* Fewer than 3 reviews would read „Neu auf SOMA“ again, next to the chip: then no rating line at all. */}
        {p.ratingAvg && p.ratingCount >= 3 ? <Rating avg={p.ratingAvg} count={p.ratingCount} /> : null}
        {p.nextSlot ? <NextSlot iso={p.nextSlot} /> : null}
      </span>
      {p.endPriceCents != null ? (
        <PriceRow endPriceCents={p.endPriceCents} price={null} extra={p.offering?.serviceName ?? null} />
      ) : (
        <PriceRow price={p.fromPriceCents != null ? { cents: p.fromPriceCents, from: true } : null} />
      )}
    </Link>
  );
}

/** Skeleton of one card in its final shape (an arch, pills for text). */
export function ExploreCardSkeleton({ ratio = "4/3" }: { ratio?: "4/3" | "4/5" }) {
  return (
    <div aria-hidden className="flex w-full flex-col gap-3.5 rounded-card bg-surface-raised p-3 pb-4 shadow-raised">
      <div className="arch relative w-full overflow-hidden bg-surface-sunken" style={{ aspectRatio: ratio, ["--arch-aspect" as string]: ratio === "4/3" ? 4 / 3 : 0.8 }}>
        <span className="absolute inset-0 animate-skeleton bg-linear-to-r from-transparent via-surface-raised/70 to-transparent" />
      </div>
      <div className="flex flex-col gap-2 px-1">
        <div className="h-3 w-20 rounded-full bg-surface-sunken" />
        <div className="h-4 w-4/5 rounded-full bg-surface-sunken" />
        <div className="h-3 w-3/5 rounded-full bg-surface-sunken" />
      </div>
      <div className="mx-1 mt-2 h-9 border-t border-line pt-3">
        <div className="h-3.5 w-16 rounded-full bg-surface-sunken" />
      </div>
    </div>
  );
}

