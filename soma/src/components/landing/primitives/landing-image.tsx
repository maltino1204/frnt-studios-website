import Image from "next/image";
import { cn } from "@/lib/cn";
import { imageFocal, resolveImage } from "@/lib/images";

/**
 * A landing photo: `next/image` (AVIF/WebP via `images.formats`) filling its arch or band, at its art-directed focal
 * point. It paints at opacity 1: there is no fade. The motion layer may settle it (`data-reveal="settle"`); the LCP
 * image (`lcp`) is preloaded (Next 16 `preload`, which replaces `priority`) and carries `data-lcp`, so it is never
 * animated in.
 */
export function LandingImage({
  src,
  alt,
  sizes,
  focal,
  lcp,
  settle,
  quality,
  className,
  ...props
}: {
  src: string;
  alt: string;
  sizes: string;
  /** CSS object-position; defaults to the registry focal point */
  focal?: string;
  lcp?: boolean;
  /** the photo settles (1.04 → 1) when its arch rises (motion layer) */
  settle?: boolean;
  quality?: number;
  className?: string;
} & Record<`data-${string}`, string | undefined>) {
  const url = resolveImage(src) ?? src;
  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes={sizes}
      quality={quality}
      preload={lcp || undefined}
      data-lcp={lcp ? "" : undefined}
      data-reveal={settle && !lcp ? "settle" : undefined}
      className={cn("object-cover", className)}
      style={{ objectPosition: focal ?? imageFocal(src, "50% 50%") }}
      {...props}
    />
  );
}
