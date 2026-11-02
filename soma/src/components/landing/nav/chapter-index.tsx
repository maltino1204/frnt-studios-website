"use client";

import { cn } from "@/lib/cn";
import { ChapterLabels } from "./chapter-labels";
import { openChapterOverlay } from "./overlay-events";
import { ProgressArch } from "./progress-arch";
import { NoScriptChapterLink } from "./static-chapter-list";

/**
 * The chapter index (spec § 5.2): a pill with the index arch and the current chapter's label; it opens the chapter
 * overlay. Accessible name „Kapitel 03 Behandlungen“ (the visible label is part of it). 44 px tall (spec § 9 targets).
 * Without JS it is a link „Kapitel“ to the static chapter list above the footer (the overlay never mounts).
 */
export function ChapterIndex({ className }: { className?: string }) {
  const pill = "relative inline-flex h-11 max-w-[15rem] min-w-0 items-center gap-2.5 rounded-full px-3 type-label text-ink focus-ring hover:bg-surface-sunken";
  return (
    <>
      <button type="button" aria-haspopup="dialog" onClick={openChapterOverlay} className={cn("lp-js pressable", pill, className)}>
        <span className="sr-only">Kapitel</span>
        <ProgressArch />
        <ChapterLabels />
      </button>
      <NoScriptChapterLink className={cn(pill, className)}>
        <ProgressArch />
        Kapitel
      </NoScriptChapterLink>
    </>
  );
}
