import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { toneKey, toneStyle } from "@/lib/tone";

/*
 * The SOMA arch (der Bogen), brand/BRAND_GUIDELINES.md § 5.1 and § 5.4: the upper half of the wordmark's O
 * (ry = 1.09 rx) on straight flanks. In the UI it is always an image frame or a hairline outline, never a filled
 * decorative shape, never a gradient and never a shadow on the arch itself. Server components, no client JS.
 */

/** SVG path of the arch inside (x, y, w, h), with the O's handle tensions (0.57 / 0.585). */
export function archPath(x: number, y: number, w: number, h: number): string {
  const rx = w / 2;
  const ry = Math.min(rx * 1.09, h);
  const cx = x + rx;
  const sy = y + ry;
  const f = (v: number) => +v.toFixed(2);
  return `M${f(x)} ${f(y + h)}L${f(x)} ${f(sy)}C${f(x)} ${f(sy - ry * 0.585)} ${f(cx - rx * 0.57)} ${f(y)} ${f(cx)} ${f(y)}C${f(cx + rx * 0.57)} ${f(y)} ${f(x + w)} ${f(sy - ry * 0.585)} ${f(x + w)} ${f(sy)}L${f(x + w)} ${f(y + h)}`;
}

const LINE_4_5 = archPath(1, 1, 78, 99);

/**
 * Standalone arch outline (4:5, 1.5 px, currentColor): empty states (72 px in stone-deep), small brand marks.
 * Size it with a width class; the height follows.
 */
export function ArchLine({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 80 100" aria-hidden focusable="false" className={cn("block h-auto w-[72px] shrink-0 overflow-visible", className)} fill="none">
      <path d={LINE_4_5} stroke="currentColor" strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" strokeLinecap="butt" />
    </svg>
  );
}

/**
 * The arch outline for an empty image slot: inset 12 % at the top and 14 % at the sides, ending above the word.
 * Must sit inside a size container (ToneFill sets one); its width follows the slot, capped by the height so the
 * curve keeps the O ratio in landscape slots too. Hidden below 120 px arch width (brand: a rounded tile there).
 */
function SlotArch() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute top-[12cqh] bottom-[18cqh] left-1/2 -translate-x-1/2 border-[1.5px] border-b-0 border-current opacity-70 @max-[10.5rem]:hidden"
      style={{
        width: "min(72cqw, 84cqh)",
        borderRadius: "50% 50% 0 0 / calc(0.545 * min(72cqw, 84cqh)) calc(0.545 * min(72cqw, 84cqh)) 0 0",
      }}
    />
  );
}

const WORD_SIZE = {
  s: "text-[clamp(1.375rem,1.25rem+0.6vw,1.75rem)]",
  m: "text-[clamp(1.5rem,1.3rem+1vw,2.25rem)]",
  l: "text-[clamp(2rem,1.5rem+2.2vw,3.25rem)]",
} as const;

/**
 * Flat category tone (the replacement for the v2 aura artwork): the wash, an optional arch outline and the
 * category word in the serif italic, bottom left. Static: no drift, no grain, no gradient. Decorative
 * (aria-hidden); render the real label as text elsewhere. Fills its positioned parent (absolute inset-0).
 */
export function ToneFill({
  tone,
  seed,
  word,
  wordSize = "m",
  arch = true,
  className,
  style,
  children,
}: {
  /** category slug, "nacht", or anything else to seed a wash (a person, a city) */
  tone?: string | null;
  seed?: string;
  word?: ReactNode;
  wordSize?: keyof typeof WORD_SIZE;
  /** the arch outline (empty image slots); off for plain tone tiles */
  arch?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const key = toneKey(tone, seed);
  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden", className)} style={{ ...toneStyle(key), containerType: "size", ...style }}>
      {arch ? <SlotArch /> : null}
      {word ? (
        <span className={cn("absolute inset-x-5 bottom-4 line-clamp-2 type-accent leading-[1.05] @max-[7rem]:hidden lg:inset-x-6 lg:bottom-5", WORD_SIZE[wordSize])}>
          {word}
        </span>
      ) : null}
      {children}
    </div>
  );
}
