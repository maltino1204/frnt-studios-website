import type { CSSProperties, ImgHTMLAttributes, Ref } from "react";

/**
 * The attributes of one landing photo: what `getImageProps()` from `next/image` returns (the optimiser URLs, `srcSet`,
 * `sizes`, `loading`, `fetchPriority`, the fill or intrinsic `style`), built on the server by `landingImgAttrs()`
 * (landing-image.tsx). Plain data, so a server component can hand it to a client island (the hero arch, the 03
 * preview, the 07 screens) without the client loading `next/image` or the image registry (audit-2 RT-5).
 */
export type LandingImgAttrs = {
  src: string;
  srcSet?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "auto" | "sync";
  fetchPriority?: "high" | "low" | "auto";
  width?: number;
  height?: number;
  style: CSSProperties;
  /** the marker `next/image` puts on its own <img> ("fill" or "1"); kept so the markup stays the same */
  "data-nimg": "fill" | "1";
};

/**
 * A landing photo as a plain <img>, the markup `next/image` renders (no client component). Usable from server and
 * client components; the attributes come from the server (`landingImgAttrs()`).
 */
export function LandingImg({
  img,
  alt,
  ...props
}: { img: LandingImgAttrs; alt: string; ref?: Ref<HTMLImageElement> } & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "alt"> &
  Record<`data-${string}`, string | undefined>) {
  // eslint-disable-next-line @next/next/no-img-element -- the optimiser attributes come from getImageProps()
  return <img {...img} alt={alt} {...props} style={props.style ? { ...img.style, ...props.style } : img.style} />;
}
