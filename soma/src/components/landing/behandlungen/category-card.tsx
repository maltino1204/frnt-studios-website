import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { surfaceClasses } from "@/components/ui/surface";
import { LandingArch } from "../primitives/landing-arch";
import { LandingImage } from "../primitives/landing-image";
import type { CategoryItem } from "./types";

/**
 * The 03 tile for touch, tablet and mobile (spec § 4.3): the kit's service-card pattern (Paper, 12 px inset, lift on
 * hover) with the photo in the arch and the title in the sans (guidelines v1.1 § 9.3: card titles in lists are
 * `heading-m`; the kit's CategoryTile still sets the serif, so the landing renders its own).
 */
export function CategoryCard({ item }: { item: CategoryItem }) {
  return (
    <Link href={item.href} className={surfaceClasses({ interactive: true, className: "group flex h-full flex-col gap-3.5 p-3 pb-5" })}>
      <LandingArch tone={item.slug} reveal="arch">
        <LandingImage src={item.image} alt="" sizes="(min-width: 768px) 40vw, 78vw" focal={item.focal} />
      </LandingArch>
      <span className="flex flex-col gap-1.5 px-1">
        <span className="flex items-center justify-between gap-2">
          <span className="type-heading-m text-ink">{item.name}</span>
          <Icon
            icon={ArrowUpRight}
            size={18}
            className="shrink-0 text-ink-muted transition-[translate,color] duration-base ease-settle group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
          />
        </span>
        {item.tagline ? <span className="line-clamp-2 type-body-s text-ink-muted">{item.tagline}</span> : null}
        {item.price ? (
          <span className="mt-1 flex items-baseline gap-1.5">
            <span className="type-label-s text-ink num">{item.price}</span>
            <span className="type-caption text-ink-muted">zzgl. Anfahrt</span>
          </span>
        ) : null}
      </span>
    </Link>
  );
}
