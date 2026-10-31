import { CircleAlert, ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

/**
 * Form fields (design-guideline v2 §8 "Inputs"). 48px tall (36px dense), white,
 * 1px line-strong border (3:1), 10px radius, soft inner shadow, 16px text.
 * Focus: accent border plus a 4px focus glow.
 */
const control =
  "w-full rounded-control border border-line-strong bg-surface-raised px-3.5 text-ink inset-shadow-field placeholder:text-ink-muted transition-[border-color,box-shadow,background-color] duration-fast ease-standard hover:border-ink-muted focus:border-accent focus:outline-none focus:ring-4 focus:ring-focus-glow disabled:border-line disabled:bg-surface-sunken disabled:text-ink-disabled disabled:shadow-none aria-invalid:border-danger aria-invalid:focus:ring-danger/15";

export type FieldProps = {
  label: ReactNode;
  name?: string;
  hint?: ReactNode;
  error?: string | null;
  optional?: boolean;
  className?: string;
  dense?: boolean;
  /** visually hide the label but keep it accessible */
  hideLabel?: boolean;
};

export function FieldShell({
  id,
  label,
  hint,
  error,
  optional,
  className,
  hideLabel,
  children,
}: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className={cn("type-label-s text-ink", hideLabel && "sr-only")}>
        {label}
        {optional ? <span className="font-normal text-ink-muted"> (optional)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="flex animate-fade-in items-start gap-1.5 type-caption text-danger">
          <Icon icon={CircleAlert} size={16} className="mt-px shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="type-caption text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string | null, hint?: ReactNode) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

export function Input({
  label,
  hint,
  error,
  optional,
  className,
  dense,
  hideLabel,
  suffix,
  trailing,
  id: idProp,
  ...props
}: FieldProps &
  Omit<ComponentProps<"input">, "size"> & {
    /** static text inside the field's right edge, e.g. "€" or "km" */
    suffix?: ReactNode;
    /** interactive element at the right edge, e.g. a password visibility toggle */
    trailing?: ReactNode;
  }) {
  const auto = useId();
  const id = idProp ?? auto;
  const input = (
    <input
      id={id}
      className={cn(control, dense ? "h-control-s text-[15px]" : "h-12", (suffix || trailing) && "pr-12")}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, error, hint)}
      {...props}
    />
  );
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className} hideLabel={hideLabel}>
      {suffix || trailing ? (
        <div className="relative">
          {input}
          {suffix ? (
            <span aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 type-body-s text-ink-muted">
              {suffix}
            </span>
          ) : null}
          {trailing ? <span className="absolute top-1/2 right-0.5 -translate-y-1/2">{trailing}</span> : null}
        </div>
      ) : (
        input
      )}
    </FieldShell>
  );
}

export function Textarea({
  label,
  hint,
  error,
  optional,
  className,
  hideLabel,
  id: idProp,
  rows = 4,
  ...props
}: FieldProps & ComponentProps<"textarea">) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className} hideLabel={hideLabel}>
      <textarea
        id={id}
        rows={rows}
        className={cn(control, "min-h-24 py-3 leading-normal")}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...props}
      />
    </FieldShell>
  );
}

export function Select({
  label,
  hint,
  error,
  optional,
  className,
  dense,
  hideLabel,
  id: idProp,
  children,
  ...props
}: FieldProps & ComponentProps<"select">) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className} hideLabel={hideLabel}>
      <div className="group relative">
        <select
          id={id}
          className={cn(control, "appearance-none pr-10", dense ? "h-control-s text-[15px]" : "h-12")}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          {...props}
        >
          {children}
        </select>
        <Icon
          icon={ChevronDown}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-muted transition-[color,rotate] duration-base ease-spring group-focus-within:rotate-180 group-focus-within:text-ink"
        />
      </div>
    </FieldShell>
  );
}

/**
 * 20px checkbox, 6px radius, ink fill when checked. The tick draws itself in
 * (stroke-dashoffset) and the box settles on a spring.
 */
