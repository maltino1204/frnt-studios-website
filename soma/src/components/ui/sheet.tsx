"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

/**
 * Bottom sheet on mobile, centred dialog from md (design-guideline §8).
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
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** "drawer" = right-hand 400px drawer from md (filters) */
  variant?: "sheet" | "drawer";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
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

  return (
    <dialog
      ref={ref}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden bg-surface-raised p-0 text-ink shadow-sheet open:flex open:flex-col",
        "rounded-t-sheet open:animate-sheet-in",
        variant === "sheet" && "md:m-auto md:max-w-sheet md:rounded-xs md:shadow-modal md:open:animate-dialog-in",
        variant === "drawer" && "md:mt-0 md:mr-0 md:ml-auto md:h-dvh md:max-h-dvh md:w-[400px] md:rounded-none",
        className,
      )}
      aria-labelledby="sheet-title"
    >
      <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-line-strong md:hidden" aria-hidden />
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line pr-2 pl-5">
        <h2 id="sheet-title" className="type-heading-m">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="inline-flex size-touch items-center justify-center rounded-xs hover:bg-surface-sunken"
        >
          <Icon icon={X} />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
      {footer ? <footer className="shrink-0 border-t border-line px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</footer> : null}
    </dialog>
  );
}
