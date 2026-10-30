"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { berlinDateKey, formatDayShort, formatTime } from "@/lib/format";
import { formatRemaining } from "./labels";

/**
 * "Du hast noch 1 Std. 40 Min." – live response countdown for open requests.
 * Server HTML and the first client render show only the fixed deadline; the
 * remaining time starts after mount, so hydration never sees two clocks (N11).
 */
export function ResponseCountdown({ until, className }: { until: string | null; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);
  if (!until) return null;
  const deadline = `${formatDayShort(until)}, ${formatTime(until)}\u00a0Uhr`;
  if (now === null) {
    return (
      <p className={cn("flex items-start gap-2 type-body-s text-warning", className)}>
        <Clock size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden className="mt-0.5 shrink-0" />
        <span>{`Antworte bis ${deadline}.`}</span>
      </p>
    );
  }
  const left = Date.parse(until) - now;
  const urgent = left < 30 * 60_000;
  return (
    <p className={cn("flex items-start gap-2 type-body-s", left <= 0 ? "text-ink-muted" : urgent ? "text-danger" : "text-warning", className)}>
      <Clock size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden className="mt-0.5 shrink-0" />
      {left > 0 ? (
        <span>
          Du hast noch <span className="font-semibold num">{formatRemaining(left)}</span> Zeit zu antworten (bis {berlinDateKey(until) === berlinDateKey(now) ? "" : `${formatDayShort(until)}, `}
          {`${formatTime(until)}\u00a0Uhr`}).
        </span>
      ) : (
        <span>Die Antwortfrist ist abgelaufen.</span>
      )}
    </p>
  );
}
