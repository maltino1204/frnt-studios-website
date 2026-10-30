"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { imageFocal, resolveImage, toneFor } from "@/lib/images";

/* Literal class maps so Tailwind generates every tone utility. */
const TONE_BG: Record<string, string> = {
  massage: "bg-tone-massage",
  manikuere: "bg-tone-manikuere",
  pedikuere: "bg-tone-pedikuere",
  kosmetik: "bg-tone-kosmetik",
  "make-up": "bg-tone-make-up",
  "haare-styling": "bg-tone-haare-styling",
  "brows-lashes": "bg-tone-brows-lashes",
  nacht: "bg-tone-nacht",
};
const TONE_INK: Record<string, string> = {
  massage: "text-tone-massage-ink bg-tone-massage-ink",
  manikuere: "text-tone-manikuere-ink bg-tone-manikuere-ink",
  pedikuere: "text-tone-pedikuere-ink bg-tone-pedikuere-ink",
  kosmetik: "text-tone-kosmetik-ink bg-tone-kosmetik-ink",
  "make-up": "text-tone-make-up-ink bg-tone-make-up-ink",
  "haare-styling": "text-tone-haare-styling-ink bg-tone-haare-styling-ink",
  "brows-lashes": "text-tone-brows-lashes-ink bg-tone-brows-lashes-ink",
  nacht: "text-tone-nacht-ink bg-tone-nacht-ink",
};

/**
 * Tone-on-tone fallback panel (docs/art-direction.md §5): roof line + italic display word.
 * Decorative: the real label is always rendered as text elsewhere.
 */
export function TonePanel({
  tone,
  word,
  size = "m",
  className,
}: {
  tone: string;
  word?: string;
  size?: "s" | "m" | "l";
  className?: string;
}) {
  const key = tone === "nacht" ? "nacht" : toneFor(tone);
  const ink = TONE_INK[key] ?? TONE_INK.massage;
  const inkText = ink.split(" ")[0];
  const inkBg = ink.split(" ")[1];
  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden", TONE_BG[key], className)}>
      <span className={cn("absolute top-5 left-5 h-0.5 w-6 lg:top-7 lg:left-7", inkBg)} />
      {word ? (
        <span
          className={cn(
            "absolute inset-x-5 bottom-5 line-clamp-2 italic lg:inset-x-7 lg:bottom-7",
            size === "l" ? "type-display-l" : size === "s" ? "type-display-s" : "type-display-m",
            inkText,
          )}
        >
          {word}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Art-directed photo with the designed fallback underneath. The photo fades in
 * over its tone panel (640ms ease-calm); if it cannot load, the panel remains.
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
}) {
  const url = resolveImage(src);
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  return (
    <div className={cn("relative overflow-hidden", className)} style={ratio ? { aspectRatio: ratio } : undefined}>
      <TonePanel tone={tone} word={state === "loaded" ? undefined : word} size={wordSize} />
      {url && state !== "error" ? (
        <Image
          src={url}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
          style={{ objectPosition: focal ?? imageFocal(src) }}
          className={cn(
            "object-cover transition-opacity duration-calm ease-calm",
            state === "loaded" ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
        />
      ) : null}
    </div>
  );
}
