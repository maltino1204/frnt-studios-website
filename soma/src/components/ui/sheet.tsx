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

/** The CSS animations running on a dialog and its subtree (its entry animation, the backdrop's fade). */
function cssAnimations(d: HTMLDialogElement): CSSAnimation[] {
  return d.getAnimations({ subtree: true }).filter((a): a is CSSAnimation => a instanceof CSSAnimation);
}
function sameAnimation(a: CSSAnimation, b: CSSAnimation): boolean {
  const ea = a.effect as KeyframeEffect | null;
  const eb = b.effect as KeyframeEffect | null;
  return a.animationName === b.animationName && ea?.target === eb?.target && ea?.pseudoElement === eb?.pseudoElement;
}

export type DialogMotionOptions = {
  /**
   * Paint the dialog's first frame before it turns modal. showModal() makes the rest of the document inert, which
   * restyles everything rendered in the same task: on a slow phone that delays the dialog's first frame by 100 ms
   * and more. With `paintFirst` the open shows the dialog non-modally (`show()`, `data-opening`: fixed and above the
   * page, globals.css) and makes it modal in the next task after that frame (close() + showModal(): page inert,
   * focus moved in, Esc). Escape before then closes it too.
   */
  paintFirst?: boolean;
  /** Runs right before showModal() (with `paintFirst`, in the task after the first frame). */
  beforeModal?: () => void;
};

/**
 * Shared open/close choreography for <dialog>-based overlays: showModal on
 * open (then move focus per `initialFocus`); on close, play the exit
 * animation (data-closing) and only then close.
 */
export function useDialogMotion(open: boolean, onClose: () => void, initialFocus: InitialFocus = "auto", options: DialogMotionOptions = {}) {
  const ref = useRef<HTMLDialogElement>(null);
  const focusRef = useRef(initialFocus);
  focusRef.current = initialFocus;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const returnRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open) {
      d.removeAttribute("data-closing");
      d.style.removeProperty("translate");
      if (d.open) return;
      returnRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const modal = () => {
        optionsRef.current.beforeModal?.();
        d.showModal();
        focusInitial(d, focusRef.current);
      };
      if (!optionsRef.current.paintFirst) {
        modal();
        return;
      }
      d.setAttribute("data-opening", "");
      d.show();
      focusInitial(d, focusRef.current);
      let timer = 0;
      const frame = requestAnimationFrame(() => {
        timer = window.setTimeout(() => {
          d.removeAttribute("data-opening");
          if (!d.open || d.matches(":modal")) return;
          // A non-modal dialog cannot turn modal: close() and showModal() in the same task, no frame in between. The
          // focus inside stays where it is; the opener holds it for a moment so that showModal() records it as the
          // element focus returns to on close. Entry animations a style update restarted while the dialog was
          // closed are put back to their start time.
          const focused = d.contains(document.activeElement) ? (document.activeElement as HTMLElement) : null;
          const started = cssAnimations(d).map((a) => ({ a, startTime: a.startTime }));
          returnRef.current?.focus({ preventScroll: true });
          d.close();
          optionsRef.current.beforeModal?.();
          d.showModal();
          if (focused) focused.focus({ preventScroll: true });
          else focusInitial(d, focusRef.current);
          for (const a of cssAnimations(d)) {
            const was = started.find((x) => sameAnimation(x.a, a));
            if (was && was.a !== a && was.startTime != null) a.startTime = was.startTime;
          }
        }, 0);
      });
      // No `cancel` event before it is modal: Escape closes it here.
      const onKey = (e: KeyboardEvent) => {
        if (e.key !== "Escape" || !d.hasAttribute("data-opening")) return;
        e.preventDefault();
        closeRef.current();
      };
      document.addEventListener("keydown", onKey);
      return () => {
        cancelAnimationFrame(frame);
        window.clearTimeout(timer);
        document.removeEventListener("keydown", onKey);
        d.removeAttribute("data-opening");
      };
    }
    if (!d.open) return;
    const closeNow = () => {
      d.close();
      // The platform returns focus to the element showModal() recorded; if that could not take it, the opener does.
      const back = returnRef.current;
      if (optionsRef.current.paintFirst && document.activeElement === document.body && back?.isConnected) back.focus({ preventScroll: true });
    };
    if (prefersReduced()) {
      closeNow();
      return;
    }
    d.setAttribute("data-closing", "");
    const t = window.setTimeout(() => {
      d.removeAttribute("data-closing");
      d.style.removeProperty("translate");
      closeNow();
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
 * Bottom sheet on mobile (Paper, radius 24 at the top, arrives in 480 ms without overshoot, drag down to dismiss
 * with a rubber-band feel), centred dialog from md (brand § 9.3).
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
  paintFirst,
  beforeModal,
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
} & DialogMotionOptions) {
  const ref = useDialogMotion(open, onClose, initialFocus, { paintFirst, beforeModal });
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
        "rounded-t-sheet bg-surface-raised shadow-sheet open:animate-sheet-in",
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
