# SOMA iconography spec

*Identity Designer · v1.1. Board: `iconography-board.png`. Grid: `icon-grid.svg`. Custom set: `custom/*.svg`, `soma-icons.json`, `react/soma-icons.tsx`. Build: `node brand/tools/build-graphics.mjs icons`.*

## 1. Decision: Lucide, tuned

`lucide-react` (already in the app) stays the base set. At SOMA's settings it matches the identity:
- its round caps and joins echo the wordmark's soft terminals;
- its geometric construction matches the precise stems of M and A;
- a 1.5 px stroke at 24 px has about the same weight as Instrument Sans Regular at 15–16 px.

The `Icon` wrapper (`src/components/ui/icon.tsx`) already renders a 1.5 px **absolute** stroke, so no fork is needed. Custom icons exist only where Lucide has no metaphor free of cliché: the three places (Zuhause, Hotel, Büro) and the seven categories.

## 2. Grid and construction

| Rule | Value |
|---|---|
| Canvas | 24 × 24 px, `viewBox="0 0 24 24"` |
| Live area | 20 × 20 px (2 px padding). Only optical overshoots (round shapes, diagonals) may reach 1 px into the padding. |
| Keylines | circle Ø 20 · square 18 (r 2) · portrait 16 × 20 · landscape 20 × 16 |
| Stroke | **1.5 px absolute** at 16, 20 and 24 px. In the 24 grid that is 1.5 at 24 px, 1.8 at 20 px and 2.25 at 16 px. Never thinner, never filled. **Exception:** the rating star, which is filled in Espresso. |
| Caps and joins | round / round |
| Corners | 1.5–2 px outer radius on rectangles; sharp corners only where the object is sharp (a blade, an arrow tip) |
| Arcs | Doors and fingertips use the **SOMA arch** (a semicircle over straight flanks). It is the motif at icon scale. |
| Colour | `currentColor`. Espresso by default, `ink-muted` for secondary, Bone on dark. Never Oxblood, except inside the one primary button. |
| Optical alignment | Centre by visual mass, not by bounding box: triangles and play shapes move 0.5–1 px toward their open side, and tall objects sit 0.5 px high. |
| Pixel fit | Straight strokes sit on half-pixels (x.5 for odd stroke widths, x.0 for even) at 24 px, so 1.5 px lines render crisp at 1× and 2×. |

## 3. Sizes

| Size | Use | Stroke (absolute) |
|---|---|---|
| 16 px | inline in text (meta lines, chips, field feedback) | 1.5 |
| 20 px | buttons, list rows, inputs: the default | 1.5 |
| 24 px | navigation, empty-state headers, sheet headers | 1.5 (active nav item 1.9) |
| 32–48 px | marketing only, rare | 1.5 × size / 24 |

The icon box is square; the touch target is always ≥ 44 px around it.

## 4. Custom icons (`custom/`)

| Icon | Metaphor | Why not Lucide |
|---|---|---|
| `zuhause` | House with an arched door | Lucide `House` has a square door; the arch ties it to the motif |
| `hotel` | Facade with windows and an arched entrance | Lucide `Hotel` reads as a generic office building |
| `buero` | Briefcase | Lucide `Briefcase` is close; the custom one matches the arch set's proportions |
| `massage` | Treatment table with a head cushion | No Lucide equivalent; hands and lotus would be clichés |
| `manikuere` | Fingertip with a nail (an arch) | No equivalent; it avoids nail-polish bottles (salon cliché) |
| `pedikuere` | Foot in profile | Lucide `Footprints` reads as walking or fitness |
| `kosmetik` | Cream jar | Avoids droplets (banned) |
| `make-up` | Brush | Lucide `Brush` is a paint brush |
| `haare-styling` | Comb | Lucide `Scissors` alone reads as a cut and excludes styling |
| `brows-lashes` | Closed eye with lashes and a brow | A discreet, closed-eyed motif (strategy § 10.6) |

**Banned** (unchanged from v2, plus additions): `Sparkles`, `Leaf`, `Flower`, `Droplet(s)`, `Gem`, `Crown`, `Wand`, `Heart` as a wellness symbol, `Lotus`, any spa imagery, any Greek letter.

## 5. Use

- Icons support labels. They never replace a label for status ("Bestätigt" + `CircleCheck`), and only stand alone as `IconButton` with an accessible name.
- Feedback icons are fixed: success `CircleCheck`, warning `TriangleAlert`, danger `CircleAlert`, info `Info`.
- Lucide icons used in the app today and checked at SOMA settings on the board: `Search`, `Calendar`, `MapPin`, `Clock`, `ArrowRight`, `Check`, `X`, `Star`, `UserRound`, `CreditCard`, `Car`, `ShieldCheck`.

## 6. Production files (v1.1, for the product: Brand Audit 1, M2)

| File | Content |
|---|---|
| `custom/<name>.svg` | One SVG per icon. `width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`, absolute path data only, no `<title>`, no ids, `data-icon="soma-<name>"`. They drop into any SVG pipeline (SVGR, sprite, inline). |
| `soma-icons.json` | `{ name: { label, paths[] } }`, for generators or tests. |
| `react/soma-icons.tsx` | A ready React module (type-checks in this repo). Copy it to `src/components/brand/icons.tsx`. |

**Grid check (v1.1).** Every icon is recentred on the 24 grid: the bounding-box centre is within 0.25 of (12, 12), and the bottom-heavy table and jar sit 0.25 low on purpose. Every shape stays inside the live area 2–22, including the stroke (extremes 2.25 and 21.75).

**Component API** (mirrors `lucide-react`, so the icons also work inside the existing `<Icon icon={…} />` wrapper):

```tsx
import { SomaIcon, IconZuhause, IconHotel, IconBuero, SOMA_ICON_LABELS, type SomaIconName } from "@/components/brand/icons";

<IconZuhause size={20} />                         // decorative, next to a visible label
<SomaIcon name="hotel" size={16} />               // by name (e.g. from a place type)
<IconBuero size={24} title="Büro" />              // standalone: accessible name
<Icon icon={IconMassage} size={20} />             // inside the existing wrapper (falls back to rendering the component)
```

Props: `size` (default 20), `strokeWidth` (1.5), `absoluteStrokeWidth` (true), `title`, plus any SVG attribute (`className` …). The icons are `aria-hidden` unless a `title` is given.

**Mapping for the product** (replacing Lucide):
- places: `House` → `zuhause`, `Hotel` → `hotel`, `Building2` / `Briefcase` → `buero`;
- category slugs map 1:1: `massage`, `manikuere`, `pedikuere`, `kosmetik`, `make-up`, `haare-styling`, `brows-lashes`.

## 7. Licence

The base set is **Lucide** (`lucide-react`), © Lucide Icons and Contributors (Lucide began as a fork of Feather by Cole Bemis), released under the **ISC licence**. The licence permits use, modification and distribution, including commercial use, provided the copyright notice is kept, and the package ships it in `node_modules/lucide-react/LICENSE`. The SOMA custom icons are original drawings on Lucide's grid conventions; they contain no Lucide path data.
