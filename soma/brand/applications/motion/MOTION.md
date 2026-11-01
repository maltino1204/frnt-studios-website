# SOMA: Motion identity

*Digital Art Director · phase B2 · 1 Nov 2026 · v1.0. Linked from `brand/BRAND_GUIDELINES.md` § 8.*
*Specimen: `motion/specimen.html` (open in a browser; replay and a reduced-motion switch). Storyboards: `motion/storyboard-1..3.png` (frames captured from the specimen at 0–1200 ms).*

**The idea: arrival.** The Profi arrives, the customer stays. Every SOMA movement *arrives and comes to rest*: a short ease-out, no overshoot, no loop. Motion confirms that something happened; it never decorates, entertains or makes anyone wait.

---

## 1. Principles

| Principle | Means | Test |
|---|---|---|
| **Fluid** | One continuous ease-out per movement. Opacity and position move together, and nothing stops halfway. | No step or jerk at 0.25× playback speed. |
| **Controlled** | Short distances: 8–16 px, scale ≥ 0.98, at most 4 % of image scale. Each element moves once. | Nothing travels further than its own height. |
| **Subtle** | Motion sits in the background of the content. Only one thing moves at a time per region. | With motion off, nothing is missing. |
| **Responsive** | Feedback within 100 ms of input. Hover and press respond at once, and exits are faster than entrances. | Press feedback ≤ 100 ms; no animation queues up. |
| **Intuitive** | Things move where they come from: sheets from the bottom edge, toasts from the bottom, dialogs settle in place, back-navigation reverses. | Direction matches the spatial model. |
| **Premium** | Few tokens, used the same way everywhere; one signature (the arch) instead of many effects. | Every duration and easing comes from the table below. |

## 2. Tokens

They are in `brand/DESIGN_TOKENS/tokens.css` (`--transition-duration-*`, `--ease-*`, `--animate-*`). The one addition is proposed below.

| Duration | Value | Use |
|---|---|---|
| `instant` | **100 ms** | Press (scale 0.98), focus ring, checkbox fill |
| `fast` | **160 ms** | Hover, colour and fill changes, toast exit, price crossfade, page exit |
| `base` | **220 ms** | Fades, dialog/sheet exit, tab indicator, backdrop, content replacing a skeleton |
| `slow` | **320 ms** | Dialog entrance, page entrance, accordion |
| `arrive` | **480 ms** | Sheet and drawer entrance, toast entrance, wordmark settle |
| `calm` | **640 ms** | Arch rise, photo fade-in over its wash, outline draw |
| `reveal` *(proposed)* | **900 ms** | Only the photo settling inside the arch (scale 1.04 → 1). It is a brand-animation token, never used for UI. *Request to the Identity Designer: add `--transition-duration-reveal`.* |

