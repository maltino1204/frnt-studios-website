"use client";

import { useEffect, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { useSiteSession } from "./discovery-session";

let barModule: Promise<ComponentType> | null = null;
const loadBar = () => (barModule ??= import("./account-nav").then((m) => m.AccountBottomNav));

/**
 * The customer bottom bar (Entdecken · Termine · Favoriten · Konto, product spec § 3) on the static /entdecken
 * pages, so the bar a customer taps „Entdecken“ in stays there, with „Entdecken“ active. Shown only once the
 * session check says „customer“; its code loads only then. A spacer after the footer keeps the fixed bar from
 * covering the last lines (it adds height at the very end of the page, so nothing above moves).
 */
export function ExploreAccountBar() {
  const session = useSiteSession();
  const customer = session?.role === "customer";
  const [Bar, setBar] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!customer) return;
    let alive = true;
    loadBar()
      .then((B) => {
        if (alive) setBar(() => B);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [customer]);

  if (!customer || !Bar) return null;
  return (
    <>
      <Bar />
      {createPortal(<div aria-hidden className="h-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] shrink-0 lg:hidden" />, document.body)}
    </>
  );
}
