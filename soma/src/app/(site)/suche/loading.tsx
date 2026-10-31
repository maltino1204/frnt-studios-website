import { Container } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/feedback";

/** Mirrors the /suche geometry: overline, title, glass chip bar, count line, result cards, filter card. */
export default function SucheLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Suchergebnisse werden geladen">
      <Container width="page" className="pt-6 pb-16 lg:pt-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="flex flex-col lg:col-span-7 xl:col-span-8">
            <Skeleton className="h-3 w-36 rounded-full" />
            <Skeleton className="mt-4 h-6 w-3/4 rounded-full" />
            <div className="-mx-(--space-gutter) mt-4 flex gap-2 overflow-hidden px-(--space-gutter) py-3.5 lg:mx-0 lg:mt-5 lg:rounded-card lg:bg-surface-raised lg:px-3.5 lg:shadow-raised">
              <Skeleton className="h-9 w-36 shrink-0 rounded-full" />
              <Skeleton className="h-9 w-44 shrink-0 rounded-full" />
              <Skeleton className="h-9 w-40 shrink-0 rounded-full" />
            </div>
            <Skeleton className="mt-6 mb-3 h-3.5 w-64 rounded-full" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="rounded-card bg-surface-raised p-4 shadow-raised md:p-5">
                  <div className="grid grid-cols-[72px_minmax(0,1fr)_auto] gap-x-4 md:grid-cols-[80px_minmax(0,1fr)_auto]">
                    <Skeleton className="size-[72px] rounded-tile md:size-20" />
                    <div className="flex flex-col gap-2.5 pt-1">
                      <Skeleton className="h-4 w-28 rounded-full" />
                      <Skeleton className="h-3 w-40 rounded-full" />
                      <Skeleton className="h-3 w-[86%] rounded-full" />
                    </div>
                    <div className="flex flex-col items-end gap-2 pt-10">
                      <Skeleton className="h-5 w-14 rounded-full" />
                      <Skeleton className="h-3 w-16 rounded-full" />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 overflow-hidden border-t border-line pt-4">
                    {Array.from({ length: 4 }, (_, j) => (
                      <Skeleton key={j} className="h-10 w-24 shrink-0 rounded-tile" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:col-span-5 lg:block xl:col-span-4">
            <div className="flex flex-col gap-4 rounded-card bg-surface-raised p-6 shadow-raised">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-full" />
                <Skeleton className="h-9 w-24 rounded-full" />
                <Skeleton className="h-9 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
