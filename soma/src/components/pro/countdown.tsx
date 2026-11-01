"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { berlinDateKey, formatDayShort, formatTime } from "@/lib/format";
import { formatRemaining } from "./labels";

/**
 * Live response countdown for open requests: a ring that empties over the
 * response window plus the remaining time as text ("Noch 1 Std. 40 Min.").
 * The server passes its clock (`serverNow`), so server HTML and the first
 * client render agree exactly; the client clock takes over after mount (N11).
 * Below 30 minutes the ring turns danger-red. The text is the information;
 * the ring is decorative.
 */
export function ResponseCountdown({
  until,
  serverNow,
  windowHours = 4,
  className,
}: {
  until: string | null;
  serverNow: number;
  /** nominal response window for the ring (platform setting) */
  windowHours?: number;
  className?: string;
}) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);
  if (!until) return null;
  const end = Date.parse(until);
  const left = end - now;
  const urgent = left > 0 && left < 30 * 60_000;
  const fraction = left <= 0 ? 0 : Math.min(1, left / (Math.max(1, windowHours) * 3_600_000));
  const sameDay = berlinDateKey(until) === berlinDateKey(now);
  const deadline = `${sameDay ? "" : `${formatDayShort(until)}, `}${formatTime(until)} Uhr`;
  const tone = left <= 0 ? "muted" : urgent ? "danger" : "accent";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <CountdownRing fraction={fraction} tone={tone} />
      <p className="flex min-w-0 flex-col" aria-live="off">
        {left > 0 ? (
          <>
            <span className={cn("type-label num", urgent ? "text-danger" : "text-ink")}>Noch {formatRemaining(left)}</span>
            <span className="type-caption text-ink-muted">Antworte bis {deadline}</span>
          </>
        ) : (
          <>
            <span className="type-label text-ink-muted">Antwortfrist abgelaufen</span>
            <span className="type-caption text-ink-muted">Die Kundschaft wurde nicht belastet.</span>
          </>
        )}
      </p>
    </div>
  );
}

/** 40px ring: hairline track, arc in the aura (or danger) that empties as time runs out. */
function CountdownRing({ fraction, tone }: { fraction: number; tone: "accent" | "danger" | "muted" }) {
  const size = 40;
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  return (
    <span aria-hidden className="relative inline-flex size-10 shrink-0 items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 size-full -rotate-90 overflow-visible">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        {fraction > 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={tone === "danger" ? "var(--color-danger)" : "var(--color-ink)"}
            strokeWidth={stroke}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={`${fraction} 1`}
            className="transition-[stroke-dasharray] duration-calm ease-standard"
          />
        ) : null}
      </svg>
      <span className={cn("relative size-1.5 rounded-full", tone === "danger" ? "bg-danger" : tone === "muted" ? "bg-ink-disabled" : "bg-info")}>
      </span>
    </span>
  );
}
