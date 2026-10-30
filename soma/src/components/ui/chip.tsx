import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

/**
 * Filter chips: 36px visual / 44px hit area, pill shape (design-guideline §8).
 * Selected: ink fill with optional check.
 */
export function chipClasses(selected?: boolean, className?: string) {
  return cn(
    "relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[14px] font-[520] leading-none whitespace-nowrap transition-colors duration-fast ease-standard",
    "before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']",
    selected
      ? "border-ink bg-ink text-ink-inverse"
      : "border-line-strong bg-surface-raised text-ink hover:border-ink",
    className,
  );
}

export function Chip({
  selected,
  showCheck,
  className,
  children,
  type = "button",
  ...props
}: ComponentProps<"button"> & { selected?: boolean; showCheck?: boolean }) {
  return (
    <button type={type} aria-pressed={selected} className={chipClasses(selected, className)} {...props}>
      {selected && showCheck ? <Icon icon={Check} size={16} /> : null}
      {children}
    </button>
  );
}

export function ChipLink({
  selected,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { selected?: boolean }) {
  return (
    <Link aria-current={selected ? "true" : undefined} className={chipClasses(selected, className)} {...props}>
      {children}
    </Link>
  );
}

/** Horizontal, edge-bleeding scroll row (never wraps on mobile). */
export function ChipRow({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div
      role={label ? "group" : undefined}
      aria-label={label}
      className={cn(
        "-mx-(--space-gutter) flex snap-x gap-2 overflow-x-auto px-(--space-gutter) py-1 scrollbar-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
