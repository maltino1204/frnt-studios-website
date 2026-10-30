/**
 * Result type of every Server Action (docs/architecture.md §6).
 * `error` and `fieldErrors` are German, user-facing.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Initial state for useActionState. */
export const initialActionState = null;
