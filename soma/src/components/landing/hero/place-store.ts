"use client";

import { getImageProps } from "next/image";
import { useSyncExternalStore } from "react";
import { resolveImage } from "@/lib/images";
import { HERO_SIZES, PLACES, type Place, type PlaceId } from "./places";

/*
 * The hero's „Ortswechsel“ state (spec § 4.1.5) as a tiny external store. The place switch, the arch and the booking
 * entry's place hint subscribe to it, so the hero grid itself stays server markup (no provider around it; PT-2).
 * No auto-rotation, ever.
 */
let current: PlaceId = "zuhause";
const listeners = new Set<() => void>();

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function setPlace(id: PlaceId): void {
  if (id === current) return;
  current = id;
  for (const l of listeners) l();
}

/** The selected place; the server snapshot is always „Zu Hause“, so hydration never mismatches. */
export function usePlace(): Place {
  const id = useSyncExternalStore(
    subscribe,
    () => current,
    () => "zuhause" as PlaceId,
  );
  return PLACES.find((p) => p.id === id) ?? PLACES[0];
}

let fetched = false;

/** Fetch the other places' images once (first intent on the switch or the arch, or idle 2 s after load). */
export function prefetchPlaces(): void {
  if (fetched || typeof window === "undefined") return;
  fetched = true;
  for (const p of PLACES) {
    if (p.id === "zuhause") continue;
    const { props } = getImageProps({ src: resolveImage(p.src) ?? p.src, alt: "", fill: true, sizes: HERO_SIZES });
    const img = new window.Image();
    img.decoding = "async";
    if (props.sizes) img.sizes = props.sizes;
    if (props.srcSet) img.srcset = props.srcSet;
    img.src = props.src;
  }
}
