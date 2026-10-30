import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SegmentOption = { value: string; label: ReactNode };

/**
 * Segmented control built on native radios, so it works inside <form> without JS.
 * 44px (36 dense), 1px line-strong border, 3px inner padding, ink-filled selection.
 */
export function SegmentedControl({
  name,
  options,
  value,
  defaultValue,
  onChange,
  dense,
  className,
  label,
}: {
  name: string;
  options: SegmentOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  dense?: boolean;
  className?: string;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex w-full rounded-xs border border-line-strong bg-surface-raised p-[3px]",
        dense ? "h-control-s" : "h-control",
        className,
      )}
    >
      {options.map((o) => (
        <label key={o.value} className="relative flex flex-1">
          <input
            type="radio"
            name={name}
            value={o.value}
            className="peer sr-only"
            {...(value !== undefined ? { checked: value === o.value, onChange: () => onChange?.(o.value) } : { defaultChecked: defaultValue === o.value })}
          />
          <span className="flex flex-1 items-center justify-center rounded-[1px] px-3 type-label-s text-ink-muted transition-colors duration-fast peer-checked:bg-ink peer-checked:text-ink-inverse peer-focus-visible:outline-2 peer-focus-visible:outline-focus hover:text-ink peer-checked:hover:text-ink-inverse">
            {o.label}
          </span>
        </label>
      ))}
    </div>
  );
}