| Easing | Curve | Use |
|---|---|---|
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | State changes on the spot (hover, colour, indicator) |
| `ease-arrive` | `cubic-bezier(0.16, 1, 0.3, 1)` | Things entering: sheets, dialogs, toasts, arch, wordmark |
| `ease-settle` | `cubic-bezier(0.22, 1, 0.36, 1)` | Things coming to rest in place: photo scale, check mark, pop (no overshoot) |
| `ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Things leaving (always shorter than their entrance) |
| `ease-calm` | `cubic-bezier(0.4, 0, 0.2, 1)` | Long linear-feeling fades: skeleton shimmer, photo over wash |
| `linear` | — | Only spinners and scroll-linked progress |

| Choreography | Value |
|---|---|
| Stagger between siblings | 60–90 ms (the Start-Code digits: 90 ms); at most 6 items, total ≤ 480 ms |
| Rise distance | 16 px (arch, images), 10 px (content, `soma-rise`), 8 px (dialogs, wordmark), 12 px (toasts) |
| Exit vs. entrance | Exit ≈ ½ of the entrance, `ease-exit`, opacity first |

## 3. Patterns

### 3.1 Page transitions
- **Route change:** the outgoing view fades out in 160 ms (`fast`, exit). The new view fades in and rises 10 px in 320 ms (`slow`, arrive). Use the View Transitions API where it is supported; elsewhere, show the new view at once.
- **Shared element:** a card's arch image becomes the profile-header arch (`view-transition-name: provider-<id>`) over 480 ms (`arrive`). Only the image moves; text crossfades.
- **Back navigation** reverses the direction. Scroll position is restored and never animated.
- **Never** slide whole pages sideways on the web, and never hold the new page behind an animation: the content is interactive from the first frame.

### 3.2 Overlays, sheets, dialogs
| | Entrance | Exit |
|---|---|---|
| Bottom sheet (mobile) | translateY 100 % → 0, 480 ms arrive | 220 ms exit; drag to dismiss follows the finger 1:1, then settles |
| Drawer (≥ md, 400 px) | translateX 100 % → 0, 480 ms arrive | 220 ms exit |
| Dialog | rise 8 px + fade, 320 ms arrive | fade 220 ms exit |
| Backdrop (48 % Espresso-deep) | fade 220 ms standard | fade 160 ms |
| Toast | rise 12 px + fade, 480 ms arrive | fade 160 ms exit; paused on hover/focus |
| Popover, menu (desktop) | fade + 4 px, 160 ms standard | 100 ms |

There is no spring, no scale-up from 0 and no blur ramp. Focus moves into the overlay as soon as it opens and does not wait for the animation to end.

### 3.3 Navigation
- **Tabs and segmented controls:** the 2 px Espresso indicator slides to the new tab in 220 ms (standard). The label weight changes instantly.
- **Bottom nav:** the active pill (Linen) fades in over 160 ms and the icon stroke changes 1.5 → 1.9 at once. Nothing bounces.
- **Header:** the hairline and the glass fill appear after 8 px of scroll (160 ms). The header never hides on scroll in the product; on the landing page it may hide on scroll-down after 400 px and returns on any scroll-up (220 ms).
- **Landing chapter navigation:** the progress indicator is scroll-linked and linear. Anchor jumps use native smooth scrolling (off when motion is reduced). Scroll is never hijacked or snapped.

### 3.4 Loading states
- **Skeleton:** Linen with a quiet shimmer, 1.8 s `calm`, in the final shapes (an arch for arch images, pills for text). It is the only allowed loop, because it is feedback.
- **Spinner:** 2 px, 0.9 s linear, only inside buttons and inline status („Freie Termine werden geladen …“). Show it only after 300 ms, so fast responses never flash; once shown, keep it at least 400 ms.
- **Content replacing a skeleton:** crossfade 220 ms. Photos fade in over their category wash in 640 ms (`calm`) and never pop.
- **Numbers never count up.** Prices, totals and the Start-Code appear as final values; a changed price crossfades in 160 ms.

### 3.5 Interactive elements
| Element | Motion |
|---|---|
| Button | Hover colour 160 ms; press scale 0.98 for 100 ms; loading swaps the icon for the spinner at the same width |
| Card | Hover (pointer only) lifts 2 px and changes `shadow-raised` → `shadow-float` in 220 ms (settle); press scale 0.99 |
| Chip, slot, date | Selection fill 160 ms + the check icon fades in 100 ms; never colour alone |
| Checkbox, radio | Fill 100 ms; the check draws (stroke-dashoffset) in 220 ms settle |
| Field | Focus border and glow 160 ms; error message rises 4 px + fades in 220 ms on blur or submit |
| Accordion (FAQ) | Height and opacity 320 ms standard; the chevron rotates 180° in 220 ms (the only rotation in the system) |
| Favourite (heart) | Fill 160 ms, no burst, no particles |

### 3.6 Brand animations (specimen 1–3)
1. **Arch rise (the signature).** The arch mask opens from the bottom up (`clip-path: inset(100% 0 0 0)` → `inset(0)`) while the frame rises 16 px, over 640 ms arrive. Inside it the photo settles from scale 1.04 to 1 over 900 ms. The Ortszeile follows, rising 8 px over 480 ms, starting 480 ms in. **Use it for:** hero and editorial images on marketing pages, the first card row of a list (stagger 90 ms, at most 6 cards), and the confirmation glyph. **Trigger:** the element enters the viewport (IntersectionObserver, 15 % visible), once; it never replays on scroll-up.
2. **The S draws on.** The arch outline draws (640 ms arrive). The S contour traces inside it from 320 ms, then the S fill fades in (220 ms) and the contour fades out. The total is 1.2 s. **Use it only for:** the PWA splash on a cold start, video end frames, and the social avatar intro. It is never a loading indicator and never loops. It is not a morph: the S is never built from or turned into other letters (`LOGO_USAGE.md` § 6).
3. **Wordmark lockup reveal.** The whole wordmark settles as one shape (opacity 0 → 1, 8 px, 480 ms arrive). A 40 px rule grows (320 ms, from 160 ms), and the tagline in Newsreader Italic follows from 320 ms. The wordmark is never animated letter by letter, never typed on and never scaled up from small.

**Confirmation moment** (booking confirmed, `ConfirmHaptic`): the arch-check glyph draws (outline 640 ms, check 320 ms), „Bestätigt.“ fades and rises 10 px, then the four Start-Code digits rise with a 90 ms stagger. The haptic `success` fires once, together with the check. With reduced motion, everything appears at once and the haptic stays.

## 4. Reduced motion (`prefers-reduced-motion: reduce`)
- Every transform animation becomes an **opacity fade of ≤ 160 ms, or nothing**. Brand animations show their final frame at once.
- **Kept, because they are feedback:** the skeleton shimmer (slowed to 3 s), the spinner (slower), focus rings, and colour changes on hover and selection.
- **Removed:** arch rise, image settle, staggers, page and shared-element transitions (instant swap), smooth scrolling, header hide, and the sheet slide (sheets fade).
- **Never information through motion alone:** every state change also changes text, an icon or colour plus a word.
- The global guard is in `tokens.css` (`animation-duration: 1ms`, `transition-duration: 1ms`). Components that use JS animation (Motion, GSAP) must read `matchMedia('(prefers-reduced-motion: reduce)')` and skip, not shorten.

## 5. Avoid
| Never | Because |
|---|---|
| Bounce, spring overshoot, elastic easing, wiggle | It reads as playful SaaS, not care. The tokens have no overshoot. |
| Parallax, meaning layers that scroll at different speeds | It is distracting and can make people motion-sick. Scroll-linked motion is allowed only for reveal progress and chapter progress. |
| 3D: rotateX/Y, perspective tilts, card flips, WebGL depth for decoration | The identity is flat and architectural. |
| Motion that delays interaction: intros, splash longer than 1.2 s, buttons that wait for an animation, scroll locks | Respect for time is the brand promise. |
| Ambient loops: floating, breathing, drifting gradients (the retired v2 aura), autoplaying background video behind text | There is no ambient motion, and nothing moves without a cause. |
| Counting numbers, ticking prices, confetti, particles, shimmer on text | Truth before effect; prices are facts. |
| Letter-by-letter type, typing effects, logo morphs | `LOGO_USAGE.md` § 6. |
| Rotating or bouncing the arch, putting the logo inside the arch | Guidelines § 5.1. |

## 6. Implementation notes
- **CSS first.** Use the `--animate-*` utilities in `tokens.css`. JavaScript only for viewport triggers and drag gestures. The landing page may use GSAP ScrollTrigger for scroll-linked progress (L3), with the same tokens.
- **Animate only `opacity`, `transform` and `clip-path`**; never `width`, `height`, `top` or `box-shadow` in loops. `will-change` only during the animation.
- **Performance budget:** no animation may drop below 60 fps on a mid-range Android device. Brand animations run once per page view.
- **Testing:** the E2E suite runs with `reducedMotion: "reduce"`. Visual snapshots take the final frame. The specimen is the reference for review.
