"use client";

import { useSyncExternalStore, type ComponentType } from "react";
import { isDesktop, openBooking, type BookingOpenDetail } from "../booking/booking-access";

/*
 * The landing's dialogs (chapter overlay, booking bar, booking sheet) load on demand (audit-1 PT-1): their code is
 * fetched when the browser is idle after the first engagement, they mount on idle or on the first intent (pointer,
 * touch or keyboard on a trigger), and they stay mounted once mounted, so a later open only calls showModal(). Every
 * trigger awaits `mountSurfaces()` before it opens a dialog, so a very early click still works.
 *
 * The modules are loaded first and the dialogs mount only then, in one synchronous render (audit-2 N-4): a lazy
 * component that suspends would be retried at low priority, time-sliced between frames, which made an early tap wait
 * ≈ 250 ms of a 4× CPU phone for the mount alone. A module that fails to load leaves the surfaces unmounted, and
 * `booking-access.ts` falls back to the hero entry.
 */
export type SurfaceModules = {
  ChapterOverlay: ComponentType;
  BookingBar: ComponentType;
  BookingSheet: ComponentType;
};

let requested = false;
let modules: SurfaceModules | null = null;
const listeners = new Set<() => void>();
let markReady: () => void = () => {};
const ready = new Promise<void>((resolve) => {
  markReady = resolve;
});

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const loadOverlay = () => import("./chapter-overlay");
export const loadBookingBar = () => import("../booking/booking-bar");
export const loadBookingSheet = () => import("../booking/booking-sheet");

let loading: Promise<SurfaceModules> | null = null;
/** Fetch and evaluate the dialogs' modules without rendering them. */
export function preloadSurfaces(): Promise<SurfaceModules> {
  loading ??= Promise.all([loadOverlay(), loadBookingBar(), loadBookingSheet()]).then(([o, b, s]) => ({
    ChapterOverlay: o.ChapterOverlay,
    BookingBar: b.BookingBar,
    BookingSheet: s.BookingSheet,
  }));
  return loading;
}

/** Mount the dialogs (once, as soon as their modules are there); resolves when they have mounted and registered. */
export function mountSurfaces(): Promise<void> {
  if (!requested) {
    requested = true;
    preloadSurfaces().then(
      (m) => {
        modules = m;
        for (const l of listeners) l();
      },
      () => {
        // A chunk failed: nothing mounts, a booking request falls back to the hero entry (booking-access.ts).
        requested = false;
        loading = null;
      },
    );
  }
  return ready;
}

export function surfacesReady(): void {
  markReady();
}

/** The dialogs' components once they should mount, else null. */
export function useSurfaceModules(): SurfaceModules | null {
  return useSyncExternalStore(
    subscribe,
    () => modules,
    () => null,
  );
}

/**
 * Let the browser paint the tap's feedback before a dialog renders (web.dev "yield to the main thread", after the
 * next paint): the dialog's render and the page's inert style update then run in their own task, one frame later,
 * not inside the tap's interaction.
 */
export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

/**
 * Booking access for the landing's own triggers: mount the bar and sheet if needed, then `openBooking()`.
 * The tap's feedback paints first (`yieldToMain`), unless that has happened already or a yield would only delay the
 * sheet (audit-2 N-4):
 * - below 1024 with the surfaces mounted, the sheet opens in the tap's own task: its entry has rendered closed in
 *   advance and the page parts off screen are skipped, so the open is one short task;
 * - after a cold mount, a frame has usually been presented while the modules loaded: no second wait then;
 * - the desktop bar renders its entry on the first open, so it yields unless a frame has been presented.
 */
export async function requestBooking(detail: BookingOpenDetail): Promise<void> {
  const warm = modules !== null;
  let framed = false;
  const frame = requestAnimationFrame(() => {
    framed = true;
  });
  await mountSurfaces();
  if (!framed && (!warm || isDesktop())) await yieldToMain();
  cancelAnimationFrame(frame);
  openBooking(detail);
}
