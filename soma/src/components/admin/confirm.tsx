"use client";

import { useRef, useState, type ReactNode } from "react";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/feedback";

/**
 * Trigger button + consequential confirmation modal. The modal is mounted only
 * while open (the kit Modal uses a fixed title id) and focus returns to the
 * trigger on close.
 */
export function ConfirmButton({
  label,
  icon,
  variant = "secondary",
  title,
  children,
  confirmLabel,
  confirmVariant = "primary",
  onConfirm,
  pending,
  error,
  disabled,
  formId,
  onOpen,
}: {
  label: ReactNode;
  icon?: ReactNode;
  variant?: ButtonVariant;
  title: ReactNode;
  /** content, or a render function receiving `close` (e.g. to close after a successful submit) */
  children?: ReactNode | ((api: { close: () => void }) => ReactNode);
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  /** return true to close the modal */
  onConfirm?: () => Promise<boolean> | boolean;
  pending?: boolean;
  error?: string | null;
  disabled?: boolean;
  /** when set, the confirm button submits this form instead of calling onConfirm */
  formId?: string;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  return (
    <>
      <Button
        ref={trigger}
        size="s"
        variant={variant}
        icon={icon}
        disabled={disabled}
        onClick={() => {
          onOpen?.();
          setOpen(true);
        }}
      >
        {label}
      </Button>
      {open ? (
        <ConfirmModal
          open
          onClose={close}
          title={title}
          confirmLabel={confirmLabel}
          confirmVariant={confirmVariant}
          pending={pending}
          error={error}
          formId={formId}
          onConfirm={async () => {
            if (!onConfirm) return;
            const ok = await onConfirm();
            if (ok) close();
          }}
        >
          {typeof children === "function" ? children({ close }) : children}
        </ConfirmModal>
      ) : null}
    </>
  );
}

export function ConfirmModal({
  open,
  onClose,
  title,
  children,
  confirmLabel,
  confirmVariant = "primary",
  onConfirm,
  pending,
  error,
  formId,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children?: ReactNode;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  onConfirm?: () => void;
  pending?: boolean;
  error?: string | null;
  formId?: string;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Button size="s" variant="ghost" onClick={onClose} disabled={pending}>
            Abbrechen
          </Button>
          <Button
            size="s"
            variant={confirmVariant}
            loading={pending}
            type={formId ? "submit" : "button"}
            form={formId}
            onClick={formId ? undefined : onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-ink-muted">
        {children}
        {error ? <Notice kind="danger">{error}</Notice> : null}
      </div>
    </Modal>
  );
}
