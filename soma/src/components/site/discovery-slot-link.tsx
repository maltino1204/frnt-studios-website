"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { haptic } from "@/lib/haptic";

/**
 * A slot chip that links straight to checkout (search results). On press it
 * settles into the selected ink state immediately (design-guideline v2 §10:
 * "slot selection that settles"), so the tap is answered before the next page arrives.
 */
export function SlotChipLink({ className, onClick, ...props }: ComponentProps<typeof Link>) {
  const [picked, setPicked] = useState(false);
  // Coming back via the back button (bfcache) shows the list as it was, not mid-selection.
  useEffect(() => {
    const reset = (e: PageTransitionEvent) => {
      if (e.persisted) setPicked(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);
  return (
    <Link
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
          setPicked(true);
          haptic("tap");
        }
      }}
      data-picked={picked || undefined}
      className={cn(
        "relative inline-flex h-10 items-center rounded-tile border px-3.5 type-label-s whitespace-nowrap num pressable focus-ring",
        "before:absolute before:-inset-y-0.5 before:inset-x-0 before:content-['']",
        picked
          ? "animate-settle border-ink bg-ink text-ink-inverse shadow-ink"
          : "border-line-mid bg-surface-raised text-ink shadow-[0_1px_2px_rgb(23_22_31/0.05)] hover:-translate-y-px hover:border-ink hover:shadow-[0_6px_14px_-8px_rgb(23_22_31/0.3)]",
        className,
      )}
    />
  );
}
