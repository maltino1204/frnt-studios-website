import { Container } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/feedback";

export default function BuchungLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Buchung wird geladen" className="flex-1">
      <Container width="content" className="flex flex-col gap-10 pt-8 pb-16 lg:pt-14">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-0.5 w-6" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-full max-w-reading" />
        </div>
        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="flex flex-col gap-4 lg:col-span-5 lg:ml-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </Container>
    </div>
  );
}
