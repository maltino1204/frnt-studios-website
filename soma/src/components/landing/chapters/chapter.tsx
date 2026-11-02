import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { chapterByN, titleId } from "../nav/chapters";

/**
 * A landing chapter (spec § 4, § 11.2): `<section id data-chapter …>` labelled by its heading. Writes the static
 * contract attributes the motion layer reads (data-chapter, -name, -tone, -header-theme) and the colour scope
 * (oxblood). `cv` turns on content-visibility with the chapter's intrinsic sizes (§ 10.4; 04–06 only): the measured
 * content heights at ≥ 1024 (desktop), 768–1023 (tablet, defaults to mobile; a CSS length where it grows with the
 * width) and below (mobile).
 */
const px = (v: number | string) => (typeof v === "number" ? `${v}px` : v);

export function Chapter({
  n,
  className,
  style,
  cv,
  padded = true,
  children,
}: {
  n: number;
  className?: string;
  style?: CSSProperties;
  cv?: { desktop: number; tablet?: number | string; mobile: number };
  /** the chapter padding (72 / 96 / 128 px); off for bands that manage their own */
  padded?: boolean;
  children: ReactNode;
}) {
  const c = chapterByN(n);
  const theme = c.tone === "oxblood" ? "oxblood" : undefined;
  return (
    <section
      id={c.id}
      aria-labelledby={titleId(c.id)}
      data-chapter={c.nn}
      data-chapter-name={c.name}
      data-tone={c.tone}
      data-header-theme={c.headerTheme}
      data-theme={theme}
      className={cn("lp-chapter", `lp-tone-${c.tone}`, padded && "py-(--space-section)", cv && "lp-cv", className)}
      style={cv ? ({ ...style, "--cv-m": `${cv.mobile}px`, "--cv-t": px(cv.tablet ?? cv.mobile), "--cv-d": `${cv.desktop}px` } as CSSProperties) : style}
    >
      {children}
    </section>
  );
}

/** The page container (1376 px, gutters 20 / 32 / 48, safe areas in landscape). */
export function LpContainer({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("lp-container", className)}>{children}</div>;
}
