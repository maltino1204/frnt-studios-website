import { Car, Star } from "lucide-react";
import { Portrait } from "@/components/ui/avatar";
import { FloatingCard, FloatingStage } from "@/components/ui/floating";
import { Icon } from "@/components/ui/icon";
import { Spotlight } from "@/components/ui/motion";
import { SuccessCheck } from "@/components/ui/success";
import { Rating, VerifiedBadge } from "@/components/ui/trust";
import { cn } from "@/lib/cn";
import { formatDayShort, formatDuration, formatPrice, formatPriceExact, formatRating, formatTime } from "@/lib/format";
import type { ProviderSearchResult } from "@/server/dto";

const NBSP = " ";

/** What the hero composition shows: one real search result and the real review aggregate. */
export type ShowcaseData = {
  result: Pick<
    ProviderSearchResult,
    "displayName" | "avatarUrl" | "ratingAvg" | "ratingCount" | "offering" | "nextSlots" | "travelFeeCents" | "totalPriceCents"
  > | null;
  rating: { avg: number; count: number } | null;
};

/**
 * Product-led hero (design-guideline v2 §9.3): real SOMA components floating on
 * the aura. Every value comes from the database at render time (a live search
 * result, its next free slots and travel fee, the review aggregate); only the
 * Start-Code digits are illustrative. Decorative: aria-hidden + inert, the
 * real booking entry sits next to it.
 */
export function HeroShowcase({ data, className }: { data: ShowcaseData; className?: string }) {
  const r = data.result;
  // Keep a little distance from "now" so an hourly-cached page never shows a slot that already started.
  const soon = Date.now() + 2 * 3_600_000;
  const slots = (r?.nextSlots ?? []).filter((s) => new Date(s).getTime() > soon);
  const day = slots[0] ? slots.filter((s) => formatDayShort(s) === formatDayShort(slots[0])).slice(0, 3) : [];
  const picked = day[1] ?? day[0] ?? null;

  return (
    <Spotlight className={cn("rounded-panel", className)}>
      <FloatingStage className="h-[25rem] sm:h-[29rem] lg:h-[36rem]" placement="center">
        {/* 1 · Provider result card with real slot chips */}
        {r ? (
          <FloatingCard
            className="top-[2%] left-0 w-[min(20rem,86%)] sm:left-[3%] lg:top-[6%] lg:left-[2%]"
            depth={10}
            tilt={-1.5}
            enter={0}
            cardClassName="p-4"
          >
            <div className="flex gap-3">
              <Portrait src={r.avatarUrl} name={r.displayName} sizes="56px" className="w-14 shrink-0" />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="flex items-center gap-1.5 type-heading-s">
                  <span className="truncate">{r.displayName}</span>
                  <VerifiedBadge className="shrink-0" />
                </p>
                <Rating avg={r.ratingAvg} count={r.ratingCount} />
                <p className="truncate type-caption text-ink-muted">{`${r.offering.serviceName} · ${formatDuration(r.offering.durationMinutes)}`}</p>
              </div>
            </div>
            {day.length ? (
              <>
                <p className="mt-3.5 type-caption text-ink-muted num">{`Freie Termine · ${formatDayShort(day[0])}`}</p>
                <div className="mt-2 flex gap-1.5">
                  {day.map((s) => (
                    <span
                      key={s}
                      className={cn(
                        "inline-flex h-8 items-center rounded-tile px-3 type-label-s num",
                        s === picked ? "bg-ink text-ink-inverse shadow-ink" : "border border-line-mid bg-surface-raised text-ink",
                      )}
                    >
                      {formatTime(s)}
                    </span>
                  ))}
                </div>
              </>
            ) : null}
            <div className="mt-3.5 flex items-baseline justify-between gap-3 border-t border-dashed border-line-mid pt-3">
              <span className="type-caption text-ink-muted">Endpreis</span>
              <span className="type-label-s num">
                {formatPrice(r.totalPriceCents)}
                <span className="font-normal text-ink-muted">{` inkl.${NBSP}Anfahrt`}</span>
              </span>
            </div>
          </FloatingCard>
        ) : null}

        {/* 2 · The confirmation moment (glass, slow float) */}
        <FloatingCard
          className="top-[47%] right-0 w-[min(16.5rem,72%)] lg:top-[40%] lg:right-[1%]"
          depth={22}
          glass
          float
          enter={1}
          cardClassName="flex items-center gap-3 p-3.5"
        >
          <SuccessCheck size={38} glow={false} />
          <div className="min-w-0">
            <p className="type-heading-s">Bestätigt.</p>
            <p className="truncate type-caption text-ink-muted num">
              {picked ? `${formatDayShort(picked)} · ${formatTime(picked)}` : "Ihr Termin steht."}
            </p>
          </div>
        </FloatingCard>

        {/* 3 · Start-Code with the staggered digit reveal */}
        <FloatingCard
          className="bottom-[2%] left-[6%] w-[min(14.5rem,62%)] lg:bottom-[5%] lg:left-auto lg:right-[22%]"
          depth={16}
          tilt={1.5}
          enter={2}
          cardClassName="p-4"
        >
          <p className="type-overline text-ink-muted">Start-Code</p>
          <p className="mt-2 flex gap-1.5 stagger-rise">
            {["4", "8", "2", "7"].map((d, i) => (
              <span key={i} className="inline-flex h-11 w-9 items-center justify-center rounded-tile bg-surface-sunken type-heading-l num">
                {d}
              </span>
            ))}
          </p>
          <p className="mt-2.5 type-caption text-ink-muted">Erst vor Ort, beim Start.</p>
        </FloatingCard>

        {/* 4 · Rating aggregate and travel line (sm and up) */}
        {data.rating ? (
          <FloatingCard
            className="top-[3%] right-[2%] hidden w-[13.5rem] sm:block lg:top-[2%] lg:right-[4%]"
            depth={28}
            glass
            float
            enter={3}
            cardClassName="flex flex-col gap-1 px-4 py-3.5"
          >
            <p className="flex items-center gap-1.5 type-heading-l num">
              {formatRating(data.rating.avg)}
              <Star aria-hidden size={18} strokeWidth={1.5} absoluteStrokeWidth className="fill-ink text-ink" />
            </p>
            <p className="type-caption text-ink">{`aus ${data.rating.count.toLocaleString("de-DE")} verifizierten Bewertungen`}</p>
          </FloatingCard>
        ) : null}
        {r && r.travelFeeCents >= 0 ? (
          <FloatingCard
            className="top-[49%] left-[6%] hidden w-[13rem] lg:block"
            depth={8}
            enter={3}
            elevation={1}
            radius="tile"
            cardClassName="flex items-center justify-between gap-3 px-3.5 py-2.5"
          >
            <span className="inline-flex items-center gap-2 type-label-s text-ink">
              <Icon icon={Car} size={16} />
              Anfahrt
            </span>
            <span className="type-label-s num">{r.travelFeeCents === 0 ? "inklusive" : formatPriceExact(r.travelFeeCents)}</span>
          </FloatingCard>
        ) : null}
      </FloatingStage>
    </Spotlight>
  );
}
