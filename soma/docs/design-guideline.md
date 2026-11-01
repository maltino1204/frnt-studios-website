# SOMA design guideline (implementation notes)

**The source of truth for the visual identity is [`brand/BRAND_GUIDELINES.md`](../brand/BRAND_GUIDELINES.md)** (colour,
type, motif, iconography, component specs), with [`brand/LOGO_USAGE.md`](../brand/LOGO_USAGE.md), the tokens in
[`brand/DESIGN_TOKENS/`](../brand/DESIGN_TOKENS/README.md) (including the WCAG table in `contrast.md`) and the rendered
brand book at `/kit/marke` (demo mode). If this file and the brand documents disagree, the brand documents win.

This file keeps only the implementation notes for the app: where things live, the component APIs, the motion
utilities and haptics. Design v2 (ultramarine accent, aura gradients, glass cards, spring overshoot) is retired; do
not reintroduce it.

| File | Purpose |
|---|---|
| `src/styles/tokens.css` | A verbatim copy of `brand/DESIGN_TOKENS/tokens.css` (generated, v1.1: no aura, grain, ambient or spotlight utilities; `reveal` 900 ms). Never hand-edit; regenerate in `brand/tools/` and copy. |
| `src/app/globals.css` | App-level additions: scrollbars, reveal, segmented thumb, overlay exits, view transitions, reduced motion, night-scope soft status colours, `type-title-serif`. |
| `src/app/layout.tsx` | Fonts (`next/font/local`, files and OFL licences in `src/styles/fonts/`). |
| `src/components/brand/logo.tsx` | `Wordmark` (micro master by default, `master="display"` from 32 px cap height), `Mark` / `Symbol` (the S; `size="small"` is the favicon cut), `ProLockup` (wordmark + "Pro"), `AdminMark`. Inline SVG outlines from `brand/assets/logo/final/`, `currentColor`, accessible name "SOMA" (pass `title={null}` inside an already-labelled link). |
| `src/components/ui/motif.tsx` | `ToneFill` (category wash, arch outline, category word), `ArchLine` (standalone outline), `archPath()`. |
| `src/components/brand/arch-check.tsx` | `ArchCheck`: the arch-check glyph for confirmation moments (booking confirmed, request accepted, Profi approved). |
| `src/components/brand/icons.tsx` | A copy of `brand/assets/iconography/react/soma-icons.tsx` (generated): `SomaIcon`, `IconZuhause` … with Lucide-compatible props. Re-copy when the masters change. |
| `src/components/brand/brand-icon.tsx` | App helpers on top of it: `BrandIcon`, `CategoryIcon` (by category slug), `PlaceIcon` (home / hotel / office, `MapPin` otherwise). |
| `public/splash/` | iOS PWA startup images (copied from `brand/assets/splash/ios`), wired in `layout.tsx` (`appleWebApp.startupImage`). |
| `src/components/ui/ai-label.tsx` | `AiLabel`: the visible AI disclosure („Demo-Profil · Foto KI-generiert“, „Bild KI-generiert“) next to every registry photo (all registry images are AI development assets, `isAiImage()` in `src/lib/images.ts`). |
| `src/components/ui/number.tsx` | `FormattedNumber`: de-DE, tabular, final on the first frame. Numbers never count up. |
| `src/lib/tone.ts` | `toneKey()` / `toneStyle()`: deterministic category washes for slots, avatars and portraits. |
| `scripts/brand/build-og.cjs` | Builds `public/brand/og-default.jpg` from the tagline lockup and one photograph in the arch. |

## 1. Rules that are easy to get wrong in code

