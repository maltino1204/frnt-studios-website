import "server-only";
import { getImageProps } from "next/image";
import { imageFocal, images, resolveImage, toneFor } from "@/lib/images";
import type { CategoryWithServicesDTO } from "@/server/dto";
import { toEntryCatalog, type EntryCategory, type EntryThumb } from "./discovery-copy";

/** The Was? picker's category photo is `w-11` (44 px) square. */
const THUMB_SIZES = "44px";
/** A 44 px slot never picks a wider candidate than 256 w (DPR 4: 176 px): the wider ones stay out of the payload. */
const THUMB_MAX_W = 384;

/**
 * The picker's photo for a category, on the server: the same optimiser URLs, `srcSet` and fill style the kit
 * `<Photo>` (`next/image`) produced in the client, at the category's focal point (registry). Null when the
 * registry has no loadable image (the picker then shows the tone wash alone, as `<Photo>` did).
 */
export function entryThumb(slug: string, imagePath: string | null): EntryThumb | null {
  const path = imagePath ?? images.category(slug);
  const url = resolveImage(path);
  if (!url) return null;
  const { props } = getImageProps({ src: url, alt: "", fill: true, sizes: THUMB_SIZES, style: { objectPosition: imageFocal(path) } });
  const srcSet = props.srcSet
    ?.split(", ")
    .filter((c) => Number(/ (\d+)w$/.exec(c)?.[1] ?? 0) <= THUMB_MAX_W)
    .join(", ");
  return {
    src: props.src,
    srcSet: srcSet || undefined,
    sizes: props.sizes,
    loading: props.loading as EntryThumb["loading"],
    decoding: props.decoding as EntryThumb["decoding"],
    style: (props.style ?? {}) as EntryThumb["style"],
  };
}

/** `toEntryCatalog()` plus each category's tone and picker photo (server only; see `EntryThumb`). */
export function entryCatalog(catalog: CategoryWithServicesDTO[], floors: Record<string, number> = {}): EntryCategory[] {
  return toEntryCatalog(catalog, floors).map((c) => ({ ...c, tone: toneFor(c.slug), thumb: entryThumb(c.slug, c.imagePath) }));
}
