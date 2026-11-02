import "server-only";
import { getImageProps } from "next/image";
import { preload } from "react-dom";
import { cn } from "@/lib/cn";
import { imageFocal, resolveImage } from "@/lib/images";
import { LandingImg, type LandingImgAttrs } from "./landing-img";

/**
 * The <img> attributes of a landing photo, on the server: `getImageProps()` from `next/image` (AVIF/WebP through the
 * optimiser, the same URLs, `srcSet` and `sizes` the `<Image>` component produced), the registry's local path and
 * focal point (`@/lib/images`). `fill` photos cover their arch or band at `focal`; without `fill`, `width`/`height`
 * are the intrinsic size. The LCP photo (`lcp`) is eager, `fetchPriority="high"` and preloaded with the same
 * `imageSrcSet`/`imageSizes` (React's `preload()`, which `<Image preload>` also used).
 */
export function landingImgAttrs(
  src: string,
  {
    sizes,
    focal,
    lcp,
    quality,
    width,
    height,
  }: { sizes: string; focal?: string; lcp?: boolean; quality?: number; width?: number; height?: number },
): LandingImgAttrs {
  const fill = width == null || height == null;
  const { props } = getImageProps({
    src: resolveImage(src) ?? src,
    alt: "",
    sizes,
    quality,
    ...(fill ? { fill: true, style: { objectPosition: focal ?? imageFocal(src, "50% 50%") } } : { width, height }),
    preload: lcp || undefined,
    fetchPriority: lcp ? "high" : undefined,
  });
  if (lcp) preload(props.src, { as: "image", imageSrcSet: props.srcSet, imageSizes: props.sizes, fetchPriority: "high" });
  return {
    src: props.src,
    srcSet: props.srcSet,
    sizes: props.sizes,
    loading: props.loading as LandingImgAttrs["loading"],
    decoding: props.decoding as LandingImgAttrs["decoding"],
    fetchPriority: props.fetchPriority,
    width: props.width as number | undefined,
    height: props.height as number | undefined,
    style: props.style ?? {},
    "data-nimg": fill ? "fill" : "1",
  };
}

/**
 * A landing photo (server component): a plain <img> from `getImageProps()` filling its arch or band, at its
 * art-directed focal point. It paints at opacity 1: there is no fade. The motion layer may settle it
 * (`data-reveal="settle"`); the LCP image (`lcp`) is preloaded and carries `data-lcp`, so it is never animated in.
 * Client islands get the same attributes as data (`landingImgAttrs()`) and render <LandingImg>.
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
  return (
    <LandingImg
      img={landingImgAttrs(src, { sizes, focal, lcp, quality })}
      alt={alt}
      data-lcp={lcp ? "" : undefined}
      data-reveal={settle && !lcp ? "settle" : undefined}
      className={cn("object-cover", className)}
      {...props}
    />
  );
}