export function Checkbox({
  label,
  description,
  className,
  id: idProp,
  error,
  ...props
}: { label: ReactNode; description?: ReactNode; error?: string | null } & Omit<ComponentProps<"input">, "type">) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="group flex min-h-touch cursor-pointer items-start gap-3 py-2.5">
        <span className="relative mt-0.5 inline-flex size-5 shrink-0">
          <input
            id={id}
            type="checkbox"
            className="peer size-5 appearance-none rounded-[6px] border border-line-strong bg-surface-raised inset-shadow-field transition-[background-color,border-color,box-shadow,scale] duration-fast ease-standard group-hover:border-ink-muted checked:border-ink checked:bg-ink checked:shadow-ink checked:animate-settle focus-ring aria-invalid:border-danger active:scale-90"
            aria-invalid={error ? true : undefined}
            {...props}
          />
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute inset-0 size-5 text-ink-inverse [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-base ease-enter peer-checked:[stroke-dashoffset:0] peer-checked:delay-75"
            strokeDasharray={1}
          >
            <path d="M5.5 10.4l3 3 6-6.4" pathLength={1} stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="type-body-s text-ink">{label}</span>
          {description ? <span className="type-caption text-ink-muted">{description}</span> : null}
        </span>
      </label>
      {error ? <p className="animate-fade-in type-caption text-danger">{error}</p> : null}
    </div>
  );
}

/** 42×24 switch; ink when on. The knob springs across and stretches while pressed. Native checkbox for forms and a11y. */
export function Switch({
  label,
  description,
  className,
  id: idProp,
  ...props
}: { label: ReactNode; description?: ReactNode } & Omit<ComponentProps<"input">, "type">) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <label htmlFor={id} className={cn("group flex min-h-touch cursor-pointer items-center justify-between gap-4 py-2", className)}>
      <span className="flex flex-col gap-0.5">
        <span className="type-body-s text-ink">{label}</span>
        {description ? <span className="type-caption text-ink-muted">{description}</span> : null}
      </span>
      <span className="relative inline-flex shrink-0">
        <input id={id} type="checkbox" role="switch" className="peer sr-only" {...props} />
        <span className="h-6 w-[42px] rounded-full bg-surface-pressed ring-1 ring-line-strong ring-inset transition-[background-color,box-shadow] duration-base ease-standard peer-checked:bg-ink peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-focus-visible:shadow-[0_0_0_6px_var(--color-focus-glow)] peer-disabled:opacity-50" />
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-surface-raised shadow-[0_1px_2px_rgb(23_22_31/0.2),0_2px_6px_-1px_rgb(23_22_31/0.18)] transition-[translate,width] duration-spring ease-spring group-active:w-6 peer-checked:translate-x-[18px] peer-checked:group-active:translate-x-[14px]" />
      </span>
    </label>
  );
}

/** Radio card list, e.g. choose a saved address. The dot springs in. */
export function RadioRow({
  label,
  description,
  aside,
  className,
  id: idProp,
  ...props
}: { label: ReactNode; description?: ReactNode; aside?: ReactNode } & Omit<ComponentProps<"input">, "type">) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-touch cursor-pointer items-start gap-3 border-b border-line py-3.5 transition-colors duration-fast last:border-b-0 has-checked:[&_.radio-label]:font-semibold",
        className,
      )}
    >
      <input
        id={id}
        type="radio"
        className="mt-0.5 size-5 shrink-0 appearance-none rounded-full border border-line-strong bg-surface-raised inset-shadow-field transition-[border-width,border-color,scale] duration-spring ease-spring checked:border-[6px] checked:border-ink focus-ring active:scale-90"
        {...props}
      />
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="radio-label type-body-s text-ink">{label}</span>
        {description ? <span className="type-caption text-ink-muted">{description}</span> : null}
      </span>
      {aside ? <span className="type-body-s num text-ink">{aside}</span> : null}
    </label>
  );
}
