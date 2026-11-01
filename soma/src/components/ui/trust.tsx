import { BadgeCheck, Star } from "lucide-react";
import { formatRating } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

/** Verified marker: BadgeCheck in Espresso; with label it becomes a Linen pill (brand § 3.6: never Oxblood). No green ticks, seals or rosettes. */
export function VerifiedBadge({ withLabel, size = 16, className }: { withLabel?: boolean; size?: 16 | 20; className?: string }) {
  if (withLabel) {
    return (
      <span className={cn("inline-flex h-7 items-center gap-1.5 rounded-full bg-surface-sunken pr-3 pl-2 text-ink", className)}>
        <Icon icon={BadgeCheck} size={size === 20 ? 18 : 16} strokeWidth={1.75} />
        <span className="type-label-s">Verifiziert</span>
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-ink", className)}>
      <Icon icon={BadgeCheck} size={size} strokeWidth={1.75} aria-hidden={false} aria-label="Verifiziertes Profil" role="img" />
    </span>
  );
}

/**
 * Rating: filled ink star, value, muted count. Fewer than three reviews → "Neu auf SOMA".
 * Never yellow stars.
 */
export function Rating({
  avg,
  count,
  size = 14,
  className,
  showCount = true,
}: {
  avg: number | null | undefined;
  count: number;
  size?: 14 | 16;
  className?: string;
  showCount?: boolean;
}) {
  if (!avg || count < 3) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 type-label-s text-ink-muted", className)}>
        <span aria-hidden className="size-1.5 rounded-full bg-line-strong" />
        Neu auf SOMA
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1 type-label-s text-ink", className)} aria-label={`Bewertung ${formatRating(avg)} von 5 bei ${count} Bewertungen`}>
      <Icon icon={Star} size={size} className="fill-ink text-ink" />
      <span className="font-semibold num">{formatRating(avg)}</span>
      {showCount ? <span className="font-normal text-ink-muted num">({count})</span> : null}
    </span>
  );
}

/** Five-star row for review display and composer. */
export function Stars({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} role="img" aria-label={`${value} von 5 Sternen`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          icon={Star}
          size={size}
          className={i <= Math.round(value) ? "fill-ink text-ink" : "fill-surface-sunken text-line-strong"}
        />
      ))}
    </span>
  );
}
