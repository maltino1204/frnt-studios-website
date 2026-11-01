import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";

/*
 * SOMA logo system (brand/LOGO_USAGE.md). Outlines copied from the masters in brand/assets/logo/final/
 * (built by brand/tools/build-logo.mjs; never retype the name in a font). Every mark fills currentColor:
 * Espresso by default, Bone on dark grounds. Never Oxblood in the product UI, never effects or gradients.
 */

/** Micro master (< 32 px cap height): heavier hairlines, wider spacing. Header and footer size. */
const MICRO = { viewBox: "0 -16.8 2910 731.2", paths: [
  "M421.72 73C397.16 41.32 362.45 18.92 325.07 5.21C256.95 -19.79 177.75 -17.92 111.29 11.52C56.77 35.68 7.19 82.62 0.7 144.66C-0.28 154.02 -0.23 163.47 0.86 172.82C7.16 227.01 46.78 269.61 92.38 295.96C160.89 335.55 247.35 346.18 304.12 404.99C310.65 411.75 316.63 419.05 321.98 426.79C328.3 435.93 333.69 445.7 337.85 456.01C342.84 468.39 346.07 481.47 347.36 494.75C349.03 511.96 347.4 529.44 342.64 546.06C338.3 561.21 331.39 575.59 322.42 588.55C314 600.72 303.79 611.62 292.31 620.96C225.96 674.91 122.76 672.55 59.62 614.54C49.78 605.49 41.16 595.23 33.91 584L12.15 623C38.65 656.65 75.99 680.16 116.05 694.44C188.03 720.09 271.3 718.06 341.49 687.51C397.34 663.2 449.05 616.64 458.52 553.76C459.93 544.37 460.34 534.83 459.72 525.36C456.07 469.71 417.72 423.85 371.52 395.96C351.74 384.02 330.22 374.73 309.05 365.55C272.11 349.53 234.57 334.78 199.44 314.95C185.47 307.07 171.65 298.77 159.65 288.06C134.11 265.27 116.89 233.7 112.91 199.59C110.96 182.9 112.18 165.88 116.46 149.62C120.54 134.13 127.37 119.41 136.45 106.22C145.15 93.57 155.87 82.36 168.02 72.99C227.47 27.15 315.97 29.62 372.36 79.38C383.1 88.86 392.36 99.86 399.96 112Z",
  "M942 -12C1131.24 -12 1274 138.23 1274 350C1274 561.77 1131.24 712 942 712C752.76 712 610 561.77 610 350C610 138.23 752.76 -12 942 -12ZM722 350C722 517.4 810 660 942 660C1074 660 1162 517.4 1162 350C1162 182.6 1074 40 942 40C810 40 722 182.6 722 350Z",
  "M1797.59 478.28L1980.36 0L2158 0L2158 714.4L2046 714.4L2046 39.46L1788.08 714.4L1529.4 161.24L1529.4 714.4L1454 714.4L1454 0L1573.93 0Z",
  "M2690.2 479.9L2436.79 479.9L2334.54 700L2260 700L2593 -16.8L2910 700L2787.53 700ZM2566.61 200.45L2459.74 430.5L2668.35 430.5Z",
] } as const;
/** Display master (>= 32 px cap height, about 128 px wide and up). */
const DISPLAY = { viewBox: "0 -16.8 2796 731.2", paths: [
  "M421.72 73C396.77 40.82 361.35 18.22 323.29 4.56C255.02 -19.94 175.83 -17.65 109.6 12.28C54.89 37.01 5.52 84.95 0.42 147.62C-0.3 156.5 -0.09 165.46 1.04 174.29C8.21 230.33 50.68 273.3 98.29 299.49C139.22 322.01 184.4 334.94 227.23 353.13C259.19 366.71 290.31 383.66 314.56 408.96C321.28 415.98 327.42 423.55 332.88 431.58C339.48 441.29 345.07 451.67 349.38 462.59C354.61 475.8 357.98 489.74 359.33 503.88C361.12 522.69 359.28 541.79 354 559.93C349.18 576.48 341.54 592.16 331.6 606.23C323.43 617.81 313.74 628.3 302.9 637.44C236.04 693.84 131.96 693.84 65.09 637.44C52.02 626.41 40.73 613.45 31.58 599L12.15 623C38.65 656.65 75.99 680.16 116.05 694.44C188.71 720.34 272.94 718.05 343.55 686.6C399.61 661.64 451.14 613.91 459 550.22C460.16 540.8 460.31 531.26 459.44 521.81C454.2 465.29 413.58 419.74 365.88 392.66C312.98 362.62 253.25 346.93 199.65 318.23C184.5 310.11 169.3 301.4 156 290.46C135.43 273.54 119.23 251.45 109.72 226.54C105.32 215.01 102.36 202.94 100.95 190.68C98.85 172.31 100.26 153.59 105.08 135.75C109.66 118.75 117.3 102.62 127.44 88.24C135.91 76.23 146.1 65.46 157.57 56.27C217.26 8.42 306.24 8.31 366.07 55.98C380.45 67.44 392.67 81.34 402.29 97Z",
  "M904 -12C1093.24 -12 1236 138.23 1236 350C1236 561.77 1093.24 712 904 712C714.76 712 572 561.77 572 350C572 138.23 714.76 -12 904 -12ZM672 350C672 528.2 764.8 680 904 680C1043.2 680 1136 528.2 1136 350C1136 171.8 1043.2 20 904 20C764.8 20 672 171.8 672 350Z",
  "M1735.19 531.55L1941.5 0L2082 0L2082 714.4L1982 714.4L1982 23.91L1714 714.4L1424.4 98.66L1424.4 714.4L1378 714.4L1378 0L1485.19 0Z",
  "M2580.91 460.9L2302.94 460.9L2191.87 700L2146 700L2479 -16.8L2796 700L2686.65 700ZM2445.35 154.36L2317.07 430.5L2567.47 430.5Z",
] } as const;
/** The symbol: the S drawn from the two halves of the O. */
const SYMBOL = { viewBox: "0 0 472 724.43", d: "M432.92 85.2C407.52 53.29 371.82 31.03 333.7 17.41C263.13 -7.82 181.23 -5.77 112.51 24.48C58.5 48.26 8.22 93.94 0.88 155.39C-0.18 164.23 -0.28 173.19 0.56 182.06C5.88 237.73 47.29 281.12 93.82 307.88C161.79 346.97 247.25 358.59 303.35 416.97C309.84 423.73 315.79 431.01 321.11 438.73C327.62 448.18 333.16 458.27 337.45 468.92C342.51 481.53 345.83 494.83 347.23 508.35C349.09 526.32 347.53 544.6 342.69 562.01C338.16 578.3 330.79 593.76 321.11 607.62C313.12 619.07 303.57 629.42 292.86 638.39C230.3 690.78 133.93 691.13 70.94 639.29C57.63 628.34 46.2 615.3 37.04 600.7L12.96 635.2C39.81 668.47 77.27 691.61 117.24 705.86C191.6 732.38 277.74 730.62 350.52 699.71C406.49 675.94 459.63 630.49 470.19 567.72C471.77 558.36 472.32 548.82 471.82 539.33C468.82 483.2 429.65 437.21 383.21 409.29C363.07 397.18 341.13 387.89 319.61 378.52C283.65 362.88 247.28 348.05 213.21 328.47C198.87 320.23 184.56 311.57 172.24 300.44C146.48 277.18 129.33 245.07 125.07 210.58C122.84 192.59 124.12 174.2 128.78 156.69C133.22 140.01 140.71 124.19 150.71 110.13C160.25 96.72 172.04 84.94 185.41 75.35C242.84 34.11 324.43 37.34 378.16 83.43C390.26 93.81 400.57 106.08 408.83 119.7Z" } as const;
/** Favicon cut of the symbol (16-32 px): hairlines opened so the waist survives small sizes. */
const SYMBOL_MICRO = { viewBox: "8.6 4.3 15.2 23.2", d: "M22.26 7.31C21.48 6.32 20.37 5.63 19.2 5.21C17.03 4.44 14.52 4.49 12.41 5.41C10.76 6.12 9.21 7.48 8.92 9.34C8.88 9.63 8.87 9.92 8.89 10.21C9.01 11.87 10.17 13.2 11.54 14.04C13.57 15.29 16.16 15.64 17.88 17.39C18.07 17.59 18.25 17.81 18.41 18.03C18.61 18.31 18.78 18.61 18.91 18.93C19.05 19.27 19.14 19.63 19.18 20C19.24 20.49 19.19 20.99 19.06 21.47C18.94 21.91 18.74 22.32 18.49 22.69C18.26 23.02 17.99 23.32 17.69 23.58C15.76 25.21 12.68 25.17 10.82 23.45C10.55 23.19 10.31 22.91 10.11 22.6L9.28 24.31C10.12 25.36 11.31 26.08 12.57 26.52C14.9 27.33 17.59 27.25 19.85 26.25C21.67 25.44 23.38 23.85 23.47 21.73C23.54 20.07 22.54 18.6 21.23 17.66C20.56 17.18 19.81 16.84 19.07 16.5C18.04 16.03 17.01 15.57 16.03 15.03C15.54 14.76 15.04 14.49 14.61 14.13C13.89 13.53 13.38 12.69 13.21 11.77C13.12 11.28 13.12 10.78 13.23 10.3C13.32 9.85 13.49 9.42 13.73 9.03C13.96 8.67 14.24 8.35 14.56 8.07C16.26 6.6 18.95 6.61 20.64 8.09C20.95 8.36 21.22 8.68 21.44 9.02Z" } as const;

