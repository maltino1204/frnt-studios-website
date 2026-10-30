import { Skeleton, SkeletonText } from "@/components/ui/feedback";
import { Container } from "@/components/ui/layout";

/** Booking entry geometry: three 64px rows + L button (mobile), one 72px bar (lg, hero). */
export function EntrySkeleton({ bar = true }: { bar?: boolean }) {
  return (
    <div aria-hidden className={bar ? "w-full lg:w-[min(55rem,calc(100vw-2*var(--space-gutter)))]" : "w-full"}>
      <div className={bar ? "flex flex-col border border-line bg-surface-raised lg:h-[4.5rem] lg:flex-row lg:items-center" : "flex flex-col border border-line bg-surface-raised"}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={bar ? "flex h-16 flex-col justify-center gap-2 border-b border-line px-4 lg:flex-1 lg:border-b-0 lg:px-5" : "flex h-16 flex-col justify-center gap-2 border-b border-line px-4"}>
            <Skeleton className="h-2.5 w-10" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        ))}
        <div className={bar ? "p-2 lg:p-0 lg:pr-2.5" : "p-2"}>
          <Skeleton className={bar ? "h-control-l w-full lg:w-60" : "h-control-l w-full"} />
        </div>
      </div>
    </div>
  );
}

/** Hero: overline, display headline, lead, entry; image 4:5 below on mobile, right half from lg. */
export function HeroSkeleton() {
  return (
    <div aria-busy="true" aria-label="Wird geladen">
      <section className="relative lg:flex lg:min-h-[min(calc(100svh-var(--header-height)),52rem)] lg:items-center">
        <Container className="relative z-10 lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="flex flex-col gap-8 pt-8 pb-10 md:pt-14 md:pb-14 lg:col-span-6 lg:py-24">
            <div className="flex max-w-[38rem] flex-col gap-5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-10 w-4/5 lg:h-14" />
              <SkeletonText lines={3} className="type-body-l max-w-[34rem]" />
            </div>
            <EntrySkeleton />
          </div>
        </Container>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:left-[calc(50%+0.75rem)]">
          <Skeleton className="aspect-[4/5] w-full md:aspect-[3/2] lg:aspect-auto lg:h-full" />
        </div>
      </section>
    </div>
  );
}

/** Rows of a hairline list (services, providers). */
export function RowsSkeleton({ rows = 4, portrait }: { rows?: number; portrait?: boolean }) {
  return (
    <ul aria-hidden className="border-t border-line">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-start gap-4 border-b border-line py-5">
          {portrait ? <Skeleton className="size-[4.5rem] shrink-0" /> : null}
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <SkeletonText lines={2} className="type-body-s" />
          </div>
          <Skeleton className="h-4 w-14 shrink-0" />
        </li>
      ))}
    </ul>
  );
}

/** Page header block used on overview and content pages. */
export function HeaderSkeleton() {
  return (
    <div aria-hidden className="flex max-w-[44rem] flex-col gap-5 pt-8 pb-10 md:pt-12 md:pb-14">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-10 w-3/4 md:h-12" />
      <SkeletonText lines={2} className="type-body-l max-w-[34rem]" />
    </div>
  );
}
