import "server-only";

/**
 * ServiceError carries a German, user-facing message. Services throw it; actions
 * turn it into `{ ok: false, error, fieldErrors }`.
 */
export type ServiceErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "validation"
  | "conflict"
  | "slot_taken"
  | "invalid_state"
  | "rate_limited"
  | "payment"
  | "unavailable"
  | "internal";

export class ServiceError extends Error {
  constructor(
    public readonly code: ServiceErrorCode,
    message: string,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export const isServiceError = (e: unknown): e is ServiceError => e instanceof ServiceError;

export const notFound = (what = "Eintrag") => new ServiceError("not_found", `${what} wurde nicht gefunden.`);
export const forbidden = (msg = "Dafür fehlt die Berechtigung.") => new ServiceError("forbidden", msg);
export const unauthenticated = () => new ServiceError("unauthenticated", "Bitte melde dich an.");
export const invalidState = (msg: string) => new ServiceError("invalid_state", msg);
export const validation = (msg: string, fieldErrors?: Record<string, string>) => new ServiceError("validation", msg, fieldErrors);
