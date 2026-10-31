/**
 * Device haptics for key confirmations (design-guideline v2 §10 "Haptics").
 * Uses navigator.vibrate where supported (Android Chrome); a silent no-op on
 * iOS, desktop, without user activation and with prefers-reduced-motion.
 *
 *   haptic("success")  // booking confirmed, request accepted, treatment started
 *   haptic("tap")      // selection of a slot or date (sparingly)
 *   haptic("warning")  // destructive confirmation
 */
export type HapticKind = "tap" | "select" | "success" | "warning";

const PATTERNS: Record<HapticKind, number | number[]> = {
  tap: 8,
  select: 10,
  success: [12, 60, 14],
  warning: [14, 80, 14],
};

export function haptic(kind: HapticKind = "tap"): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (!("vibrate" in navigator) || typeof navigator.vibrate !== "function") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return navigator.vibrate(PATTERNS[kind]);
  } catch {
    return false;
  }
}
