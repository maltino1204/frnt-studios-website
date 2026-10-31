import { Skeleton, SkeletonText } from "@/components/ui/feedback";
import { Container } from "@/components/ui/layout";

/** Booking entry geometry: three 64px rows + L button in a card (mobile), one 72px pill bar (lg, hero). */
export function EntrySkeleton({ bar = true }: { bar?: boolean }) {
  return (
    <div aria-hidden className={bar ? "w-full lg:w-[min(55rem,calc(100vw-2*var(--space-gutter)))]" : "w-full"}>
      <div
        className={
          bar
            ? "flex flex-col rounded-card bg-surface-raised shadow-raised lg:h-[4.5rem] lg:flex-row lg:items-center lg:rounded-full"
            : "flex flex-col rounded-card bg-surface-raised shadow-raised"
        }
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className={bar ? "flex h-16 flex-col justify-center gap-2 px-5 lg:flex-1 lg:px-6" : "flex h-16 flex-col justify-center gap-2 px-5"}>
            <Skeleton className="h-2.5 w-10 rounded-full" />
            <Skeleton className="h-3.5 w-32 rounded-full" />
          </div>
        ))}
        <div className={bar ? "p-2 lg:p-0 lg:pr-2.5" : "p-2"}>
          <Skeleton className={bar ? "h-control-l w-full rounded-full lg:w-60" : "h-control-l w-full rounded-full"} />
        </div>
      </div>
    </div>
  );
}

/** Hero: overline, display headline, lead; booking entry; media panel (right from lg). */
export function HeroSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Wird geladen">
      <section>
        <Container className="grid gap-10 pt-4 pb-14 md:pt-6 lg:grid-cols-12 lg:items-center lg:gap-6 lg:gap-y-10 lg:pt-8 lg:pb-20">
          <div className="flex max-w-[38rem] flex-col gap-5 lg:col-span-6">
            <Skeleton className="h-3 w-32 rounded-full" />
            <Skeleton className="h-10 w-4/5 rounded-full lg:h-12" />
            <SkeletonText lines={3} className="type-body-l max-w-[34rem]" />
          </div>
          <div className="lg:order-3 lg:col-span-12">
            <EntrySkeleton />
          </div>
          <Skeleton className="aspect-[16/10] w-full rounded-panel sm:aspect-[2/1] lg:order-2 lg:col-span-5 lg:col-start-8 lg:aspect-[5/4]" />
        </Container>
      </section>
    </div>
  );
}

/** Rows of a card list (services, providers). */
export function RowsSkeleton({ rows = 4, portrait }: { rows?: number; portrait?: boolean }) {
  return (
    <ul aria-hidden className={portrait ? "flex flex-col gap-3" : "flex flex-col divide-y divide-line rounded-card bg-surface-raised px-5 shadow-raised"}>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className={portrait ? "flex items-start gap-4 rounded-card bg-surface-raised p-3 pr-4 shadow-raised" : "flex items-start gap-4 py-5"}>
          {portrait ? <Skeleton className="size-[4.5rem] shrink-0 rounded-tile" /> : null}
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2 rounded-full" />
            <SkeletonText lines={2} className="type-body-s" />
          </div>
          <Skeleton className="h-4 w-14 shrink-0 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

/** Category and city pages: breadcrumb line + hero. */
export function CategoryPageSkeleton() {
  return (
    <>
      <Container className="pt-5 md:pt-7">
        <Skeleton className="h-3 w-48 rounded-full" />
      </Container>
      <HeroSkeleton />
    </>
  );
}

/** SEO city × category page: intro, booking entry (sticky column from lg), provider rows. */
export function SeoPageSkeleton() {
  return (
    <Container className="pt-6 pb-(--space-section) md:pt-8" role="status" aria-busy="true" aria-label="Wird geladen">
      <Skeleton className="h-3 w-56 rounded-full" />
      <div className="grid gap-10 pt-6 md:pt-10 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-0">
        <div className="flex flex-col gap-5 lg:col-span-7">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-9 w-4/5 md:h-11" />
          <SkeletonText lines={2} className="type-body-l max-w-[36rem]" />
        </div>
        <div className="lg:col-span-4 lg:col-start-9 lg:row-span-2">
          <EntrySkeleton bar={false} />
        </div>
        <div className="lg:col-span-7 lg:pt-16">
          <Skeleton className="mb-4 h-6 w-2/3" />
          <RowsSkeleton rows={3} portrait />
        </div>
      </div>
    </Container>
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
