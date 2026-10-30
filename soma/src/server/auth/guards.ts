import "server-only";

import { redirect } from "next/navigation";
import type { AppRole, Session } from "../dto";
import { ServiceError } from "../errors";
import { getSession } from "./session";

export { getSession };

/** Landing page per role. */
export function homeForRole(role: AppRole): string {
  return role === "admin" ? "/admin" : role === "provider" ? "/pro" : "/konto";
}

function loginUrl(next?: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? `/anmelden?next=${encodeURIComponent(next)}` : "/anmelden";
}

/** Layouts/pages: redirects to /anmelden?next=… when signed out. */
export async function requireUser(next?: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(loginUrl(next));
  return session;
}

/** Layouts/pages: redirects signed-out users to login and other roles to their own home. */
export async function requireRole(role: AppRole, next?: string): Promise<Session> {
  const session = await requireUser(next);
  if (session.role !== role) redirect(homeForRole(session.role));
  return session;
}

/** Server Actions / route handlers: throws a ServiceError instead of redirecting. */
export async function authorize(role?: AppRole | AppRole[]): Promise<Session> {
  const session = await getSession();
  if (!session) throw new ServiceError("unauthenticated", "Bitte melden Sie sich an.");
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(session.role)) throw new ServiceError("forbidden", "Dafür fehlt die Berechtigung.");
  }
  return session;
}
