import { Skeleton, SkeletonText } from "@/components/ui/feedback";
import { Container } from "@/components/ui/layout";
import { EntrySkeleton, RowsSkeleton } from "@/components/site/discovery-skeletons";

export default function Loading() {
  return (
    <Container className="pt-6 pb-(--space-section) md:pt-8" aria-busy="true" aria-label="Wird geladen">
      <Skeleton className="h-3 w-56" />
      <div className="grid gap-10 pt-8 md:pt-12 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-0">
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
