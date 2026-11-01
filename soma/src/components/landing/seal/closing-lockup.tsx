import { cn } from "@/lib/cn";

import { DISPLAY_PATHS, SYMBOL_PATHS } from "@/components/brand/logo";

/*
 * Geometry from the master brand/assets/logo/final/soma-lockup-stacked.svg (symbol group translate/scale, wordmark
 * offset); the outlines come from the logo module, so the lockup always follows the current masters.
 */
/**
 * The stacked lockup for chapter 10 (spec § 4.10, § 11.1 seal/closing-lockup.tsx), proportions and spacing from the
 * master. The mark is drawn twice: contour strokes (`data-seal-part="o-trace" | "s-trace"`, pathLength 1, start at
 * the left springline) for "the mark draws on" (MOTION.md § 3.6.2), and the fills (`"o-fill" | "s-fill"`). The
 * wordmark is `"wordmark"`. Static (final frame): fills shown, contours hidden. Never placed inside an arch.
 */
export function ClosingLockup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 -16.8 2796 2178" role="img" aria-label="SOMA" className={cn("lp-lockup block h-auto overflow-visible", className)} fill="currentColor">
      <g transform="translate(832.81 0) scale(1.51934)">
        <path data-seal-part="o-fill" d={SYMBOL_PATHS.o} />
        <path data-seal-part="s-fill" d={SYMBOL_PATHS.s} />
        <path data-seal-part="o-trace" d={SYMBOL_PATHS.oTrace} pathLength={1} className="lp-seal-trace" />
        <path data-seal-part="s-trace" d={SYMBOL_PATHS.s} pathLength={1} className="lp-seal-trace" />
      </g>
      <g data-seal-part="wordmark" transform="translate(0 1446.8)">
        {DISPLAY_PATHS.map((d) => (
          <path key={d.slice(0, 14)} d={d} />
        ))}
      </g>
    </svg>
  );
}
