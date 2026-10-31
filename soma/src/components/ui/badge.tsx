import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "ink" | "aura";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-sunken text-ink-muted",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  ink: "bg-ink text-ink-inverse",
  aura: "aura-border text-ink",
};
const DOTS: Partial<Record<BadgeTone, string>> = {
  neutral: "bg-ink-muted",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  aura: "bg-aura",
};

/**
 * Small pill label: "Neu", "Sofort bestätigt", "Demo", "Top bewertet".
 * Colour always comes with a word. `aura` is for one key badge per view.
 */
export function Badge({
  tone = "neutral",
  size = "m",
  dot,
  icon,
  className,
  children,
}: {
  tone?: BadgeTone;
  size?: "s" | "m";
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full whitespace-nowrap [&_svg]:size-3.5",
        size === "s" ? "h-5 px-2 text-[11.5px] leading-none font-[560]" : "h-6 px-2.5 type-label-s",
        TONES[tone],
        className,
      )}
    >
      {dot && DOTS[tone] ? <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", DOTS[tone])} /> : null}
      {icon}
      {children}
    </span>
  );
}

/** Keyboard key hint, e.g. <Kbd>Esc</Kbd>. Pair with text; never the only instruction. */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[6px] bg-surface-raised px-1.5 font-sans text-[11px] leading-none font-[560] text-ink-muted shadow-[0_0_0_1px_var(--color-line-mid),0_1px_0_1px_var(--color-line)] num",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
