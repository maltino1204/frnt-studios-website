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
 * The SOMA mark, "S im O" with the Versatz: the S of the wordmark (the body) held in the O of the wordmark (the
 * place), whose halves slide against each other at the waist (contrapposto). Line cut from 32 px; masters:
 * brand/assets/logo/final/soma-symbol.svg.
 */
const SYMBOL = { viewBox: "0 0 744 724", paths: [
  "M332 0C521.24 0 664 150.23 664 362L744 362C744 573.77 601.24 724 412 724C222.76 724 80 573.77 80 362L0 362C0 150.23 142.76 0 332 0ZM556 362C556 188.12 466.4 40 332 40C197.6 40 108 188.12 108 362L188 362C188 535.88 277.6 684 412 684C546.4 684 636 535.88 636 362Z",
  "M488.38 191.45C473.37 171.81 452.28 158.1 429.74 149.72C388.03 134.19 339.63 135.45 299.01 154.07C267.09 168.71 237.37 196.84 233.04 234.66C232.41 240.11 232.35 245.63 232.85 251.09C235.96 285.05 260.07 311.7 287.3 328.12C328.15 352.75 379.72 359.33 413.73 395.65C417.63 399.82 421.21 404.32 424.41 409.09C428.32 414.9 431.65 421.12 434.23 427.69C437.26 435.44 439.26 443.64 440.1 451.97C441.22 463.03 440.28 474.29 437.37 485C434.73 494.78 430.46 504.05 424.9 512.38C419.67 520.21 413.32 527.2 406.16 533.13C367.15 565.49 307.61 564.01 270.46 529.17C264.1 523.2 258.55 516.35 253.95 508.82L240.18 530.06C256.04 550.54 278.19 564.79 301.81 573.57C346.17 590.05 397.66 588.81 440.94 569.22C473.82 554.34 504.86 526.08 510.58 487.43C511.44 481.66 511.69 475.78 511.31 469.95C509.11 435.84 486.15 407.98 459.01 390.98C446.99 383.46 433.9 377.69 421.04 371.94C399.26 362.19 377.18 353.09 356.51 340.89C348.08 335.92 339.69 330.69 332.43 323.97C317.03 309.73 306.66 289.98 304.08 268.64C302.78 257.87 303.47 246.85 306.09 236.34C308.51 226.62 312.57 217.37 317.97 209.06C323.3 200.87 329.92 193.62 337.45 187.61C372.53 159.59 424.27 161.15 457.53 191.58C464.21 197.69 469.94 204.82 474.61 212.69Z",
] } as const;
/** Seal cut (< 32 px: favicon, tabs, admin tile): the O filled, the S set into it. Master: soma-symbol-solid.svg. */
const SYMBOL_SOLID = { viewBox: "0 0 744 724", paths: [
  "M332 0C521.24 0 664 150.23 664 362L744 362C744 573.77 601.24 724 412 724C222.76 724 80 573.77 80 362L0 362C0 150.23 142.76 0 332 0ZM490.28 192.22C475.02 172.66 453.58 159.02 430.69 150.67C388.64 135.33 339.94 136.45 298.87 154.54C267.33 168.43 237.78 194.72 231.44 230.71C230.44 236.39 230.07 242.19 230.34 247.95C231.86 280.5 253.58 307.14 279.43 324.18C316.61 348.7 364.07 356.94 395.39 390.56C399.2 394.65 402.69 399.05 405.8 403.72C409.25 408.9 412.22 414.4 414.49 420.23C417.16 427.06 418.91 434.27 419.65 441.59C420.65 451.57 419.76 461.72 417.06 471.37C414.6 480.17 410.64 488.51 405.47 495.98C401.06 502.35 395.78 508.08 389.86 513.01C356.87 540.43 306.85 540.25 274.09 512.52C267.07 506.58 261.05 499.52 256.24 491.62L238.03 529.31C254.46 550.08 277.49 564.4 302 573.1C347.19 589.13 399.5 587.6 443.32 567.73C478.12 551.95 510.71 521.28 513.56 480.36C515.84 447.51 497.31 418.13 472.31 399C459.18 388.96 444.24 382.17 429.58 374.86C411.54 365.88 393.62 356.65 376.38 346.15C367.42 340.69 358.06 335.24 350.2 328.19C337.69 316.96 328.87 301.7 325.51 285.03C323.53 275.22 323.44 265.04 325.25 255.2C326.97 245.85 330.39 236.85 335.27 228.75C339.92 221.04 345.87 214.17 352.77 208.49C382.19 184.28 425.91 184.64 454.93 209.36C461.75 215.17 467.52 222.14 472.08 229.91Z",
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
