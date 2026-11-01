/** Opens the chapter overlay from any trigger (header index, „Menü“, dock). The overlay listens on `window`. */
export const CHAPTER_OVERLAY_EVENT = "soma:chapters:open";

export function openChapterOverlay(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHAPTER_OVERLAY_EVENT));
}
