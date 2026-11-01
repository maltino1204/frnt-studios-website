import Link from "next/link";
import { ViewTransition, type ComponentProps, type ReactNode } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/**
 * Filter toolbar above tables: a native GET form, so filters are shareable
 * URLs and work without JavaScript. Children are dense kit fields.
 */
export function FilterForm({
  action,
  children,
  more,
  moreActive = 0,
  resetHref,
  hidden,
  className,
  label = "Filter",
}: {
  action: string;
  children: ReactNode;
  /** secondary fields: inline from md, behind a "Weitere Filter" toggle below md (CSS only, no JS) */
  more?: ReactNode;
  /** number of active secondary filters (opens the toggle and shows the count) */
  moreActive?: number;
  resetHref?: string;
  hidden?: Record<string, string | undefined>;
  className?: string;
  label?: string;
}) {
  const id = `more-${ident(label)}`;
  return (
    <form method="get" action={action} role="search" aria-label={label} className={cn("flex flex-wrap items-end gap-x-3 gap-y-3", className)}>
      {Object.entries(hidden ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      {children}
      {more ? (
        <>
          <input id={id} type="checkbox" defaultChecked={moreActive > 0} className="peer sr-only md:hidden" aria-label="Weitere Filter anzeigen" />
          <label
            htmlFor={id}
            aria-hidden
            className={cn(
              buttonClasses({ variant: "secondary", size: "s" }),
              "cursor-pointer peer-checked:bg-ink peer-checked:text-ink-inverse peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus md:hidden",
            )}
          >
            <Icon icon={SlidersHorizontal} size={16} />
            Weitere Filter
            {moreActive ? <span className="rounded-full bg-ink px-1.5 text-[12px] leading-[18px] font-[600] text-ink-inverse num">{moreActive}</span> : null}
          </label>
          <div className="flex w-full flex-wrap items-end gap-3 max-md:hidden max-md:peer-checked:flex md:contents">{more}</div>
        </>
      ) : null}
      <div className="flex items-center gap-1.5">
        <Button type="submit" size="s">
          Anwenden
        </Button>
        {resetHref ? (
          <Link href={resetHref} className={buttonClasses({ variant: "ghost", size: "s" })}>
            Zurücksetzen
          </Link>
        ) : null}
      </div>
    </form>
  );
}

/** Dense search input with a leading magnifier (kit Input underneath). */
export function SearchField({ className, label = "Suche", hideLabel = true, ...props }: Omit<ComponentProps<typeof Input>, "label" | "dense" | "type"> & { label?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Input dense type="search" label={label} hideLabel={hideLabel} style={{ paddingLeft: "2.375rem" }} {...props} />
      <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 flex h-control-s w-10 items-center justify-center text-ink-muted">
        <Icon icon={Search} size={16} />
      </span>
    </div>
  );
}

/** Row of filter chips (ChipLinks) with a muted label. */
export function ChipFilter({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="group" aria-label={label} className={cn("flex min-w-0 items-center gap-3", className)}>
      <span className="hidden shrink-0 type-label-s text-ink-muted md:inline">{label}</span>
      <div className="-mx-(--space-gutter) flex min-w-0 gap-2 overflow-x-auto px-(--space-gutter) py-1 scrollbar-none md:mx-0 md:flex-wrap md:px-0">{children}</div>
    </div>
  );
}

const ident = (s: string) => s.normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "seg";

/**
 * Segmented filter made of links (server-rendered, shareable URLs, no JS): a sunken pill
 * track with an ink thumb on the current option. The thumb glides to the new option on
 * navigation (shared view transition, like TabLinks). `aria-current` marks the active link.
 */
export function SegmentedLinks({
  label,
  items,
  className,
  showLabel = true,
}: {
  label: string;
  items: Array<{ href: string; label: ReactNode; active: boolean; count?: number }>;
  className?: string;
  showLabel?: boolean;
}) {
  const name = `seg-thumb-${ident(label)}`;
  return (
    <div role="group" aria-label={label} className={cn("flex min-w-0 items-center gap-3", className)}>
      {showLabel ? <span className="hidden shrink-0 type-label-s text-ink-muted md:inline">{label}</span> : null}
      <div className="-mx-(--space-gutter) min-w-0 overflow-x-auto px-(--space-gutter) py-1 scrollbar-none md:mx-0 md:px-0">
        <ul className="inline-flex h-control-s items-stretch rounded-full bg-surface-sunken p-[3px] inset-shadow-sunken">
          {items.map((it, i) => (
            <li key={i} className="flex">
              <Link
                href={it.href}
                aria-current={it.active ? "true" : undefined}
                scroll={false}
                className={cn(
                  "group/seg relative isolate flex items-center gap-1.5 rounded-full px-3 type-label-s whitespace-nowrap transition-[color,scale] duration-fast ease-standard pressable focus-ring",
                  "before:absolute before:-inset-y-[7px] before:inset-x-0 before:content-['']",
                  it.active ? "text-ink-inverse" : "text-ink-muted hover:text-ink",
                )}
              >
                {it.active ? (
                  <ViewTransition name={name} share="soma-morph" default="none">
                    <span aria-hidden className="absolute inset-0 -z-10 rounded-full bg-ink shadow-ink" />
                  </ViewTransition>
                ) : (
                  <span aria-hidden className="absolute inset-0 -z-10 rounded-full transition-colors duration-fast group-hover/seg:bg-surface-raised/80" />
                )}
                {it.label}
                {it.count ? (
                  <span className={cn("rounded-full px-1.5 text-[12px] leading-[18px] font-[600] num", it.active ? "bg-ink-inverse/15 text-ink-inverse" : "bg-surface-raised text-ink-muted")}>
                    {it.count}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
