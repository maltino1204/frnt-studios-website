"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, FocusEvent, PointerEvent, TouchEvent } from "react";

/**
 * A `next/link` that prefetches on intent only: pointer over, focus or touch, never because it scrolled into view.
 * For links whose route prefetch carries assets the current page does not use (audit-2 N-6 / RT-9: the landing's
 * links to `/suche` and `/pro/registrieren` preloaded the display-font CSS of those layouts, which `/` never applies,
 * and the browser warned about an unused preload on every visit).
 */
export function IntentLink({ href, onPointerEnter, onFocus, onTouchStart, ...props }: Omit<ComponentProps<typeof Link>, "prefetch">) {
  const router = useRouter();
  const prefetch = () => {
    if (typeof href === "string") router.prefetch(href);
  };
  return (
    <Link
      href={href}
      prefetch={false}
      onPointerEnter={(e: PointerEvent<HTMLAnchorElement>) => {
        onPointerEnter?.(e);
        prefetch();
      }}
      onFocus={(e: FocusEvent<HTMLAnchorElement>) => {
        onFocus?.(e);
        prefetch();
      }}
      onTouchStart={(e: TouchEvent<HTMLAnchorElement>) => {
        onTouchStart?.(e);
        prefetch();
      }}
      {...props}
    />
  );
}
