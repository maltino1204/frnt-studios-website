"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/logo";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { accountLink, useSiteSession } from "@/components/site/discovery-session";
import { BRAND_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { openBooking } from "../booking/booking-access";
import { ArchMark } from "../primitives/arch-mark";
import { CHAPTERS } from "./chapters";
import { jumpToChapter } from "./jump";
import { CHAPTER_OVERLAY_EVENT } from "./overlay-events";

const PAGES = [
  { href: routes.categories(), label: "Behandlungen" },
  { href: routes.cities(), label: "Städte" },
  { href: routes.forPros(), label: "Für Profis" },
  { href: routes.help(), label: "Hilfe" },
] as const;

/**
 * Chapter overlay „Kapitel“ (spec § 5.4): a modal `<dialog>` (top layer, focus trap, Esc, page inert, focus back to
 * the trigger) on solid Bone. Chapters on the left (sans, numbered, the current one with `aria-current="location"`
 * and the arch mark), pages on the right, „Termin finden“, the account link and the tagline. A chapter link closes
 * the dialog, jumps and focuses the chapter heading. Motion hooks: `data-overlay-row` (0…n) on the rows.
 */
export function ChapterOverlay() {
  const ref = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const session = useSiteSession();
  const account = session === undefined ? null : accountLink(session);

  const close = useCallback(() => ref.current?.close(), []);

  useEffect(() => {
    const onOpen = () => {
      const d = ref.current;
      if (!d || d.open) return;
      trigger.current = document.activeElement as HTMLElement | null;
      setCurrent(document.documentElement.getAttribute("data-chapter-active") ?? "01");
      document.documentElement.style.overflow = "hidden";
      d.showModal();
    };
    window.addEventListener(CHAPTER_OVERLAY_EVENT, onOpen);
    return () => window.removeEventListener(CHAPTER_OVERLAY_EVENT, onOpen);
  }, []);

  const onClose = () => {
    document.documentElement.style.overflow = "";
    const t = trigger.current;
    trigger.current = null;
    // Browsers restore focus to the opener; this is the safety net (and keeps focus when a jump moved it already).
    if (t && document.activeElement === document.body) t.focus({ preventScroll: true });
  };

  return (
    <dialog
      ref={ref}
      aria-label="Kapitel und Seiten"
      onClose={onClose}
      className="lp-overlay fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto bg-surface p-0 text-ink backdrop:bg-transparent"
    >
      <div className="flex min-h-full flex-col pb-[env(safe-area-inset-bottom)]">
        <div className="lp-container flex h-(--header-height) shrink-0 items-center justify-between gap-4 pt-[env(safe-area-inset-top)]">
          <Wordmark title="SOMA" />
          <button type="button" onClick={close} className="inline-flex min-h-touch items-center gap-2 rounded-full pr-3 pl-4 type-label text-ink pressable focus-ring hover:bg-surface-sunken">
            Schließen
            <Icon icon={X} size={20} />
          </button>
        </div>

        <div className="lp-container grid flex-1 content-start gap-12 pt-6 pb-10 lg:grid-cols-12 lg:gap-6 lg:pt-12 lg:pb-14">
          <nav aria-label="Kapitel" className="lg:col-span-6">
            <h2 className="type-eyebrow text-ink-muted">Kapitel</h2>
            <ol className="mt-3 border-t border-line lg:mt-4">
              {CHAPTERS.map((c, i) => {
                const isCurrent = c.nn === current;
                return (
                  <li key={c.id} data-overlay-row={i} className="border-b border-line">
                    <a
                      href={`#${c.id}`}
                      aria-current={isCurrent ? "location" : undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        close();
                        jumpToChapter(c.id);
                      }}
                      className="group flex min-h-[52px] items-center gap-4 rounded-control px-1 text-ink transition-colors duration-fast focus-ring hover:bg-surface-sunken lg:min-h-14 lg:px-2"
                    >
                      <span className="w-7 shrink-0 type-label text-ink-muted num">{c.nn}</span>
                      <span className="type-heading-l">{c.name}</span>
                      {isCurrent ? <ArchMark className="ml-1 text-ink" /> : null}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="flex flex-col gap-10 lg:col-span-5 lg:col-start-8">
            <div data-overlay-row={CHAPTERS.length}>
              <h2 className="type-eyebrow text-ink-muted">Seiten</h2>
              <ul className="mt-3 flex flex-wrap gap-x-6 lg:mt-4 lg:flex-col lg:gap-0">
                {PAGES.map((p) => (
                  <li key={p.href}>
                    <Link href={p.href} onClick={close} className="inline-flex min-h-touch items-center rounded-control type-heading-m text-ink transition-colors duration-fast focus-ring hover:text-link-hover">
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div data-overlay-row={CHAPTERS.length + 1} className="flex flex-wrap gap-3">
              <a
                href="#termin"
                className={buttonClasses({ variant: "primary", size: "l" })}
                onClick={(e) => {
                  e.preventDefault();
                  close();
                  openBooking({ source: "overlay" });
                }}
              >
                Termin finden
              </a>
              <ButtonLink
                href={account?.href ?? routes.login()}
                variant="secondary"
                size="l"
                onClick={close}
                className={cn("transition-opacity duration-fast", account ? "opacity-100" : "pointer-events-none opacity-0")}
                aria-hidden={account ? undefined : true}
                tabIndex={account ? undefined : -1}
              >
                {account?.label ?? "Anmelden"}
              </ButtonLink>
            </div>
            <p lang="en" data-overlay-row={CHAPTERS.length + 2} className="mt-auto type-accent text-[1.75rem] leading-[1.1] text-ink-muted lg:text-[2rem]">
              <span className="block">{BRAND_TAGLINE.split(". ")[0]}.</span> <span className="block">{BRAND_TAGLINE.split(". ")[1]}</span>
            </p>
          </div>
        </div>
      </div>
    </dialog>
  );
}
