import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Chapter eyebrow „{NN} · {label}“ (spec § 3.1): 12 px caps, the number in tabular figures, umber-deep. */
export function Eyebrow({ nn, children, className }: { nn?: string; children: ReactNode; className?: string }) {
  return (
    <p className={cn("type-eyebrow text-ink-muted", className)}>
      {nn ? (
        <>
          <span className="num">{nn}</span>
          {" · "}
        </>
      ) : null}
      {children}
    </p>
  );
}
