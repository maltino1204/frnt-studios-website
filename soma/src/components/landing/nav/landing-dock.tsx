"use client";

import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { requestBooking } from "./surfaces";
import { ChapterLabels } from "./chapter-labels";
import { openChapterOverlay } from "./overlay-events";
import { ProgressArch } from "./progress-arch";

/**
 * Mobile dock „Schnellzugriff“ (spec § 5.6), < 1024 only: fixed 12 px from the edges, 56 px pill, glass. Left: the
 * chapter overlay (index arch + current label); right: „Termin finden“ → booking sheet. In the DOM directly after
 * the header, so keyboard and screen-reader users meet it early. Hidden while `html[data-dock="hidden"]` (motion
 * layer rules: hero entry or chapter 10 CTAs in view, text input focused, a dialog or sheet open).
 */
export function LandingDock() {
  return (
    <nav aria-label="Schnellzugriff" className="lp-dock text-ink lg:hidden">
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={openChapterOverlay}
        className="relative flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-full pr-2 pl-4 text-left type-label text-ink pressable focus-ring"
      >
        <span className="sr-only">Kapitel</span>
        <ProgressArch />
        <ChapterLabels className="min-w-0" />
      </button>
      <a
        href="#termin"
        className={cn(buttonClasses({ variant: "primary" }), "h-12 shrink-0 px-5")}
        onClick={(e) => {
          e.preventDefault();
          void requestBooking({ source: "dock" });
        }}
      >
        Termin finden
      </a>
    </nav>
  );
}
