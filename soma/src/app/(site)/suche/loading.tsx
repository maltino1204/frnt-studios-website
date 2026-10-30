import { Container } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/feedback";

/** Mirrors the /suche geometry: overline, title, chip row, count line, provider rows. */
export default function SucheLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Suchergebnisse werden geladen">
      <Container width="page" className="pt-6 pb-16 lg:pt-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="flex flex-col lg:col-span-7">
            <Skeleton className="h-0.5 w-6" />
            <Skeleton className="mt-3 h-3 w-32" />
            <Skeleton className="mt-3 h-6 w-3/4" />
            <div className="mt-5 flex gap-2 overflow-hidden">
              <Skeleton className="h-9 w-36 shrink-0 rounded-full" />
              <Skeleton className="h-9 w-44 shrink-0 rounded-full" />
              <Skeleton className="h-9 w-40 shrink-0 rounded-full" />
            </div>
            <Skeleton className="mt-6 h-3.5 w-64" />
            <div className="mt-3 border-t border-line">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="border-b border-line py-4">
                  <div className="grid grid-cols-[72px_minmax(0,1fr)_auto] gap-x-4">
                    <Skeleton className="size-[72px]" />
                    <div className="flex flex-col gap-2 pt-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-3 w-[92%]" />
                    </div>
                    <div className="flex flex-col items-end gap-2 pt-12">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 overflow-hidden">
                    {Array.from({ length: 4 }, (_, j) => (
                      <Skeleton key={j} className="h-9 w-24 shrink-0" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:col-span-4 lg:col-start-9 lg:block">
            <div className="flex flex-col gap-3 border-l border-line pl-8">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
