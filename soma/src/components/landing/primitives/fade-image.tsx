"use client";

import { useCallback, useState } from "react";
import { LandingImg, type LandingImgAttrs } from "./landing-img";

/**
 * A landing photo that fades in once it has loaded (640 ms, the kit portrait's arrival), over whatever its container
 * shows underneath. The only client part of a server-rendered portrait (landing-portrait.tsx): a plain <img> with the
 * server's `getImageProps()` attributes, no `next/image`. A photo that loaded before hydration is shown at once; one
 * that fails is removed (the initials stay). Without JS it shows directly (`noscript:`).
 */
export function FadeImage({ img, alt, className }: { img: LandingImgAttrs; alt: string; className: string }) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const ref = useCallback((el: HTMLImageElement | null) => {
    if (el?.complete) setState(el.naturalWidth > 0 ? "loaded" : "error");
  }, []);
  if (state === "error") return null;
  return (
    <LandingImg
      ref={ref}
      img={img}
      alt={alt}
      onLoad={() => setState("loaded")}
      onError={() => setState("error")}
      className={`${className} ${state === "loaded" ? "opacity-100" : "opacity-0 noscript:opacity-100"}`}
    />
  );
}
