import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link" | "destructive" | "accent";
export type ButtonSize = "s" | "m" | "l";

/*
 * Buttons (brand/BRAND_GUIDELINES.md § 9.3): pill; press scale 0.98 for 100 ms, no overshoot, no lift and no glow.
 * - accent: Oxblood, the ONE primary action of a screen ("Zahlungspflichtig buchen", "Termin wählen").
 * - primary: Espresso with a Bone label, every other strong action.
 * - secondary: transparent with a 1 px control ring; ghost: text only; both fill Linen on hover.
 * - link: Espresso, underlined in line-strong, Oxblood on hover. destructive: vermilion, never Oxblood.
 * Disabled: Oat fill, Taupe label. Loading morphs the label into a spinner at the same width.
 */
const base =
  "relative isolate inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full type-button pressable focus-ring disabled:pointer-events-none aria-busy:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-interactive text-ink-inverse hover:bg-interactive-hover active:bg-interactive-pressed disabled:bg-interactive-disabled disabled:text-ink-disabled",
  accent:
    "bg-accent text-on-accent shadow-accent hover:bg-accent-hover active:bg-accent-pressed disabled:bg-interactive-disabled disabled:text-ink-disabled disabled:shadow-none",
  secondary:
    "bg-transparent text-ink ring-1 ring-line-control ring-inset hover:bg-surface-sunken active:bg-surface-pressed disabled:text-ink-disabled disabled:ring-line",
  ghost: "text-ink hover:bg-surface-sunken active:bg-surface-pressed disabled:text-ink-disabled",
  link: "h-auto! px-0! text-link underline decoration-line-strong decoration-1 underline-offset-4 hover:text-link-hover hover:decoration-current",
  destructive: "bg-danger text-on-danger hover:bg-danger-hover disabled:opacity-50",
};

const sizes: Record<ButtonSize, string> = {
  // 36 px visual, 44 px hit area (A5-6): the pseudo-element extends the target vertically.
  s: "h-control-s px-3.5 text-[0.875rem] [&_svg]:size-4 before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']",
  m: "h-12 px-[1.375rem] [&_svg]:size-5",
  l: "h-control-l px-[1.625rem] text-[1rem] [&_svg]:size-5",
};

export function buttonClasses({
  variant = "primary",
  size = "m",
  block,
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], block && "w-full", className);
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
};

export function Button({
  variant,
  size,
  block,
  loading,
  icon,
  iconRight,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, block, className })}
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      <span
        className={cn(
          "inline-flex items-center gap-2 transition-[opacity,scale,filter] duration-base ease-standard",
          loading && "scale-95 opacity-0 blur-[2px]",
        )}
      >
        {icon}
        {children}
        {iconRight}
      </span>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center transition-[opacity,scale] duration-spring ease-spring",
          loading ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
      >
        {loading ? <Spinner size={size === "s" ? 16 : 20} /> : null}
      </span>
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
};

export function ButtonLink({ variant, size, block, icon, iconRight, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, block, className })} {...props}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}

/** 44px icon-only ghost button (circle). Always pass an aria-label. */
export function IconButton({
  className,
  label,
  children,
  type = "button",
  ...props
}: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-touch shrink-0 items-center justify-center rounded-full text-ink pressable focus-ring hover:bg-surface-sunken active:bg-surface-pressed disabled:text-ink-disabled",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