type LabelProps = { className?: string; /** accessible name; pass null when a parent link already names it */ title?: string | null };

function a11y(title: string | null | undefined) {
  return title ? ({ role: "img", "aria-label": title } as const) : ({ "aria-hidden": true, focusable: false } as const);
}

/**
 * The SOMA wordmark. Defaults to the micro master at the product header size (15 px tall on mobile, 18 px from lg).
 * Use `master="display"` from 32 px cap height (about 40 px tall) upwards. Clear space: 0.43 x the cap height.
 */
export function Wordmark({ className, title = BRAND_NAME, master = "micro" }: LabelProps & { master?: "micro" | "display" }) {
  const m = master === "display" ? DISPLAY : MICRO;
  return (
    <svg viewBox={m.viewBox} {...a11y(title)} className={cn("wordmark block h-[15px] w-auto shrink-0 fill-current lg:h-[18px]", className)}>
      {m.paths.map((d) => (
        <path key={d.slice(0, 12)} d={d} />
      ))}
    </svg>
  );
}

/**
 * The symbol (the S). For the app icon, avatars, stamps and small spaces where the name is already present.
 * Never set beside the wordmark in a line (the S would repeat). Below 24 px it switches to the favicon cut.
 */
export function Mark({ className, title, size = "auto" }: Omit<LabelProps, "title"> & { title?: string; /** "small" forces the favicon cut (16-24 px) */ size?: "auto" | "small" }) {
  const s = size === "small" ? SYMBOL_MICRO : SYMBOL;
  return (
    <svg viewBox={s.viewBox} {...a11y(title)} className={cn("block h-6 w-auto shrink-0 fill-current", className)}>
      <path d={s.d} />
    </svg>
  );
}

