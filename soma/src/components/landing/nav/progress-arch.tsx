import { archPath } from "@/components/ui/motif";
import { cn } from "@/lib/cn";

const D = archPath(1, 1, 14, 18);

/**
 * The index arch (spec § 1.3 B): a 16 × 20 outline that draws itself with page progress, from the left flank over
 * the crown to the right flank. Two strokes: the track and the progress (`data-progress-arch`, pathLength 1,
 * `stroke-dashoffset: calc(1 - var(--lp-progress))`). `--lp-progress` is written by the motion layer; without it the
 * arch shows its track only.
 */
export function ProgressArch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 20" width={16} height={20} aria-hidden focusable="false" className={cn("lp-progress-arch shrink-0", className)} fill="none">
      <path d={D} pathLength={1} className="lp-progress-track" />
      <path d={D} pathLength={1} data-progress-arch="" className="lp-progress-bar" />
    </svg>
  );
}
