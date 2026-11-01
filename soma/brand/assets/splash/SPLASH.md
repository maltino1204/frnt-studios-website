# SOMA launch treatment and "the mark draws on"

*Identity Designer · v1.2.1 · Brand Audit 1 (M3), Brand Audit 2 (the Versatz), Brand Audit 3 (N11: what is shipped vs. what is a concept). Motion principles: `brand/applications/motion/MOTION.md` (Art Director). This file specifies the asset; the product engineer integrates it.*

> **Status (1 Nov 2026):**
> - **Shipped:** the iOS startup images, and the draw-on in the landing page's closing band (§ 2).
> - **Concept, not built:** the PWA first-paint intro (§ 3). No code in `src/` plays the draw-on on an app start.

| File | Use |
|---|---|
| `soma-mark-draw.svg` | The animation as one self-contained SVG (CSS inside; Oxblood). It can be used as `<img>`, inline, or in video tools. |
| `soma-mark-draw-bone.svg` | The same in Bone, for dark or Oxblood grounds |
| `soma-mark-draw.json` | Path data (`o`, `s`), `viewBox` and the timeline, for a React or Lottie-free implementation |
| `soma-mark-draw-storyboard.png` | Frames at 0 / 160 / 320 / 480 / 640 / 800 / 960 / 1200 ms |
| `soma-splash.svg` | Static launch screen: Bone ground, the stacked lockup (S im O over the micro wordmark) in Oxblood, optical centre at 47 % height |
| `ios/apple-splash-{w}x{h}.png` | iOS PWA startup images (`<link rel="apple-touch-startup-image">`) for 10 current iPhone and iPad resolutions, portrait |

## 1. The animation: "Das Zeichen zeichnet sich"

The mark is the S (the body) inside the O (the place). The animation tells that order: first the place is drawn, then the body arrives in it, then both settle. It runs once, it is 1.2 s long, and it never loops.

| Time | Element | Property | Easing |
|---|---|---|---|
| 0–640 ms | O, both contours (outer and counter) | `stroke-dashoffset` 1 → 0 (`pathLength="1"`), stroke 5 units on 744 × 724 (the mark with the Versatz) | `ease-arrive` `cubic-bezier(0.16, 1, 0.3, 1)` |
| 320–960 ms | S contour | `stroke-dashoffset` 1 → 0 | `ease-arrive` |
| 480–700 ms | O fill | opacity 0 → 1 | `ease-standard` |
| 900–1120 ms | S fill | opacity 0 → 1 | `ease-standard` |
| 1000–1200 ms | both contours | opacity 1 → 0 | `ease-exit` |

- **Final frame = static state.** Every element's resting style is the final frame; the animation only plays under `@media (prefers-reduced-motion: no-preference)`. With reduced motion, the mark is simply there.
- **Never:** a loader or spinner substitute, a loop, a morph from or into other letters, a scale-up from 0, a bounce. It never delays interaction (§ 2).
- **Colours:** Oxblood on Bone (default), Bone on Oxblood or Espresso. One colour per mark.

## 2. Where it runs (as built)

| Surface | Status | Treatment |
|---|---|---|
| **iOS PWA cold start** | **Shipped** | Static startup images: `ios/apple-splash-*.png` are copied to `public/splash/` and wired in `src/app/layout.tsx` (`appleWebApp.startupImage`, 10 portrait sizes). Bone ground, the stacked mark in Oxblood. **No animation follows.** |
| Android PWA cold start | Shipped (by the OS) | Android generates the splash from `manifest.background_color` (#F3EFE8) and the icon. No animation. |
| **Landing page, closing band** (`/`, chapter 10) | **Shipped as the draw-on surface** | `src/components/landing/seal/closing-lockup.tsx` builds the stacked lockup with contour strokes (`data-seal-part="o-trace"`, `"s-trace"`, `pathLength 1`, from the left springline) and fills (`"o-fill"`, `"s-fill"`). The paths come from `logo.tsx`, so the band follows the masters. The landing motion layer plays the § 1 timeline **once**, when the band enters the viewport (`MOTION.md` § 3.6.2). Static state and reduced motion show the final frame: fills shown, contours hidden. The trace is driven by the landing's motion module (product engineer); until that module plays it, the band shows the final frame. |
| Brand book `/kit/marke` | Shipped (demo) | `src/app/kit/marke/draw-on.tsx`: the same timeline, with a replay button. |
| Video end frames, social avatar intro | Asset ready | `soma-mark-draw.svg`, or the storyboard frames. The wordmark lockup reveal (`MOTION.md` § 3.6.3) may follow. |
| Browser tab (not standalone) | n/a | No splash, no animation. |

## 3. Concept, not built: the PWA first-paint intro

*This was the v1.1 proposal. It is **not implemented**, and nothing in the product depends on it. Build it only if the client wants a branded app start; then move it into § 2.*

- **Idea:** after the OS splash, the app's first paint in standalone mode shows the draw-on **once per session**, as a centred overlay with the mark 96 px tall on Bone.
- **Timing:** it fades out (220 ms) at 1.2 s, or earlier as soon as the content is ready.
- **Input:** `pointer-events: none` from the first frame, so it never blocks input.
- **Session rule:** set `sessionStorage['soma-intro'] = '1'` after the first play. Never on navigation, never on a reload within a session.

```tsx
// Sketch only. src/components/brand/intro.tsx (client). Paths from brand/assets/splash/soma-mark-draw.json.
"use client";
export function BrandIntro() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const standalone = matchMedia("(display-mode: standalone)").matches;
    if (!standalone || sessionStorage.getItem("soma-intro")) return;
    sessionStorage.setItem("soma-intro", "1");
    setShow(true);
    const t = setTimeout(() => setShow(false), 1200);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-(--z-toast) grid place-items-center bg-surface animate-fade-in">
      {/* inline the SVG from soma-mark-draw.svg (or render the paths from the JSON with the same CSS) */}
    </div>
  );
}
```

**Verify (if built):**
- A screen recording at 390 px in standalone mode shows the mark draw once.
- With `reducedMotion: "reduce"`, the first frame is the final mark.
- Input is possible during the animation.

## 4. Verify what is shipped

- **iOS startup images:** `public/splash/*.png` must be byte-identical to `ios/*.png`. Rebuild with `node brand/tools/build-splash.mjs`, then copy.
- **Closing band:**
  - Playwright at 390 and 1440 on `/`: scroll to chapter 10. The `o-trace` and `s-trace` contours animate once and end at opacity 0, and the fills are visible.
  - With `reducedMotion: "reduce"`, the final frame shows immediately.
