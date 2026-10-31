/**
 * Device haptics for key confirmations (design-guideline v2 §10 "Haptics").
 * Uses navigator.vibrate where supported (Android Chrome); a silent no-op on
 * iOS, desktop, without user activation and with prefers-reduced-motion.
 *
 *   haptic("success")  // booking confirmed, request accepted, treatment started
 *   haptic("warning")  // destructive confirmation
 *   haptic("select")   // rare: a date picked in a long flow
 *
 * Only on key confirmations, after the action resolves; never on ordinary taps (slots, chips, CTAs).
 * Those answer visually (press, settle) instead (brief principle 11, guideline §10.3, A5-14).
 */
export type HapticKind = "select" | "success" | "warning";

const PATTERNS: Record<HapticKind, number | number[]> = {
  select: 10,
  success: [12, 60, 14],
  warning: [14, 80, 14],
};

export function haptic(kind: HapticKind = "success"): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (!("vibrate" in navigator) || typeof navigator.vibrate !== "function") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return navigator.vibrate(PATTERNS[kind]);
  } catch {
    return false;
  }
}
