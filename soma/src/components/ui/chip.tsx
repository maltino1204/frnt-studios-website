import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

/**
 * Filter chips: 36px visual / 44px hit area, pill (design-guideline v2 §8).
 * Rest: white with a mid hairline. Selected: ink fill that settles on a spring.
 */
export function chipClasses(selected?: boolean, className?: string) {
  return cn(
    "relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[14px] font-[520] leading-none tracking-[-0.006em] whitespace-nowrap pressable focus-ring",
    "before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']",
    selected
      ? "animate-settle border-ink bg-ink text-ink-inverse shadow-ink"
      : "border-line-mid bg-surface-raised text-ink shadow-[0_1px_2px_rgb(23_22_31/0.04)] hover:border-line-strong hover:bg-surface-raised",
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
      {selected && showCheck ? <Icon icon={Check} size={16} className="animate-pop" /> : null}
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
        "-mx-(--space-gutter) flex snap-x gap-2 overflow-x-auto px-(--space-gutter) py-1.5 scrollbar-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
