import { cn } from "@/lib/cn";

/**
 * Spinner: a 2 px ring with a soft conic tail in currentColor. Keeps turning
 * (slower) under reduced motion, because it is essential feedback.
 */
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        background: "conic-gradient(from 90deg, transparent 0deg, currentColor 300deg, currentColor 360deg)",
        mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px))",
        WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px))",
      }}
      className={cn("soma-spinner inline-block shrink-0 animate-spin rounded-full", className)}
    />
  );
}
