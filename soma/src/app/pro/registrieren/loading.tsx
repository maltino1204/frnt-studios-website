import { Skeleton } from "@/components/ui/feedback";
import { Container } from "@/components/ui/layout";

export default function Loading() {
  return (
    <Container width="content" className="flex flex-col gap-8 pt-6 md:gap-10 md:pt-10" aria-busy="true">
      <span className="sr-only">Wird geladen …</span>
      <div className="flex items-center gap-4 rounded-card bg-surface-raised px-5 py-5 shadow-raised">
        <Skeleton className="size-12 shrink-0 rounded-full md:hidden" />
        <div className="hidden flex-1 justify-between md:flex">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-3 w-16 rounded-full" />
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-2 md:hidden">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-4 w-32 rounded-full" />
        </div>
      </div>
      <div className="flex max-w-[40rem] flex-col gap-6">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="h-8 w-64" />
        <div className="flex flex-col gap-5 rounded-card bg-surface-raised p-6 shadow-raised">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-28 rounded-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
