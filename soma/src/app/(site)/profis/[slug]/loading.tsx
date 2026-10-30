import { Container } from "@/components/ui/layout";
import { Skeleton, SkeletonText } from "@/components/ui/feedback";

/** Mirrors the profile geometry: 4:5 portrait (full-bleed on mobile), then header and lists. */
export default function ProfilLoading() {
  return (
    <div aria-busy="true" aria-label="Profil wird geladen" className="pb-28 lg:pb-0">
      <Container width="content" className="pb-16 lg:pt-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="-mx-(--space-gutter) lg:col-span-5 lg:mx-0">
            <Skeleton className="aspect-[4/5] w-full" />
          </div>
          <div className="flex flex-col gap-4 pt-8 lg:col-span-7 lg:pt-0 lg:pl-10">
            <Skeleton className="h-0.5 w-6" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-5 w-56" />
            <SkeletonText lines={3} className="mt-2 type-body" />
            <div className="mt-6 flex flex-col">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center justify-between border-b border-line py-3.5">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-9 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
