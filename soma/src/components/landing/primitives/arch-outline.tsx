import { archPath } from "@/components/ui/motif";
import { cn } from "@/lib/cn";

const OUTLINE_4_5 = archPath(0.75, 0.75, 78.5, 99.25);

/**
 * A 4:5 arch outline from the master geometry (`archPath`): `pathLength=1` so the motion layer can draw it
 * (`data-reveal="draw"`), non-scaling stroke. Static: fully drawn, no dash pattern (Chromium misapplies a
 * pathLength dash on a non-scaling stroke: the draw needs a screen-space dash, e.g. from getTotalLength()). Size it with a width class.
 */
export function ArchOutline({
  className,
  strokeWidth = 1.5,
  draw,
}: {
  className?: string;
  strokeWidth?: number;
  /** marks the outline as a draw-on target for the motion layer */
  draw?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 80 100"
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
      data-arch="outline"
      data-reveal={draw ? "draw" : undefined}
      className={cn("block aspect-[4/5] h-auto overflow-visible", className)}
      fill="none"
    >
      <path d={OUTLINE_4_5} pathLength={1} stroke="currentColor" strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
