# SOMA launch treatment and "the mark draws on"

*Identity Designer · v1.1 · Brand Audit 1, M3. Motion principles: `brand/applications/motion/MOTION.md` (Art Director); this file specifies the asset. The product engineer integrates it.*

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
| 0–640 ms | O, both contours (outer and counter) | `stroke-dashoffset` 1 → 0 (`pathLength="1"`), stroke 5 units on 664 × 724 | `ease-arrive` `cubic-bezier(0.16, 1, 0.3, 1)` |
| 320–960 ms | S contour | `stroke-dashoffset` 1 → 0 | `ease-arrive` |
| 480–700 ms | O fill | opacity 0 → 1 | `ease-standard` |
| 900–1120 ms | S fill | opacity 0 → 1 | `ease-standard` |
| 1000–1200 ms | both contours | opacity 1 → 0 | `ease-exit` |

- **Final frame = static state.** Every element's resting style is the final frame; the animation only plays under `@media (prefers-reduced-motion: no-preference)`. With reduced motion, the mark is simply there.
- **Never:** a loader or spinner substitute, a loop, a morph from or into other letters, a scale-up from 0, a bounce. It never delays interaction (§ 2).
- **Colours:** Oxblood on Bone (default), Bone on Oxblood or Espresso. One colour per mark.

## 2. Where it runs

| Surface | Treatment |
|---|---|
| **PWA cold start** (standalone display) | The OS shows the static splash: on Android it is generated from `manifest.background_color` (#F3EFE8) + the icon; on iOS it is the `apple-splash-*.png` image. Then the app's first paint shows the **draw-on once per session**: centred overlay, mark 96 px tall on Bone. The overlay fades out (220 ms) at 1.2 s, or earlier as soon as the content is ready. `pointer-events: none` from the first frame, so it never blocks input. |
| Browser tab (not standalone) | No splash, no animation. |
| Video end frames, social avatar intro | The SVG or the storyboard frames; the wordmark lockup reveal (`MOTION.md` § 3.6.3) may follow. |

**Session rule:** `sessionStorage['soma-intro'] = '1'` after the first play. Never on navigation, never on reload within a session.

## 3. Suggested implementation (product engineer)

```tsx
// src/components/brand/intro.tsx (client). Paths from brand/assets/splash/soma-mark-draw.json.
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

iOS startup images, in `layout.tsx` metadata (`appleWebApp.startupImage`), for example: `{ url: "/brand/splash/apple-splash-1179x2556.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" }`. Copy `ios/*.png` to `public/brand/splash/`.

**Verify:** a screen recording at 390 px in standalone mode shows the mark draw once; with `reducedMotion: "reduce"` the first frame is the final mark; input is possible during the animation.
