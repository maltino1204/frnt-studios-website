import "server-only";

import { withService } from "../db/client";
import type { AppRole, ProviderStatus, Session } from "../dto";

/**
 * Builds the Session for a user id (no cookies involved, used by both auth
 * adapters and by tests). Blocked accounts get no session.
 */
export async function loadSession(userId: string): Promise<Session | null> {
  // withService: reads auth.users (e-mail) which API roles cannot access.
  const rows = await withService(
    (tx) => tx<{ id: string; email: string; role: AppRole; firstName: string | null; blockedAt: Date | null; providerStatus: ProviderStatus | null }[]>`
      select p.id, u.email, p.role, p.first_name, p.blocked_at, pr.status as provider_status
      from public.profiles p
      join auth.users u on u.id = p.id
      left join public.providers pr on pr.id = p.id
      where p.id = ${userId}`,
  );
  const r = rows[0];
  if (!r || r.blockedAt) return null;
  const session: Session = { userId: r.id, role: r.role, email: r.email, firstName: r.firstName };
  if (r.providerStatus) session.providerStatus = r.providerStatus;
  return session;
}
