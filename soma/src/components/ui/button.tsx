import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link" | "destructive" | "accent";
export type ButtonSize = "s" | "m" | "l";

const base =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xs transition-colors duration-fast ease-standard disabled:pointer-events-none aria-busy:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-ink-inverse hover:bg-ink-hover active:opacity-92 disabled:bg-surface-sunken disabled:text-ink-disabled",
  accent: "bg-accent text-on-accent hover:bg-accent-hover active:opacity-92 disabled:bg-surface-sunken disabled:text-ink-disabled",
  secondary: "border border-ink text-ink hover:bg-surface-sunken disabled:border-line disabled:text-ink-disabled",
  ghost: "text-ink hover:bg-surface-sunken disabled:text-ink-disabled",
  link: "h-auto! px-0! text-accent underline decoration-1 underline-offset-[0.2em] hover:text-accent-hover",
  destructive: "bg-danger text-on-danger hover:brightness-92 disabled:opacity-50",
};

const sizes: Record<ButtonSize, string> = {
  s: "h-control-s px-3 type-label-s [&_svg]:size-4",
  m: "h-control px-5 type-label [&_svg]:size-5",
  l: "h-control-l px-6 type-label [&_svg]:size-5",
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
      <span className={cn("inline-flex items-center gap-2", loading && "opacity-0")}>
        {icon}
        {children}
        {iconRight}
      </span>
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size={size === "s" ? 16 : 20} />
        </span>
      ) : null}
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

/** 44px icon-only ghost button. Always pass an aria-label. */
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
        "inline-flex size-touch shrink-0 items-center justify-center rounded-xs text-ink transition-colors duration-fast hover:bg-surface-sunken disabled:text-ink-disabled",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
