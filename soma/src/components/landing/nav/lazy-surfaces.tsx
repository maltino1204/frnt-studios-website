"use client";

import { useEffect } from "react";
import { setBookingSurfaceLoader } from "../booking/booking-access";
import { mountSurfaces, preloadSurfaces, surfacesReady, useSurfaceModules } from "./surfaces";

/** Commits with the dialogs, after their effects have registered them (it is their last sibling). */
function Ready() {
  useEffect(() => surfacesReady(), []);
  return null;
}

type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (h: number) => void };

/** Intent: a pointer, touch or key on anything that opens a dialog (index, „Menü“, dock, „Termin finden“, CTAs). */
const TRIGGER = '[aria-haspopup="dialog"], a[href="#termin"], [data-booking-open]';

/**
 * Mounts the chapter overlay, the booking bar and the booking sheet off the critical path (PT-1): after the first
 * scroll or tap (or 10 s after load), in idle periods, or at once on intent on a trigger, whichever comes first. They
 * render once their modules have loaded (nav/surfaces.ts), never as a suspended lazy component. A first tap or key
 * anywhere fetches and evaluates their modules at once (audit-3 M-1: the next tap may be the dock's „Termin finden“);
 * the mount still waits for an idle period.
 */
export function LazySurfaces() {
  const surfaces = useSurfaceModules();

  useEffect(() => {
    // A bare `openBooking()` (or a raw `soma:booking:open` event) before the dialogs exist mounts them and is queued
    // by booking-access until the bar or sheet registers.
    setBookingSurfaceLoader(mountSurfaces);
    const win = window as IdleWindow;
    const handles: number[] = [];
    let started = false;
    // Off the load path: the first scroll or tap (the visitor is engaging), or 10 s after load at the latest; then the
    // modules load and the dialogs mount in an idle period.
    const START = ["scroll", "pointerdown", "touchstart", "keydown"] as const;
    const start = (e?: Event) => {
      if (started) return;
      started = true;
      for (const t of START) window.removeEventListener(t, start, true);
      if (e && e.type !== "scroll") void preloadSurfaces().catch(() => undefined);
      const idle = (cb: () => void) => {
        if (win.requestIdleCallback) handles.push(win.requestIdleCallback(cb, { timeout: 3000 }));
        else handles.push(window.setTimeout(cb, 300));
      };
      idle(() => {
        void preloadSurfaces().catch(() => undefined);
        idle(() => void mountSurfaces());
      });
    };
    for (const t of START) window.addEventListener(t, start, { capture: true, passive: true, once: true });
    const latest = window.setTimeout(start, 10_000);

    // Intent on a dialog trigger mounts at once (the click then awaits `mountSurfaces()`).
    const onIntent = (e: Event) => {
      if ((e.target as Element | null)?.closest?.(TRIGGER)) void mountSurfaces();
    };
    const opts = { capture: true, passive: true } as const;
    for (const t of ["pointerdown", "pointerover", "focusin", "keydown"]) document.addEventListener(t, onIntent, opts);
    return () => {
      window.clearTimeout(latest);
      for (const t of START) window.removeEventListener(t, start, true);
      for (const h of handles) {
        if (win.cancelIdleCallback) win.cancelIdleCallback(h);
        else window.clearTimeout(h);
      }
      for (const t of ["pointerdown", "pointerover", "focusin", "keydown"]) document.removeEventListener(t, onIntent, opts);
      setBookingSurfaceLoader(null);
    };
  }, []);

  if (!surfaces) return null;
  const { ChapterOverlay, BookingBar, BookingSheet } = surfaces;
  return (
    <>
      <ChapterOverlay />
      <BookingBar />
      <BookingSheet />
      <Ready />
    </>
  );
}
