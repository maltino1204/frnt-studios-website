"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { auraBackground, auraPalette } from "@/lib/aura";
import { imageFocal, resolveImage } from "@/lib/images";
import { AuraArt } from "./aura";

export function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\s.-]/gu, "").split(/[\s.-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "·";
}

/**
 * Circular avatar ≤ 48px: monogram on a seeded aura tile with a white ring
 * and hairline. The photo fades in over it when it loads.
 */
export function Avatar({ src, name, size = 40, className }: { src?: string | null; name: string; size?: 24 | 32 | 40 | 48; className?: string }) {
  const url = resolveImage(src);
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const palette = auraPalette(null, name);
  const { backgroundColor, backgroundImage } = auraBackground(name, null);
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.75),0_0_0_1px_rgb(23_22_31/0.08),0_1px_2px_rgb(23_22_31/0.08)]",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        fontWeight: 620,
        letterSpacing: "-0.03em",
        color: palette.ink,
        backgroundColor,
        backgroundImage,
      }}
      aria-hidden
    >
      {initials(name)}
      {url && state !== "error" ? (
        <Image
          src={url}
          alt=""
          fill
          sizes={`${size}px`}
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
          className={cn("object-cover transition-opacity duration-calm ease-calm", state === "loaded" ? "opacity-100" : "opacity-0")}
          style={{ objectPosition: imageFocal(src, "50% 36%") }}
        />
      ) : null}
    </span>
  );
}

/**
 * Rectangular portrait (list rows 1:1, profile 4:5). Fallback: the person's
 * seeded aura artwork with a monogram; from 10rem wide the monogram sits on
 * a glass disc. The photo fades in over it (640 ms).
 */
export function Portrait({
  src,
  name,
  ratio = "1/1",
  sizes,
  priority,
  className,
}: {
  src?: string | null;
  name: string;
  ratio?: "1/1" | "4/5";
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const url = resolveImage(src);
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const palette = auraPalette(null, name);
  return (
    <div
      className={cn("@container relative isolate overflow-hidden bg-surface-sunken", !className?.includes("rounded") && "rounded-tile", className)}
      style={{ aspectRatio: ratio }}
    >
      <AuraArt seed={name} />
      {state !== "loaded" ? (
        <>
          <span aria-hidden className="absolute inset-0 z-[2] flex items-center justify-center">
            <span
              className="flex items-center justify-center rounded-full text-[30cqw] leading-none font-[620] tracking-[-0.04em] @min-[10rem]:size-[46cqw] @min-[10rem]:bg-white/45 @min-[10rem]:text-[17cqw] @min-[10rem]:shadow-[inset_0_1px_0_rgb(255_255_255/0.8),0_0_0_1px_rgb(255_255_255/0.5),0_12px_32px_-12px_rgb(23_22_31/0.25)] @min-[10rem]:backdrop-blur-md"
              style={{ color: palette.ink }}
            >
              {initials(name)}
            </span>
          </span>
        </>
      ) : null}
      {url && state !== "error" ? (
        <Image
          src={url}
          alt={`Porträt von ${name}`}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
          className={cn("z-[3] object-cover transition-opacity duration-calm ease-calm", state === "loaded" ? "opacity-100" : "opacity-0")}
          style={{ objectPosition: imageFocal(src, "50% 36%") }}
        />
      ) : null}
    </div>
  );
}
