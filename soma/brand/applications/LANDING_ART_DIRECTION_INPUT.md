# Landing page: art-direction input (for the Landing Art Director, phase L1)

*Digital Art Director · phase B2 · 1 Nov 2026. This is input, not the spec: the spec is `docs/landing/LANDING_DESIGN_SPEC.md`.*
*Binding: `brand/BRAND_GUIDELINES.md` §§ 5, 7, 8 · `brand/photography/PHOTOGRAPHY.md` · `brand/applications/motion/MOTION.md` · `brand/COPY_DECK_LANDING.md` (copy and Ortszeilen per section).*

All images below are **AI development assets**, labelled. Paths are canonical (`/images/…`) and listed in `scripts/images/sources.json` with `focal`, `ratio`, `place`. Until the capture workflow has fetched them, the app serves the remote URL (`src/lib/images.ts`), and the designed fallback (wash + arch outline + word) must look intentional. Reviewed previews: `brand/photography/v2-previews/` and `brand/photography/v2-contact-sheet.jpg`.

---

## 1. Three key-visual directions

| | **A · „Blaue Stunde“ (recommended)** | **B · „Die Schwelle“** | **C · „Das Bogenpaar“** |
|---|---|---|---|
| Idea | The room is the hero: an Altbau at dusk, the Profi's palms on linen, the left half calm for *Your body. Your place.* | The arrival: an arched doorway, the kit just set down. The hero interaction opens the arch into the room. | Two places at once, Zuhause and Hotel, as the contrapposto pair; a place toggle swaps the right arch (Hotel ↔ Büro). |
| Images | `landing/hero-wide` (16:9) · `landing/hero-mobile` (9:16) | `landing/philosophy` (4:5) → `landing/hero-wide` | `landing/experience-privacy` + `editorial/hotel-v2` / `landing/experience-flexible` |
| Hero interaction | The arch rise (`MOTION.md` § 3.6 1) on load; the Ortszeile changes with the place toggle (Zuhause · Hotel · Büro, copy deck § 01). | Scroll-linked: the arch mask widens from the doorway to full bleed over the first 60 % of the viewport, then stops. With reduced motion: a static full-bleed image. | The pair arrives with a 90 ms stagger; the toggle crossfades the right arch (220 ms) and its Ortszeile. |
| Strength | Strongest single image; it explains the service at once (a massage, at home, in the evening). | Most ownable (the motif *is* the image); the best brand moment. | Shows the three places; the most "product". |
| Risk | Massage-led: the copy must name all categories (the H1 does). | The doorway alone does not explain the service: the H1 and the lead must carry it. | Two smaller images, less drama; mobile needs a stacked fallback. |

**Recommendation:** A for the hero, B as the philosophy chapter (02), C as the experience entry (05). That way each direction appears exactly once.

## 2. Image selection per section

