import type { LucideIcon, LucideProps } from "lucide-react";

/** lucide icon with SOMA defaults: 1.5px absolute stroke, currentColor (design-guideline §9). */
export function Icon({ icon: I, size = 20, ...props }: { icon: LucideIcon } & LucideProps) {
  return <I size={size} strokeWidth={1.5} absoluteStrokeWidth aria-hidden {...props} />;
}
