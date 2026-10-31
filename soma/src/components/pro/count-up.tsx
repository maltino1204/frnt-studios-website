"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

/*
 * Local count-up for /pro (same API as the kit's CountUp).
 *
 * Why local: the kit version decides "first load vs. client navigation" with a
 * module flag that MotionRoot sets when the root layout hydrates. /pro pages
 * stream in behind a loading.tsx Suspense boundary and hydrate later, so the
 * kit's first client render shows 0 while the server HTML shows the value —
 * a hydration mismatch. Here `useSyncExternalStore` tells hydration (server
 * snapshot) apart from a fresh client mount, so both renders always agree.
 */

const noop = () => () => {};
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const automated = () => navigator.webdriver === true;

export function CountUp({
  value,
  format,
  prefix = "",
  suffix = "",
  duration = 900,
  className,
}: {
  value: number;
  format?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const fmt = (n: number) => `${prefix}${new Intl.NumberFormat("de-DE", format).format(n)}${suffix}`;
  const ref = useRef<HTMLSpanElement>(null);
  // false while hydrating server HTML, true for components mounted on the client (navigations).
  const clientMount = useSyncExternalStore(noop, () => true, () => false);
  const [fresh] = useState(clientMount);
  const [display, setDisplay] = useState(fresh ? 0 : value);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion() || automated()) {
      setDisplay(value);
      setAnimating(false);
      return;
    }
    const decimals = format?.maximumFractionDigits ?? (Number.isInteger(value) ? 0 : 1);
    const factor = Math.pow(10, decimals);
    let raf = 0;
    const run = () => {
      const start = performance.now();
      setAnimating(true);
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 4);
        setDisplay(p >= 1 ? value : Math.round(value * eased * factor) / factor);
        if (p < 1) raf = requestAnimationFrame(tick);
        else setAnimating(false);
      };
      raf = requestAnimationFrame(tick);
    };
    const rect = el.getBoundingClientRect();
    const onScreen = rect.top < window.innerHeight && rect.bottom > 0;
    if (onScreen) {
      // First load: already final, nothing to do. Client navigation: count on mount.
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

  const moving = animating || display !== value;
  return (
    <span ref={ref} className={cn("num", className)}>
      <span aria-hidden={moving ? true : undefined}>{fmt(display)}</span>
      {moving ? <span className="sr-only">{fmt(value)}</span> : null}
    </span>
  );
}
