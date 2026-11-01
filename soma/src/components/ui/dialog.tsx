"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useDialogMotion, type InitialFocus } from "./sheet";

/**
 * Modal for consequential confirmations only (e.g. "Termin stornieren?").
 * Glass, rises in, fades out. On open, focus goes to the first action
 * (usually the safe "Behalten"), not into a text field, so the mobile
 * keyboard does not pop up. Pass `initialFocus` (a ref, a selector or
 * "auto") to choose otherwise.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  actions,
  className,
  initialFocus = "actions",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children?: ReactNode;
  actions: ReactNode;
  className?: string;
  /** "actions" (default): first button in the action row; "auto": platform default; or a ref / selector */
  initialFocus?: "actions" | InitialFocus;
}) {
  const ref = useDialogMotion(open, onClose, initialFocus === "actions" ? "[data-dialog-actions]" : initialFocus);
  const titleId = useId();
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={cn(
        "soma-modal m-auto w-[calc(100%-2.5rem)] max-w-form rounded-card bg-surface-raised p-6 text-ink shadow-overlay open:animate-dialog-in md:p-8",
        className,
      )}
    >
      <h2 id={titleId} className="type-title-serif">
        {title}
      </h2>
      {children ? <div className="mt-3 type-body-s text-ink-muted">{children}</div> : null}
      <div data-dialog-actions="" className="mt-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        {actions}
      </div>
    </dialog>
  );
}
