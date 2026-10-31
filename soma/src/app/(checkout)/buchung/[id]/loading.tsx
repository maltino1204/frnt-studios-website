import { Container } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/feedback";

/** Mirrors the booking detail: status hero panel, detail cards, price column. */
export default function BuchungLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Buchung wird geladen" className="flex-1">
      <Container width="content" className="flex flex-col gap-5 pt-6 pb-16 md:gap-6 lg:pt-10">
        <div className="grid gap-8 rounded-panel bg-surface-raised p-5 pt-7 shadow-raised sm:p-8 lg:grid-cols-12 lg:p-12">
          <div className="flex flex-col gap-5 lg:col-span-7">
            <Skeleton className="h-6 w-48 rounded-full" />
            <Skeleton className="size-14 rounded-full" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-full max-w-reading rounded-full" />
            <Skeleton className="h-11 w-56 rounded-full" />
          </div>
          <Skeleton className="h-52 rounded-card lg:col-span-5" />
        </div>
        <div className="flex flex-col gap-5 md:gap-6 lg:grid lg:grid-cols-12">
          <div className="flex flex-col gap-5 md:gap-6 lg:col-span-7">
            <Skeleton className="h-72 w-full rounded-card" />
            <Skeleton className="h-48 w-full rounded-card" />
          </div>
          <div className="flex flex-col gap-5 md:gap-6 lg:col-span-5">
            <Skeleton className="h-64 w-full rounded-card" />
            <Skeleton className="h-56 w-full rounded-card" />
          </div>
        </div>
      </Container>
    </div>
  );
}
