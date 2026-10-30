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
 * Marketing header (design-guideline §8): sticky, Kalk, a hairline after 8px
 * of scroll. Account state is fetched after hydration so pages stay static.
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
      className={cn(
        "sticky top-0 z-(--z-header) h-(--header-height) border-b bg-surface transition-colors duration-fast ease-standard",
        scrolled ? "border-line" : "border-transparent",
      )}
    >
      <Container className="flex h-full items-center justify-between gap-6">
        <Link href="/" aria-label="SOMA, zur Startseite" className="-mx-2 inline-flex min-h-touch items-center rounded-xs px-2">
          <Wordmark />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          <nav aria-label="Hauptnavigation">
            <ul className="flex items-center gap-8">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={l.active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-touch items-center type-label text-ink underline-offset-[6px] decoration-1 hover:underline",
                      l.active && "underline",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
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
