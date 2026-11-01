"use client";

import { getImageProps } from "next/image";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { resolveImage } from "@/lib/images";
import { HERO_SIZES, PLACES, type Place, type PlaceId } from "./places";

type PlaceContext = {
  place: Place;
  places: readonly Place[];
  setPlace: (id: PlaceId) => void;
  /** fetch the other places' images (first intent, or idle 2 s after load) */
  prefetch: () => void;
};

const Ctx = createContext<PlaceContext | null>(null);

export function usePlace(): PlaceContext {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlace() outside <HeroPlaceStage>");
  return c;
}

/**
 * The hero's „Ortswechsel“ (spec § 4.1.5): the context for the place switch, the arch and the booking entry's place
 * hint, around the hero grid (`data-scene="hero-place"`). No auto-rotation, ever.
 */
export function HeroPlaceStage({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const [id, setId] = useState<PlaceId>("zuhause");
  const place = PLACES.find((p) => p.id === id) ?? PLACES[0];
  const fetched = useRef(false);

  const prefetch = useCallback(() => {
    if (fetched.current || typeof window === "undefined") return;
    fetched.current = true;
    for (const p of PLACES) {
      if (p.id === "zuhause") continue;
      const { props } = getImageProps({ src: resolveImage(p.src) ?? p.src, alt: "", fill: true, sizes: HERO_SIZES });
      const img = new window.Image();
      img.decoding = "async";
      if (props.sizes) img.sizes = props.sizes;
      if (props.srcSet) img.srcset = props.srcSet;
      img.src = props.src;
    }
  }, []);

  // Idle prefetch 2 s after load (spec § 4.1.5).
  useEffect(() => {
    let idle = 0;
    const t = window.setTimeout(() => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
      if (ric) idle = ric(prefetch);
      else prefetch();
    }, 2000);
    return () => {
      window.clearTimeout(t);
      const cic = (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
      if (idle && cic) cic(idle);
    };
  }, [prefetch]);

  const value = useMemo<PlaceContext>(
    () => ({
      place,
      places: PLACES,
      setPlace: setId,
      prefetch,
    }),
    [place, prefetch],
  );

  return (
    <Ctx.Provider value={value}>
      <div data-scene="hero-place" data-place={place.id} className={className}>
        {children}
      </div>
    </Ctx.Provider>
  );
}
