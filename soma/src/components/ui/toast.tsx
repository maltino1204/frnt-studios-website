"use client";

import { CircleAlert, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; message: string; kind: ToastKind; action?: { label: string; onClick: () => void }; leaving?: boolean };
type ToastApi = {
  show: (message: string, opts?: { kind?: ToastKind; action?: Toast["action"]; /** device haptic for key confirmations */ haptic?: boolean }) => void;
};

const ToastContext = createContext<ToastApi | null>(null);
const LEAVE_MS = 180;

/** Glass toasts, bottom-centre on mobile / bottom-right on desktop; spring in, fade out (design-guideline v2 §8). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), LEAVE_MS);
  }, []);
  const show = useCallback<ToastApi["show"]>((message, opts) => {
    const id = nextId.current++;
    const kind = opts?.kind ?? "success";
    if (opts?.haptic) haptic(kind === "error" ? "warning" : "success");
    setToasts((t) => [...t.slice(-2), { id, message, kind, action: opts?.action }]);
  }, []);
  const api = useMemo<ToastApi>(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+1rem+env(safe-area-inset-bottom))] z-(--z-toast) flex flex-col items-center gap-2 px-4 md:right-6 md:bottom-6 md:left-auto md:items-end">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || toast.leaving) return;
    const t = setTimeout(onDismiss, toast.action ? 8000 : 5000);
    return () => clearTimeout(t);
  }, [paused, onDismiss, toast.action, toast.leaving]);
  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      data-theme="night"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "pointer-events-auto flex w-full max-w-[420px] items-center gap-3 rounded-tile bg-surface py-3 pr-2 pl-3 text-ink shadow-float type-body-s",
        toast.leaving ? "toast-leave" : "animate-toast-in",
      )}
    >
      {toast.kind === "success" ? (
        <span aria-hidden className="inline-flex size-7 shrink-0 animate-pop items-center justify-center rounded-full text-success">
          <svg viewBox="0 0 24 24" fill="none" className="size-4">
            <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} className="animate-draw [animation-delay:120ms]" />
          </svg>
        </span>
      ) : null}
      {toast.kind === "error" ? (
        <span aria-hidden className="inline-flex size-7 shrink-0 animate-pop items-center justify-center rounded-full text-danger">
          <Icon icon={CircleAlert} size={16} />
        </span>
      ) : null}
      {toast.kind === "info" ? (
        <span aria-hidden className="inline-flex size-7 shrink-0 animate-pop items-center justify-center rounded-full text-info">
          <Icon icon={Info} size={16} />
        </span>
      ) : null}
      <p className="flex-1 py-0.5">{toast.message}</p>
      {toast.action ? (
        <button type="button" onClick={toast.action.onClick} className="shrink-0 rounded-full px-2 py-1 type-label-s text-ink underline decoration-line-strong underline-offset-4 focus-ring hover:decoration-current">
          {toast.action.label}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Hinweis schließen"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-ink-muted pressable focus-ring hover:bg-ink/10 hover:text-ink"
      >
        <Icon icon={X} size={16} />
      </button>
    </div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
