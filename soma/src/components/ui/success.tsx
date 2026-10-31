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
  glowSize,
  className,
}: {
  size?: number;
  tone?: "success" | "accent" | "ink";
  /** soft aura halo behind the ring (hero moments) */
  glow?: boolean;
  /**
   * How far the halo reaches beyond the ring, in px (default ≈ 22 % of size,
   * e.g. 12 px at 56). It is a radial gradient that ends exactly there (no
   * blur filter), so it never spills onto neighbours; 0 = no halo.
   */
  glowSize?: number;
  className?: string;
}) {
  const color = tone === "success" ? "text-success" : tone === "accent" ? "text-accent" : "text-ink";
  const fill = tone === "success" ? "bg-success-soft" : tone === "accent" ? "bg-accent-soft" : "bg-surface-sunken";
  const reach = glowSize ?? Math.round(size * 0.22);
  return (
    <span aria-hidden className={cn("relative isolate inline-flex shrink-0 items-center justify-center", color, className)} style={{ width: size, height: size }}>
      {glow && reach > 0 ? (
        <span
          className="pointer-events-none absolute -z-10 animate-fade-in rounded-full"
          style={{
            inset: -reach,
            background: "radial-gradient(closest-side, rgb(84 102 255 / 0.32), rgb(159 139 255 / 0.2) 55%, rgb(255 168 148 / 0.14) 75%, transparent)",
          }}
        />
      ) : null}
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
