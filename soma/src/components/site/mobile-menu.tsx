"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/logo";
import { ButtonLink, IconButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BRAND_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { focusBookingEntry } from "./discovery-session";

export type NavLink = { href: string; label: string; active?: boolean };

/**
 * Full-screen menu for < lg (design-guideline v2 §8 "Navigation"): a light
 * glass layer over a soft aura; links rise in with a short stagger.
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
        aria-label="Menü"
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-ink backdrop:bg-transparent backdrop:backdrop-blur-none open:flex open:animate-fade-in open:flex-col"
      >
        <div aria-hidden className="absolute inset-0 -z-20 bg-surface" />
        <div className="flex h-(--header-height) shrink-0 items-center justify-between px-(--space-gutter)">
          <Link href="/" onClick={close} aria-label="SOMA, zur Startseite" className="-mx-2 inline-flex min-h-touch items-center rounded-control px-2 focus-ring">
            <Wordmark />
          </Link>
          <IconButton label="Menü schließen" onClick={close} className="-mr-2.5">
            <Icon icon={X} size={24} />
          </IconButton>
        </div>
        <nav aria-label="Hauptnavigation" className="min-h-0 flex-1 overflow-y-auto px-(--space-gutter) pt-8 pb-8">
          <ul className={cn("flex flex-col", open && "stagger-rise")}>
            {links.map((l) => (
              <li key={l.href} className="border-b border-line/80 last:border-b-0">
                <Link
                  href={l.href}
                  onClick={close}
                  aria-current={l.active ? "page" : undefined}
                  className="group flex min-h-16 items-center justify-between gap-4 rounded-control py-2 type-display-s transition-colors duration-fast focus-ring"
                >
                  <span className="flex items-center gap-3">
                    {l.active ? <span aria-hidden className="h-[1.5px] w-5 shrink-0 bg-ink" /> : null}
                    {l.label}
                  </span>
                  <Icon icon={ArrowUpRight} size={20} className="text-ink-muted transition-[translate,color] duration-base ease-arrive group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex shrink-0 flex-col gap-3 px-(--space-gutter) pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <ButtonLink
            href="/#termin"
            size="l"
            block
            onClick={(e) => {
              close();
              if (focusBookingEntry()) e.preventDefault();
            }}
          >
            Termin finden
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
          <p lang="en" className="pt-3 text-center type-accent text-[1.25rem] leading-snug text-ink-muted">
            {BRAND_TAGLINE}
          </p>
        </div>
      </dialog>
    </div>
  );
}
