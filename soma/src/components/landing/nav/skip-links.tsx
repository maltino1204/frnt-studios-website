"use client";

import { focusHeroEntry } from "../booking/booking-access";

const cls =
  "sr-only z-(--z-toast) rounded-full bg-ink px-4 py-3 type-label text-ink-inverse focus:not-sr-only focus:fixed focus:top-2 focus:left-2";

/** Skip links (spec § 5.8), first in the DOM and visible on focus: to the content and to the booking entry's PLZ. */
export function SkipLinks() {
  return (
    <>
      <a href="#inhalt" className={cls}>
        Zum Inhalt springen
      </a>
      <a
        href="#termin"
        className={cls}
        onClick={(e) => {
          if (focusHeroEntry({ scroll: true })) e.preventDefault();
        }}
      >
        Zur Terminsuche springen
      </a>
    </>
  );
}
