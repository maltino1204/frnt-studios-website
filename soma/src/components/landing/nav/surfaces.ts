"use client";

import { useSyncExternalStore } from "react";
import { openBooking, type BookingOpenDetail } from "../booking/booking-access";

/*
 * The landing's dialogs (chapter overlay, booking bar, booking sheet) load on demand (audit-1 PT-1): their code is
 * fetched when the browser is idle after load, they mount on idle or on the first intent (pointer, touch or keyboard
 * on a trigger), and they stay mounted once mounted, so a later open only calls showModal(). Every trigger awaits
 * `mountSurfaces()` before it opens a dialog, so a very early click still works.
 */
let mounted = false;
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

let preloaded = false;
/** Fetch and evaluate the dialogs' modules without rendering them. */
export function preloadSurfaces(): void {
  if (preloaded) return;
  preloaded = true;
  void loadOverlay();
  void loadBookingBar();
  void loadBookingSheet();
}

/** Mount the dialogs (once); resolves when they have mounted and registered. */
export function mountSurfaces(): Promise<void> {
  if (!mounted) {
    mounted = true;
    preloadSurfaces();
    for (const l of listeners) l();
  }
  return ready;
}

export function surfacesReady(): void {
  markReady();
}

export function useSurfacesMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => mounted,
    () => false,
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

/** Booking access for the landing's own triggers: mount the bar and sheet if needed, then `openBooking()`. */
export async function requestBooking(detail: BookingOpenDetail): Promise<void> {
  await mountSurfaces();
  await yieldToMain();
  openBooking(detail);
}
