import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TimelineItem = { key: string | number; title: ReactNode; time: ReactNode; note?: ReactNode; meta?: ReactNode };

/**
 * Vertical event timeline (status history, booking events): a hairline spine, muted
 * nodes and one current node in accent with a soft halo. Items are rendered in the
 * given order; `current` is the index of the latest state.
 */
export function Timeline({ items, current, className }: { items: TimelineItem[]; current: number; className?: string }) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {items.map((e, i) => {
        const isCurrent = i === current;
        const last = i === items.length - 1;
        return (
          <li key={e.key} className={cn("relative grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3", !last && "pb-4")}>
            <span aria-hidden className="relative flex justify-center">
              {!last ? <span className="absolute top-[1.2rem] -bottom-[1.1rem] w-px bg-line-mid" /> : null}
              <span
                className={cn(
                  "relative mt-[0.3rem] size-2.5 rounded-full",
                  isCurrent ? "bg-accent shadow-[0_0_0_3px_var(--color-surface-raised),0_0_0_6px_color-mix(in_srgb,var(--color-accent)_16%,transparent)]" : "bg-surface-raised shadow-[inset_0_0_0_2px_var(--color-line-strong)]",
                )}
              />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                <p className={cn("min-w-0 type-body-s", isCurrent ? "text-ink" : "text-ink")}>{e.title}</p>
                <p className="shrink-0 type-caption text-ink-muted num">{e.time}</p>
              </div>
              {e.meta ? <p className="type-caption text-ink-muted">{e.meta}</p> : null}
              {e.note ? <p className="mt-1 rounded-tile bg-surface-sunken/70 px-3 py-2 type-caption whitespace-pre-line text-ink">„{e.note}“</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
