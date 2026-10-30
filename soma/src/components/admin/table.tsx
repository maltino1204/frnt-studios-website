import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationLabel } from "@/components/ui/data";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/**
 * Class string for the kit <Table dense>: no wrapping (tables scroll
 * horizontally on small screens) and a fixed first column below lg.
 */
export const adminTable = cn(
  "[&_td]:whitespace-nowrap",
  "max-lg:[&_td:first-child]:sticky max-lg:[&_td:first-child]:left-0 max-lg:[&_td:first-child]:z-[1] max-lg:[&_td:first-child]:bg-surface-raised",
  "max-lg:[&_th:first-child]:sticky max-lg:[&_th:first-child]:left-0 max-lg:[&_th:first-child]:z-[1] max-lg:[&_th:first-child]:bg-surface-raised",
  "max-lg:[&_td:first-child]:shadow-[1px_0_0_var(--color-line)] max-lg:[&_th:first-child]:shadow-[1px_0_0_var(--color-line)]",
  "max-lg:[&_tbody_tr:hover_td:first-child]:bg-surface-sunken",
);

/**
 * `wrapperClassName` for the kit <Table>: makes the scroll container the containing block,
 * so absolutely positioned descendants (sr-only hints in cells) are clipped instead of
 * widening the page (audit-1 R11).
 */
export const adminTableWrapper = "relative max-w-full";

/**
 * Admin data table (audit-2 N7): the kit table styling inside a scroll region that is
 * keyboard-focusable and named (`role="region"`, `tabIndex={0}`, `aria-label`; axe
 * scrollable-region-focusable). The region is `relative` and `max-w-full`, so wide tables
 * scroll inside it and never widen the page; the first column stays sticky below lg.
 */
export function AdminTable({
  label,
  className,
  regionClassName,
  ...props
}: ComponentProps<"table"> & { label: string; regionClassName?: string }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        "relative max-w-full min-w-0 overflow-x-auto border border-line bg-surface-raised",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        regionClassName,
      )}
    >
      <table
        data-dense=""
        className={cn(
          "w-full border-collapse text-left type-body-s",
          "[&_th]:h-10 [&_th]:border-b [&_th]:border-line-strong [&_th]:px-4 [&_th]:type-label-s [&_th]:font-[520] [&_th]:whitespace-nowrap [&_th]:text-ink-muted",
          "[&_td]:border-b [&_td]:border-line [&_td]:px-4 [&_tr:last-child_td]:border-b-0 [&_td]:h-10",
          "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-surface-sunken",
          adminTable,
          className,
        )}
        {...props}
      />
    </div>
  );
}

/** Right-aligned numeric header/cell helpers. */
export const numCell = "text-right num";

/** Builds a URL keeping the current filters and overriding some (undefined/"" removes). */
export function hrefWith(base: string, current: Record<string, string | undefined>, patch: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...patch })) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}

/** Pagination row: "1–25 von 312" plus previous/next links. */
export function TablePager({
  page,
  pageSize,
  total,
  href,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  href: (page: number) => string;
  className?: string;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const last = Math.max(1, Math.ceil(total / pageSize));
  const link = "inline-flex h-control-s items-center gap-1 rounded-xs border border-line-strong bg-surface-raised px-2.5 type-label-s text-ink hover:border-ink";
  const off = "inline-flex h-control-s items-center gap-1 rounded-xs border border-line px-2.5 type-label-s text-ink-disabled";
  return (
    <nav aria-label="Seiten" className={cn("flex items-center justify-between gap-4 pt-3", className)}>
      <PaginationLabel from={from} to={to} total={total} />
      {last > 1 ? (
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={href(page - 1)} className={link} rel="prev">
              <Icon icon={ChevronLeft} size={16} /> Zurück
            </Link>
          ) : (
            <span className={off} aria-disabled>
              <Icon icon={ChevronLeft} size={16} /> Zurück
            </span>
          )}
          <span className="type-caption text-ink-muted num">
            Seite {page} von {last}
          </span>
          {page < last ? (
            <Link href={href(page + 1)} className={link} rel="next">
              Weiter <Icon icon={ChevronRight} size={16} />
            </Link>
          ) : (
            <span className={off} aria-disabled>
              Weiter <Icon icon={ChevronRight} size={16} />
            </span>
          )}
        </div>
      ) : null}
    </nav>
  );
}

/** Primary cell content: a link in ink with an underline on hover, plus an optional muted second line. */
export function CellLink({ href, children, sub }: { href: string; children: ReactNode; sub?: ReactNode }) {
  return (
    <span className="flex flex-col">
      <Link href={href} className="w-fit rounded-xs font-[520] text-ink underline-offset-4 hover:underline">
        {children}
      </Link>
      {sub ? <span className="type-caption text-ink-muted">{sub}</span> : null}
    </span>
  );
}
