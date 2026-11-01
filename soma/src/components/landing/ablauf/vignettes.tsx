import { Check, MapPin } from "lucide-react";
import { AiLabel } from "@/components/ui/ai-label";
import { Portrait } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { SegmentedControl } from "@/components/ui/segmented";
import { cn } from "@/lib/cn";
import { formatDayShort, formatPrice, formatTime } from "@/lib/format";
import type { ProviderSearchResult } from "@/server/dto";
import { LandingArch } from "../primitives/landing-arch";
import { LandingImage } from "../primitives/landing-image";
import { Ortszeile } from "../primitives/ortszeile";

/** Everything the three vignettes show, from real data (spec § 4.4); null fields drop their element. */
export type WalkthroughData = {
  plz: string;
  city: string | null;
  /** the showcase result's category, else the first catalogue category */
  categoryName: string | null;
  result: ProviderSearchResult | null;
  /** hours before the start until which cancelling is free (terms.cancellationPolicy) */
  freeHours: number | null;
};

const NBSP = " ";
const card = "rounded-card bg-surface-raised shadow-float";
const chip = "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] leading-none font-[540] whitespace-nowrap";

/** Future slots at least 2 h ahead (the showcase rule of the former home page). */
function usableSlots(result: ProviderSearchResult | null): string[] {
  if (!result) return [];
  const soon = Date.now() + 2 * 3_600_000;
  return result.nextSlots.filter((s) => new Date(s).getTime() > soon);
}

/** "Do." */
const weekday = (iso: string) => formatDayShort(iso).replace(/,.*/, "");
/** "Do. 18:30" */
const slotLabel = (iso: string) => `${weekday(iso)}${NBSP}${formatTime(iso)}`;

