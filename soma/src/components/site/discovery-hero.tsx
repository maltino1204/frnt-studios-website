import type { ReactNode } from "react";
import { Container, Overline } from "@/components/ui/layout";
import { Photo } from "@/components/ui/photo";
import { cn } from "@/lib/cn";

/**
 * Editorial hero (design-guideline §6 "Hero"): text and booking entry first,
 * then the image (4:5 full-bleed on mobile). From lg: text in 6 columns, the
 * image in the other 6 running to the viewport edge. Without photography the
 * image becomes a night panel with a decorative word and a readable place line
 * (art-direction §5.2).
 */
export function DiscoveryHero({
  overline,
  title,
  emphasis,
  lead,
  children,
  photo,
  size = "xl",
}: {
  overline?: ReactNode;
  title: ReactNode;
  /** second clause of the headline, set in italic */
  emphasis?: ReactNode;
  lead?: ReactNode;
  /** booking entry, rebook row, extra links */
  children?: ReactNode;
  photo: { src: string | null; alt: string; tone?: string; word?: string; placeLine?: string; focal?: string };
  /** "xl" = home (type-display-xl, one per site), "m" = category and SEO pages */
  size?: "xl" | "m";
}) {
  const night = !photo.tone || photo.tone === "nacht";
  return (
    <section className="relative lg:flex lg:min-h-[min(calc(100svh-var(--header-height)),52rem)] lg:items-center">
      <Container className="relative z-10 lg:grid lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-col gap-8 pt-8 pb-10 md:pt-14 md:pb-14 lg:col-span-6 lg:py-24">
          <div className="flex max-w-[38rem] flex-col gap-5">
            {overline ? <Overline>{overline}</Overline> : null}
            <h1 className={size === "xl" ? "type-display-xl" : "type-display-m"}>
              {title}
              {emphasis ? (
                <>
                  {" "}
                  <em className="italic">{emphasis}</em>
                </>
              ) : null}
            </h1>
            {lead ? <p className="max-w-[34rem] type-body-l text-ink-muted">{lead}</p> : null}
          </div>
          {children}
        </div>
      </Container>
      <figure
        data-theme={night ? "night" : undefined}
        className="relative bg-transparent lg:absolute lg:inset-y-0 lg:right-0 lg:left-[calc(50%+0.75rem)]"
      >
        <Photo
          src={photo.src}
          alt={photo.alt}
          tone={photo.tone ?? "nacht"}
          word={photo.word}
          wordSize="l"
          focal={photo.focal}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="aspect-[4/5] w-full md:aspect-[3/2] lg:aspect-auto lg:h-full"
        />
        {photo.placeLine ? (
          <figcaption
            className={cn(
              "absolute left-5 bg-scrim px-2 py-1 type-caption text-ink-muted lg:left-7",
              photo.word
                ? "bottom-[calc(1.25rem+var(--text-display-l)*1.06*1+0.75rem)] lg:bottom-[calc(1.75rem+var(--text-display-l)*1.06+0.75rem)]"
                : "bottom-5 lg:bottom-7",
              !night && "text-ink",
            )}
          >
            {photo.placeLine}
          </figcaption>
        ) : null}
      </figure>
    </section>
  );
}
