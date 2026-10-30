import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";
import { getConfig } from "../config";
import type { Session } from "../dto";
import type { AuthAdapter, CookieJar, RequestMeta } from "./adapter";
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

export async function getRequestMeta(): Promise<RequestMeta> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return { ip: forwarded || h.get("x-real-ip") || null, userAgent: h.get("user-agent") };
}
