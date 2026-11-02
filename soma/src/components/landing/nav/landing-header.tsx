"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Wordmark } from "@/components/brand/logo";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { accountLink, useSiteSession } from "@/components/site/discovery-session";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { requestBooking } from "./surfaces";
import { ChapterIndex } from "./chapter-index";
import { NoScriptChapterLink } from "./static-chapter-list";
import { openChapterOverlay } from "./overlay-events";
import { HEADER_LINKS } from "./pages";

/**
 * Landing header (spec § 5.2, § 5.3). ≥ 1024: 68 px, sticky, never hides; micro wordmark · chapter index · (≥ 1280)
 * the five links (Entdecken first, as in the site header) · hairline · Anmelden · „Termin finden“. 1024–1279: the
 * links live in the overlay („Menü“).
 * < 1024: 60 / 68 px, the wordmark and „Menü“ (the dock carries booking).
 *
 * Themes are CSS (landing.css): transparent at the top, glass after 8 px (`data-scrolled`, set here), and the dark
 * variant while a section with `data-header-theme="dark"` is under it (`html[data-header-theme]`, written by the
 * motion layer's nav observer). Hiding on scroll (< 1024) is the motion layer's (`html[data-header-hidden]`).
 */
export function LandingHeader() {
  const ref = useRef<HTMLElement>(null);
  const session = useSiteSession();
  const account = session === undefined ? null : accountLink(session);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last: boolean | null = null;
    const onScroll = () => {
      const scrolled = window.scrollY > 8;
      if (scrolled === last) return;
      last = scrolled;
      el.toggleAttribute("data-scrolled", scrolled);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header ref={ref} className="lp-header sticky top-0 z-(--z-header) text-ink">
      <div className="lp-container flex h-(--header-height) items-center gap-2">
        <Link href="/" prefetch={false} aria-label="SOMA, zur Startseite" className="-mx-2 inline-flex min-h-touch shrink-0 items-center rounded-control px-2 focus-ring">
          <Wordmark title={null} />
        </Link>

        <nav aria-label="Hauptnavigation" className="flex min-w-0 flex-1 items-center gap-2">
          <ChapterIndex className="ml-6 hidden lg:inline-flex" />
          <ul className="ml-auto hidden items-center gap-1 xl:flex">
            {HEADER_LINKS.map((l) => (
              <li key={l.href}>
                {l.href.startsWith("#") ? (
                  <a href={l.href} className="inline-flex h-11 items-center rounded-full px-3.5 type-label text-ink pressable focus-ring hover:bg-surface-sunken">
                    {l.label}
                  </a>
                ) : (
                  <Link href={l.href} prefetch={false} className="inline-flex h-11 items-center rounded-full px-3.5 type-label text-ink pressable focus-ring hover:bg-surface-sunken">
                    {l.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          {/* Below 1280 the account link sits next to „Menü“ (client feedback 2026-11-02: login was only inside the
              overlay). Reserved width, faded in once the session is known (no shift, no wrong label); without JS it shows
              „Anmelden“ at once. */}
          <Link
            href={account?.href ?? routes.login()}
            prefetch={false}
            className={cn(
              "ml-auto inline-flex min-h-touch min-w-[6.25rem] items-center justify-center rounded-full px-3 type-label text-ink pressable focus-ring transition-opacity duration-fast hover:bg-surface-sunken xl:hidden",
              account ? "opacity-100" : "pointer-events-none opacity-0 noscript:pointer-events-auto noscript:opacity-100",
            )}
            aria-hidden={account ? undefined : true}
            tabIndex={account ? undefined : -1}
          >
            {account?.label ?? "Anmelden"}
          </Link>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={openChapterOverlay}
            className="lp-js inline-flex min-h-touch items-center rounded-full px-3.5 type-label text-ink pressable focus-ring hover:bg-surface-sunken xl:hidden"
          >
            Menü
          </button>
          <NoScriptChapterLink className="inline-flex min-h-touch items-center rounded-full px-3.5 type-label text-ink focus-ring hover:bg-surface-sunken xl:hidden">
            Menü
          </NoScriptChapterLink>
        </nav>

        <span aria-hidden className="mx-2 hidden h-5 w-px bg-line-mid xl:block" />
        <div className="hidden items-center gap-2 lg:flex">
          <ButtonLink
            href={account?.href ?? routes.login()}
            prefetch={false}
            variant="ghost"
            className={cn("hidden transition-opacity duration-fast xl:inline-flex", account ? "opacity-100" : "pointer-events-none opacity-0")}
            aria-hidden={account ? undefined : true}
            tabIndex={account ? undefined : -1}
          >
            {account?.label ?? "Anmelden"}
          </ButtonLink>
          <a
            href="#termin"
            className={buttonClasses({ variant: "primary" })}
            onClick={(e) => {
              e.preventDefault();
              void requestBooking({ source: "header" });
            }}
          >
            Termin finden
          </a>
        </div>
      </div>
    </header>
  );
}
