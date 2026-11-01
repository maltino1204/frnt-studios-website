"use client";

/**
 * Booking links for the landing (Conversion & Integration; LANDING_DESIGN_SPEC.md § 5.5, § 4.10).
 *
 * <BookingLink source="header" className={buttonClasses()}>Termin finden</BookingLink>
 *   An `<a href="#termin">` (works without JS) that calls `openBooking({ source, categorySlug })` on a plain click.
 *   Use it for the header, the dock, the chapter overlay and the chapter CTAs „Freie Termine finden“ (04, 05, 06, 07).
 *   `data-cta` defaults to `{source}-termin` (INTEGRATION.md § 7).
 *
 * <SearchLink className={…}>Freie Termine finden</SearchLink>
 *   Chapter 10's customer CTA: `/suche` in the HTML, upgraded after mount to `/suche?plz={PLZ}` when the draft or the
 *   remembered PLZ holds one.
 */
import Link from "next/link";
import { useEffect, useState, type ComponentProps, type MouseEvent } from "react";
import { routes } from "@/lib/routes";
import { HERO_ENTRY_ID, openBooking } from "./booking-access";
import { knownPlz, useBookingDraft } from "./booking-draft";

type AnchorProps = Omit<ComponentProps<"a">, "href"> & { "data-cta"?: string };

export function BookingLink({ source, categorySlug, onClick, children, ...rest }: AnchorProps & { source: string; categorySlug?: string }) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    openBooking({ source, categorySlug });
  };
  return (
    <a href={`#${HERO_ENTRY_ID}`} data-cta={rest["data-cta"] ?? `${source}-termin`} {...rest} onClick={handle}>
      {children}
    </a>
  );
}

export function SearchLink({ children, ...rest }: Omit<ComponentProps<typeof Link>, "href"> & { "data-cta"?: string }) {
  const draft = useBookingDraft();
  const [href, setHref] = useState<string>(routes.search());
  useEffect(() => {
    const plz = knownPlz();
    setHref(routes.search(plz ? { plz } : {}));
  }, [draft.version]);
  return (
    <Link href={href} data-cta={rest["data-cta"] ?? "final-search"} {...rest}>
      {children}
    </Link>
  );
}