/** Alias with the brand name of the mark. */
export const Symbol = Mark;

/**
 * "SOMA Pro": the wordmark plus "Pro" in the interface sans as a plain descriptor (BRAND_STRATEGY § 5), never a
 * separate logo. A hairline separates the two, at the wordmark's cap height.
 */
export function ProLockup({ className, title = "SOMA Pro" }: LabelProps) {
  return (
    <span {...a11y(title)} className={cn("inline-flex items-center gap-2.5 text-ink", className)}>
      <Wordmark title={null} className="h-[15px] lg:h-4" />
      <span aria-hidden className="h-4 w-px bg-line-strong" />
      <span aria-hidden className="type-label leading-none font-[560] tracking-[0.01em]">
        Pro
      </span>
    </span>
  );
}

/**
 * Admin mark: the favicon-cut S in an Espresso tile plus "Admin" (no Oxblood brand moment in the console,
 * BRAND_STRATEGY § 5). Decorative by default; the surrounding link carries the name.
 */
export function AdminMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-ink text-ink-inverse", className)}>
      <Mark size="small" className="h-4" />
    </span>
  );
}

/** Retired v2 roof line, kept as a neutral 20 x 1.5 px Espresso rule for legacy call sites. */
export function RoofLine({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block h-[1.5px] w-5 bg-current", className)} />;
}
