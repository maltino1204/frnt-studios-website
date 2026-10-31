import { Container } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/feedback";

/** Mirrors the v2 checkout geometry: title, stepper pill, step cards; summary card on desktop. */
export default function BuchenLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Buchung wird vorbereitet" className="flex-1">
      <Container width="content" className="pt-6 pb-16 lg:pt-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-4 md:gap-5 lg:col-span-7">
            <div className="flex flex-col gap-3 pb-2">
              <Skeleton className="h-3 w-28 rounded-full" />
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-3.5 w-80 max-w-full rounded-full" />
            </div>
            <Skeleton className="h-[3.75rem] w-full rounded-full" />
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex flex-col gap-5 rounded-card bg-surface-raised p-5 shadow-raised md:p-7">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-6 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-12 w-full rounded-full" />
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <Skeleton className="h-20 rounded-tile" />
                  <Skeleton className="h-20 rounded-tile" />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden lg:col-span-5 lg:block">
            <div className="flex flex-col gap-5 rounded-card bg-surface-raised p-7 shadow-float">
              <div className="flex items-center gap-3.5">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-28 rounded-full" />
                  <Skeleton className="h-3 w-44 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-14 w-full rounded-tile" />
              <Skeleton className="h-32 w-full rounded-tile" />
              <Skeleton className="h-[52px] w-full rounded-full" />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
