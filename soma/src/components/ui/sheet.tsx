"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

const EXIT_MS = 200;
const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Where focus goes when a dialog opens: "auto" is the platform default (the
 * first focusable element); otherwise a ref, or a CSS selector inside the
 * dialog. A selector that matches a container focuses its first focusable
 * child (Modal uses this to focus its first action).
 */
export type InitialFocus = "auto" | string | RefObject<HTMLElement | null>;

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusInitial(d: HTMLDialogElement, initialFocus: InitialFocus) {
  if (initialFocus === "auto") return;
  let target: HTMLElement | null;
  if (typeof initialFocus === "string") {
    const el = d.querySelector<HTMLElement>(initialFocus);
    target = el && !el.matches(FOCUSABLE) ? el.querySelector<HTMLElement>(FOCUSABLE) : el;
  } else {
    target = initialFocus.current;
  }
  target?.focus({ preventScroll: true });
}

/**
 * Shared open/close choreography for <dialog>-based overlays: showModal on
 * open (then move focus per `initialFocus`); on close, play the exit
 * animation (data-closing) and only then close.
 */
export function useDialogMotion(open: boolean, onClose: () => void, initialFocus: InitialFocus = "auto") {
  const ref = useRef<HTMLDialogElement>(null);
  const focusRef = useRef(initialFocus);
  focusRef.current = initialFocus;
  const returnRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open) {
      d.removeAttribute("data-closing");
      d.style.removeProperty("translate");
      if (!d.open) {
        returnRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        d.showModal();
        focusInitial(d, focusRef.current);
      }
      return;
    }
    if (!d.open) return;
    if (prefersReduced()) {
      d.close();
      return;
    }
    d.setAttribute("data-closing", "");
    const t = window.setTimeout(() => {
      d.removeAttribute("data-closing");
      d.style.removeProperty("translate");
      d.close();
    }, EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open]);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, [onClose]);
  // Prefer keeping the dialog mounted and passing open={false} (exit animation, platform focus restore).
  // Safety net for parents that unmount it while open: the platform never runs close(), so focus would
  // fall to <body>. Give it back to the element that opened the dialog.
  useEffect(() => {
    const d = ref.current;
    return () => {
      const back = returnRef.current;
      if (!d || d.isConnected || !d.open || !back?.isConnected) return;
      const active = document.activeElement;
      if (!active || active === document.body) back.focus({ preventScroll: true });
    };
  }, []);
  return ref;
}

/**
 * Bottom sheet on mobile (glass, spring entry, drag down to dismiss with a
 * rubber-band feel), centred dialog from md (design-guideline v2 §8).
 * Built on <dialog>: focus trap, Esc to close and focus restore come from the platform.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  variant = "sheet",
  initialFocus = "auto",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** "drawer" = right-hand 400px drawer from md (filters) */
  variant?: "sheet" | "drawer";
  /** where focus lands on open (default: platform, i.e. the close button) */
  initialFocus?: InitialFocus;
}) {
  const ref = useDialogMotion(open, onClose, initialFocus);
  const titleId = useId();
  const drag = useRef<{ y: number; t: number; dy: number } | null>(null);

  // Drag-to-dismiss on the grabber/header (touch and pen; mobile layout only).
  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse" || window.matchMedia("(min-width: 48rem)").matches) return;
    if ((e.target as HTMLElement).closest("button, a, input, select, textarea")) return;
    drag.current = { y: e.clientY, t: performance.now(), dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    ref.current?.setAttribute("data-dragging", "");
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const s = drag.current;
    const d = ref.current;
    if (!s || !d) return;
    const raw = e.clientY - s.y;
    // Rubber band: free downwards, strong resistance upwards.
    s.dy = raw > 0 ? raw : -Math.sqrt(-raw) * 2.5;
    d.style.translate = `0 ${s.dy}px`;
  };
  const onPointerUp = () => {
    const s = drag.current;
    const d = ref.current;
    drag.current = null;
    if (!s || !d) return;
    d.removeAttribute("data-dragging");
    const velocity = s.dy / Math.max(1, performance.now() - s.t);
    if (s.dy > 110 || (s.dy > 40 && velocity > 0.6)) {
      onClose();
    } else {
      d.style.removeProperty("translate");
    }
  };

  return (
    <dialog
      ref={ref}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "soma-sheet m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden p-0 text-ink open:flex open:flex-col",
        "rounded-t-sheet glass-strong glass-edge shadow-sheet open:animate-sheet-in",
        variant === "sheet" && "md:m-auto md:max-w-sheet md:rounded-card md:bg-surface-raised md:shadow-overlay md:open:animate-dialog-in",
        variant === "drawer" && "soma-drawer md:mt-0 md:mr-0 md:ml-auto md:h-dvh md:max-h-dvh md:w-[400px] md:rounded-tr-none md:rounded-l-card md:bg-surface-raised md:shadow-overlay",
        className,
      )}
      aria-labelledby={titleId}
    >
      <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} className="shrink-0 touch-none md:touch-auto">
        <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-ink/20 md:hidden" aria-hidden />
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line/70 pr-2 pl-5">
          <h2 id={titleId} className="type-heading-m">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="inline-flex size-touch items-center justify-center rounded-full pressable focus-ring hover:bg-ink/5"
          >
            <Icon icon={X} />
          </button>
        </header>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
      {footer ? <footer className="shrink-0 border-t border-line/70 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</footer> : null}
    </dialog>
  );
}
