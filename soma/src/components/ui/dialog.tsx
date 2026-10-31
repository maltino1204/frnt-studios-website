"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useDialogMotion } from "./sheet";

/** Modal for consequential confirmations only (e.g. "Termin stornieren?"). Glass, rises in, fades out. */
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
  const ref = useDialogMotion(open, onClose);
  const titleId = useId();
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={cn(
        "soma-modal m-auto w-[calc(100%-2.5rem)] max-w-form rounded-card glass-strong glass-edge p-6 text-ink shadow-overlay open:animate-dialog-in md:p-8",
        className,
      )}
    >
      <h2 id={titleId} className="type-heading-l">
        {title}
      </h2>
      {children ? <div className="mt-3 type-body-s text-ink-muted">{children}</div> : null}
      <div className="mt-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end">{actions}</div>
    </dialog>
  );
}
