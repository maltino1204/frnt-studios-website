"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { CATEGORY_AURA } from "@/lib/aura";
import { imageFocal, resolveImage, toneFor } from "@/lib/images";
import { AuraArt } from "./aura";

/**
 * Generative fallback panel (design-guideline v2 §9): the category's aura
 * artwork, seeded, with the word set in the accent italic. Decorative: the
 * real label is always rendered as text elsewhere.
 */
export function TonePanel({
  tone,
  word,
  size = "m",
  seed,
  className,
}: {
  tone: string;
  word?: string;
  size?: "s" | "m" | "l";
  /** seeds the artwork (slug, id); defaults to tone + word */
  seed?: string;
  className?: string;
}) {
  const key = tone === "nacht" ? "nacht" : toneFor(tone);
  const dark = CATEGORY_AURA[key]?.dark;
  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden", className)}>
      <AuraArt seed={seed ?? `${key}:${word ?? ""}`} tone={key} animate={size === "l"} />
      {word ? (
        <span
          className={cn(
            "absolute inset-x-5 bottom-4 z-[2] line-clamp-2 type-accent leading-[1.05] lg:inset-x-7 lg:bottom-6",
            size === "l" ? "text-[clamp(2.25rem,1.5rem+3vw,4rem)]" : size === "s" ? "text-[clamp(1.5rem,1.3rem+0.8vw,2rem)]" : "text-[clamp(1.875rem,1.5rem+1.4vw,2.75rem)]",
            dark ? "text-white/90" : "text-ink/85",
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
 * over its aura panel (640ms ease-calm); if it cannot load, the panel remains.
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
  /** seeds the fallback artwork; defaults to tone + word */
  seed?: string;
}) {
  const url = resolveImage(src);
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  return (
    <div className={cn("relative isolate overflow-hidden", className)} style={ratio ? { aspectRatio: ratio } : undefined}>
      <TonePanel tone={tone} word={state === "loaded" ? undefined : word} size={state === "loaded" && wordSize === "l" ? "m" : wordSize} seed={seed} />
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
            "z-[3] object-cover transition-opacity duration-calm ease-calm",
            state === "loaded" ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
        />
      ) : null}
    </div>
  );
}
