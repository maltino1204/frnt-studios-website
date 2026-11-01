import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/**
 * Class string for admin tables: no wrapping (tables scroll horizontally on
 * small screens) and a fixed first column below lg.
 */
export const adminTable = cn(
  "[&_td]:whitespace-nowrap",
  "max-lg:[&_td:first-child]:sticky max-lg:[&_td:first-child]:left-0 max-lg:[&_td:first-child]:z-[1] max-lg:[&_td:first-child]:bg-surface-raised",
  "max-lg:[&_th:first-child]:sticky max-lg:[&_th:first-child]:left-0 max-lg:[&_th:first-child]:z-[3]",
  "max-lg:[&_td:first-child]:shadow-[1px_0_0_var(--color-line)] max-lg:[&_th:first-child]:shadow-[1px_0_0_var(--color-line),inset_0_-1px_0_var(--color-line)]",
  "max-lg:[&_tbody_tr:hover_td:first-child]:bg-surface-tint",
);

/**
 * `wrapperClassName` for the kit <Table>: makes the scroll container the containing block,
 * so absolutely positioned descendants (sr-only hints in cells) are clipped instead of
 * widening the page (audit-1 R11).
 */
export const adminTableWrapper = "relative max-w-full";

/**
 * Admin data table (Linear-grade, design-guideline v2 §8.4 / §12): a level-1 card with a
 * Kalk header band, 40px rows, hairlines, tinted row hover and tabular numbers.
 *
 * The card is a scroll region that is keyboard-focusable and named (`role="region"`,
 * `tabIndex={0}`, `aria-label`; axe scrollable-region-focusable, audit-2 N7). It is
 * `relative` and `max-w-full`, so wide tables scroll inside it and never widen the page;
 * the first column stays sticky below lg.
 *
 * `stickyHeader` (long, paginated lists): from lg the card is capped at the viewport height
 * and the header stays pinned while the rows scroll underneath (glass header).
 */
export function AdminTable({
  label,
  className,
  regionClassName,
  stickyHeader,
  compact,
  ...props
}: ComponentProps<"table"> & {
  label: string;
  regionClassName?: string;
  stickyHeader?: boolean;
  /** 12px instead of 16px cell padding (wide tables with many columns) */
  compact?: boolean;
}) {
  return (
    <div
      role="region"
      // distinct from the section heading's landmark name (axe landmark-unique)
      aria-label={`Tabelle: ${label}`}
      tabIndex={0}
      className={cn(
        "relative max-w-full min-w-0 overflow-x-auto rounded-card bg-surface-raised shadow-raised",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        stickyHeader && "lg:max-h-[calc(100dvh-7.5rem)] lg:overflow-y-auto lg:overscroll-y-contain",
        regionClassName,
      )}
    >
      <table
        data-dense=""
        className={cn(
          "w-full border-separate border-spacing-0 text-left type-body-s",
          // header band
          compact ? "[&_td]:px-3 [&_th]:px-3" : "[&_td]:px-4 [&_th]:px-4",
          "[&_th]:h-10 [&_th]:bg-surface [&_th]:type-label-s [&_th]:font-[520] [&_th]:whitespace-nowrap [&_th]:text-ink-muted [&_th]:shadow-[inset_0_-1px_0_var(--color-line)]",
          "[&_th:first-child]:pl-5 [&_th:last-child]:pr-5 [&_td:first-child]:pl-5 [&_td:last-child]:pr-5",
          stickyHeader && "lg:[&_thead_th]:sticky lg:[&_thead_th]:top-0 lg:[&_thead_th]:z-[2] lg:[&_thead_th]:bg-surface",
          // rows
          "[&_td]:h-10 [&_td]:border-b [&_td]:border-line [&_tbody_tr:last-child_td]:border-b-0",
          "[&_tbody_tr]:transition-colors [&_tbody_tr]:duration-fast [&_tbody_tr:hover]:bg-surface-tint",
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

/** Pagination row: "1–25 von 312" plus previous/next pills. */
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
  const link = buttonClasses({ variant: "secondary", size: "s", className: "gap-1 pl-2.5" });
  const linkNext = buttonClasses({ variant: "secondary", size: "s", className: "gap-1 pr-2.5" });
  const off = "inline-flex h-control-s items-center gap-1 rounded-full px-3 type-label-s text-ink-disabled ring-1 ring-line ring-inset";
  return (
    <nav aria-label="Seiten" className={cn("flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-3", className)}>
      <span className="type-caption text-ink-muted num">
        {total === 0 ? "0" : `${from.toLocaleString("de-DE")}–${to.toLocaleString("de-DE")}`} von {total.toLocaleString("de-DE")}
      </span>
      {last > 1 ? (
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={href(page - 1)} className={link} rel="prev">
              <Icon icon={ChevronLeft} size={16} /> Zurück
            </Link>
          ) : (
            <span className={cn(off, "pl-2.5")} aria-disabled>
              <Icon icon={ChevronLeft} size={16} /> Zurück
            </span>
          )}
          <span className="hidden px-1 type-caption text-ink-muted num sm:inline">
            Seite {page} von {last}
          </span>
          {page < last ? (
            <Link href={href(page + 1)} className={linkNext} rel="next">
              Weiter <Icon icon={ChevronRight} size={16} />
            </Link>
          ) : (
            <span className={cn(off, "pr-2.5")} aria-disabled>
              Weiter <Icon icon={ChevronRight} size={16} />
            </span>
          )}
        </div>
      ) : null}
    </nav>
  );
}

/**
 * Primary cell content: a link in ink with an underline on hover, plus an optional muted second line.
 * `row`: the link's hit area covers the whole table row (Linear-style row links); other interactive
 * elements in that row must sit above it (`rowAction`).
 */
export function CellLink({ href, children, sub, row }: { href: string; children: ReactNode; sub?: ReactNode; row?: boolean }) {
  return (
    <span className="flex flex-col">
      <Link
        href={href}
        className={cn(
          // py-0.5: the target grows to ≥ 24 px (WCAG 2.5.8, A5-6); no negative margin, so stacked links never overlap.
          "w-fit rounded-[6px] py-0.5 font-[520] text-ink decoration-line-strong underline-offset-4 hover:underline focus-ring",
          row && "after:absolute after:inset-0 after:content-[''] [tr:hover_&]:underline",
        )}
      >
        {children}
      </Link>
      {sub ? <span className="type-caption text-ink-muted">{sub}</span> : null}
    </span>
  );
}

/** Lifts an interactive element above a row link (see CellLink `row`). */
export const rowAction = "relative z-[2]";

/** Table row that hosts a row link (CellLink `row`). */
export const rowLink = "relative cursor-pointer";