| § | Section | Desktop | Mobile | Focal / crop | Ortszeile (copy deck) |
|---|---|---|---|---|---|
| 01 | Hero | `landing/hero-wide.jpg` 16:9, full bleed, type on the left 45 % | `landing/hero-mobile.jpg` 9:16; headline in the top third (calm window) | `62% 55%` / `50% 62%` | Altbau, 3. OG · Berlin-Prenzlauer Berg · 19:30 |
| 02 | Philosophy | `landing/philosophy.jpg` in a 4:5 arch, 5 columns, text on 6 | Same, full width, before the text | `50% 55%`; the real arched doorway sits *inside* the arch crop | Flur · Berlin-Schöneberg · 18:40 |
| 03 | Services | `categories/<slug>-v2.jpg` × 7 as 4:5 arches (a horizontal rail or an editorial grid) | Rail, 78 % card width | Per entry in `sources.json` | — (category name + tile line) |
| 04 | How it works | 01 Entdecken: live app screen (`brand/applications/showcase/live/c2-suche-390.png`) · 02 Buchen: `editorial/arrival-v2.jpg` · 03 Bleiben: `editorial/after-v2.jpg` | Stacked; one image per step | 3:2 → 4:5 arch on mobile (`58% 50%`, `35% 50%`) | Wohnungstür, 4. OG · Berlin-Prenzlauer Berg · 19:25 / Sofa, danach · Berlin-Prenzlauer Berg · 20:10 |
| 05 | Experience (6 themes) | Time `landing/experience-time` · Comfort `-comfort` · Privacy `-privacy` · Quality `-quality` · Choice `-choice` · Flexible `-flexible` | Vertical sequence; 4:5 arch per theme | Shot for these exact lines (see `place` in `sources.json`) | Exactly the six lines of copy deck § 05 |
| 06 | Professionals | Real provider data only. In demo mode: seeded portraits (O-oval) with the label „Demo-Profil · Foto KI-generiert“. Fallback without faces: `editorial/details-v2.jpg` (tools on linen) | Same | O-oval 332:362, eyes on the upper third | — |
| 07 | Digital experience | `brand/applications/showcase/app-on-table.png` as the direction; build it live: a real screen over `landing/app-table.jpg` (top-down oak, calm right half) | `landing/app-home.jpg` (a phone in hand, screen off: composite the live screen) | Screens straight, never tilted; no store badges | Küche · Berlin-Kreuzberg · 08:10 |
| 08 | For professionals | `editorial/provider-cta-v2.jpg` 16:9 night band, type on the dark left half | `landing/app-pro.jpg` 4:5 | `68% 50%` / `50% 50%` | Treppenhaus, 2. OG · Berlin-Neukölln · 17:40 |
| 09 | FAQ & trust | No photo, or `editorial/details-v2.jpg` small (1:1) beside the accordion | none | — | — |
| 10 | Final brand moment | Oxblood band, the S draws on (`MOTION.md` § 3.6 2), *Your body. Your place.* Optional quiet image: `og-default-v2.jpg` (the empty room, waiting) | Same, no image | — | — |
| — | OG / share | `og-default-v2.jpg` 1200×630, wordmark bottom-left on the calm floor | — | `60% 50%` | — |

## 3. Crop and layout rules

1. **The arch is the crop, not a decoration.** 4:5 by default; heads and hands below the springline (top ~20 %); never an arch under 120 px wide; never nested; the logo never inside the curve.
2. **The pair is the signature** (guidelines § 10.2): the right arch drops by 18 % of its width, and the Ortszeile sits under the left arch. Use it at most once per chapter, and keep it exactly as specified; it is the brand's most recognisable composition (audit 1, memorability).
3. **Full bleed only for 16:9 bands** (hero, 08) and the final Oxblood band.
4. **Type on images** only on the calm half named above, or on a flat 62 % Espresso scrim. No gradient scrims. Bone type on dark images, Espresso on light ones, never Oxblood on photographs.
5. **One serif statement per view**, one Oxblood moment per screen (the hero CTA *or* the final band, never both in one viewport).
6. **Ortszeile** under or inside the bottom-left of every key image: `type-place`, tabular figures, aligned to the image edge. The light in the picture matches the time in the line.
7. **AI label** on every section that uses these images: one quiet line per page in the footer („Bilder: KI-generierte Entwicklungsassets“) and the demo label on any portrait.
8. **Mobile:** image first, then text (grid § 5.2); arches stay 4:5; the hero uses the dedicated 9:16 file, never a centre-crop of the 16:9.
9. **Performance:** AVIF/WebP via `next/image`, `sizes` per slot. Only the hero has `priority`; every other image is lazy, with its wash as the placeholder (the arch rise starts on load).
10. **Motion:** the arch rise on viewport entry, once; no parallax; scroll-linked motion only for the B-direction doorway reveal and the chapter progress; reduced motion shows final frames.

## 4. Open points for the landing art director
- `landing/experience-choice` (L08): the Profi is barefoot. Retouch shoes in, or use `editorial/hotel-v2` for "choice" until the shoot.
- `landing/experience-flexible` (L09): a faint mark on the laptop lid. Crop at `focal 60% 45%` or retouch.
- `landing/app-home` (L10): the phone screen is plain black and ready for a live-screen composite. Match the perspective; the screen is nearly flat.
- Real photography for every P0 slot is listed in `PHOTOGRAPHY.md` § 12.2 (same compositions).
