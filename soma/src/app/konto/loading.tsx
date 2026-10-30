import { Skeleton } from "@/components/ui/feedback";

/** Generic account skeleton: page title, two list blocks. */
export default function KontoLoading() {
  return (
    <div aria-busy="true" aria-label="Wird geladen" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 pb-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-3.5 w-72 max-w-full" />
      </div>
      <div className="flex flex-col border-t border-line">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line py-4">
            <Skeleton className="h-14 w-12" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
