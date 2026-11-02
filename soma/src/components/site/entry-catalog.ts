import "server-only";
import { getImageProps } from "next/image";
import { imageFocal, images, resolveImage, toneFor } from "@/lib/images";
import type { CategoryWithServicesDTO } from "@/server/dto";
import { toEntryCatalog, type EntryCategory, type EntryThumb } from "./discovery-copy";

/** The Was? picker's category photo is `w-11` (44 px) square. */
const THUMB_PX = 44;
/**
 * The candidates a 44 px slot can pick at a device pixel ratio of 1 to 4 (44 to 176 px: 48 w … 256 w). The others
 * (32 w, and 384 w up to 2048 w) are never chosen and stay out of the page's payload.
 */
const usable = (w: number) => w >= THUMB_PX && w <= 256;

/**
 * The picker's photo for a category, on the server: the same optimiser URLs and `srcSet` the kit `<Photo>`
 * (`next/image`) produced in the client, and the category's focal point (registry). Null when the registry has no
 * loadable image (the picker then shows the tone wash alone, as `<Photo>` did).
 */
export function entryThumb(slug: string, imagePath: string | null): EntryThumb | null {
  const path = imagePath ?? images.category(slug);
  const url = resolveImage(path);
  if (!url) return null;
  const { props } = getImageProps({ src: url, alt: "", fill: true, sizes: `${THUMB_PX}px` });
  const srcSet = props.srcSet
    ?.split(", ")
    .filter((c) => usable(Number(/ (\d+)w$/.exec(c)?.[1] ?? 0)))
    .join(", ");
  return {
    src: props.src,
    srcSet: srcSet || undefined,
    sizes: props.sizes,
    loading: props.loading as EntryThumb["loading"],
    decoding: props.decoding as EntryThumb["decoding"],
    position: imageFocal(path),
  };
}

/** `toEntryCatalog()` plus each category's tone and picker photo (server only; see `EntryThumb`). */
export function entryCatalog(catalog: CategoryWithServicesDTO[], floors: Record<string, number> = {}): EntryCategory[] {
  return toEntryCatalog(catalog, floors).map((c) => ({ ...c, tone: toneFor(c.slug), thumb: entryThumb(c.slug, c.imagePath) }));
}
