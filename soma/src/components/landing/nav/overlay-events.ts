import { mountSurfaces, yieldToMain } from "./surfaces";

/** Opens the chapter overlay from any trigger (header index, „Menü“, dock). The overlay listens on `window`. */
export const CHAPTER_OVERLAY_EVENT = "soma:chapters:open";

/** Mounts the overlay first if it has not been yet (it loads on demand; nav/surfaces.ts), then opens it. */
export async function openChapterOverlay(): Promise<void> {
  if (typeof window === "undefined") return;
  await mountSurfaces();
  await yieldToMain();
  window.dispatchEvent(new CustomEvent(CHAPTER_OVERLAY_EVENT));
}
