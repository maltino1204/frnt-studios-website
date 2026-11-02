"use client";

import { useEffect } from "react";
import { requestBooking } from "./surfaces";
import { jumpToChapter } from "./jump";

/**
 * In-page link behaviour for the landing, one capture listener (it runs before the global MotionRoot handler):
 * - `#chapter` links outside dialogs jump and focus the chapter's heading (spec § 5.1);
 * - booking CTAs (`<a href="#termin" data-booking-open="ch04">`) open booking access (spec § 5.5).
 * Without JS both stay plain anchors.
 */
export function ChapterLinks() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href^='#']") as HTMLAnchorElement | null;
      if (!a || a.closest("dialog")) return;
      const source = a.getAttribute("data-booking-open");
      if (source) {
        e.preventDefault();
        void requestBooking({ source, categorySlug: a.getAttribute("data-booking-category") ?? undefined });
        return;
      }
      const id = decodeURIComponent(a.getAttribute("href")!.slice(1));
      const target = id ? document.getElementById(id) : null;
      if (!target?.matches("[data-chapter]")) return;
      e.preventDefault();
      jumpToChapter(id);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
