import { cn } from "@/lib/cn";

/**
 * The confirmation moment (design-guideline v2 §10 "Moments of delight"):
 * a ring pops in on a spring, then the check draws itself (640 ms). Pure CSS,
 * runs once on mount, final state under reduced motion. Decorative: pair it
 * with the visible word ("Bestätigt.", "Gespeichert").
 *
 *   <SuccessCheck size={56} />  <h1>Bestätigt.</h1>
 *   // on the client, after the action resolves: haptic("success")
 */
export function SuccessCheck({
  size = 48,
  tone = "success",
  glow = true,
  className,
}: {
  size?: number;
  tone?: "success" | "accent" | "ink";
  /** soft aura halo behind the ring (hero moments) */
  glow?: boolean;
  className?: string;
}) {
  const color = tone === "success" ? "text-success" : tone === "accent" ? "text-accent" : "text-ink";
  const fill = tone === "success" ? "bg-success-soft" : tone === "accent" ? "bg-accent-soft" : "bg-surface-sunken";
  return (
    <span aria-hidden className={cn("relative inline-flex shrink-0 items-center justify-center", color, className)} style={{ width: size, height: size }}>
      {glow ? <span className="absolute -inset-[35%] rounded-full bg-aura opacity-25 blur-xl animate-fade-in" /> : null}
      <span className={cn("absolute inset-0 rounded-full shadow-raised animate-pop", fill)} />
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