/** 1 · Entdecken: the entry in its filled state and one real result. */
export function VignetteDiscover({ data }: { data: WalkthroughData }) {
  const slots = usableSlots(data.result).slice(0, 2);
  const r = data.result;
  return (
    <div className="relative flex w-full flex-col gap-3">
      <div className={cn(card, "flex flex-wrap gap-1.5 p-3")}>
        <span className={cn(chip, "bg-surface-sunken text-ink")}>
          <Icon icon={MapPin} size={14} className="text-ink-muted" />
          <span className="num">{data.plz}</span>
          {data.city ? <span className="text-ink-muted">{data.city}</span> : null}
        </span>
        {data.categoryName ? (
          <span className={cn(chip, "bg-ink text-ink-inverse shadow-ink")}>
            <Icon icon={Check} size={13} strokeWidth={2.25} />
            {data.categoryName}
          </span>
        ) : null}
        {slots[0] ? <span className={cn(chip, "border border-line-mid text-ink")}>{formatDayShort(slots[0])}</span> : null}
      </div>

      {r ? (
        <div className="relative">
          {/* A second card behind: shape only, no invented content. */}
          <div aria-hidden className={cn(card, "absolute inset-0 translate-x-4 translate-y-4 opacity-70")}>
            <div className="flex items-center gap-3 p-3.5">
              <span className="size-14 shrink-0 rounded-[50%] bg-surface-sunken" />
              <span className="flex flex-1 flex-col gap-2">
                <span className="h-3 w-2/5 rounded-full bg-surface-sunken" />
                <span className="h-2.5 w-3/5 rounded-full bg-surface-sunken" />
              </span>
            </div>
          </div>
          <div className={cn(card, "relative flex flex-col gap-3 p-3.5")}>
            <div className="flex items-start gap-3">
              <Portrait src={r.avatarUrl} name={r.displayName} shape="oval" sizes="56px" className="w-14 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate type-title-serif text-[1.375rem] text-ink">{r.displayName}</span>
                <AiLabel src={r.avatarUrl} />
                {r.bookingMode === "instant" ? (
                  <span className="inline-flex items-center gap-1.5 type-caption font-semibold text-success">
                    <span className="size-1.5 rounded-full bg-success" />
                    Sofort bestätigt
                  </span>
                ) : null}
              </div>
              <span className="flex shrink-0 flex-col items-end">
                <span className="type-label text-ink num">{formatPrice(r.totalPriceCents)}</span>
                <span className="type-caption text-ink-muted">inkl.{NBSP}Anfahrt</span>
              </span>
            </div>
            {slots.length ? (
              <div className="flex gap-1.5">
                {slots.map((s, i) => (
                  <span
                    key={s}
                    className={cn(
                      "inline-flex h-8 items-center rounded-tile px-3 text-[13px] leading-none font-[540] num",
                      i === 0 ? "bg-ink text-ink-inverse shadow-ink" : "border border-line-mid bg-surface-raised text-ink",
                    )}
                  >
                    {slotLabel(s)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className={cn(card, "flex items-center justify-between gap-3 p-3.5")}>
          <span className="type-label-s text-ink">Endpreis inkl. Anfahrt</span>
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-success-soft text-success">
            <Icon icon={Check} size={14} strokeWidth={2.5} />
          </span>
        </div>
      )}
    </div>
  );
}

/** 2 · Buchen: where, when, the final price and the free-cancellation deadline. No checkout button. */
export function VignetteBook({ data, instance }: { data: WalkthroughData; instance: string }) {
  const slots = usableSlots(data.result).slice(0, 4);
  const selected = slots[0] ?? null;
  const deadline = selected && data.freeHours != null && data.freeHours > 0 ? new Date(new Date(selected).getTime() - data.freeHours * 3_600_000) : null;
  return (
    <div className={cn(card, "flex w-full flex-col gap-4 p-4 md:p-5")}>
      <p className="type-heading-m text-ink">Wo findet dein Termin statt?</p>
      <SegmentedControl
        name={`lp-ort-${instance}`}
        label="Ort"
        dense
        defaultValue="zuhause"
        options={[
          { value: "zuhause", label: "Zuhause" },
          { value: "hotel", label: "Hotel" },
          { value: "buero", label: "Büro" },
        ]}
      />
      {slots.length ? (
        <div className="grid grid-cols-4 gap-1.5">
          {slots.map((s) => {
            const sel = s === selected;
            return (
              <span
                key={s}
                className={cn(
                  "inline-flex h-10 items-center justify-center gap-1 rounded-tile border text-[13px] font-[540] num",
                  sel ? "border-selected bg-selected text-ink-inverse" : "border-line-mid bg-surface-raised text-ink",
                )}
              >
                {sel ? <Icon icon={Check} size={13} strokeWidth={2.25} /> : null}
                {formatTime(s)}
              </span>
            );
          })}
        </div>
      ) : null}
      {data.result ? (
        <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
          <span className="type-body-s text-ink-muted">Endpreis inkl. Anfahrt</span>
          <span className="type-numeric text-ink">{formatPrice(data.result.totalPriceCents)}</span>
        </div>
      ) : (
        <p className="border-t border-line pt-3 type-body-s text-ink-muted">Endpreis inkl. Anfahrt</p>
      )}
      {deadline ? (
        <p className="-mt-1 inline-flex items-center gap-1.5 type-caption text-ink-muted">
          <Icon icon={Check} size={13} strokeWidth={2.25} className="text-success" />
          Kostenlos stornierbar bis {weekday(deadline.toISOString())},{NBSP}
          {formatTime(deadline)}
          {NBSP}Uhr
        </p>
      ) : null}
    </div>
  );
}

/**
 * 3 · Bleiben: the signature, used once on the page (guidelines § 10.2): two equal 4:5 arches, the right one dropped
 * by 18 % of its width, one Ortszeile under each (two places), and the Start-Code card overlapping the right arch's
 * lower part (the only overlap the signature allows). One evening in two moments: 19:25 at the door, 20:10 after.
 */
export function VignetteStay({ className }: { className?: string }) {
  return (
    <div className={cn("lp-pair", className)}>
      <figure className="min-w-0">
        <LandingArch tone="massage" reveal="arch">
          <LandingImage src="/images/editorial/arrival-v2.jpg" alt="" sizes="(min-width: 1024px) 296px, 42vw" focal="58% 50%" />
        </LandingArch>
        <Ortszeile text={`Wohnungstür, 4.${NBSP}OG · Berlin-Prenzlauer Berg · 19:25`} className="mt-3" />
      </figure>
      <figure className="lp-pair-right relative min-w-0">
        <LandingArch tone="kosmetik" reveal="arch">
          <LandingImage src="/images/editorial/after-v2.jpg" alt="" sizes="(min-width: 1024px) 296px, 42vw" focal="12% 50%" />
        </LandingArch>
        <Ortszeile text="Sofa, danach · Berlin-Prenzlauer Berg · 20:10" className="mt-3" />
        <div data-start-code="" className="lp-start-code">
          <span className="type-caption text-ink-muted">Start-Code</span>
          <span className="flex gap-1">
            {["4", "8", "2", "7"].map((d, i) => (
              <span key={i} data-reveal-order={i} className="inline-flex h-8 w-7 items-center justify-center rounded-[8px] bg-surface-sunken type-label text-ink num md:h-9 md:w-8">
                {d}
              </span>
            ))}
          </span>
        </div>
      </figure>
    </div>
  );
}
