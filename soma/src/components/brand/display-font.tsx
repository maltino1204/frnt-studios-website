import localFont from "next/font/local";
import type { CSSProperties, ReactNode } from "react";

/*
 * Newsreader Display roman, preloaded (brand/BRAND_GUIDELINES.md § 4.2; landing spec § 10.5, the "preferred" option).
 * The root layout declares the roman without a preload, so `/` (whose above-the-fold faces are Instrument Sans and
 * the italic) does not fetch it ahead of its LCP. Every other top-level layout renders its tree in
 * <DisplayFontScope>: this declaration of the same file is preloaded there, and the display and accent stacks point
 * at it, so those routes keep the preloaded serif headline they had (same file, same metric-matched fallback).
 */
const display = localFont({
  src: "../../styles/fonts/newsreader-display-roman-latin.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  preload: true,
  adjustFontFallback: "Times New Roman",
});

// The token stacks (src/styles/tokens.css) with this declaration in place of the root's `--font-display-src`.
const STACK = `"Newsreader", "Iowan Old Style", Georgia, "Times New Roman", serif`;
const scope = {
  "--font-display": `${display.style.fontFamily}, ${STACK}`,
  "--font-accent": `var(--font-accent-src), ${display.style.fontFamily}, ${STACK}`,
} as CSSProperties;

export function DisplayFontScope({ children }: { children: ReactNode }) {
  return (
    <div className="contents" style={scope}>
      {children}
    </div>
  );
}
