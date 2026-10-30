import { Check, CircleAlert, ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

/**
 * Form fields (design-guideline §8 "Inputs and selects"). 48px tall (36px dense),
 * raised surface, 1px line-strong border, 2px radius, 16px text.
 */
const control =
  "w-full rounded-xs border border-line-strong bg-surface-raised px-3.5 text-ink placeholder:text-ink-muted/80 transition-colors duration-fast hover:border-ink-muted focus:border-ink focus:outline-offset-1 disabled:border-line disabled:bg-surface-sunken disabled:text-ink-disabled aria-invalid:border-danger";

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
        <p id={`${id}-error`} className="flex items-start gap-1.5 type-caption text-danger">
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
  id: idProp,
  ...props
}: FieldProps & Omit<ComponentProps<"input">, "size">) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className} hideLabel={hideLabel}>
      <input
        id={id}
        className={cn(control, dense ? "h-control-s text-[15px]" : "h-12")}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...props}
      />
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
      <div className="relative">
        <select
          id={id}
          className={cn(control, "appearance-none pr-10", dense ? "h-control-s text-[15px]" : "h-12")}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          {...props}
        >
          {children}
        </select>
        <Icon icon={ChevronDown} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-muted" />
      </div>
    </FieldShell>
  );
}

/** 20px checkbox, 2px radius, ink fill when checked; the tick is an icon over the native input. */
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
      <label htmlFor={id} className="flex min-h-touch cursor-pointer items-start gap-3 py-2.5">
        <span className="relative mt-0.5 inline-flex size-5 shrink-0">
          <input
            id={id}
            type="checkbox"
            className="peer size-5 appearance-none rounded-xs border border-line-strong bg-surface-raised transition-colors checked:border-ink checked:bg-ink aria-invalid:border-danger"
            aria-invalid={error ? true : undefined}
            {...props}
          />
          <Check
            aria-hidden
            size={14}
            strokeWidth={2}
            className="pointer-events-none absolute top-[3px] left-[3px] text-ink-inverse opacity-0 transition-opacity peer-checked:opacity-100"
          />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="type-body-s text-ink">{label}</span>
          {description ? <span className="type-caption text-ink-muted">{description}</span> : null}
        </span>
      </label>
      {error ? <p className="type-caption text-danger">{error}</p> : null}
    </div>
  );
}

/** 40×24 switch; ink when on. Uses a native checkbox for forms and a11y. */
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
    <label htmlFor={id} className={cn("flex min-h-touch cursor-pointer items-center justify-between gap-4 py-2", className)}>
      <span className="flex flex-col gap-0.5">
        <span className="type-body-s text-ink">{label}</span>
        {description ? <span className="type-caption text-ink-muted">{description}</span> : null}
      </span>
      <span className="relative inline-flex shrink-0">
        <input id={id} type="checkbox" role="switch" className="peer sr-only" {...props} />
        <span className="h-6 w-10 rounded-full bg-line-strong transition-colors duration-fast peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus" />
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-surface-raised transition-transform duration-fast ease-standard peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

/** Radio card list, e.g. choose a saved address. */
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
        "flex min-h-touch cursor-pointer items-start gap-3 border-b border-line py-3.5 last:border-b-0 has-checked:[&_.radio-label]:font-semibold",
        className,
      )}
    >
      <input
        id={id}
        type="radio"
        className="mt-0.5 size-5 shrink-0 appearance-none rounded-full border border-line-strong bg-surface-raised transition-[border-width,border-color] checked:border-[6px] checked:border-ink"
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
