"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { accountLink, focusBookingEntry, useSiteSession } from "./discovery-session";
import { MobileMenu, type NavLink } from "./mobile-menu";

/**
 * Marketing header (design-guideline v2 §8 "Navigation"): sticky and
 * transparent at the top, glass with a hairline once the page scrolls.
 * Account state is fetched after hydration so pages stay static.
 */
export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const session = useSiteSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isIn = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);
  const links: NavLink[] = [
    { href: routes.categories(), label: "Behandlungen", active: isIn(routes.categories()) },
    { href: "/staedte", label: "Städte", active: isIn("/staedte") },
    { href: routes.forPros(), label: "Für Profis", active: isIn(routes.forPros()) },
  ];
  const account = session === undefined ? null : accountLink(session);

  return (
    <header
      data-scrolled={scrolled ? "" : undefined}
      className={cn(
        "sticky top-0 z-(--z-header) h-(--header-height) transition-[background-color,box-shadow,backdrop-filter] duration-base ease-standard",
        scrolled ? "glass-strong shadow-[0_1px_0_var(--glass-hairline),0_8px_24px_-16px_rgb(23_22_31/0.18)]" : "bg-transparent",
      )}
    >
      <Container className="flex h-full items-center justify-between gap-6">
        <Link href="/" aria-label="SOMA, zur Startseite" className="-mx-2 inline-flex min-h-touch items-center rounded-control px-2 focus-ring">
          <Wordmark />
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          <nav aria-label="Hauptnavigation">
            <ul className="flex items-center gap-1">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={l.active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex h-10 items-center rounded-full px-4 type-label transition-colors duration-fast pressable focus-ring",
                      l.active ? "bg-ink/[0.06] text-ink" : "text-ink hover:bg-ink/[0.04]",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <span aria-hidden className="h-5 w-px bg-line-mid" />
          <div className="flex items-center gap-2">
            <ButtonLink
              href={account?.href ?? routes.login()}
              variant="ghost"
              className={cn("transition-opacity duration-fast", account ? "opacity-100" : "pointer-events-none opacity-0")}
              aria-hidden={account ? undefined : true}
              tabIndex={account ? undefined : -1}
            >
              {account?.label ?? "Anmelden"}
            </ButtonLink>
            <ButtonLink
              href="/#termin"
              onClick={(e) => {
                if (focusBookingEntry()) e.preventDefault();
              }}
            >
              Termin buchen
            </ButtonLink>
          </div>
        </div>

        <MobileMenu
          className="lg:hidden"
          links={[...links, { href: routes.help(), label: "Hilfe", active: isIn(routes.help()) }]}
          account={account}
        />
      </Container>
    </header>
  );
}
