import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SegmentOption = { value: string; label: ReactNode };

/**
 * Segmented control built on native radios, so it works inside <form> without JS.
 * Pill track (Linen), an Espresso thumb that settles on the checked
 * option (CSS :has(), up to 6 options), 44px (36 dense).
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
        "segmented relative isolate inline-flex w-full rounded-full bg-surface-sunken p-[3px] inset-shadow-sunken",
        dense ? "h-control-s" : "h-control",
        className,
      )}
      style={{ "--n": options.length } as CSSProperties}
    >
      <span aria-hidden className="segmented-thumb absolute inset-y-[3px] left-[3px] -z-10 rounded-full bg-selected" />
      {options.map((o) => (
        <label key={o.value} className="relative flex min-w-0 flex-1">
          <input
            type="radio"
            name={name}
            value={o.value}
            className="peer sr-only"
            {...(value !== undefined ? { checked: value === o.value, onChange: () => onChange?.(o.value) } : { defaultChecked: defaultValue === o.value })}
          />
          <span className="flex flex-1 items-center justify-center rounded-full px-3 type-label-s whitespace-nowrap text-ink-muted transition-[color,scale] duration-fast ease-standard peer-checked:text-ink-inverse peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-focus hover:text-ink peer-checked:hover:text-ink-inverse active:scale-[0.97]">
            {o.label}
          </span>
        </label>
      ))}
    </div>
  );
}
