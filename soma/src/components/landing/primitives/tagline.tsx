import { BRAND_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/cn";

/** "Your body." / "Your place." */
export const TAGLINE_LINES = BRAND_TAGLINE.replace(/\.\s+/, ".\n").split("\n");

/**
 * The tagline, the page's one italic (D10): Newsreader Display Italic, `lang="en"`, always two lines, one sentence
 * per line (two block spans), never "Your body. Your / place.". Size and colour come from the caller.
 */
export function TaglineLines({ lineClassName, reveal }: { lineClassName?: string; /** clause units for the motion layer */ reveal?: boolean }) {
  return (
    <>
      {TAGLINE_LINES.map((l, i) => (
        <span key={l} lang="en" data-reveal-order={reveal ? i : undefined} className={cn("block", lineClassName)}>
          {i > 0 ? " " : null}
          {l}
        </span>
      ))}
    </>
  );
}
