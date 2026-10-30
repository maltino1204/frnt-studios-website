import "server-only";

import { withService } from "../db/client";
import { ServiceError } from "../errors";

/**
 * Password re-confirmation for sensitive actions (account deletion), rate-limited
 * per account like logins (audit-3 F16): at most 5 failures in 15 minutes
 * (table app_private.reauth_attempts, migration 0008).
 */
export const MAX_REAUTH_FAILURES = 5;
export const REAUTH_WINDOW_MINUTES = 15;

export async function verifyPasswordWithLimit(
  userId: string,
  password: string,
  verify: (userId: string, password: string) => Promise<boolean>,
): Promise<boolean> {
  // withService: the attempt counter lives in app_private (API roles have no access).
  const [{ failures }] = await withService((tx) => tx<{ failures: number }[]>`
    select count(*)::int as failures from app_private.reauth_attempts
    where user_id = ${userId} and not success and created_at > now() - make_interval(mins => ${REAUTH_WINDOW_MINUTES})`);
  if (failures >= MAX_REAUTH_FAILURES) {
    throw new ServiceError("rate_limited", `Zu viele Versuche. Bitte warten Sie ${REAUTH_WINDOW_MINUTES} Minuten und versuchen Sie es erneut.`);
  }
  const ok = await verify(userId, password);
  // withService: see above.
  await withService((tx) => tx`insert into app_private.reauth_attempts (user_id, success) values (${userId}, ${ok})`);
  return ok;
}
