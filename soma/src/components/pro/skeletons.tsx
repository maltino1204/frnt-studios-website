import { Skeleton, SkeletonText } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";

/** Loading skeletons that copy the geometry of the /pro screens (level-1 cards, shimmer). */
function Frame({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[74rem] px-(--space-gutter) pt-6 lg:pt-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Wird geladen …</span>
      <div className={cn("flex flex-col gap-8 lg:gap-10", narrow && "max-w-[48rem]")}>{children}</div>
    </div>
  );
}

const card = "rounded-card bg-surface-raised shadow-raised";

function Header({ back }: { back?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {back ? <Skeleton className="h-5 w-16 rounded-full" /> : null}
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-full max-w-md rounded-full" />
    </div>
  );
}

export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className={cn("divide-y divide-line overflow-hidden", card)}>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex min-h-18 items-center gap-4 px-4 py-3.5 sm:px-5">
          <Skeleton className="h-14 w-13 shrink-0 rounded-tile" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-24 rounded-full" />
            <Skeleton className="h-3.5 w-[64%] rounded-full" />
            <Skeleton className="h-3 w-[40%] rounded-full" />
          </div>
          <Skeleton className="hidden h-6 w-24 rounded-full sm:block" />
        </li>
      ))}
    </ul>
  );
}

export function TabsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex h-touch items-center gap-6 border-b border-line">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-4 w-20 rounded-full" />
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={cn("flex flex-col gap-3 p-4 sm:p-5 lg:p-6", card)}>
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="mt-1 h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <Frame>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-36 rounded-full" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-72 rounded-full" />
      </div>
      <StatsSkeleton />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-4 lg:col-span-7">
          <Skeleton className="h-5 w-40 rounded-full" />
          <div className={cn("flex flex-col overflow-hidden", card)}>
            <div className="flex flex-col gap-4 p-5 lg:p-6">
              <SkeletonText lines={3} />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-32 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-line px-5 py-4 lg:px-6">
              <Skeleton className="h-control-l rounded-full" />
              <Skeleton className="h-control-l rounded-full" />
            </div>
          </div>
          <RowsSkeleton rows={2} />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className={cn("flex items-center gap-4 p-5 lg:p-6", card)}>
            <Skeleton className="size-16 shrink-0 rounded-full" />
            <SkeletonText lines={2} className="flex-1" />
          </div>
          <Skeleton className="h-52 w-full rounded-card" />
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
      <div className={cn("flex flex-col gap-6 p-5 lg:p-6", card)}>
        <Skeleton className="h-5 w-40 rounded-full" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-28 rounded-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-control-l w-48 rounded-full" />
    </Frame>
  );
}

export function DetailSkeleton() {
  return (
    <Frame>
      <Header back />
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
        <div className="order-2 flex flex-col gap-6 lg:order-1 lg:col-span-7">
          <div className={cn("flex flex-col gap-4 p-5 lg:p-6", card)}>
            <Skeleton className="h-5 w-32 rounded-full" />
            <div className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-full" />
              <SkeletonText lines={2} className="flex-1" />
            </div>
          </div>
          <div className={cn("overflow-hidden", card)}>
            <Skeleton className="h-28 w-full rounded-none" />
            <div className="p-5 lg:p-6">
              <SkeletonText lines={3} />
            </div>
          </div>
        </div>
        <div className={cn("order-1 flex flex-col gap-4 p-5 lg:order-2 lg:col-span-5 lg:p-6", card)}>
          <Skeleton className="h-6 w-40" />
          <SkeletonText lines={2} />
          <Skeleton className="h-control-l w-full rounded-full" />
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
      <div className={cn("flex flex-col gap-4 p-5 lg:p-6", card)}>
        <Skeleton className="h-3 w-40 rounded-full" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-52 w-full" />
      </div>
      <RowsSkeleton rows={4} />
    </Frame>
  );
}

export function CalendarSkeleton() {
  return (
    <Frame>
      <Header />
      <TabsSkeleton count={3} />
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-11 w-40 rounded-full" />
        <Skeleton className="hidden h-8 w-64 rounded-full md:block" />
      </div>
      <Skeleton className="hidden h-[42rem] w-full rounded-card md:block" />
      <div className="flex flex-col gap-2.5 md:hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={cn("flex gap-3 p-3", card)}>
            <Skeleton className="h-12 w-11 rounded-tile" />
            <SkeletonText lines={2} className="flex-1" />
          </div>
        ))}
      </div>
    </Frame>
  );
}
