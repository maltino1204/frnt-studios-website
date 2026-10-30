import { Skeleton } from "@/components/ui/feedback";
import { Container } from "@/components/ui/layout";
import { HeroSkeleton } from "@/components/site/discovery-skeletons";

export default function Loading() {
  return (
    <>
      <Container className="pt-6 md:pt-8">
        <Skeleton className="h-3 w-40" />
      </Container>
      <HeroSkeleton />
    </>
  );
}
