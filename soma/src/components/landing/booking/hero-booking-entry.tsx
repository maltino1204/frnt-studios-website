"use client";

/**
 * The hero booking entry, „Schwelle“ (LANDING_DESIGN_SPEC.md § 4.1.6). Owner: Conversion & Integration.
 *
 *   <HeroBookingEntry
 *     catalog={toEntryCatalog(catalog, floorsById(floors))}   // discovery-copy.ts
 *     postalExample={examples.berlin ?? "10115"}
 *     postalExamples={examples}                               // listCityPostalExamples()
 *     place={place}                                           // "zuhause" | "hotel" | "buero", from the place switch
 *     trustItems={conv.heroTrust}                             // loadLandingConversion() (metadata.ts)
 *   />
 *
 * - Renders the entry (`id="termin"`, the deck's persistent CTA target), the trust row and, from lg, `RebookRow`.
 * - Place: pass `place`, or dispatch `window` event `soma:hero-place` { place } from the place switch. The example PLZ
 *   follows the place's city; caption context, placeholder and screen-reader label change only while the field is empty.
 * - Width from lg: set `--lp-sill-w` on an ancestor (landing.css: ≥ 1280 `max(8 cols, 820px)`, 1024–1279 10 cols).
 * - The wrapper of the entry carries `data-dock-hide="0.25"` (the dock hides while ≥ 25 % of it is in view).
 * - Shares its draft with <BookingBar/> and <BookingSheet/> (booking-draft.ts).
 */
import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BookingEntry } from "@/components/site/booking-entry";
import type { EntryCategory } from "@/components/site/discovery-copy";
import { RebookRow } from "@/components/site/discovery-rebook";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { HERO_ENTRY_ID, HERO_VISIBLE_RATIO } from "./booking-access";
import { registerEntryData, setBookingDraft, useBookingDraft } from "./booking-draft";

export type HeroPlace = "zuhause" | "hotel" | "buero";
export const HERO_PLACE_EVENT = "soma:hero-place";

/** The city whose example PLZ each place shows (spec § 4.1.5). */
export const PLACE_CITY: Record<HeroPlace, string> = { zuhause: "berlin", hotel: "frankfurt", buero: "hamburg" };

/**
 * Place hint (spec § 4.1.5; audit-1 I-3). The placeholder is always „PLZ, z. B. {PLZ}“, so it fits the sill's Wo? field
 * at every width (≈ 106 px of 115–122 px from 1024); the example PLZ follows the place's city, the visible payoff of the
 * place switch. The place itself moves into the caption („Wo? · Im Hotel“, aria-hidden) and the screen-reader label
 * („Postleitzahl des Hotels“).
 *
 * ✎ (spec § 13) the caption context and the sr labels need the Strategist's sign-off. Set to false for the spec's
 * fallback: only the example PLZ changes.
 */
export const PLACE_HINT_COPY_APPROVED = true;

const PLACE_COPY: Record<HeroPlace, { context: string | null; sr: string }> = {
  zuhause: { context: null, sr: "Postleitzahl" },
  hotel: { context: "Im Hotel", sr: "Postleitzahl des Hotels" },
  buero: { context: "Im Büro", sr: "Postleitzahl des Büros" },
};

export function placeHintFor(place: HeroPlace, examplePlz: string): { placeholder: string; srLabel: string; context: string | null } {
  const copy = PLACE_HINT_COPY_APPROVED ? PLACE_COPY[place] : PLACE_COPY.zuhause;
  return { placeholder: `PLZ, z.\u00a0B. ${examplePlz}`, srLabel: copy.sr, context: copy.context };
}

export type HeroBookingEntryProps = {
  catalog: EntryCategory[];
  /** example PLZ when the place's city has none */
  postalExample: string;
  /** `listCityPostalExamples()`: city slug → PLZ */
  postalExamples?: Record<string, string>;
  place?: HeroPlace;
  /** `loadLandingConversion().heroTrust`; empty hides the row */
  trustItems?: string[];
  /** `RebookRow` under the trust row from lg (never above the pill) */
  showRebook?: boolean;
  className?: string;
};

export function HeroBookingEntry({ catalog, postalExample, postalExamples, place: placeProp, trustItems = [], showRebook = true, className }: HeroBookingEntryProps) {
  const [placeEvent, setPlaceEvent] = useState<HeroPlace | null>(null);
  const place = placeProp ?? placeEvent ?? "zuhause";

  useEffect(() => {
    registerEntryData({ catalog, postalExample });
  }, [catalog, postalExample]);

  useEffect(() => {
    if (placeProp) return;
    const on = (e: Event) => {
      const p = (e as CustomEvent<{ place?: HeroPlace }>).detail?.place;
      if (p && p in PLACE_CITY) setPlaceEvent(p);
    };
    window.addEventListener(HERO_PLACE_EVENT, on);
    return () => window.removeEventListener(HERO_PLACE_EVENT, on);
  }, [placeProp]);

  const example = postalExamples?.[PLACE_CITY[place]] ?? postalExample;
  const hint = useMemo(() => placeHintFor(place, example), [place, example]);

  // Values typed into the booking bar or sheet flow back here (never while the visitor is typing in the hero).
  const draft = useBookingDraft();
  const sync = draft.source && draft.source !== "hero" ? { draft: draft.draft, version: draft.version } : null;

  return (
    <div className={cn("flex min-w-0 flex-col gap-4", className)} data-booking="sill">
      <div data-dock-hide={HERO_VISIBLE_RATIO}>
        <BookingEntry
          catalog={catalog}
          postalExample={example}
          variant="sill"
          id={HERO_ENTRY_ID}
          placeHint={hint}
          onDraftChange={(d) => setBookingDraft("hero", d)}
          syncDraft={sync}
          ctaId="hero-search-submit"
        />
      </div>
      {trustItems.length ? (
        <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Darauf kannst du dich verlassen">
          {trustItems.map((x) => (
            <li key={x} className="inline-flex items-center gap-1.5 type-label-s text-ink">
              <span aria-hidden className="inline-flex size-4 items-center justify-center rounded-full bg-success-soft text-success">
                <Icon icon={Check} size={12} strokeWidth={2.5} />
              </span>
              {x}
            </li>
          ))}
        </ul>
      ) : null}
      {showRebook ? (
        <div className="hidden lg:block">
          <RebookRow />
        </div>
      ) : null}
    </div>
  );
}
