import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic auth redirect only (Next 16 "proxy", formerly middleware).
 * Checks whether a session cookie is present for /konto, /pro and /admin and
 * sends visitors without one to /anmelden?next=…  Real authorisation happens
 * in layouts (requireRole), Server Actions and services.
 *
 * Server Action POSTs (Next-Action header) are excluded: they authorise
 * themselves, and skipping them avoids proxy body buffering for uploads.
 */
const LOCAL_COOKIE = "soma_session";

function hasSessionCookie(req: NextRequest): boolean {
  if (req.cookies.get(LOCAL_COOKIE)?.value) return true;
  // Supabase Auth (@supabase/ssr): sb-<project-ref>-auth-token (possibly chunked .0/.1)
  return req.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token") && c.value.length > 0);
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  // Provider sign-up (onboarding step 1) must stay reachable without an account.
  if (pathname === "/pro/registrieren" || pathname.startsWith("/pro/registrieren/")) return NextResponse.next();
  if (hasSessionCookie(req)) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/anmelden";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    { source: "/konto/:path*", missing: [{ type: "header", key: "next-action" }] },
    { source: "/pro/:path*", missing: [{ type: "header", key: "next-action" }] },
    { source: "/admin/:path*", missing: [{ type: "header", key: "next-action" }] },
  ],
};
