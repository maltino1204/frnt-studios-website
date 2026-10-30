import { Skeleton } from "@/components/ui/feedback";
import { Container } from "@/components/ui/layout";
import { HeaderSkeleton } from "@/components/site/discovery-skeletons";

export default function Loading() {
  return (
    <Container className="pt-6 pb-(--space-section) md:pt-8" aria-busy="true" aria-label="Wird geladen">
      <Skeleton className="h-3 w-32" />
      <HeaderSkeleton />
      <ul aria-hidden className="border-t border-line">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="grid gap-5 border-b border-line py-8 lg:grid-cols-12 lg:gap-6">
            <div className="flex flex-col gap-2 lg:col-span-4">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="flex flex-wrap gap-2 lg:col-span-8">
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
