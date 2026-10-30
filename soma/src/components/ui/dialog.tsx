"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Modal for consequential confirmations only (e.g. "Termin stornieren?"). */
export function Modal({
  open,
  onClose,
  title,
  children,
  actions,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children?: ReactNode;
  actions: ReactNode;
  className?: string;
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
      aria-labelledby="modal-title"
      className={cn(
        "m-auto w-[calc(100%-2.5rem)] max-w-form rounded-xs bg-surface-raised p-6 text-ink shadow-modal open:animate-dialog-in md:p-8",
        className,
      )}
    >
      <h2 id="modal-title" className="type-heading-l">
        {title}
      </h2>
      {children ? <div className="mt-3 type-body-s text-ink-muted">{children}</div> : null}
      <div className="mt-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end">{actions}</div>
    </dialog>
  );
}
