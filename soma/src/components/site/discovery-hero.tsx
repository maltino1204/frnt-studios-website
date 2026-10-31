import type { ReactNode } from "react";
import { AuraBackground } from "@/components/ui/aura";
import { Container, Overline } from "@/components/ui/layout";
import { Parallax } from "@/components/ui/floating";
import { Photo } from "@/components/ui/photo";
import { cn } from "@/lib/cn";

/**
 * v2 hero (design-guideline v2 §9.3, §15 "Hero recipe"): text and the booking
 * entry on the left, a product-led visual on the right, on a slowly breathing
 * aura. The headline is the LCP element: it is plain text, never hidden.
 *
 * - `visual`: a ready composition (the home page's FloatingStage).
 * - `photo`: SEO pages get a framed media panel (photo over the category's
 *   generative art) with optional floating `badges` layered over its edge.
 */
export function DiscoveryHero({
  overline,
  title,
  emphasis,
  lead,
  children,
  visual,
  photo,
  badges,
  size = "xl",
  ambient = true,
  breadcrumbs,
}: {
  overline?: ReactNode;
  title: ReactNode;
  /** second clause of the headline, set in the accent italic */
  emphasis?: ReactNode;
  lead?: ReactNode;
  /** booking entry, rebook row, extra links */
  children?: ReactNode;
  visual?: ReactNode;
  photo?: { src: string | null; alt: string; tone?: string; word?: string; placeLine?: string; focal?: string; seed?: string };
  /** small floating cards over the media panel (real facts only) */
  badges?: ReactNode;
  /** "xl" = home (type-display-xl, one per site), "m" = category and SEO pages */
  size?: "xl" | "m";
  /** slow aura drift; off for heroes that stream in behind a Suspense boundary */
  ambient?: boolean;
  /** SEO pages: the trail sits inside the hero, on the aura */
  breadcrumbs?: ReactNode;
}) {
  // SEO heroes: the booking bar gets its own row under text and media, so it never covers the panel.
  const ownRow = size === "m" && !!photo && !visual;
  return (
    <section className="relative isolate overflow-clip">
      <AuraBackground placement="right" animate={ambient} fade="both" className={size === "m" ? "opacity-80" : undefined} />
      {breadcrumbs ? <Container className="pt-5 md:pt-7">{breadcrumbs}</Container> : null}
      <Container
        className={cn(
          "grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-6",
          size === "xl"
            ? "pt-8 pb-14 md:pt-12 lg:min-h-[min(calc(100svh-var(--header-height)-2.5rem),48rem)] lg:pt-10 lg:pb-16"
            : cn(breadcrumbs ? "pt-4 md:pt-6" : "pt-6 md:pt-10", "pb-14 lg:gap-y-10 lg:pt-8 lg:pb-20"),
        )}
      >
        <div className="relative z-10 flex min-w-0 flex-col gap-8 lg:col-span-6">
          <div className="flex max-w-[38rem] flex-col gap-5">
            {overline ? <Overline>{overline}</Overline> : null}
            <h1 className={size === "xl" ? "type-display-xl" : "type-display-m"}>
              {title}
              {emphasis ? (
                <>
                  {" "}
                  <em>{emphasis}</em>
                </>
              ) : null}
            </h1>
            {lead ? <p className="max-w-[34rem] type-body-l text-ink-muted">{lead}</p> : null}
          </div>
          {ownRow ? null : children}
        </div>
        {ownRow ? <div className="relative z-10 min-w-0 lg:order-3 lg:col-span-12">{children}</div> : null}
        {visual ? (
          <div className="min-w-0 lg:col-span-6">{visual}</div>
        ) : photo ? (
          <HeroMedia photo={photo} badges={badges} />
        ) : null}
      </Container>
    </section>
  );
}

/** Framed media panel: the photo fades in over its seeded aura artwork; badges float over the lower edge. */
function HeroMedia({ photo, badges }: { photo: NonNullable<Parameters<typeof DiscoveryHero>[0]["photo"]>; badges?: ReactNode }) {
  return (
    <figure className="relative min-w-0 lg:order-2 lg:col-span-5 lg:col-start-8">
      <Parallax depth={8}>
        <div className="overflow-hidden rounded-panel shadow-float">
          <Photo
            src={photo.src}
            alt={photo.alt}
            tone={photo.tone ?? "massage"}
            word={photo.word}
            wordSize="m"
            focal={photo.focal}
            seed={photo.seed}
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="aspect-[16/10] w-full sm:aspect-[2/1] lg:aspect-[5/4]"
          />
        </div>
      </Parallax>
      {photo.placeLine ? <figcaption className="mt-3 type-caption text-ink-muted">{photo.placeLine}</figcaption> : null}
      {badges ? <div className="pointer-events-none absolute inset-0">{badges}</div> : null}
    </figure>
  );
}

/** A small floating fact over the hero media (real numbers only). Position it with absolute offsets. */
export function HeroBadge({ className, glass, children }: { className?: string; glass?: boolean; children: ReactNode }) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute flex items-center gap-3 rounded-card px-4 py-3 shadow-float animate-float-in",
        glass ? "glass-strong glass-edge" : "bg-surface-raised",
        className,
      )}
    >
      {children}
    </div>
  );
}
