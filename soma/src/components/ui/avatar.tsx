"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { AI_PORTRAIT_LABEL, avatarImagePath, imageFocal, isAiImage, resolveAvatar, resolveImage } from "@/lib/images";
import { initials } from "@/lib/initials";
import { toneKey, toneStyle } from "@/lib/tone";

export { initials };

/** The O-oval of the wordmark (332 : 362) for portraits. */
const OVAL = "332 / 362";

/**
 * Circular avatar ≤ 48 px (brand/BRAND_GUIDELINES.md § 5.4): initials in Newsreader Display at 42 % of the
 * diameter, Espresso on the person's category wash (seeded by name), a 1 px hairline ring. The photo fades in
 * over it (640 ms).
 */
export function Avatar({ src, name, size = 40, className }: { src?: string | null; name: string; size?: 24 | 32 | 40 | 48; className?: string }) {
  // ≤ 48 px: the head-and-shoulders crop when the registry has one (review R7), else the portrait itself.
  const crop = avatarImagePath(src);
  const url = resolveAvatar(src);
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display leading-none font-normal tracking-[-0.01em] shadow-[inset_0_0_0_1px_rgb(37_33_31/0.1)]",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42), ...toneStyle(toneKey(null, name)) }}
      aria-hidden
    >
      <span className="translate-y-[0.04em]">{initials(name)}</span>
      {url && state !== "error" ? (
        <Image
          src={url}
          alt=""
          fill
          sizes={`${size}px`}
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
          className={cn("object-cover transition-opacity duration-calm ease-arrive", state === "loaded" ? "opacity-100" : "opacity-0")}
          style={{ objectPosition: imageFocal(crop ?? src, "50% 36%") }}
        />
      ) : null}
    </span>
  );
}

/**
 * Portrait (list rows, profile cards, the profile header). Fallback: the person's category wash with initials in
 * Newsreader Display. `shape="oval"` is the brand's O-oval (profile cards, ≥ 96 px); `shape="arch"` crops the
 * profile header; `tile` (default) keeps the radius from className (dense rows). The photo fades in (640 ms).
 */
export function Portrait({
  src,
  name,
  ratio = "1/1",
  sizes,
  priority,
  className,
  shape = "tile",
  crop,
}: {
  src?: string | null;
  name: string;
  ratio?: "1/1" | "4/5" | "3/4";
  sizes: string;
  priority?: boolean;
  className?: string;
  shape?: "tile" | "oval" | "arch";
  /** "avatar": the head-and-shoulders crop; default: the crop when rendered ≤ 96 px (`sizes="80px"`), else the full portrait */
  crop?: "avatar" | "full";
}) {
  const px = /^(\d+)px$/.exec(sizes.trim());
  const small = crop ? crop === "avatar" : shape !== "arch" && !!px && Number(px[1]) <= 96;
  const cropPath = small ? avatarImagePath(src) : null;
  const url = small ? resolveAvatar(src) : resolveImage(src);
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const [w, h] = ratio.split("/").map(Number);
  return (
    <div
      className={cn(
        "@container relative isolate overflow-hidden",
        shape === "tile" && !className?.includes("rounded") && "rounded-tile",
        shape === "oval" && "rounded-[50%]",
        shape === "arch" && "arch",
        className,
      )}
      style={{
        aspectRatio: shape === "oval" ? OVAL : ratio,
        ...(shape === "arch" ? { ["--arch-aspect" as string]: w / h } : null),
        ...toneStyle(toneKey(null, name)),
      }}
    >
      {state !== "loaded" ? (
        <span aria-hidden className="absolute inset-0 flex items-center justify-center font-display text-[34cqw] leading-none font-normal tracking-[-0.02em] @min-[10rem]:text-[22cqw]">
          {initials(name)}
        </span>
      ) : null}
      {url && state !== "error" ? (
        <Image
          src={url}
          alt={isAiImage(src) ? `Porträt von ${name} (${AI_PORTRAIT_LABEL})` : `Porträt von ${name}`}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
          // noscript: without JS onLoad never fires, so the photo shows at once instead of staying at opacity 0.
          className={cn("z-[3] object-cover transition-opacity duration-calm ease-arrive", state === "loaded" ? "opacity-100" : "opacity-0 noscript:opacity-100")}
          style={{ objectPosition: imageFocal(cropPath ?? src, "50% 36%") }}
        />
      ) : null}
    </div>
  );
}
