"use client";

import { useSyncExternalStore } from "react";

/**
 * The signed-in customer's city for „Beliebt in <Stadt>“, published by the „Für dich“ slot once its data arrives
 * (the page itself is static and never knows who is looking). `null` = no personal city (guest, opted out, no address).
 */
let city: string | null = null;
const listeners = new Set<() => void>();

export function setPersonalCity(slug: string | null): void {
  if (slug === city) return;
  city = slug;
  for (const l of listeners) l();
}

export function usePersonalCity(): string | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => city,
    () => null,
  );
}
