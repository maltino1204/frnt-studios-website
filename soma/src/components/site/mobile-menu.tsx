"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/logo";
import { ButtonLink, IconButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BRAND_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { focusBookingEntry } from "./discovery-session";

export type NavLink = { href: string; label: string; active?: boolean };

/**
 * Full-screen night menu for < lg (design-guideline §8 "Marketing header").
 * Built on <dialog>: focus trap, Esc and focus restore come from the platform.
 */
export function MobileMenu({
  links,
  account,
  className,
}: {
  links: NavLink[];
  account: { href: string; label: string } | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const close = useCallback(() => setOpen(false), []);

  // Close whenever the route changes (link taps, back gesture).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    const root = document.documentElement;
    root.style.overflow = open ? "hidden" : "";
    return () => {
      root.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      setOpen(false);
    };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, []);

  return (
    <div className={className}>
      <IconButton label="Menü öffnen" aria-haspopup="dialog" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(true)} className="-mr-2.5">
        <Icon icon={Menu} size={24} />
      </IconButton>
      <dialog
        id="site-menu"
        ref={ref}
        data-theme="night"
        aria-label="Menü"
        className="m-0 h-dvh max-h-none w-full max-w-none bg-surface p-0 text-ink open:flex open:animate-fade-in open:flex-col"
      >
        <div className="flex h-(--header-height) shrink-0 items-center justify-between px-(--space-gutter)">
          <Link href="/" onClick={close} aria-label="SOMA, zur Startseite" className="-m-2 p-2">
            <Wordmark />
          </Link>
          <IconButton label="Menü schließen" onClick={close} className="-mr-2.5">
            <Icon icon={X} size={24} />
          </IconButton>
        </div>
        <nav aria-label="Hauptnavigation" className="min-h-0 flex-1 overflow-y-auto px-(--space-gutter) pt-10 pb-8">
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={close}
                  aria-current={l.active ? "page" : undefined}
                  className={cn(
                    "group flex min-h-touch items-center gap-4 py-2 type-display-m transition-colors duration-fast",
                    l.active ? "text-ink" : "text-ink hover:text-ink-muted",
                  )}
                >
                  {l.active ? <span aria-hidden className="h-0.5 w-6 shrink-0 bg-ink" /> : null}
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex shrink-0 flex-col gap-3 border-t border-line px-(--space-gutter) pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <ButtonLink
            href="/#termin"
            size="l"
            block
            onClick={(e) => {
              close();
              if (focusBookingEntry()) e.preventDefault();
            }}
          >
            Termin buchen
          </ButtonLink>
          <ButtonLink
            href={account?.href ?? "/anmelden"}
            variant="secondary"
            size="l"
            block
            onClick={close}
            className={cn("transition-opacity duration-fast", account ? "opacity-100" : "opacity-0")}
          >
            {account?.label ?? "Anmelden"}
          </ButtonLink>
          <p className="pt-3 font-display text-[1.125rem] italic leading-snug text-ink-muted">{BRAND_TAGLINE}</p>
        </div>
      </dialog>
    </div>
  );
}
