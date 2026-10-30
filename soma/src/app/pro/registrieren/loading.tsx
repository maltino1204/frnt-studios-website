import { Skeleton } from "@/components/ui/feedback";
import { Container } from "@/components/ui/layout";

export default function Loading() {
  return (
    <Container width="content" className="flex flex-col gap-10 pt-6 md:pt-10" aria-busy="true">
      <span className="sr-only">Wird geladen …</span>
      <div className="flex gap-1">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-0.5 flex-1" />
        ))}
      </div>
      <div className="flex max-w-[40rem] flex-col gap-6">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-full" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    </Container>
  );
}
