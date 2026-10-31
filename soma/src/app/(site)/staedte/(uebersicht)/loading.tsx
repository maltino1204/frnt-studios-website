import { Skeleton } from "@/components/ui/feedback";
import { Container } from "@/components/ui/layout";
import { HeaderSkeleton } from "@/components/site/discovery-skeletons";

export default function Loading() {
  return (
    <Container className="pt-6 pb-(--space-section) md:pt-8" role="status" aria-busy="true" aria-label="Wird geladen">
      <Skeleton className="h-3 w-32" />
      <HeaderSkeleton />
      <ul aria-hidden className="grid gap-4 md:grid-cols-2 lg:gap-6">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="flex flex-col gap-5 rounded-card bg-surface-raised p-1.5 pb-6 shadow-raised">
            <Skeleton className="h-32 w-full rounded-tile md:h-40" />
            <div className="flex flex-wrap gap-2 px-4">
              {[0, 1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-9 w-24 rounded-full" />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </Container>
  );
}
