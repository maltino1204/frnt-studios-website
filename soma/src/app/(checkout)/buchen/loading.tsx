import { Container } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/feedback";

/** Mirrors the checkout geometry: title, step indicator, sections; summary column on desktop. */
export default function BuchenLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Buchung wird vorbereitet" className="flex-1">
      <Container width="content" className="pt-6 pb-16 lg:pt-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="flex flex-col gap-8 lg:col-span-7">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-3.5 w-80 max-w-full" />
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-0.5 flex-1" />
              ))}
            </div>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex flex-col gap-4 border-t border-line pt-8">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
          <div className="hidden lg:col-span-5 lg:block">
            <div className="ml-6 flex flex-col gap-4 border border-line bg-surface-raised p-6">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-[52px] w-full" />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
