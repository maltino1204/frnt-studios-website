import "server-only";

import { getConfig } from "../config";
import { withService, type Queryable } from "../db/client";
import { ServiceError } from "../errors";

/**
 * Shared demo logins (audit-3 F7). With DEMO_MODE=true these accounts cannot be
 * broken for the next tester: no password change or reset, no e-mail change,
 * no self-deletion, and admins cannot block, anonymise, suspend or reject them
 * (or reject their documents). Everything else works as for real accounts.
 */
export const DEMO_ACCOUNT_EMAILS: ReadonlySet<string> = new Set([
  "testkunde@soma.test",
  "testkunde-b2b@soma.test",
  "testadmin@soma.test",
  "anna@kunden.soma.test",
  "hanna@profis.soma.test",
]);

export const DEMO_ACTION_DISABLED = "Im Demo-Zugang ist diese Aktion deaktiviert, damit alle mit denselben Zugangsdaten testen können.";

export function isDemoAccountEmail(email: string | null | undefined): boolean {
  return Boolean(getConfig().DEMO_MODE && email && DEMO_ACCOUNT_EMAILS.has(email.trim().toLowerCase()));
}

/** Throws the neutral demo notice when `userId` is a protected demo account (no-op outside DEMO_MODE). */
export async function assertNotDemoAccount(userId: string, tx?: Queryable): Promise<void> {
  if (!getConfig().DEMO_MODE) return;
  const run = (q: Queryable) => q<{ email: string }[]>`select email from auth.users where id = ${userId}`;
  // withService: auth.users is not readable by API roles; read-only lookup of one e-mail.
  const [row] = tx ? await run(tx) : await withService(run);
  if (row && isDemoAccountEmail(row.email)) throw new ServiceError("forbidden", DEMO_ACTION_DISABLED);
}
