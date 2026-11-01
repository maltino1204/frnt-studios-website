import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

/**
 * Filter chips (brand § 9.3): 36 px visual / 44 px hit area, pill, `label` 540; long words switch to the condensed
 * width. Rest: transparent with a Stone hairline, Linen on hover. Selected: Espresso fill and Bone label (with a
 * check where the API shows one), never Oxblood.
 */
export function chipClasses(selected?: boolean, className?: string) {
  return cn(
    "relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 type-label leading-none whitespace-nowrap pressable focus-ring",
    "before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']",
    selected
      ? "border-selected bg-selected text-ink-inverse"
      : "border-line-mid bg-transparent text-ink hover:border-line-strong hover:bg-surface-sunken",
    className,
  );
}

/** Selected chips always show a 16 px check before the label: selection is never colour alone (brand § 9.3). */
export function Chip({
  selected,
  showCheck = true,
  className,
  children,
  type = "button",
  ...props
}: ComponentProps<"button"> & { selected?: boolean; /** set false only where the chip carries its own selected icon */ showCheck?: boolean }) {
  return (
    <button type={type} aria-pressed={selected} className={chipClasses(selected, className)} {...props}>
      {selected && showCheck ? <Icon icon={Check} size={16} className="-ml-0.5 animate-pop" /> : null}
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
      {selected ? <Icon icon={Check} size={16} className="-ml-0.5" /> : null}
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
