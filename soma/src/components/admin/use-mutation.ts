"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/server/actions/types";

/**
 * Runs an admin Server Action from an event handler: pending state, German
 * field errors from the server, success toast and a router refresh.
 */
export function useMutation<A extends unknown[], T>(
  action: (...args: A) => Promise<ActionResult<T>>,
  opts: { success?: string | ((data: T, message?: string) => string); onSuccess?: (data: T) => void } = {},
) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();
  const { success, onSuccess } = opts;

  const run = useCallback(
    (...args: A) =>
      new Promise<ActionResult<T>>((resolve) => {
        start(async () => {
          setError(null);
          setFieldErrors({});
          let res: ActionResult<T>;
          try {
            res = await action(...args);
          } catch {
            res = { ok: false, error: "Die Aktion konnte nicht ausgeführt werden. Bitte erneut versuchen." };
          }
          if (res.ok) {
            const msg = typeof success === "function" ? success(res.data, res.message) : success ?? res.message ?? "Gespeichert.";
            toast.show(msg, { kind: "success" });
            onSuccess?.(res.data);
            router.refresh();
          } else {
            setError(res.error);
            setFieldErrors(res.fieldErrors ?? {});
          }
          resolve(res);
        });
      }),
    [action, success, onSuccess, toast, router],
  );

  const reset = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);

  return { run, pending, error, fieldErrors, setFieldErrors, setError, reset };
}
