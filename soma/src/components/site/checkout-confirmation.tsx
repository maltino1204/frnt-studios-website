"use client";

import { useEffect } from "react";
import { haptic } from "@/lib/haptic";

/**
 * Device haptic for the confirmation moment (design-guideline v2 §10): fires once
 * per booking and tab, only when the page is opened right after the booking was
 * confirmed or sent, never on later visits. No-op on iOS, desktop and with
 * reduced motion (see haptic()).
 */
export function ConfirmHaptic({ bookingId, fresh }: { bookingId: string; fresh: boolean }) {
  useEffect(() => {
    if (!fresh) return;
    const key = `soma:haptic:${bookingId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage unavailable: still confirm once */
    }
    haptic("success");
  }, [bookingId, fresh]);
  return null;
}
