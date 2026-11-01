import { cn } from "@/lib/cn";

/*
 * The arch-check glyph (brand/BRAND_GUIDELINES.md § 10.1 "Confirmation moments"): the SOMA arch outline with a check
 * inside. It replaces a generic check circle where something is confirmed: booking confirmed, request accepted,
 * Profi approved. Geometry as in the booking-confirmation comp and the e-mail (`brand/applications/_src/booking.mjs`).
 *
 * Motion: the outline draws in (640 ms), then the check (320 ms); with reduced motion both appear at once.
 * Decorative: the status is always a word next to it ("Bestätigt.").
 */
const ARCH = "M0 1000L0 436.14C0 181 172 0 400 0C628 0 800 181 800 436.14L800 1000Z";
const CHECK = "M250 610 360 720 560 470";

export function ArchCheck({ size = 56, animate = true, className }: { /** width in px; the glyph is 4:5 */ size?: number; animate?: boolean; className?: string }) {
  const check = Math.min(3.5, Math.max(2, size * 0.055));
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="-12 -12 824 1024"
      width={size}
      height={Math.round(size * 1.25)}
      className={cn("block shrink-0 overflow-visible text-ink", className)}
    >
      <path
        d={ARCH}
        fill="var(--color-surface-raised)"
        stroke="currentColor"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        strokeDasharray={animate ? 1 : undefined}
        className={animate ? "animate-draw" : undefined}
      />
      <path
        d={CHECK}
        fill="none"
        stroke="currentColor"
        strokeWidth={check}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={animate ? 1 : undefined}
        className={animate ? "animate-draw [animation-delay:640ms] [animation-duration:320ms] motion-reduce:[animation-delay:0ms]" : undefined}
      />
    </svg>
  );
}
