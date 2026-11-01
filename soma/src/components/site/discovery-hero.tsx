import type { ReactNode } from "react";
import { Container, Overline } from "@/components/ui/layout";
import { Photo } from "@/components/ui/photo";
import { cn } from "@/lib/cn";

/**
 * Hero (brand/BRAND_GUIDELINES.md § 5): text and the booking entry on the left, editorial photography in the SOMA
 * arch on the right, on the Bone page (no aura, no gradient). The headline is the LCP element: plain text, never
 * hidden; its <em> clause switches to Newsreader Italic.
 *
 * - `visual`: a ready composition (the home page's ArchPair).
 * - `photo`: SEO pages get one arch photograph with the Ortszeile under it; `badges` (real facts) sit beside it.
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
  /** @deprecated ignored: the brand has no ambient motion */
  ambient?: boolean;
  /** SEO pages: the trail sits inside the hero, on the aura */
  breadcrumbs?: ReactNode;
}) {
  // SEO heroes: the booking bar gets its own row under text and media, so it never covers the panel.
  const ownRow = size === "m" && !!photo && !visual;
  return (
    <section className="relative isolate overflow-clip">
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
            {lead ? <p className="max-w-[34rem] type-lead text-ink-muted">{lead}</p> : null}
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

/** One arch photograph (4:5) with the Ortszeile under it; badges (real facts) stack beside it. */
function HeroMedia({ photo, badges }: { photo: NonNullable<Parameters<typeof DiscoveryHero>[0]["photo"]>; badges?: ReactNode }) {
  return (
    <figure className="relative min-w-0 lg:order-2 lg:col-span-5 lg:col-start-8">
      <Photo
        src={photo.src}
        alt={photo.alt}
        tone={photo.tone ?? "massage"}
        word={photo.word}
        wordSize="m"
        focal={photo.focal}
        seed={photo.seed}
        priority
        shape="arch"
        ratio="4/5"
        sizes="(min-width: 1024px) 36vw, (min-width: 640px) 60vw, 88vw"
        className="mx-auto w-full max-w-[24rem] lg:max-w-[26rem]"
      />
      {photo.placeLine ? <figcaption className="mx-auto mt-3 max-w-[24rem] type-place text-ink-muted lg:max-w-[26rem]">{photo.placeLine}</figcaption> : null}
      {badges ? <div className="pointer-events-none absolute inset-0">{badges}</div> : null}
    </figure>
  );
}

/**
 * The contrapposto pair (brand § 5.1): two arch photographs side by side, the right one lower by 18 % of its width,
 * each with its Ortszeile. One pair per view. Decorative imagery is described by its alt text.
 */
export function ArchPair({ items, className }: { items: [ArchPairItem, ArchPairItem]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 items-start gap-3 sm:gap-5 lg:gap-6", className)}>
      {items.map((it, i) => (
        <figure key={it.src} className={cn("min-w-0", i === 1 && "mt-[18%]")}>
          <Photo src={it.src} alt={it.alt} tone={it.tone} focal={it.focal} priority={i === 0} shape="arch" ratio="4/5" sizes="(min-width: 1024px) 22vw, 45vw" className="w-full" />
          <figcaption className="mt-3 type-place text-ink-muted">{it.place}</figcaption>
        </figure>
      ))}
    </div>
  );
}
export type ArchPairItem = { src: string; alt: string; tone: string; place: string; focal?: string };

/** A small floating fact over the hero media (real numbers only). Position it with absolute offsets. */
export function HeroBadge({ className, children }: { className?: string; /** @deprecated ignored */ glass?: boolean; children: ReactNode }) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute flex items-center gap-3 rounded-card bg-surface-raised px-4 py-3 shadow-float animate-float-in",
        className,
      )}
    >
      {children}
    </div>
  );
}
