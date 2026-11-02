"use client";

import type { EntryCategory } from "@/components/site/discovery-copy";
import { HeroBookingEntry } from "../booking/hero-booking-entry";
import { usePlace } from "./place-store";

/**
 * The hero's booking threshold („Schwelle“, spec § 4.1.6): Conversion's <HeroBookingEntry/> (entry `#termin`, trust
 * row, RebookRow), fed with the place of the place switch so Wo?'s example PLZ, placeholder and screen-reader label
 * follow it. The box reserves exactly the pill's 72 px from lg (landing.css `.lp-sill-box`): the trust row and the
 * RebookRow hang below it, so the pill's bottom stays 72 px above the arch base and nothing ever shifts the hero.
 */
export function HeroBookingSlot({
  catalog,
  postalExample,
  postalExamples,
  trustItems,
}: {
  catalog: EntryCategory[];
  postalExample: string;
  postalExamples: Record<string, string>;
  trustItems: string[];
}) {
  const place = usePlace();
  return (
    <div className="lp-sill">
      <div className="lp-sill-box">
        <HeroBookingEntry catalog={catalog} postalExample={postalExample} postalExamples={postalExamples} place={place.id} trustItems={trustItems} />
      </div>
    </div>
  );
}
