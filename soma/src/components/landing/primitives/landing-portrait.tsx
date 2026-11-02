import "server-only";
import { cn } from "@/lib/cn";
import { AI_PORTRAIT_LABEL, isAiImage, imageFocal, resolveImage } from "@/lib/images";
import { initials } from "@/lib/initials";
import { toneKey, toneStyle } from "@/lib/tone";
import { FadeImage } from "./fade-image";
import { landingImgAttrs } from "./landing-image";

/**
 * The kit's O-oval portrait (`Portrait shape="oval"`, ui/avatar.tsx) rendered on the server for the landing (04
 * vignette, 06 cards): the person's category wash with their initials in Newsreader Display, and the photo
 * (`getImageProps()`, no `next/image`) fading in over it once loaded (`FadeImage`, the only client part). Same
 * markup, classes and AI alt text as the kit component.
 */
export function LandingPortrait({ src, name, sizes, className }: { src?: string | null; name: string; sizes: string; className?: string }) {
  const url = resolveImage(src);
  return (
    <div
      className={cn("@container relative isolate overflow-hidden rounded-[50%]", className)}
      style={{ aspectRatio: "332 / 362", ...toneStyle(toneKey(null, name)) }}
    >
      <span aria-hidden className="absolute inset-0 flex items-center justify-center font-display text-[34cqw] leading-none font-normal tracking-[-0.02em] @min-[10rem]:text-[22cqw]">
        {initials(name)}
      </span>
      {url ? (
        <FadeImage
          img={landingImgAttrs(url, { sizes, focal: imageFocal(src, "50% 36%") })}
          alt={isAiImage(src) ? `Porträt von ${name} (${AI_PORTRAIT_LABEL})` : `Porträt von ${name}`}
          className="z-[3] object-cover transition-opacity duration-calm ease-arrive"
        />
      ) : null}
    </div>
  );
}
