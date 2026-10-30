import "server-only";

/**
 * AuthAdapter: one interface, two implementations.
 *   local    — scrypt hashes in auth.users, opaque DB-backed session tokens (dev, fully working)
 *   supabase — Supabase Auth via @supabase/ssr (production)
 * Callers (actions, session.ts) never depend on the concrete adapter.
 */

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  maxAge?: number;
  expires?: Date;
  domain?: string;
}

/** Minimal cookie store, satisfied by `await cookies()` from next/headers. */
export interface CookieJar {
  get(name: string): { name: string; value: string } | undefined;
  getAll(): Array<{ name: string; value: string }>;
  set(name: string, value: string, options?: CookieOptions): unknown;
  delete(name: string): unknown;
}

export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
}

export interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "customer" | "provider";
  referralCode?: string;
  providerInviteCode?: string;
  marketingOptIn?: boolean;
}

export interface AuthAdapter {
  readonly id: "local" | "supabase";
  /** creates the account and signs the user in */
  signUp(input: SignUpInput, meta: RequestMeta): Promise<{ userId: string }>;
  signIn(email: string, password: string, meta: RequestMeta): Promise<{ userId: string }>;
  signOut(): Promise<void>;
  /** user id of the current request, or null */
  getUserId(): Promise<string | null>;
  /** always resolves (no account enumeration) */
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
  /** re-confirmation for sensitive actions (account deletion); never records a login */
  verifyPassword(userId: string, password: string): Promise<boolean>;
}

export const SESSION_COOKIE = "soma_session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
