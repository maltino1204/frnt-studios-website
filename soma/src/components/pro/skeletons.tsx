import { Skeleton, SkeletonText } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";

/** Loading skeletons that copy the geometry of the /pro screens (sunken, square, opacity pulse). */
function Frame({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[72rem] px-(--space-gutter) pt-6 lg:pt-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Wird geladen …</span>
      <div className={cn("flex flex-col gap-8 lg:gap-10", narrow && "max-w-[46rem]")}>{children}</div>
    </div>
  );
}

function Header({ back }: { back?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {back ? <Skeleton className="h-4 w-16" /> : null}
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-full max-w-md" />
    </div>
  );
}

export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="border-y border-line">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex min-h-16 items-center gap-4 border-b border-line py-3 last:border-b-0">
          <Skeleton className="h-9 w-12 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-[64%]" />
            <Skeleton className="h-3 w-[40%]" />
          </div>
          <Skeleton className="h-4 w-14" />
        </li>
      ))}
    </ul>
  );
}

export function TabsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex h-touch items-center gap-6 border-b border-line">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-4 w-20" />
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 bg-surface-raised p-5 lg:p-6">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <Frame>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <Skeleton className="h-5 w-40" />
          <div className="flex flex-col gap-5 border border-line bg-surface-raised p-5 lg:p-6">
            <SkeletonText lines={3} />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-control-l" />
              <Skeleton className="h-control-l" />
            </div>
          </div>
          <RowsSkeleton rows={3} />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-5">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-2 gap-px border border-line bg-line">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex flex-col gap-3 bg-surface-raised p-5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-9 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

export function ListPageSkeleton({ tabs, back, narrow, rows = 6 }: { tabs?: number; back?: boolean; narrow?: boolean; rows?: number }) {
  return (
    <Frame narrow={narrow}>
      <Header back={back} />
      {tabs ? <TabsSkeleton count={tabs} /> : null}
      <RowsSkeleton rows={rows} />
    </Frame>
  );
}

export function FormPageSkeleton({ back = true }: { back?: boolean }) {
  return (
    <Frame narrow>
      <Header back={back} />
      <div className="flex flex-col gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
        <Skeleton className="h-control-l w-48" />
      </div>
    </Frame>
  );
}

export function DetailSkeleton() {
  return (
    <Frame>
      <Header back />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="order-2 flex flex-col gap-8 lg:order-1 lg:col-span-7">
          <RowsSkeleton rows={3} />
          <RowsSkeleton rows={2} />
        </div>
        <div className="order-1 flex flex-col gap-4 border border-line bg-surface-raised p-5 lg:order-2 lg:col-span-5 lg:p-6">
          <Skeleton className="h-5 w-32" />
          <SkeletonText lines={2} />
          <Skeleton className="h-control-l w-full" />
          <SkeletonText lines={3} />
        </div>
      </div>
    </Frame>
  );
}

export function EarningsSkeleton() {
  return (
    <Frame>
      <Header />
      <StatsSkeleton />
      <Skeleton className="h-28 w-full" />
      <RowsSkeleton rows={5} />
    </Frame>
  );
}
