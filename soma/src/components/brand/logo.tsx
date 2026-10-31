import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";

/**
 * SOMA wordmark — custom-drawn outlines (no font dependency), fills currentColor.
 * Header size: 20px tall on mobile, 24px from lg (design-guideline §2).
 */
export function Wordmark({ className, title = BRAND_NAME }: { className?: string; title?: string }) {
  // Drawn by the `wordmark` mask in globals.css (A5-9): the 2.7 KB outline ships once in the cached stylesheet
  // instead of in every page's HTML and RSC payload. currentColor fill, forced-colors and print safe.
  return <span role="img" aria-label={title} className={cn("wordmark h-5 lg:h-6", className)} />;
}

/** σ mark — avatars, loading states, small brand stamps. Never set next to the wordmark. */
export function Mark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 136 100"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn("h-6 w-auto", className)}
    >
      <path fill="currentColor" d="M76.52,91.55c-8.59,6.29 -19.04,8.45 -29.52,8.45c-13.49,0 -26.85,-3.89 -35.94,-14.37c-8.59,-9.9 -11.06,-22.88 -11.06,-35.63c0,-12.75 2.47,-25.73 11.06,-35.63c9.09,-10.48 22.45,-14.37 35.94,-14.37h89v17h-51.03c6.7,9.34 9.01,21.24 9.03,33c-0.03,15.76 -4.17,31.78 -17.48,41.55zM62,21.26c-4.33,-3.46 -9.6,-4.26 -15,-4.26c-5.12,0 -10.16,0.69 -14.38,3.79c-8.76,6.42 -10.58,18.39 -10.62,28.5c-0.04,10.33 1.32,22.51 10,29.45c4.33,3.46 9.6,4.26 15,4.26c5.19,0 10.28,-0.72 14.53,-3.9c8.65,-6.48 10.41,-18.33 10.47,-28.39c0.02,-10.33 -1.31,-22.51 -10,-29.45z" />
    </svg>
  );
}

/** The roof line (Dachlinie): the system's single graphic device marking "where you are". */
export function RoofLine({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block h-0.5 w-6 bg-current", className)} />;
}
