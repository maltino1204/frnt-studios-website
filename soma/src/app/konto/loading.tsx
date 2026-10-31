import { Skeleton } from "@/components/ui/feedback";

/** Generic account skeleton: page title, then level-1 cards like the final rows. */
export default function KontoLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Wird geladen" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 pb-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-3.5 w-72 max-w-full rounded-full" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-card bg-surface-raised p-3.5 shadow-raised md:p-4">
            <Skeleton className="h-16 w-14 rounded-tile" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/2 rounded-full" />
              <Skeleton className="h-3 w-1/3 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
