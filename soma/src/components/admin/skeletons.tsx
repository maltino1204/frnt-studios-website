import { Skeleton } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";

/**
 * Loading skeletons in the final admin geometry (header, stat tiles, toolbar,
 * 40px table rows). Appear after 200 ms so fast loads never flash.
 */
function Delay({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div aria-busy="true" aria-label="Wird geladen" className={cn("animate-fade-in [animation-delay:200ms]", className)}>
      {children}
    </div>
  );
}

export function HeaderSkeleton({ back }: { back?: boolean }) {
  return (
    <div className="flex flex-col gap-2 pb-6">
      {back ? <Skeleton className="h-6 w-32" /> : <Skeleton className="h-[26px] w-24" />}
      <Skeleton className="h-[30px] w-64" />
      <Skeleton className="h-5 w-96 max-w-full" />
    </div>
  );
}

export function StatsSkeleton({ tiles = 4 }: { tiles?: number }) {
  return (
    <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
      {Array.from({ length: tiles }, (_, i) => (
        <div key={i} className="flex flex-col gap-2 bg-surface-raised p-5 lg:p-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

/** Loading table: clipped to the available width (never widens the page, audit-3 F10). */
export function TableSkeleton({ rows = 10, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div aria-hidden className="relative max-w-full min-w-0 overflow-hidden border border-line bg-surface-raised">
      <div className="flex h-10 min-w-0 items-center gap-6 overflow-hidden border-b border-line-strong px-4">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className={cn("h-3 min-w-0", i === 0 ? "w-24" : "w-16")} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex h-10 min-w-0 items-center gap-6 overflow-hidden border-b border-line px-4 last:border-b-0">
          {Array.from({ length: cols }, (_, i) => (
            <Skeleton key={i} className={cn("h-3 min-w-0", i === 0 ? "w-24" : i % 3 === 1 ? "w-28" : "w-14")} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ToolbarSkeleton({ fields = 1 }: { fields?: number }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {Array.from({ length: fields }, (_, i) => (
        <Skeleton key={i} className={cn("h-control-s", i === 0 ? "w-64" : "w-40")} />
      ))}
      <Skeleton className="h-control-s w-24" />
    </div>
  );
}

export function PanelSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("border border-line bg-surface-raised", className)}>
      <div className="flex h-12 items-center border-b border-line px-4">
        <Skeleton className="h-4 w-32" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-14 flex-col justify-center gap-1.5 border-b border-line px-4 last:border-b-0">
          <Skeleton className="h-3.5 w-[64%]" />
          <Skeleton className="h-3 w-[40%]" />
        </div>
      ))}
    </div>
  );
}

export function TabsSkeleton() {
  return (
    <div className="flex h-touch items-center gap-6 border-b border-line">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

/** List pages: header, optional tabs, toolbar, table. */
export function ListPageSkeleton({ tabs, fields = 1, cols = 7, stats }: { tabs?: boolean; fields?: number; cols?: number; stats?: number }) {
  return (
    <Delay>
      <HeaderSkeleton />
      <div className="flex min-w-0 flex-col gap-4">
        {tabs ? <TabsSkeleton /> : null}
        {stats ? <StatsSkeleton tiles={stats} /> : null}
        <ToolbarSkeleton fields={fields} />
        <TableSkeleton cols={cols} rows={12} />
      </div>
    </Delay>
  );
}

/** Detail pages: back link, two columns (main panels + 340px aside). */
export function DetailPageSkeleton() {
  return (
    <Delay>
      <HeaderSkeleton back />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          <TableSkeleton rows={4} cols={4} />
          <PanelSkeleton rows={3} />
          <TableSkeleton rows={3} cols={5} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <PanelSkeleton rows={6} />
          <PanelSkeleton rows={2} />
        </div>
      </div>
    </Delay>
  );
}

export function OverviewSkeleton() {
  return (
    <Delay>
      <HeaderSkeleton />
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-px">
          <StatsSkeleton />
          <StatsSkeleton />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <PanelSkeleton rows={2} />
          <PanelSkeleton rows={2} />
          <PanelSkeleton rows={4} />
          <PanelSkeleton rows={4} />
        </div>
      </div>
    </Delay>
  );
}

export function SplitPageSkeleton({ left = 320 }: { left?: number }) {
  return (
    <Delay>
      <HeaderSkeleton />
      <TabsSkeleton />
      <div className="mt-6 grid gap-6 lg:grid-cols-[var(--left)_minmax(0,1fr)]" style={{ ["--left" as string]: `${left}px` }}>
        <PanelSkeleton rows={4} className="self-start" />
        <PanelSkeleton rows={7} />
      </div>
    </Delay>
  );
}

export function FormsPageSkeleton() {
  return (
    <Delay>
      <HeaderSkeleton />
      <div className="flex min-w-0 flex-col gap-12">
        <TableSkeleton rows={2} cols={6} />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-2">
          <PanelSkeleton rows={7} />
          <PanelSkeleton rows={7} />
        </div>
      </div>
    </Delay>
  );
}
