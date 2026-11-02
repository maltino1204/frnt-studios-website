"use client";

import { lazy, Suspense, useEffect } from "react";
import { loadBookingBar, loadBookingSheet, loadOverlay, mountSurfaces, preloadSurfaces, surfacesReady, useSurfacesMounted } from "./surfaces";

const ChapterOverlay = lazy(() => loadOverlay().then((m) => ({ default: m.ChapterOverlay })));
const BookingBar = lazy(() => loadBookingBar().then((m) => ({ default: m.BookingBar })));
const BookingSheet = lazy(() => loadBookingSheet().then((m) => ({ default: m.BookingSheet })));

/** Commits with the dialogs (same Suspense boundary), after their effects have registered them. */
function Ready() {
  useEffect(() => surfacesReady(), []);
  return null;
}

type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (h: number) => void };

/** Intent: a pointer, touch or key on anything that opens a dialog (index, „Menü“, dock, „Termin finden“, CTAs). */
const TRIGGER = '[aria-haspopup="dialog"], a[href="#termin"], [data-booking-open]';

/**
 * Mounts the chapter overlay, the booking bar and the booking sheet off the critical path (PT-1): after the first
 * scroll or tap (or 10 s after load), in idle periods, or at once on intent on a trigger, whichever comes first.
 */
export function LazySurfaces() {
  const on = useSurfacesMounted();

  useEffect(() => {
    const win = window as IdleWindow;
    const handles: number[] = [];
    let started = false;
    // Off the load path: the first scroll or tap (the visitor is engaging), or 10 s after load at the latest; then the
    // modules load and the dialogs mount in an idle period.
    const start = () => {
      if (started) return;
      started = true;
      for (const t of ["scroll", "pointerdown", "keydown"]) window.removeEventListener(t, start, true);
      const idle = (cb: () => void) => {
        if (win.requestIdleCallback) handles.push(win.requestIdleCallback(cb, { timeout: 3000 }));
        else handles.push(window.setTimeout(cb, 300));
      };
      idle(() => {
        preloadSurfaces();
        idle(() => void mountSurfaces());
      });
    };
    for (const t of ["scroll", "pointerdown", "keydown"]) window.addEventListener(t, start, { capture: true, passive: true, once: true });
    const latest = window.setTimeout(start, 10_000);

    // Intent on a dialog trigger mounts at once (the click then awaits `mountSurfaces()`).
    const onIntent = (e: Event) => {
      if ((e.target as Element | null)?.closest?.(TRIGGER)) void mountSurfaces();
    };
    const opts = { capture: true, passive: true } as const;
    for (const t of ["pointerdown", "pointerover", "focusin", "keydown"]) document.addEventListener(t, onIntent, opts);
    return () => {
      window.clearTimeout(latest);
      for (const t of ["scroll", "pointerdown", "keydown"]) window.removeEventListener(t, start, true);
      for (const h of handles) {
        if (win.cancelIdleCallback) win.cancelIdleCallback(h);
        else window.clearTimeout(h);
      }
      for (const t of ["pointerdown", "pointerover", "focusin", "keydown"]) document.removeEventListener(t, onIntent, opts);
    };
  }, []);

  if (!on) return null;
  return (
    <Suspense fallback={null}>
      <ChapterOverlay />
      <BookingBar />
      <BookingSheet />
      <Ready />
    </Suspense>
  );
}
