import { Skeleton } from "@/components/ui/feedback";
import { Container } from "@/components/ui/layout";
import { HeaderSkeleton, RowsSkeleton } from "@/components/site/discovery-skeletons";

export default function Loading() {
  return (
    <Container className="pt-6 pb-(--space-section) md:pt-10" role="status" aria-busy="true" aria-label="Wird geladen">
      <Skeleton className="h-3 w-40" />
      <HeaderSkeleton />
      <Skeleton className="mb-10 h-11 w-full rounded-full" />
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
        <Skeleton className="aspect-[2/1] w-full rounded-panel sm:aspect-[5/2] lg:col-span-4 lg:aspect-[4/5]" />
        <div className="flex flex-col gap-6 lg:col-span-7 lg:col-start-6">
          <Skeleton className="h-9 w-1/3" />
          <RowsSkeleton rows={4} />
        </div>
      </div>
    </Container>
  );
}
