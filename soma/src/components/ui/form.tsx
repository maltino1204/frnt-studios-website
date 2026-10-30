"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Button } from "./button";
import { Notice } from "./feedback";

/** Submit button that shows the loading state while its parent <form> action runs. */
export function SubmitButton({ children, ...props }: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending || props.loading} {...props}>
      {children}
    </Button>
  );
}

/** Renders an ActionResult error/message returned by a Server Action via useActionState. */
export function FormMessage({ state }: { state: { ok: boolean; error?: string; message?: string } | null | undefined }) {
  if (!state) return null;
  if (!state.ok && state.error) return <Notice kind="danger">{state.error}</Notice>;
  if (state.ok && state.message) return <Notice kind="success">{state.message}</Notice>;
  return null;
}
