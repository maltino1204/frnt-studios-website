"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

const noop = () => () => {};
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const automated = () => navigator.webdriver === true;

/**
 * Count-up for admin KPIs (same behaviour as the kit `CountUp`, design-guideline v2 §10.3),
 * safe inside streamed Suspense content: the kit component decides "first load or client
 * navigation" from a flag that `MotionRoot` sets before streamed segments (behind
 * `loading.tsx`) hydrate, so there it starts at 0 and fails hydration. Here the decision
 * comes from `useSyncExternalStore`, which reports "server" while hydrating and "client"
 * for fresh client mounts:
 *
 * - hydration: renders the final value (no flash, no LCP cost); offscreen values count
 *   up once when scrolled into view;
 * - client navigation: counts up from 0 (900 ms, expo-out);
 * - reduced motion and automation: always final. Screen readers only get the final value.
 */
export function Count({
  value,
  format,
  prefix = "",
  suffix = "",
  duration = 900,
  className,
}: {
  value: number;
  /** Intl.NumberFormat options for de-DE */
  format?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const clientMount = useSyncExternalStore(noop, () => true, () => false);
  const [fresh] = useState(clientMount);
  const [display, setDisplay] = useState(() => (fresh ? 0 : value));
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = (n: number) => `${prefix}${new Intl.NumberFormat("de-DE", format).format(n)}${suffix}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion() || automated() || value === 0) {
      setDisplay(value);
      return;
    }
    const decimals = format?.maximumFractionDigits ?? (Number.isInteger(value) ? 0 : 1);
    const factor = Math.pow(10, decimals);
    let raf = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 4);
        setDisplay(t >= 1 ? value : Math.round(value * eased * factor) / factor);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const r = el.getBoundingClientRect();
    const onScreen = r.top < window.innerHeight && r.bottom > 0;
    if (onScreen) {
      if (fresh) run();
      else setDisplay(value);
      return () => cancelAnimationFrame(raf);
    }
    setDisplay(0);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          run();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // Re-run only when the target value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const settled = display === value;
  return (
    <span ref={ref} className={cn("num", className)}>
      <span aria-hidden={settled ? undefined : true}>{fmt(display)}</span>
      {settled ? null : <span className="sr-only">{fmt(value)}</span>}
    </span>
  );
}
