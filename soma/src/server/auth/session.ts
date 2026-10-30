import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";
import { getConfig } from "../config";
import type { Session } from "../dto";
import type { AuthAdapter, CookieJar, RequestMeta } from "./adapter";
import { clientIpFrom } from "./client-ip";
import { createLocalAuthAdapter } from "./local";
import { loadSession } from "./session-store";
import { createSupabaseAuthAdapter } from "./supabase";

/** The configured auth adapter bound to this request's cookies. */
export async function getAuthAdapter(): Promise<AuthAdapter> {
  const jar: CookieJar = await cookies();
  return getConfig().AUTH_PROVIDER === "supabase" ? createSupabaseAuthAdapter(jar) : createLocalAuthAdapter(jar);
}

/** Current session, memoised per request with React cache(). */
export const getSession = cache(async (): Promise<Session | null> => {
  const adapter = await getAuthAdapter();
  const userId = await adapter.getUserId();
  return userId ? loadSession(userId) : null;
});

/** Client IP from an explicitly trusted source only (TRUSTED_IP_HEADER / TRUSTED_PROXY_HOPS, see client-ip.ts) and the user agent. */
export async function getRequestMeta(): Promise<RequestMeta> {
  const h = await headers();
  const cfg = getConfig();
  return { ip: clientIpFrom((name) => h.get(name), { header: cfg.TRUSTED_IP_HEADER, hops: cfg.TRUSTED_PROXY_HOPS }), userAgent: h.get("user-agent") };
}
