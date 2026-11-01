import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

export type SegmentOption = {
  value: string;
  label: ReactNode;
  /** optional leading icon (e.g. a place icon); the check replaces it while the option is selected */
  icon?: ReactNode;
};

/**
 * Segmented control on native radios, so it works inside <form> without JS (brand § 9.3 "Chips, segmented").
 * Linen track; the selected segment is Espresso with a Bone label and a check (never colour alone). The check
 * replaces the option's leading icon instead of adding width, labels use the condensed width (§ 4.4), and segments
 * size to their content: equal shares where they fit, wider where a label needs it, two rows below that. 44 px
 * (36 dense).
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
        "relative isolate flex w-full flex-wrap gap-[3px] bg-surface-sunken p-[3px] inset-shadow-sunken",
        dense ? "min-h-control-s rounded-[18px]" : "min-h-control rounded-[22px]",
        className,
      )}
    >
      {options.map((o) => (
        <label key={o.value} className="relative flex min-w-fit flex-1 basis-0">
          <input
            type="radio"
            name={name}
            value={o.value}
            className="peer sr-only"
            {...(value !== undefined ? { checked: value === o.value, onChange: () => onChange?.(o.value) } : { defaultChecked: defaultValue === o.value })}
          />
          <span
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 type-label-s condensed whitespace-nowrap text-ink-muted",
              "transition-[background-color,color,scale] duration-base ease-standard hover:text-ink active:scale-[0.97]",
              "peer-checked:bg-selected peer-checked:text-ink-inverse peer-checked:hover:text-ink-inverse",
              "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-focus",
              "[&>.seg-check]:hidden peer-checked:[&>.seg-check]:inline-block peer-checked:[&>.seg-icon]:hidden",
            )}
          >
            <Icon icon={Check} size={14} className="seg-check shrink-0" />
            {o.icon ? <span className="seg-icon hidden shrink-0 min-[360px]:inline-flex">{o.icon}</span> : null}
            {o.label}
          </span>
        </label>
      ))}
    </div>
  );
}
