"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { AI_IMAGE_LABEL, imageFocal, isAiImage, resolveImage, toneFor } from "@/lib/images";
import { ToneFill } from "./motif";

/**
 * Empty image slot (brand/BRAND_GUIDELINES.md § 5.4): the category wash, a 1.5 px arch outline and the category
 * word in the serif italic, bottom left. Static. Decorative: the real label is always rendered as text elsewhere.
 */
export function TonePanel({
  tone,
  word,
  size = "m",
  seed,
  arch = true,
  className,
}: {
  tone: string;
  word?: string;
  size?: "s" | "m" | "l";
  /** kept for API compatibility; the wash is the category's, not seeded */
  seed?: string;
  /** the arch outline (off for small tiles) */
  arch?: boolean;
  className?: string;
}) {
  const key = tone === "nacht" ? "nacht" : toneFor(tone);
  return <ToneFill tone={key} seed={seed} word={word} wordSize={size} arch={arch} className={className} />;
}

/** "4/5" → 0.8 (width / height), for the arch radius. */
function ratioValue(ratio: string | undefined): number | undefined {
  if (!ratio) return undefined;
  const [w, h] = ratio.split("/").map((n) => Number(n.trim()));
  return w && h ? w / h : undefined;
}

/**
 * Art-directed photo with the designed fallback underneath. The photo fades in over its tone slot and settles from
 * scale 1.04 to 1 (the brand's "arrival", 640 / 900 ms; reduced motion: it simply appears). If it cannot load,
 * the slot remains. `shape="arch"` crops it to the SOMA arch (hero, editorial, category and card images);
 * `shape="oval"` to the full O (portraits).
 */
export function Photo({
  src,
  alt,
  tone = "massage",
  word,
  sizes,
  priority,
  className,
  imgClassName,
  ratio,
  wordSize,
  focal,
  seed,
  shape = "rect",
  archAspect,
}: {
  src: string | null | undefined;
  alt: string;
  tone?: string;
  word?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  /** CSS aspect-ratio, e.g. "4/5". Omit when the parent sizes the box. */
  ratio?: string;
  wordSize?: "s" | "m" | "l";
  focal?: string;
  /** seeds the fallback; defaults to tone + word */
  seed?: string;
  /** crop: rect (radius from className), the SOMA arch, or the O-oval */
  shape?: "rect" | "arch" | "oval";
  /** width / height of the box for the arch curve when `ratio` is not given (default 0.8 = 4:5) */
  archAspect?: number;
}) {
  const url = resolveImage(src);
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const aspect = archAspect ?? ratioValue(ratio);
  const style: CSSProperties = {
    ...(ratio ? { aspectRatio: ratio } : null),
    ...(shape === "arch" && aspect ? { ["--arch-aspect" as string]: aspect } : null),
    ...(shape === "oval" ? { borderRadius: "50%" } : null),
  };
  return (
    <div className={cn("relative isolate overflow-hidden", shape === "arch" && "arch", className)} style={style}>
      <TonePanel tone={tone} word={state === "loaded" ? undefined : word} size={wordSize} seed={seed} arch={shape !== "oval"} />
      {url && state !== "error" ? (
        <Image
          src={url}
          alt={alt && isAiImage(src) ? `${alt} (${AI_IMAGE_LABEL})` : alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
          style={{ objectPosition: focal ?? imageFocal(src) }}
          className={cn(
            "z-[3] object-cover transition-[opacity,scale] ease-arrive [transition-duration:var(--transition-duration-calm),900ms]",
            state === "loaded" ? "scale-100 opacity-100" : "scale-[1.04] opacity-0",
            imgClassName,
          )}
        />
      ) : null}
    </div>
  );
}
