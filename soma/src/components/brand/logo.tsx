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
/**
 * The SOMA mark, "S im O": the S of the wordmark (the body) held in the O of the wordmark (the place). Line cut from
 * 32 px; masters: brand/assets/logo/final/soma-symbol.svg.
 */
const SYMBOL = { viewBox: "0 0 664 724", paths: [
  "M332 0C521.24 0 664 150.23 664 362C664 573.77 521.24 724 332 724C142.76 724 0 573.77 0 362C0 150.23 142.76 0 332 0ZM108 362C108 535.88 197.6 684 332 684C466.4 684 556 535.88 556 362C556 188.12 466.4 40 332 40C197.6 40 108 188.12 108 362Z",
  "M458.67 183.81C442.33 163.28 419.37 148.96 394.85 140.2C349.45 123.97 296.77 125.29 252.56 144.75C217.82 160.05 185.48 189.43 180.76 228.95C180.08 234.64 180.01 240.41 180.55 246.11C183.94 281.6 210.18 309.44 239.82 326.6C284.27 352.33 340.41 359.21 377.42 397.16C381.66 401.52 385.56 406.21 389.04 411.2C393.29 417.28 396.92 423.77 399.73 430.64C403.03 438.74 405.2 447.3 406.12 456C407.33 467.56 406.31 479.33 403.15 490.52C400.27 500.73 395.63 510.42 389.57 519.13C383.89 527.3 376.97 534.6 369.18 540.8C326.73 574.62 261.92 573.06 221.49 536.67C214.56 530.43 208.53 523.27 203.52 515.41L188.53 537.6C205.8 559 229.9 573.88 255.61 583.05C303.89 600.27 359.93 598.98 407.03 578.51C442.82 562.96 476.6 533.44 482.83 493.06C483.76 487.02 484.03 480.89 483.62 474.79C481.23 439.15 456.24 410.05 426.69 392.28C413.62 384.42 399.37 378.4 385.37 372.39C361.66 362.2 337.64 352.69 315.14 339.95C305.97 334.75 296.84 329.28 288.93 322.26C272.18 307.38 260.88 286.75 258.08 264.46C256.67 253.2 257.42 241.69 260.27 230.71C262.9 220.55 267.32 210.88 273.2 202.2C279 193.65 286.2 186.07 294.4 179.79C332.57 150.51 388.89 152.15 425.09 183.94C432.36 190.32 438.6 197.77 443.67 206Z",
] } as const;
/** Seal cut (< 32 px: favicon, tabs, admin tile): the O filled, the S set into it. Master: soma-symbol-solid.svg. */
const SYMBOL_SOLID = { viewBox: "0 0 664 724", paths: [
  "M332 0C521.24 0 664 150.23 664 362C664 573.77 521.24 724 332 724C142.76 724 0 573.77 0 362C0 150.23 142.76 0 332 0ZM454.87 189.16C439.02 169.25 416.75 155.36 392.96 146.86C349.29 131.25 298.69 132.39 256.04 150.8C223.27 164.95 192.57 191.71 185.99 228.35C184.95 234.13 184.56 240.03 184.84 245.89C186.42 279.03 208.98 306.15 235.83 323.5C274.46 348.46 323.76 356.85 356.3 391.07C360.26 395.24 363.88 399.72 367.11 404.47C370.7 409.75 373.78 415.35 376.14 421.28C378.92 428.23 380.73 435.57 381.5 443.02C382.54 453.18 381.62 463.52 378.81 473.34C376.25 482.29 372.14 490.79 366.77 498.39C362.19 504.88 356.7 510.71 350.55 515.73C316.28 543.65 264.33 543.46 230.29 515.23C223 509.19 216.75 502 211.74 493.95L192.84 532.33C209.9 553.46 233.82 568.05 259.28 576.9C306.22 593.22 360.57 591.66 406.09 571.44C442.23 555.37 476.09 524.15 479.05 482.49C481.42 449.05 462.17 419.14 436.2 399.67C422.57 389.44 407.04 382.53 391.81 375.09C373.08 365.95 354.46 356.55 336.55 345.86C327.24 340.31 317.52 334.76 309.36 327.58C296.36 316.15 287.2 300.61 283.7 283.64C281.65 273.66 281.56 263.29 283.44 253.28C285.22 243.76 288.78 234.59 293.85 226.35C298.67 218.5 304.85 211.51 312.02 205.73C342.58 181.08 388 181.44 418.15 206.61C425.23 212.53 431.22 219.62 435.96 227.53Z",
] } as const;

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
 * The mark ("S im O"). For the app icon, avatars, stamps and small spaces where the name is already present or
 * implied. Never set beside the wordmark in a line; together they only appear as the stacked lockup. From 32 px it
 * uses the line cut; `size="small"` (16-31 px) switches to the seal cut, which keeps its shape at favicon size.
 */
export function Mark({ className, title, size = "auto" }: Omit<LabelProps, "title"> & { title?: string; /** "small" forces the seal cut (16-31 px) */ size?: "auto" | "small" }) {
  const s = size === "small" ? SYMBOL_SOLID : SYMBOL;
  return (
    <svg viewBox={s.viewBox} {...a11y(title)} className={cn("block h-8 w-auto shrink-0 fill-current", className)}>
      {s.paths.map((d) => (
        <path key={d.slice(0, 16)} d={d} />
      ))}
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
 * Admin mark: the seal cut of the mark in Bone on an Espresso tile (no Oxblood brand moment in the console,
 * BRAND_STRATEGY § 5). Decorative; the surrounding link carries the name.
 */
export function AdminMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-ink text-ink-inverse", className)}>
      <Mark size="small" className="h-4" />
    </span>
  );
}

/** A neutral 20 x 1.5 px rule (the former v2 roof line), kept for existing call sites. */
export function RoofLine({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block h-[1.5px] w-5 bg-current", className)} />;
}
