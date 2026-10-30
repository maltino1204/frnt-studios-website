"use client";

import { Check, CircleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icon";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; message: string; kind: ToastKind; action?: { label: string; onClick: () => void } };
type ToastApi = { show: (message: string, opts?: { kind?: ToastKind; action?: Toast["action"] }) => void };

const ToastContext = createContext<ToastApi | null>(null);

/** Night-scoped toasts, bottom-centre on mobile / bottom-right on desktop (design-guideline §8). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const show = useCallback<ToastApi["show"]>((message, opts) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { id, message, kind: opts?.kind ?? "success", action: opts?.action }]);
  }, []);
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        data-theme="night"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+1rem+env(safe-area-inset-bottom))] z-(--z-toast) flex flex-col items-center gap-2 bg-transparent! px-4 md:right-6 md:bottom-6 md:left-auto md:items-end"
      >
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
    if (paused) return;
    const t = setTimeout(onDismiss, toast.action ? 8000 : 5000);
    return () => clearTimeout(t);
  }, [paused, onDismiss, toast.action]);
  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex w-full max-w-[420px] animate-toast-in items-start gap-3 rounded-xs bg-surface-raised px-4 py-3.5 text-ink shadow-float type-body-s"
    >
      {toast.kind === "success" ? <Icon icon={Check} className="mt-px shrink-0 text-success" /> : null}
      {toast.kind === "error" ? <Icon icon={CircleAlert} className="mt-px shrink-0 text-danger" /> : null}
      <p className="flex-1 pt-px">{toast.message}</p>
      {toast.action ? (
        <button type="button" onClick={toast.action.onClick} className="type-label-s text-accent underline underline-offset-4">
          {toast.action.label}
        </button>
      ) : null}
      <button type="button" onClick={onDismiss} aria-label="Hinweis schließen" className="-m-1 p-1 text-ink-muted hover:text-ink">
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
