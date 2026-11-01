import { cn } from "@/lib/cn";

/**
 * A formatted number (de-DE, tabular figures) that is final on the first frame. Money, ratings and counts never count
 * up (brand MOTION.md, BRAND_GUIDELINES.md § 10.1: "Prices appear final and never count up"). Server-safe.
 */
export function FormattedNumber({
  value,
  format,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  /** Intl.NumberFormat options for de-DE, e.g. { maximumFractionDigits: 1 } */
  format?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  return <span className={cn("num", className)}>{`${prefix}${new Intl.NumberFormat("de-DE", format).format(value)}${suffix}`}</span>;
}
