"use client";

import { focusHeroEntry } from "../booking/booking-access";

/* `lp-skip` (landing.css) restores the padding that `not-sr-only` resets: a 44 px pill when focused (audit-1 T-6). */
const cls = "lp-skip sr-only z-(--z-toast) rounded-full bg-ink type-label text-ink-inverse focus:not-sr-only focus:fixed focus:top-2 focus:left-2";

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
