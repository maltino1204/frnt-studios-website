import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ToneFill } from "./motif";

/*
 * Retired v2 aura (brand/BRAND_GUIDELINES.md § 5.4, LOGO_USAGE § 7: "never the retired v2 aura").
 * The exports stay so existing pages keep compiling, but they now render the brand's motif surfaces:
 * a flat category tone, the arch outline where a slot waits for a photo, and nothing decorative behind sections.
 * New code uses ToneFill / ArchLine from ./motif directly.
 */

/**
 * Formerly generative gradient artwork; now a flat category tone (no gradient, no grain, no drift).
 * `animate` and `grain` are ignored. Pass `arch` for an empty image slot with the arch outline.
 */
export function AuraArt({
  seed,
  tone,
  arch = false,
  className,
  style,
  children,
}: {
  seed: string;
  /** category slug (massage, kosmetik, …) or "nacht"; omit for a seeded wash */
  tone?: string | null;
  /** @deprecated ignored: the brand has no ambient motion */
  animate?: boolean;
  /** @deprecated ignored: no film grain on fallbacks */
  grain?: boolean;
  /** show the arch outline (empty image slots) */
  arch?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <ToneFill tone={tone} seed={seed} arch={arch} className={className} style={style}>
      {children}
    </ToneFill>
  );
}

type Placement = "right" | "left" | "top" | "bottom" | "center" | "full";
type Variant = "hero" | "section" | "subtle" | "night";

/**
 * Formerly the decorative aura wash behind a section. The brand rejects decorative gradients, so light variants
 * render nothing (the section stays on its Bone / Paper surface). `variant="night"` still paints the flat
 * Espresso band behind its section, because content on top of it is set in Bone.
 */
export function AuraBackground({
  variant = "hero",
  className,
}: {
  variant?: Variant;
  placement?: Placement;
  animate?: boolean;
  grain?: boolean;
  fade?: "bottom" | "top" | "both" | "radial" | "none";
  className?: string;
}) {
  if (variant !== "night") return null;
  return <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 bg-night", className)} />;
}

/** Retired roof line. The brand's eyebrows stand alone, so this renders nothing. */
export function AuraLine(_: { className?: string }) {
  return null;
}
