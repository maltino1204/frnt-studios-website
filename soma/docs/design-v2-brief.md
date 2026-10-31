# SOMA Design v2: Brief (binding for all agents)

**Goal.** SOMA must look and feel like a product from a top-tier, venture-backed company (a "$100M SaaS" quality bar). It
should be precise, light, calm and technically flawless. The client's feedback on v1: *"Farben sind ok, könnten aber leichter
sein. Alles muss technisch viel hochwertiger aussehen."*

v1 reads like a print editorial: lime-washed beige surfaces, 2 px corners, flat panels, dark blocks and beige placeholder
boxes. v2 keeps the brand's warmth and its German voice. Its execution shifts to a premium product: lighter, layered,
tactile, alive.

## Quality references (bar, not templates — never copy their assets, layouts or identity)
- **Stripe:** precision, layered UI compositions, restrained gradients.
- **Linear:** crisp density, motion and keyboard-grade polish.
- **Airbnb:** marketplace clarity, cards and trust.
- **Calm / Aesop:** sensory warmth.

## Principles
1. **Lighter.** Near-white, airy surfaces with a whisper of warmth. Generous whitespace. No large dark blocks on the customer
   side, except at most one deliberate band. Contrast stays WCAG AA (body text ≥ 4.5:1, UI ≥ 3:1). Lighter must never mean faint.
2. **Depth instead of flat.** Three elevation levels, made of soft multi-layer shadows plus a hairline at low opacity.
   Cards float, overlays are glass:
   - translucent white;
   - `backdrop-filter: blur(...) saturate(...)`;
   - a hairline;
   - for the sticky header, bottom nav, sticky CTA, sheets and toasts.
3. **Soft geometry.** Consistent radii: about 10, 14, 20 and 28 px, plus pill. No 2 px corners. One radius family per component type.
4. **One signature.** A refined accent: ultramarine, made lighter and brighter, AA-safe on white. It comes with a signature
   gradient (the "SOMA aura": ultramarine → soft violet → warm peach/rose). Use it sparingly: hero aura, highlights, key
   badges, focus glow, charts. Never as a full-bleed button fill everywhere.
5. **Product-led visuals.** The hero and the marketing sections show the product itself: compositions of real SOMA
   components as floating, layered cards on an aura background. Examples:
   - a provider result card with slot chips;
   - a *Bestätigt* toast;
   - the Start-Code card;
   - a rating;
   - a travel-fee line.

   This works without photos and signals "technology". Photos, where they exist, are an additional layer, not the only content.
6. **Premium without photos.** Image slots must look intentional even when an image does not load. This sandbox cannot load
   the photo CDN; on the client's deployment the photos load.
   - Fallbacks are generative "aura" artworks: layered radial gradients in category hues plus a fine SVG grain, deterministic
     per seed (slug).
   - Avatars are monograms on an aura tile with a subtle ring.
   - Never flat beige boxes with big initials.
7. **Typography with intent.** Display and UI must feel contemporary and engineered:
   - optical sizes and tight tracking on large sizes;
   - `font-feature-settings` for tabular numbers in prices, times and stats;
   - balanced headlines (`text-wrap: balance`) and `pretty` paragraphs.

   The serif can stay as an emotional accent, or be replaced. That is the Creative Director's call, documented in
   `docs/design-guideline.md`. Font budget: at most 2 preloaded files and at most 150 KB of fonts on `/`.
8. **Motion is information.** 120–280 ms, spring-like easing, stagger for lists, hover lift and press-scale on cards and
   buttons, smooth sheet and dialog transitions, skeleton shimmer, count-up for stats. Scroll reveals stay subtle: opacity plus
   8–12 px, run once, never on content above the fold. `prefers-reduced-motion` disables all of it. No layout shift.
9. **Data looks expensive.** In `/pro` and `/admin`:
   - KPI tiles with sparklines;
   - area charts with gradient fills;
   - tabular numerals;
   - refined tables (sticky header, row hover, density);
   - status pills;
   - empty states with illustration-grade aura art.
10. **Details.** Focus rings (accent glow), selection colour, scrollbar styling where sensible, favicon and OG consistency,
    loading and empty states for every async view, 44 px touch targets, safe areas, and no hydration warnings.

11. **Haptics: "Bewegung und Ruhe".** Client requirement: *„Auch die Haptik muss viel besser sein. Bring Effekte rein.
    Bewegung und Ruhe."*
    - **Every interactive element responds tactilely:**
      - spring-like press (scale ≈ 0.97), hover lift, focus glow;
      - animated checkbox, switch and radio (the check draws in, the knob springs);
      - slot and chip selection that "settles";
      - loading states that morph instead of jumping.
    - **Ambient calm:** aura gradients drift and breathe very slowly (20–40 s loops, transform/opacity only). They pause
      offscreen and are off with reduced motion.
    - **Subtle, expensive effects:**
      - a pointer-following spotlight on large cards and hero panels (pointer: fine only);
      - small scroll parallax on the floating hero cards;
      - shimmer skeletons;
      - route transitions (View Transitions API with a cross-fade fallback).
    - **Moments of delight:**
      - the checkmark draws in on *Bestätigt*/*Gespeichert*;
      - staggered Start-Code reveal and count-up stats;
      - spring toasts and sheets with a drag feel.
    - **Device haptics:** `haptic()` uses `navigator.vibrate` where supported, on key confirmations such as booking,
      accepting and starting. It is feature-detected and off with reduced motion.
    - **Rhythm:** interactions answer within 120–200 ms; ambient motion is slow and quiet. Nothing frantic, no motion that
      delays content, no layout shift.

## Technical standards (must hold after v2)
- **Core Web Vitals on the production build:** LCP < 2.5 s (mobile, throttled), CLS < 0.05, no long tasks from decoration.
  JS added for visuals stays small; prefer CSS (no heavy animation libraries).
- **WCAG 2.2 AA:** contrast, focus visible, reduced motion, accessible names unchanged or improved.
- **No regressions:** `npx tsc --noEmit`, `npm test`, and the E2E suite (108 tests) stay green. E2E tests rely on roles,
  labels and German copy. Keep accessible names and visible texts unless the change is a real improvement, and then update
  the test in the same change.
- **Server Components** stay the default. Client components only where interaction needs them.

## Scoring
The independent QA agent adds a dimension **"Premium-Anmutung (High-End-Produkt)"** to its nine dimensions. **Every
dimension must be ≥ 8/10** at 390 px and 1440 px on all three experiences (customer, provider, admin).