- **Oxblood (`accent`) is one moment per screen.** Only `Button variant="accent"` uses it: the one primary action
  (checkout "Zahlungspflichtig buchen", the profile's booking CTA, the hero search, auth submits, the Pro sign-up CTA).
  Everything else that used `text-accent` / `bg-accent*` in v2 is Espresso, a neutral selected state, or `focus`.
  Never put Oxblood on links, icons, nav, chips, slots, badges, counts, statuses, charts in `/admin`, or errors.
- **Links** are Espresso, underlined in `line-strong` (`decoration-line-strong`), and turn `link-hover` (Oxblood) only on
  hover. `Button variant="link"` does this.
- **Status is never colour alone.** `Status`, `Badge`, `Notice` always carry a word (and `Notice` an icon). Danger is
  vermilion (`danger`), never Oxblood. "In progress" (`tone="accent"` on `Status`) renders in slate (`info`).
- **Serif once per view.** Display type (`type-display-*`, `type-h1`, `type-h2`) and `type-title-serif` (cards, empty
  states, modal titles) are Newsreader; app forms, tables and controls are Instrument Sans. `<em>` inside a serif
  headline switches to Newsreader Italic automatically (tokens).
- **No gradients, glows, grain or ambient loops.** Elevation is the warm `shadow-raised` / `shadow-float` /
  `shadow-overlay`. Glass (`glass-strong`) only on the sticky header, sticky bars and the bottom nav.
- **The arch** crops editorial, hero, category, card and profile images (`Photo shape="arch"`, `Portrait shape="arch"`);
  the O-oval (`shape="oval"`) is for portraits in rows and cards. Below 120 px use a rounded tile. Put the Ortszeile
  (`type-place`) under key images, never on them.

## 2. Component APIs (`src/components/ui/*`)

The APIs are unchanged from v2 unless noted; props that only drove the retired visuals are accepted and ignored.

| Component | Notes |
|---|---|
| `Button`, `ButtonLink`, `IconButton` | Variants `accent` (Oxblood, one per screen), `primary` (Espresso), `secondary` (1 px control ring), `ghost`, `link`, `destructive` (vermilion). Sizes S 36 (44 hit area), M 48, L 52. Loading keeps the width and sets `aria-busy`. |
| `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioRow` | 48 px, Paper, `line-control` border; focus = focus border + 3 px glow; errors with `CircleAlert`, `aria-invalid`, `aria-describedby`. |
| `Chip`, `ChipLink`, `ChipRow`, `SegmentedControl`, `TabLinks` | Selected = Espresso fill with Bone label and a check icon (never Oxblood, never colour alone). |
| `DateStrip`, `TimeSlots` | Radiogroups with arrow keys. Today carries the small arch mark; the selected slot shows a check. |
| `Notice`, `Status`, `Badge`, `CountPill` | `Badge tone="accent"` and `CountPill accent` are neutral now (kept for API compatibility). |
| `EmptyState`, `EmptyArt` | 72 px arch outline in stone-deep, `type-title-serif` title. `seed` / `tone` are ignored. |
| `Photo`, `TonePanel` | `shape`: `rect` / `arch` / `oval`; `archAspect` when the parent sizes the box. The fallback is the category wash with the arch outline and the word; the photo fades in and settles from 1.04 to 1. |
| `Avatar`, `Portrait` | Newsreader initials on the person's wash; `Portrait shape` and `ratio="3/4"` are new. |
| `Surface`, `GlassPanel`, `Panel` | Solid Paper levels; `glass` on cards is ignored. |
| `StatTile` | A sparkline renders only with `sparkLabel` (the period, printed under it). `deltaTone="neutral"` for business fluctuations (Pro). |
| Retired | `AuraArt`, `AuraBackground`, `AuraLine`, `FloatingStage`, `FloatingCard`, `Parallax`, `Ambient`, `Spotlight`, `CountUp` and the `bg-aura`, `aura-border`, `grain`, `ambient`, `spotlight` utilities are removed. |
| `Modal`, `Sheet`, `useDialogMotion` | Keep them mounted and close with `open={false}` so the exit plays and focus returns to the trigger. `Modal` focuses the first (safe) action. |
| `ToastProvider`, `useToast()` | Espresso toast (`data-theme="night"`), 5 s (8 s with an action), paused on hover/focus. |
| `StatTile`, `Sparkline`, `Table`, `AreaChart` | Flat tints, no gradients. Charts: chart-1 (Oxblood) is the primary series on customer/pro screens; `/admin` charts use Espresso. |

## 3. Motion and haptics

Tokens (in `tokens.css`): durations `instant` 100, `fast` 160, `base` 220, `slow` 320, `arrive`/`spring` 480, `calm` 640 ms;
easings `standard`, `arrive`/`enter`, `settle`/`spring` (overshoot-free), `exit`. Motion means arrival: elements settle
and stop. There are no ambient loops.

- **Utilities:** `pressable` (scale 0.98 while held), `lift` (hover rises 2 px to `shadow-float`), `focus-ring`
  (2 px focus outline, 2 px offset, glow), `stagger-rise`, `animate-arch-in`, `cv-auto` (below-the-fold sections).
- **`Reveal`, `RouteTransition`, `ScrollRegion`, `MotionRoot`** (`@/components/ui/motion`): unchanged. Content on screen
  at mount is never hidden; under `navigator.webdriver` they render their final state.
- **Numbers** (money, ratings, counts) are final on the first frame (`FormattedNumber`); no cursor effects.
- **Text floor:** nothing below 12 px (bottom-nav labels, badges, counts and `code-ref` included).
- **`haptic()`** (`@/lib/haptic`): only on key confirmations after the action resolves (`success`, `warning`, `select`);
  never on taps. `toast.show(msg, { haptic: true })` does it for you.
- **Reduced motion:** every duration drops to 1 ms; the spinner keeps turning, slower.

## 4. Dev notes

- `globals.css` imports `tailwindcss`, then `../styles/tokens.css`. Use `text-wrap-style` (longhand) in custom CSS.
- `cn()` (`tailwind-merge`) knows the token scales, including `h1`, `h2`, `lead`, `button`, `control`, `ease-arrive`.
- After editing `globals.css` or `tokens.css` in dev, check the served CSS (`curl` the chunk and `grep`). If Turbopack
  keeps a stale transform, restart the dev server by PID (and, if needed, clear `.next/dev/cache`).
- Fonts on `/`: 2 preloaded files (Instrument Sans latin 57 KB, Newsreader Display roman 22 KB); the italic (23 KB) and
  the Instrument Sans latin-ext face (19 KB, same family, own `unicode-range`) load on demand; DM Mono only where used.
