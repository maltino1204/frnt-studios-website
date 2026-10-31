"use client";

import { usePathname } from "next/navigation";
import {
  ViewTransition,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

/*
 * Motion primitives (design-guideline v2 §10 "Motion" and "Haptics").
 * CSS does the animating; JS only decides *when*: in view, once, never above
 * the fold, never with prefers-reduced-motion, paused in hidden tabs.
 */

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Automation (E2E, QA screenshots) sees the finished page: full-page captures do not scroll, so nothing may wait for a scroll. */
const automated = () => typeof navigator !== "undefined" && navigator.webdriver === true;

const subscribeNever = () => () => {};
/**
 * false while React hydrates server HTML (server snapshot), true for
 * components mounted fresh on the client (navigations, later state). This is
 * per component and correct inside streamed Suspense boundaries, unlike a
 * global "root has hydrated" flag.
 */
function useClientMount(): boolean {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

/* ------------------------------------------------------------------------ */
/* MotionRoot: mounted once in the root layout.                             */
/* ------------------------------------------------------------------------ */

/**
 * Global motion housekeeping, after mount only:
 * - html[data-hidden] while the tab is hidden (pauses every `ambient` loop);
 * - smooth scrolling for same-page anchor links.
 * It never touches React-rendered attributes, so it cannot cause hydration
 * mismatches (offscreen pausing lives in <Ambient>).
 */
export function MotionRoot() {
  useEffect(() => {
    const root = document.documentElement;
    const onVisibility = () => {
      if (document.hidden) root.setAttribute("data-hidden", "");
      else root.removeAttribute("data-hidden");
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Smooth scrolling for same-page anchor links only (#inhalt, #preis, …).
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank") return;
      const url = new URL(a.href, location.href);
      if (!url.hash || url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
      if (location.hash !== url.hash) history.pushState(history.state, "", url.hash);
      if (!target.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("click", onClick);
    };
  }, []);
  return null;
}

/* ------------------------------------------------------------------------ */
/* Ambient: the gate for slow decorative loops.                             */
/* ------------------------------------------------------------------------ */

/**
 * A div whose `ambient` descendants (aura drift, float) run only while it is
 * near the viewport. The attribute is React state: server and first client
 * render are both data-ambient="off", and it switches after mount, so it is
 * hydration-safe anywhere, including streamed Suspense boundaries.
 * AuraArt/AuraBackground (animate) and FloatingCard (float) use it.
 */
export function Ambient({ className, style, children, ...props }: Omit<ComponentProps<"div">, "ref">) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: "120px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} data-ambient={on ? "on" : "off"} className={className} style={style} {...props}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Reveal: subtle scroll reveal, once, never above the fold.                */
/* ------------------------------------------------------------------------ */

type Revealable = { el: HTMLElement; attr: "data-reveal" | "data-reveal-stagger" };
let revealObserver: IntersectionObserver | null = null;
const revealTargets = new Map<Element, Revealable>();

function getRevealObserver() {
  if (revealObserver) return revealObserver;
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const t = revealTargets.get(entry.target);
        if (!t) continue;
        t.el.setAttribute(t.attr, "in");
        revealObserver?.unobserve(entry.target);
        revealTargets.delete(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  return revealObserver;
}

/**
 * Fades content up by 10 px when it scrolls into view, once. Content that is
 * on screen (or above it) at mount is never hidden, so there is no flash and
 * no LCP delay. `stagger` reveals direct children one after another (60 ms).
 */
export function Reveal<T extends ElementType = "div">({
  as,
  stagger,
  delay,
  className,
  style,
  children,
  ...props
}: {
  as?: T;
  stagger?: boolean;
  /** extra delay in ms (single reveal only) */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
} & Omit<ComponentProps<T>, "as" | "className" | "style" | "children">) {
  const ref = useRef<HTMLElement>(null);
  const Tag = (as ?? "div") as ElementType;
  const attr = stagger ? "data-reveal-stagger" : "data-reveal";
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || automated() || typeof IntersectionObserver === "undefined") return;
    const rect = el.getBoundingClientRect();
    // Above the fold (or already scrolled past): leave it alone.
    if (rect.top < window.innerHeight * 0.92) return;
    el.setAttribute(attr, "hidden");
    revealTargets.set(el, { el, attr });
    getRevealObserver().observe(el);
    return () => {
      revealObserver?.unobserve(el);
      revealTargets.delete(el);
    };
  }, [attr]);
  return (
    <Tag
      ref={ref}
      className={className}
      style={delay ? ({ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties) : style}
      {...props}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------------ */
/* CountUp: stats count up when they come into view.                        */
/* ------------------------------------------------------------------------ */

/**
 * Counts a number up (900 ms, expo-out).
 * - Hydration: the first client render always equals the server value (no
 *   mismatch, also behind streamed loading.tsx boundaries, no LCP cost).
 *   Values already on screen stay final; below the fold they count up from 0
 *   when scrolled to.
 * - Fresh client mounts (navigations) count up from 0 on mount.
 * - A changed `value` animates from the number currently shown; re-renders
 *   with the same value do nothing.
 * - Reduced motion and automation: always final. Screen readers only ever
 *   get the final value.
 */
export function CountUp({
  value,
  format,
  prefix = "",
  suffix = "",
  duration = 900,
  className,
}: {
  value: number;
  /** Intl.NumberFormat options for de-DE, e.g. { maximumFractionDigits: 1 } */
  format?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const fmt = (n: number) => `${prefix}${new Intl.NumberFormat("de-DE", format).format(n)}${suffix}`;
  const ref = useRef<HTMLSpanElement>(null);
  const clientMount = useClientMount();
  const [fresh] = useState(clientMount);
  const [display, setDisplay] = useState(() => (fresh ? 0 : value));
  const [animating, setAnimating] = useState(false);
  const shown = useRef(display);
  const first = useRef(true);
  const decimals = format?.maximumFractionDigits ?? (Number.isInteger(value) ? 0 : 1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const isFirst = first.current;
    first.current = false;
    const show = (n: number) => {
      shown.current = n;
      setDisplay(n);
    };
    if (reducedMotion() || automated()) {
      show(value);
      setAnimating(false);
      return;
    }
    let raf = 0;
    let io: IntersectionObserver | null = null;
    const factor = Math.pow(10, decimals);
    const run = (from: number) => {
      if (from === value) {
        show(value);
        setAnimating(false);
        return;
      }
      const start = performance.now();
      setAnimating(true);
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 4);
        show(t >= 1 ? value : Math.round((from + (value - from) * eased) * factor) / factor);
        if (t < 1) raf = requestAnimationFrame(tick);
        else setAnimating(false);
      };
      raf = requestAnimationFrame(tick);
    };
    const cleanup = () => {
      io?.disconnect();
      cancelAnimationFrame(raf);
    };
    if (!isFirst) {
      // The target changed: glide from whatever is on screen now.
      run(shown.current);
      return cleanup;
    }
    const rect = el.getBoundingClientRect();
    const onScreen = rect.top < window.innerHeight && rect.bottom > 0;
    if (onScreen) {
      run(fresh ? 0 : value); // hydrated + visible: already final, nothing moves
      return cleanup;
    }
    // Below the fold: hide the figure at 0 (invisible, so no flash) and count when it arrives.
    show(0);
    io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io?.disconnect();
          run(0);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return cleanup;
    // Only a new target value re-runs the effect; format/prefix changes just re-render.
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

/* ------------------------------------------------------------------------ */
/* Spotlight: a soft light that follows the pointer (pointer: fine only).   */
/* ------------------------------------------------------------------------ */

/**
 * Wrap large cards and hero panels; give the wrapper the card's radius.
 * The light is an overlay above the content (pointer-events: none), so it
 * shows on opaque cards too: `fill` tints the surface (multiply, text stays
 * AA), `border` draws a glowing 1 px rim, `both` does both. Touch devices get
 * nothing; it costs one rAF per pointer move.
 *
 *   <Spotlight className="rounded-panel" variant="border">
 *     <Surface radius="panel" interactive as={Link} href="…">…</Surface>
 *   </Spotlight>
 */
export function Spotlight({
  className,
  children,
  variant = "fill",
  ...props
}: ComponentProps<"div"> & { variant?: "fill" | "border" | "both" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches || reducedMotion()) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      raf = 0;
      el.style.setProperty("--spot-x", `${x}px`);
      el.style.setProperty("--spot-y", `${y}px`);
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const enter = () => el.style.setProperty("--spot-o", "1");
    const leave = () => el.style.setProperty("--spot-o", "0");
    el.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);
  return (
    <div ref={ref} className={cn("spotlight", className)} {...props}>
      {children}
      {variant !== "border" ? <span aria-hidden className="spotlight-fill" /> : null}
      {variant !== "fill" ? <span aria-hidden className="spotlight-border" /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* RouteTransition: page cross-fade on client navigation.                    */
/* ------------------------------------------------------------------------ */

/**
 * Wraps a shell's page area. With the View Transitions API (Chromium,
 * Safari 18+) the old page fades out in 140 ms and the new one rises in; the
 * surrounding chrome stays put. Without it, the new page cross-fades in.
 * Only pathname changes animate (not search params, refreshes or actions).
 */
export function RouteTransition({
  as,
  className,
  children,
  ...props
}: { as?: "main" | "div"; className?: string; children: ReactNode } & Omit<ComponentProps<"main">, "className" | "children">) {
  const pathname = usePathname();
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = ref.current;
    if (!el || "startViewTransition" in document || reducedMotion()) return;
    el.classList.remove("route-fade-in");
    void el.offsetWidth;
    el.classList.add("route-fade-in");
  }, [pathname]);
  return (
    <Tag ref={ref} className={className} {...props}>
      <ViewTransition key={pathname} enter="soma-page" exit="soma-page" default="none">
        {children}
      </ViewTransition>
    </Tag>
  );
}
