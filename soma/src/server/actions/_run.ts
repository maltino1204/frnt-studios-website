import "server-only";

import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { authorize } from "../auth/guards";
import { safeRelativePath } from "../auth/redirect";
import { getConfig } from "../config";
import { mapDbError } from "../db/errors";
import type { AppRole, Session } from "../dto";
import { isServiceError, ServiceError } from "../errors";
import { parse } from "../services/_shared";
import type { ActionResult } from "./types";

/**
 * Shared plumbing for Server Actions: role check, zod validation, German errors.
 * redirect()/notFound() thrown inside are re-thrown (unstable_rethrow).
 */

export const GENERIC_ERROR = "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.";

export function fail(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return fieldErrors ? { ok: false, error, fieldErrors } : { ok: false, error };
}

export function toActionError(e: unknown): ActionResult<never> {
  unstable_rethrow(e);
  if (isServiceError(e)) return fail(e.message, e.fieldErrors);
  const mapped = mapDbError(e);
  if (mapped) return fail(mapped.message, mapped.fieldErrors);
  console.error("[action] unexpected error", e);
  return fail(GENERIC_ERROR);
}

/** Runs `fn` with an authorised session (any role when `role` is omitted). */
export async function withSession<T>(role: AppRole | AppRole[] | undefined, fn: (s: Session) => Promise<T>, message?: string): Promise<ActionResult<T>> {
  try {
    const session = await authorize(role);
    const data = await fn(session);
    return message ? { ok: true, data, message } : { ok: true, data };
  } catch (e) {
    return toActionError(e);
  }
}

/** Runs `fn` without a session requirement (public actions such as the waitlist). */
export async function publicAction<T>(fn: () => Promise<T>, message?: string): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return message ? { ok: true, data, message } : { ok: true, data };
  } catch (e) {
    return toActionError(e);
  }
}

/** Validates an action input with zod (throws a German ServiceError with field errors). */
export function input<S extends z.ZodType>(schema: S, value: unknown): z.output<S> {
  return parse(schema, value);
}

/** FormData → plain object ('on' checkboxes → true, repeated keys → arrays, empty strings dropped). */
export function formToObject(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, raw] of fd.entries()) {
    if (key.startsWith("$ACTION")) continue;
    const value: unknown = typeof raw === "string" ? (raw === "on" ? true : raw) : raw;
    if (value === "") continue;
    if (key in out) out[key] = ([] as unknown[]).concat(out[key], value);
    else out[key] = value;
  }
  return out;
}

export const zGuid = z.guid("Ungültige ID.");

/** Reads an uploaded file from FormData into the service UploadInput shape. */
export async function fileFrom(fd: FormData, field = "file"): Promise<{ fileName: string; contentType: string; bytes: Uint8Array }> {
  const f = fd.get(field);
  if (!(f instanceof File) || f.size === 0) {
    throw new ServiceError("validation", "Bitte eine Datei auswählen.", { [field]: "Keine Datei ausgewählt." });
  }
  return { fileName: f.name, contentType: f.type, bytes: new Uint8Array(await f.arrayBuffer()) };
}

/** Same-origin relative path for ?next= redirects (prevents open redirects, audit-1 R2). */
export function safeNext(value: unknown): string | null {
  return safeRelativePath(value, getConfig().APP_URL);
}
