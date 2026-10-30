"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { imageFocal, resolveImage } from "@/lib/images";

export function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\s.-]/gu, "").split(/[\s.-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "·";
}

/** Circular avatar ≤ 48px; initials fallback in Instrument Sans 600 on sunken surface. */
export function Avatar({ src, name, size = 40, className }: { src?: string | null; name: string; size?: 24 | 32 | 40 | 48; className?: string }) {
  const url = resolveImage(src);
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-sunken text-ink-muted", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), fontWeight: 600 }}
      aria-hidden
    >
      {initials(name)}
      {url && !failed ? (
        <Image src={url} alt="" fill sizes={`${size}px`} onError={() => setFailed(true)} className="object-cover" style={{ objectPosition: imageFocal(src, "50% 36%") }} />
      ) : null}
    </span>
  );
}

/**
 * Rectangular portrait (list rows 1:1, profile 4:5). Initials fallback in Newsreader
 * at 32% of the tile width, centred at 40% from the top.
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
  return (
    <div className={cn("@container relative overflow-hidden bg-surface-sunken", className)} style={{ aspectRatio: ratio }}>
      {state !== "loaded" ? (
        <span aria-hidden className="absolute inset-x-0 top-[40%] -translate-y-1/2 text-center font-display text-[32cqw] leading-none font-[380] text-tone-massage-ink">
          {initials(name)}
        </span>
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
          className={cn("object-cover transition-opacity duration-calm ease-calm", state === "loaded" ? "opacity-100" : "opacity-0")}
          style={{ objectPosition: imageFocal(src, "50% 36%") }}
        />
      ) : null}
    </div>
  );
}
