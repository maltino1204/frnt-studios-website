import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The chapter arch (spec § 1.3 A, Appendix A). The root is an inline-size container; its face carries the O curve
 * `border-radius: 50cqw 50cqw 0 0 / 54.5cqw 54.5cqw 0 0`, so any height keeps the O ratio (ry = 1.09 rx). The face
 * is the masked element (`data-arch-mask`) of the doorway scene; its parent is the container of the same width.
 * The wash of `tone` is the load colour under the photo (never a grey box).
 */
export function LandingArch({
  aspect = "4/5",
  mask,
  tone = "massage",
  reveal,
  className,
  faceClassName,
  style,
  children,
  ...props
}: {
  aspect?: "4/5" | "3/4" | "2/3" | "fill";
  mask?: "doorway";
  /** category wash slug (tokens `--color-tone-*`) */
  tone?: string;
  /** arch rise target for the motion layer */
  reveal?: "arch";
  className?: string;
  faceClassName?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & Record<`data-${string}`, string | undefined>) {
  return (
    <div
      data-arch="frame"
      data-aspect={aspect}
      data-reveal={reveal}
      className={cn("lp-arch", className)}
      style={{ ...(aspect !== "fill" ? ({ "--lp-aspect": aspect } as CSSProperties) : null), ...style }}
      {...props}
    >
      <div data-arch-mask={mask} className={cn("lp-arch-face", faceClassName)} style={{ backgroundColor: `var(--color-tone-${tone}, var(--color-tone-massage))` }}>
        {children}
      </div>
    </div>
  );
}
