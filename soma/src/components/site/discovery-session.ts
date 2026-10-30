"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSessionAction } from "@/server/actions/auth";
import { routes } from "@/lib/routes";

export type SiteSession = { userId: string; role: string; firstName: string | null };

/**
 * Who is signed in, fetched after hydration so public pages can stay static
 * (the (site) layout never reads cookies). `undefined` while loading.
 * Re-checked on every navigation, so a fresh sign-in shows up immediately.
 */
export function useSiteSession(): SiteSession | null | undefined {
  const pathname = usePathname();
  const [session, setSession] = useState<SiteSession | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    getSessionAction()
      .then((res) => {
        if (alive) setSession(res.ok ? res.data : null);
      })
      .catch(() => {
        if (alive) setSession(null);
      });
    return () => {
      alive = false;
    };
  }, [pathname]);
  return session;
}

/** Account entry for the header: role-specific home, or sign-in for guests. */
export function accountLink(session: SiteSession | null | undefined): { href: string; label: string } {
  if (!session) return { href: routes.login(), label: "Anmelden" };
  if (session.role === "admin") return { href: routes.admin.root(), label: "Admin" };
  if (session.role === "provider") return { href: routes.pro.root(), label: "Profi-Bereich" };
  return { href: routes.account.root(), label: "Mein Konto" };
}

/**
 * "Termin buchen": scrolls to the booking entry on this page if there is one
 * (and focuses its first field), otherwise lets the link navigate to /#termin.
 * Returns true when it handled the click.
 */
export function focusBookingEntry(): boolean {
  if (typeof document === "undefined") return false;
  const el = document.getElementById("termin");
  if (!el) return false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  el.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
  return true;
}
