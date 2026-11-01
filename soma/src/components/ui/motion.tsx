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
 * Motion primitives (brand MOTION.md: motion means arrival; elements settle and stop, nothing loops, numbers never
 * count up). CSS does the animating; JS only decides *when*: in view, once, never above the fold, never with
 * prefers-reduced-motion.
 */

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Automation (E2E, QA screenshots) sees the finished page: full-page captures do not scroll, so nothing may wait for a scroll. */
const automated = () => typeof navigator !== "undefined" && navigator.webdriver === true;

/* ------------------------------------------------------------------------ */
/* MotionRoot: mounted once in the root layout.                             */
/* ------------------------------------------------------------------------ */

/**
 * Global motion housekeeping, after mount only:
 * - html[data-automation] under navigator.webdriver: `cv-auto` sections render
 *   in full, because full-page captures do not scroll (first paint is unchanged);
 * - smooth scrolling for same-page anchor links.
 * It never touches React-rendered attributes, so it cannot cause hydration mismatches.
 */
export function MotionRoot() {
  useEffect(() => {
    const root = document.documentElement;
    if (automated()) root.setAttribute("data-automation", "");

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
      document.removeEventListener("click", onClick);
    };
  }, []);
  return null;
}

/* ------------------------------------------------------------------------ */
/* ScrollRegion: horizontal scrollers that keyboard users can reach.         */
/* ------------------------------------------------------------------------ */

/**
 * Wrapper for a horizontal snap row without focusable content (e.g. the home
 * "Orte" row on phones). While its content overflows it is a focusable, named
 * region, so Tab reaches it and the arrow keys scroll it (WCAG 2.1.1, axe
 * scrollable-region-focusable). Where it does not scroll (the desktop grid) it
 * is a plain wrapper, so there is no empty tab stop. Server HTML is focusable.
 */
export function ScrollRegion({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setScrolls(el.scrollWidth > el.clientWidth + 1);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      role={scrolls ? "region" : undefined}
      aria-label={scrolls ? label : undefined}
      tabIndex={scrolls ? 0 : undefined}
      className={cn("focus-ring", className)}
    >
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
