import { cn } from "@/lib/cn";

/**
 * The confirmation moment: a soft disc settles in, then the check draws itself (640 ms, no overshoot, no halo).
 * Pure CSS, runs once on mount, final state under reduced motion. Decorative: pair it with the visible word
 * ("Bestätigt.", "Gespeichert").
 *
 *   <SuccessCheck size={56} />  <h1>Bestätigt.</h1>
 *   // on the client, after the action resolves: haptic("success")
 */
export function SuccessCheck({
  size = 48,
  tone = "success",
  className,
}: {
  size?: number;
  tone?: "success" | "accent" | "ink";
  /** @deprecated ignored: the brand has no glows */
  glow?: boolean;
  /** @deprecated ignored */
  glowSize?: number;
  className?: string;
}) {
  // "accent" is kept for API compatibility and renders in Espresso: a confirmation is never Oxblood.
  const color = tone === "success" ? "text-success" : "text-ink";
  const fill = tone === "success" ? "bg-success-soft" : "bg-surface-sunken";
  return (
    <span aria-hidden className={cn("relative isolate inline-flex shrink-0 items-center justify-center", color, className)} style={{ width: size, height: size }}>
      <span className={cn("absolute inset-0 rounded-full animate-pop", fill)} />
      <svg viewBox="0 0 24 24" fill="none" className="relative" style={{ width: size * 0.5, height: size * 0.5 }}>
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          pathLength={1}
          stroke="currentColor"
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={1}
          className="animate-draw [animation-delay:180ms]"
        />
      </svg>
    </span>
  );
}
