import { cn } from "@/lib/cn";
import { AI_IMAGE_LABEL, AI_IMAGES_LABEL, AI_PORTRAIT_LABEL, isAiImage } from "@/lib/images";

/**
 * Visible AI disclosure (brand/photography/PHOTOGRAPHY.md § 0, BRAND_GUIDELINES.md § 10.1): AI-generated faces never
 * appear next to a name, a rating or „Verifiziert“ without „Demo-Profil · Foto KI-generiert“ beside them. Renders
 * nothing for real (uploaded) photos or when there is no photo. Plain text in the 12 px caption style, so screen
 * readers read it with the card; works in server and client components.
 *
 * - `kind="portrait"` (default): a Profi's photo next to their name.
 * - `kind="image"`: an editorial photo („Bild KI-generiert“); `kind="images"` for a set (portfolio).
 */
export function AiLabel({
  src,
  srcs,
  kind = "portrait",
  className,
}: {
  src?: string | null;
  /** any of these AI images triggers the label (portfolio grids) */
  srcs?: Array<string | null | undefined>;
  kind?: "portrait" | "image" | "images";
  className?: string;
}) {
  const ai = srcs ? srcs.some((s) => isAiImage(s)) : isAiImage(src);
  if (!ai) return null;
  const text = kind === "portrait" ? AI_PORTRAIT_LABEL : kind === "images" ? AI_IMAGES_LABEL : AI_IMAGE_LABEL;
  return <span className={cn("block type-caption text-ink-muted", className)}>{text}</span>;
}
