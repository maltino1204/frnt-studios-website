"use client";

import { cn } from "@/lib/cn";
import { ChapterLabels } from "./chapter-labels";
import { openChapterOverlay } from "./overlay-events";
import { ProgressArch } from "./progress-arch";

/**
 * The chapter index (spec § 5.2): a pill with the index arch and the current chapter's label; it opens the chapter
 * overlay. Accessible name „Kapitel 03 Behandlungen“ (the visible label is part of it). Without JS it reads
 * „Kapitel 01 Bei dir“ and does nothing.
 */
export function ChapterIndex({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={openChapterOverlay}
      className={cn(
        "relative inline-flex h-10 max-w-[15rem] min-w-0 items-center gap-2.5 rounded-full px-3 type-label text-ink pressable focus-ring hover:bg-surface-sunken",
        "before:absolute before:-inset-y-0.5 before:inset-x-0 before:content-['']",
        className,
      )}
    >
      <span className="sr-only">Kapitel</span>
      <ProgressArch />
      <ChapterLabels />
    </button>
  );
}
