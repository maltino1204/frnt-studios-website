import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link" | "destructive" | "accent";
export type ButtonSize = "s" | "m" | "l";

/*
 * Buttons (design-guideline v2 §8): pill, spring press (scale 0.97), 1 px hover
 * lift on filled variants, focus glow, loading morphs label → spinner.
 */
const base =
  "relative isolate inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full pressable focus-ring disabled:pointer-events-none aria-busy:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-ink-inverse shadow-ink hover:bg-ink-hover hover:-translate-y-px disabled:bg-surface-sunken disabled:text-ink-disabled disabled:shadow-none",
  accent:
    "bg-accent text-on-accent shadow-accent hover:bg-accent-hover hover:-translate-y-px disabled:bg-surface-sunken disabled:text-ink-disabled disabled:shadow-none",
  secondary:
    "bg-surface-raised text-ink shadow-[0_1px_2px_rgb(23_22_31/0.06)] ring-1 ring-line-mid ring-inset hover:-translate-y-px hover:ring-line-strong hover:shadow-[0_4px_12px_-4px_rgb(23_22_31/0.14)] disabled:text-ink-disabled disabled:ring-line",
  ghost: "text-ink hover:bg-surface-sunken active:bg-surface-pressed disabled:text-ink-disabled",
  link: "h-auto! px-0! text-accent underline decoration-1 underline-offset-[0.2em] hover:text-accent-hover",
  destructive:
    "bg-danger text-on-danger shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_1px_2px_rgb(190_49_39/0.3),0_6px_14px_-6px_rgb(190_49_39/0.5)] hover:brightness-95 hover:-translate-y-px disabled:opacity-50",
};

const sizes: Record<ButtonSize, string> = {
  s: "h-control-s px-3.5 type-label-s [&_svg]:size-4",
  m: "h-control px-5 type-label [&_svg]:size-[18px]",
  l: "h-control-l px-7 type-label text-[1rem] [&_svg]:size-5",
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
