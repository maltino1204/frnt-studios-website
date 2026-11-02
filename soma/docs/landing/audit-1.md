# SOMA landing page: independent quality audit 1

*Agent 6, Independent Quality Auditor · 1 Nov 2026 · production build on `http://localhost:3100` (`DEMO_MODE=true`, `/api/health` → `demoMode: true`).*
*Evidence: `docs/landing/audit-1/` (screenshots, contact sheets, raw measurement JSON in `data/`, the E2E log, and the audit scripts in `scripts/`). Every number below was measured on the running build. Nothing in `src/` was changed.*
*To re-run the scripts: `node docs/landing/audit-1/scripts/<name>.js`. They expect `axe-core` in `/tmp/audit-tools` (`npm i axe-core` there) and write temporary files to `/tmp/audit/out`.*

---

## 1. Executive summary

The landing page is a real, integrated product page. It is not a prototype. Ten chapters are server-rendered from live data. The hero search lands on `/suche` with every parameter preserved, and the page works with JavaScript disabled. The art direction is coherent and recognisably SOMA: Bone and Espresso surfaces, Newsreader Display with Instrument Sans, the arch in one geometry, Ortszeilen, one Oxblood moment per view, and a single italic used as a bookend. The strongest moments are the scroll-linked doorway in 02, the dusk-to-night stage in 05 and the Oxblood seal with the mark drawing on in 10. They are original, they come from the brand, and they do not borrow the reference's look.

The cross-check is clean: 66 of the 74 landing E2E tests passed, 8 were skipped by viewport design, and none failed. The console showed no errors at any of the 7 viewports. No viewport from 320 to 1440 px scrolls horizontally, and CLS is 0 at load.

**What blocks sign-off:** mobile performance. In a Lighthouse-like lab run (4× CPU, Slow 4G) I measured:
- LCP with a median of 2.36 s (2.33–2.64 s across 9 runs), which is on the line;
- **TBT with a median of 486 ms (429–803 ms)**, against a target of ≤ 200;
- **200–400 ms** to open the booking sheet or the chapter overlay (medians 256 and 312 ms), which is the INP for those interactions (target ≤ 200);
- about 225 KB gz of JS on first load, against a route budget of ≤ 90 KB.

From these I estimate a Lighthouse mobile score of **83–86**, against a target of ≥ 90. Desktop scores about 100.

Besides performance (I-1), there are three P1 defects:
1. the 08 band's „Konditionen ansehen“ button collides with the Ortszeile at 1024 × 768 (I-2);
2. the hero's place-adapted PLZ placeholder is truncated at every desktop width, so the example PLZ, which is the visible payoff of the hero interaction, never shows (I-3);
3. on phones there is a stretch of about 300 px, and on tall viewports the whole first view, with no booking control in sight (I-4).

The most visible P2 issue: with JavaScript off, the sticky header is transparent over the content, and the Profi portraits never appear (I-5, I-6).

**Verdict:** 10 of the 11 dimensions score ≥ 8. **Performance scores 7 and does not pass.** The page is not yet at the brief's threshold. The tasks in § 15 are concrete and verifiable.

## 2. Scores

| # | Dimension | Score | One-line basis |
|---|---|---|---|
| 1 | Overall visual experience | **8** | Coherent, editorial, premium at every width. Held back by the 1024 band collision, the half-empty 768 hero, the blank Oxblood band before the seal plays, and AI interim imagery. |
| 2 | Brand fidelity | **9** | Tokens, faces, arch geometry, Ortszeile, the signature pair (once), one italic, one Oxblood moment per view, lockup rules, du-voice and the copy deck verbatim. Minor: two image deviations, „·Berlin“ spacing. |
| 3 | Typography and composition | **8** | The scale follows the tokens. Tagline exactly 2 lines at every width, sill 72 px above the arch base at all desktop sizes. Collision at 1024; placeholder truncation; skip link cramped. |
| 4 | Interaction design | **8** | Place switch (tap, swipe, keyboard), index ↔ preview with focus parity, overlay, bar and sheet, tabs, FAQ; no queueing under rapid input. Undermined by the truncated hint and the mobile booking gap. |
| 5 | Animation quality | **8** | On-token, purposeful, no loops; every tier ends at rest. Seal idles blank until 60 % visible; doorway statement arrives before line 3; jank under 4× CPU in the full tier. |
| 6 | Mobile experience | **8** | Thumb dock, sheet with inline pickers, swipe, header hide, clean at 320 px. Booking gap, plus TBT and INP (see Performance). |
| 7 | User experience | **8** | Effortless chapter navigation; booking always one click away on desktop; skip links; deep links. Same gaps as above, plus the no-JS header overlap. |
| 8 | Conversion clarity | **8** | Every CTA resolves (39 internal links, 0 failures); params preserved; no-JS submit works; FAQ true to the product. Mobile first-view CTA gap and placeholder truncation. |
| 9 | Technical quality | **8** | 66/66 E2E passing, 0 console errors, valid JSON-LD that matches the FAQ, clean motion contract. No-JS header and portraits, skip-link CSS, 2 axe violations, 414 KB HTML. |
| 10 | Accessibility | **8** | Excellent keyboard parity, visible focus, dialogs trap and restore, correct landmarks and headings, `lang="en"`, reduced motion. Skip link 18 px tall; 2 axe violations; 40 px desktop header targets. |
| 11 | Performance | **7** | LCP ≈ 2.36 s (median of 9 mobile lab runs), CLS 0, desktop ≈ 100. **TBT median 486 ms (429–803), dialog-open INP 200–400 ms, JS 225 KB gz, estimated Lighthouse mobile 83–86 (≈ 75 in the noisiest run).** |

Target is ≥ 8 everywhere. **Performance is below target. The tasks for it are in § 15.1.**

---

## 3. Method and environment

- **Browser:** Playwright with Chromium at `/opt/pw-browsers/chromium` (headless, software rendering).
- **Viewports:**
  - 1440 × 900 and 1280 × 800;
  - 1024 × 768 (touch) and 768 × 1024 (touch, DPR 2);
  - 390 × 844, 360 × 740 and 320 × 640 (DPR 2, `isMobile`, touch).
  - Extra checks at 1180 × 820, 1280 × 720, 1366 × 768, 1920 × 1080, 390 × 664, 412 × 915 and 430 × 932.
- **Tiers:** Playwright sets `navigator.webdriver`, which forces the `none` tier, so I forced tiers with `?motion=full` (desktop) and `?motion=lite` (≤ 1024, touch), which is what real visitors get. For the "true reduced motion" run I used no override plus `reducedMotion: 'reduce'`. JS-disabled runs used `javaScriptEnabled: false`.
- **Walkthrough:** gradual scrolling (so observers fire), with a viewport screenshot every 0.9–1.0 viewport heights. Contact sheets are `audit-1/sheet-walk-*.jpg`.
- **Performance:** Lighthouse is not installed, so I replicated its mobile preset (details in § 11):
  - a Moto-G-like context (412 × 823, DPR 1.75, mobile UA);
  - CDP `Emulation.setCPUThrottlingRate(4)`;
  - CDP `Network.emulateNetworkConditions` set to DevTools "Slow 4G" (562.5 ms latency, 1,474.56 kbps down, 675 kbps up) and "Fast 4G" (165 ms, 9 Mbps, 1.5 Mbps);
  - cache disabled, a fresh browser per run, 3 runs.
- **Accessibility:** axe-core 4 was injected by CDP evaluate (it is not in `node_modules`, so I installed it in `/tmp/audit-tools`, outside the product). I also did a keyboard walkthrough, a landmark and heading dump, a target-size scan, and a pixel-sampled contrast measurement on the 08 photo band.
- **Constraints:**
  - A `next dev` server on :3000 (not mine; I did not stop it) used about 35 % CPU and 6 GB of RAM during the measurements. Lab numbers may be slightly pessimistic.
  - There is no WebKit and no real device, so iOS Safari toolbar behaviour, VoiceOver and real GPU compositing are **not verified**.
  - The canonical and `og:url` resolve to `http://localhost:3000`, which is this build's `APP_URL`, not a code defect.

---

## 4. Per-dimension evidence

### 4.1 Overall visual experience: 8
- The hero matches the spec mock at 1440, 1366, 1280 and 1024 (`hero-d1440.png`, `hero-d1280.png`, `hero-t1024.png`): tagline in 2 lines, German H1, lead, the sill overlapping the arch flank (D4), and the trust row on Bone.
- The page holds one direction from the hero to the footer. See `sheet-d1440-a.jpg` and `sheet-d1440-b.jpg`.
- Highlights:
  - the doorway mask (`sheet-doorway.jpg`);
  - the 05 dusk and pinned stage (`sheet-stage.jpg`);
  - the seal (`d1440-full-10-seal-500ms.png`, `d1440-full-10-seal-final.png`).
- What keeps it at 8:
  - At 1024 × 768 the 08 band's second CTA sits on top of the Ortszeile (`band-1024x768.png`; measured overlap `true`), and the headline breaks „Dein / Können.“ into 4 lines.
  - At 768 × 1024 the hero puts the text on the left half and leaves the right half empty above a large arch; the booking card is below the fold (`hero-t768.png`).
  - In the full tier, chapter 10 is a blank Oxblood field until 60 % of it is in view (`d1440-full-seal-idle-blank.png`).
  - On the night band, arches show their light category wash (Bone-like cream) on Espresso before the photos load (`t768-05-wash-before-load.png`).

### 4.2 Brand fidelity: 9
- **Faces:** only Newsreader Display and Instrument Sans; no DM Mono.
- **Italic:** the italic leaves in `<main>` are exactly „Your body.“ and „Your place.“ (hero plus the chapter 10 bookend, D10). `h1 em, h2 em` count is **0**. `lang="en"` appears on 5 elements (2 hero spans, 2 in 10, 1 in the overlay).
- **One serif headline per view:** I checked every chapter. 02 adds the permitted pull statement, and 05 shows one statement at a time.
- **Oxblood once per view:**
  - hero: the submit only;
  - 07: the product's own buttons;
  - 10: the band;
  - everything else is Espresso or Bone.
- **Arch:** the O-ratio radius is everywhere. The signature pair appears once (04, step 3: right arch about 52 px lower, Ortszeile under each arch). The logo is never inside an arch: the seal mask is square before the mark draws. The header wordmark steps back while the lockup is in view (`headerLogo: hidden`).
- **Copy:** the deck verbatim, du-voice, and „Freie Termine finden“, which replaces „Jetzt entdecken“ (rationale in deck § 01).
- **Deviations:**
  - `categories/kosmetik-v2.jpg` reads as a spa robe and headband (photography "Never: spa robes"; `img-check.jpg`);
  - `experience-choice.jpg` has the barefoot Profi (spec A6, known);
  - the interim hotel and office hero crops put heads near the curve (spec A2/A3, known);
  - the PLZ city hint renders „10115 ·Berlin“, against brand § 4.4 (middle dot with NBSP on both sides): `src/components/site/booking-entry.tsx:825`.

### 4.3 Typography and composition: 8
- **Measured hero geometry** (`?motion=none`):

| Viewport | Tagline lines | Tagline size | Sill bottom → arch base |
|---|---|---|---|
| 1440 × 900 | 2 | 104 px | 72 px |
| 1280 × 800 | 2 | 73.8 px (short-viewport rule) | 72 px |
| 1366 × 768 | 2 | — | 72 px |
| 1024 × 768 | 2 | — | 72 px |
| 390 × 844 | 2 | — | — (stacked) |

  At 1440 the arch is 628 px wide, as specified.
- **Wrapping:** German hyphenation works („Behand-lung“ at 390). Display headlines are balanced.
- **Defects:**
  - **The place-hint placeholder is truncated at every width ≥ 1024.** „PLZ des Hotels, z. B. 60306“ needs 198 px and the field has 122 px (1440, 1280) or 115 px (1024). „PLZ des Büros, z. B. 20095“ needs 193 px. See `d1440-full-01-place-hotel-250ms.png` and `d1280-placeholder-hotel.png`. Spec § 14.1 says "no segment value truncates".
  - **08 band at 1024:** text top 29 px into the band, last CTA bottom at 595 of 600 px, the Ortszeile at 544 overlapping the CTA. At 1180 × 820 the clearance is 3 px. At 1920 the headline reaches 44 % of the band, beyond the measured 43 % safe zone (its contrast still measured ≥ 4.17:1 worst-pixel for large text).
  - **Skip links** render as an 18 px-tall pill with no padding (`d1440-kbd-skiplink.png`).
  - **The hero Ortszeile** sits 1–17 px below the fold at every desktop size in demo mode (the 33 px ribbon pushes it). Without the ribbon it would fit.

### 4.4 Interaction design: 8
- **Place switch:**
  - radios with roving tabindex; Arrow, Home and End all work (`placeAfterRight: IM HOTEL`, `placeAfterEnd: IM BÜRO`);
  - a touch swipe changes the place (`placeAfterSwipe: IM HOTEL`, `m390-swipe-hotel.png`);
  - the Ortszeile and the PLZ example follow (Frankfurt 60306, Hamburg 20095);
  - six clicks 60 ms apart left at most 2 layers during the switch and 1 `current` layer at rest, with a consistent radio, caption and placeholder (no queueing).
- **03 index:** hover and focus swap the preview arch (focus parity); the hover fill and the arrow nudge work (`d1440-full-03-index-hover-kosmetik.png`).
- **Chapter index → overlay → jump:** focus moves into the dialog („Schließen“), `aria-current` marks the current chapter, a jump focuses the `h2` and sets the hash, and Esc returns focus to the trigger.
- **Header „Termin finden“:** with the hero out of view it opens the booking bar with the PLZ focused; Esc returns focus to the trigger (`d1440-booking-bar.png`).
- **Dock → sheet:** PLZ focused; Was? expands inline in the same sheet (one dialog open); submit → `/suche?plz=10115&kategorie=massage` (`sheet-m390-ui.jpg`).
- **07 tabs:** arrows, End and activation on focus. **FAQ:** Enter toggles and the chevron rotates.
- **Defects:**
  1. The truncated place hint (§ 4.3).
  2. **The mobile booking gap** (§ 6). At 390 × 844 no booking control (dock, hero submit or chapter CTA) is visible between scroll 0 and 300 px, and **at load on 390 × 844, 412 × 915 and 430 × 932 the dock is hidden** while the card is still below the fold. Cause: the dock hides as soon as the hero Ortszeile enters the viewport (`src/components/landing/motion/nav-observer.ts:155`). The spec rule (§ 5.6) is "visible until the hero booking card is ≥ 25 % in view".
  3. Without JS the „Menü“ button does nothing, and the dock is hidden.

### 4.5 Animation quality: 8
- **Tokens only:** 160, 220, 320, 480, 640 and 900 ms; the arrive, settle and exit easings. No loops, bounce or parallax. The E2E no-loop checks pass.
- **Full-tier scenes:**
  - hero wipe (bottom-up inset, 250 ms frame `d1440-full-01-place-hotel-250ms.png`);
  - doorway mask (scroll-linked);
  - sticky walkthrough with the pair rise;
  - dusk spacer, pinned 6-step stage, dawn;
  - band settle;
  - seal mask with the O-then-S draw-on and lockup reveal (`d1440-full-10-seal-500ms.png`).
- **Lite tier:** the same content as rises, with the pins off. **None:** the final frames (`sheet-walk-d1440-auto-reduce.jpg`).
- **Scroll smoothness** (rAF frame intervals during a wheel scroll of the whole page):

| Run | p50 | p95 | p99 | Frames > 50 ms | Long tasks | Scroll CLS |
|---|---|---|---|---|---|---|
| 1440 full, 1× CPU | 16.7 ms | 33.4 ms | — | 0 | 0 | 0.0056 |
| 1440 full, 4× CPU | — | 50 ms | 83 ms | 29 | — | — |
| 390 lite, 4× CPU | — | 33 ms | — | 7 | 0 | 0 |

- **Defects:**
  - The seal waits for 60 % visibility in the full tier (`src/components/landing/motion/scenes/seal.ts:46`). A reader who pauses at 40–59 % sees an empty Oxblood field (`d1440-full-seal-idle-blank.png`), and the header logo is already hidden at that point (`d1440-full-10-seal-approach.png`).
  - In 02 the closing statement is visible before line 3 („Kein Wartebereich.“) arrives (`d1440-full-02-doorway-70.png`). Only the three lines are gated (`src/components/landing/motion/scenes/doorway.ts:4`; markup `src/components/landing/chapters/02-idee.tsx:45-56`).
  - The full tier is chosen for any desktop with ≥ 4 GB device memory; at 4× CPU it drops frames.

### 4.6 Mobile experience: 8
- No horizontal overflow at 320, 360, 390 or 768 (`scrollWidth == clientWidth`).
- The tagline holds 2 lines at 320. The dock label truncates gracefully („03 Behandlu…“).
- The header hides on scroll-down and returns on scroll-up.
- Mobile targets are ≥ 44 px, except the skip links and three footer words (Berlin, Köln, AGB, 29–37 px wide × 44 px high).
- Sheet, inline pickers, swipe and overlay all work (`sheet-m390-ui.jpg`).
- Held back by:
  - the booking gap (§ 4.4);
  - TBT and INP (§ 11): the main mobile conversion tap, dock → sheet, takes **296–328 ms** at 4× CPU;
  - about **250–300 KB of RSC prefetches** while scrolling (§ 11.4).

### 4.7 User experience: 8
- Narrative pacing is clear (statement → immersion → hand-off, twice).
- Every chapter ends in a „Weiter: …“ foot.
- The header index shows the chapter and progress.
- Deep links prefill: E2E T21 passes.
- Defects: the mobile gap; the no-JS header overlap (§ 9); the 1024 collision.

### 4.8 Conversion clarity: 8
All flows were verified on the live build (§ 10). Held back by:
- the first-view CTA gap on tall phones;
- the hidden example PLZ on desktop;
- the two-row CTAs in the 08 band at ≤ 1280.

### 4.9 Technical quality: 8
- The E2E suites pass (`audit-1/data/e2e-landing.log`): **66 passed, 8 skipped (viewport-gated), 0 failed** in 4.6 min.
- Zero console errors or page errors across all walks.
- One `h1`; every `href="#…"` resolves to exactly one id (15 anchors); 39 internal links all return 200.
- **Issues:**
  - No-JS header stays transparent and sticky, so nav and content overlap and the header is invisible on Espresso (`nojs-d1440-header-overlap.png`, `nojs-d1440-header-portraits.png`). Cause: `src/app/(landing)/landing.css:106-121`; the glass only appears with `[data-scrolled]`, set by JS at `src/components/landing/nav/landing-header.tsx:40-43`.
  - No-JS portraits stay at `opacity: 0` because of `src/components/ui/avatar.tsx:105` (opacity flips only on `onLoad` via React state). The 06 cards and the 04 vignette show initials. Measured `noJsPortraitOpacity: ["0","0"]`.
  - Skip-link CSS: `focus:not-sr-only` resets the padding (`src/components/landing/nav/skip-links.tsx:6`).
  - Two axe violations (§ 12).
  - HTML is 414 KB raw (59 KB gz), of which 210 KB is the inline RSC payload. The DOM has 1,522 nodes (Lighthouse warns above 1,400).

### 4.10 Accessibility: 8
See § 12.

### 4.11 Performance: 7
See § 11.

---

## 5. Chapter walkthrough (desktop 1440/1280 full · tablet 1024/768 lite · mobile 390/360/320 lite)

Contact sheets:
- `sheet-d1440-a.jpg`, `sheet-d1440-b.jpg`;
- `sheet-walk-d1280-full.jpg`, `sheet-walk-t1024-lite.jpg`, `sheet-walk-t768-lite.jpg`;
- `sheet-walk-m390-lite.jpg`, `sheet-walk-m360-lite.jpg`, `sheet-walk-m320-lite.jpg`;
- no-JS: `sheet-d1440-nojs.jpg`, `sheet-m390-nojs.jpg`;
- reduced motion: `sheet-walk-d1440-auto-reduce.jpg`.

| Ch | Desktop | Tablet | Mobile |
|---|---|---|---|
| **01 Bei dir** | As specified. Place switch, wipe and settle. Sill pill over the arch flank; popovers flip upward (`d1440-was-popover.png`). **Place-hint truncation.** Ortszeile just below the fold (demo ribbon). | 1024: desktop grid, sill fits, trust row wraps. 768: stacked, right half of the first view empty, card below the fold; dock visible. | Tagline → H1 → arch → Ortszeile → lead → stacked card. Card at y ≈ 1042. **Dock hidden at load on tall phones.** |
| **02 Idee** | Scroll-linked doorway mask from the real doorway to the full arch; three lines triggered. The statement shows before line 3. | Arch rise, lines stacked. | Same, 350 px arch, good rhythm. |
| **03 Behandlungen** | Editorial index (7 rows, „ab x € zzgl. Anfahrt“) plus a sticky preview arch with category, 3 services and price. Hover and focus swap. | Rail of `CategoryTile` cards with peek. | Rail, 78 % cards, snap. |
| **04 Ablauf** | Pinned sticky stage. Vignettes built from real data (10115 Berlin, Mai T., 34,50 € inkl. Anfahrt, Mo. 12:00; „Kostenlos stornierbar bis So., 12:00 Uhr“ = slot − 24 h). Step 3 is the signature pair with the Start-Code card. „Vorschau · Demo-Daten“. The Start-Code card overhangs the content edge by about 15 px. | Step buttons plus snap row. | Same; buttons 44 px. |
| **05 Dein Ort** | Dusk spacer → pinned stage 01–06 → dawn. Counter, one statement at a time. Contrast 13.9 / 7.8:1. | Vertical essay, alternating arches. **Cream wash flashes on Espresso while images load.** | Same; essay reads well at 320. |
| **06 Profis** | 8 approved providers in O-ovals. Rating only with ≥ 3 reviews; „Sofort bestätigt“ only when instant. AI label on every card. Rail arrows. | Rail, 3–4 visible. | Rail, 64 % cards. No-JS: initials only. |
| **07 Deine Buchung** | Vertical tablist and a floating real screen with the region ring; „Live-App · Demo-Daten“. | Same layout, narrower. | Screen, then horizontal chips (snap), then the active line. |
| **08 Für Profis** | Full-bleed band, Bone text on the calm third (contrast below). Benefits row and data-bound commission and payment lines. | **1024: CTA overlaps the Ortszeile.** 768: arch plus Bone text, stacked CTAs. | Arch, then text, then stacked full-width CTAs. |
| **09 Fragen** | Sticky trust strip plus 9-item accordion, chevron 180°, Linen fill when open. | Same, stacked. | All 9 shown (no `mobileLimit`). |
| **10 SOMA** | Oxblood arch mask → mark draws on (O over the crown, then the S) → wordmark, rule, tagline, German line; Bone CTAs. **Blank until 60 % visible.** | Lite: hard edge plus the sequence. | Mark 72 px, CTAs full width; dock hides at the CTAs. |
| Footer | Shared `SiteFooter` plus „Bilder: KI-generierte Entwicklungsassets“ (outside any landmark, § 12). | — | Dock hidden over the footer; legal row never covered. |

---

## 6. Navigation and dock review

**Desktop header (≥ 1024):**
- micro wordmark; chapter index pill (index arch 16 × 20 drawing with progress, plus a CSS-switched label „NN Name“, accessible name „Kapitel 01 Bei dir“);
- links (≥ 1280) or „Menü“ (1024–1279); Anmelden (fades in after the session resolves); **Termin finden**;
- sticky, never hides; glass after 8 px; dark variant over 05, the 08 band and 10, verified by `data-header-theme` in the walk logs;
- the header targets are 40 px tall, which passes WCAG 2.2 AA (24 px) but misses the spec's own 44 px.

**Chapter overlay:**
- `<dialog>` with `showModal`, solid Bone, Kapitel (10 rows, sans, current marked with the 14 × 7 arch) and Seiten, Termin finden, Anmelden;
- 30 Tabs never left the dialog, except the browser-chrome stop that native modals give;
- Esc restores focus; on mobile, scrolling behind it is locked (0 px moved).

**Dock (< 1024):**
- a 56 px glass pill: the index arch with the chapter label on the left, primary „Termin finden“ (48 px) on the right;
- dark variant on the night band; hidden while a text field has focus, a dialog is open, the chapter 10 CTAs are in view, or the footer is in view.

**Gap:** the hero rule differs from the spec (§ 4.4). Measured at load:

| Viewport | Dock at load | Hero Ortszeile top | Booking card top |
|---|---|---|---|
| 390 × 664 | shown | 814 | 1042 |
| 360 × 740 | shown | 773 | 1043 |
| 430 × 740 | shown | 869 | 1097 |
| **390 × 844** | **hidden** | 814 | 1042 |
| **412 × 915** | **hidden** | 844 | 1072 |
| **430 × 932** | **hidden** | 869 | 1097 |

On every phone there is a stretch of about 300 px between the Ortszeile entering and the card reaching 25 % in which the dock is hidden and the card is not yet visible.

**Mobile header:** 60 px, wordmark plus „Menü“ (text button). There is no booking button there by design; the dock carries it.

---

## 7. Motion tiers review

| Check | Result |
|---|---|
| Detection | `none` under reduced motion or webdriver; `lite` for < 1024, coarse pointer or no hover; `full` otherwise. `?motion=` wins (`src/components/landing/motion/tier.ts:21-28`). The E2E "tiers" test passes. |
| Upgrade without shift | Pins are applied only to scenes below the fold. Load CLS 0; whole-page scroll CLS 0.0056 (desktop full; one chapter-foot shift in 04) and 0 (mobile lite). |
| Pins only in full | 04 and 05 are pinned only with `data-motion="full"`. 1024 touch → lite, no pins. |
| Every scene ends at rest | Yes. The hero swap leaves 1 `current` layer; the seal hands back to `done` after 2.3 s. |
| No queueing | Rapid place switching and rapid index sweeps settle on the last input. |
| Reduced motion (real, no override) | Tier `none`: final frames, static vertical essay, step buttons, no smooth scroll (`sheet-walk-d1440-auto-reduce.jpg`). With `?motion=full` plus reduced motion the override still pins. That is intended for QA (spec § 8.1). |
| Runtime cost | `lp-motion:init` 30 ms at 4× CPU. The motion runtime is not the TBT problem. |
| Loops | None (E2E). |

---

## 8. Reference-copying check (theoneagency.de captures, `research/reference/theoneagency/`; `audit-1/ref-sheet.jpg`)

**Not copied (verified visually):**
- colours: the reference is white with CMY and rainbow gradients; SOMA is Bone, Espresso and Oxblood;
- fonts: the reference uses Space Grotesk, Inter and JetBrains Mono; SOMA uses Newsreader and Instrument Sans;
- logo, chrome blob, particles, dot-matrix screens, starfield panels, bracketed numerals „[ 00 ]“, the "Punkte" counter;
- headlines and CTAs; media; and the persistent WebGL stage. SOMA's persistent element is the arch, derived from its own O.

**Principles adopted (allowed):**
- numbered chapters with a header HUD and an overlay;
- a header that inverts over dark scenes;
- a mobile pill dock with a progress glyph, the chapter name and a CTA;
- a "next chapter" foot;
- pinned scenes on desktop only;
- a reduced mobile tier.

**Close calls (low risk, flagged for the Lead):**
- the dock's anatomy matches the reference's dock almost one to one (left: progress glyph plus chapter name; right: solid CTA);
- the trigger and section label „Kapitel“ and the dock `aria-label="Schnellzugriff"` are the reference's exact labels;
- the chapter name **„Idee“** (02) is also the reference's chapter-00 name, which `REFERENCE_ANALYSIS.md` § 9 lists under "do not copy" (abstract chapter names).

These are generic German words, and the visual expression is SOMA's own. If the client wants extra distance, rename „Idee“ (for example „Haltung“) and the dock label.

---

## 9. Progressive enhancement (JS disabled)

| Check | Result |
|---|---|
| Every chapter readable | Yes (`sheet-d1440-nojs.jpg`, `sheet-m390-nojs.jpg`). |
| Hero form submits `plz` | `/suche?plz=10115` → H1 „Beauty & Wellness in 10115 Berlin“. |
| CTAs are working links | Yes (`#termin`, `/suche`, `/pro/registrieren`). |
| FAQ `<details>` | Work. |
| Header | **Defect:** transparent, so nav and content overlap and the wordmark disappears on the dark bands. |
| Portraits | **Defect:** never fade in; initials only. |
| Mobile booking | „Menü“ is inert; the dock is hidden. The hero form and the chapter CTA links still work. |

---

## 10. Conversion flows (live build)

| Flow | Result |
|---|---|
| Hero search with service, PLZ, date and time (desktop, JS) | 10115 → „· Berlin“; Was? → Massage → Entspannungsmassage; Wann? → Morgen + Abends → `/suche?plz=10115&kategorie=massage&leistung=entspannungsmassage&datum=2026-11-02&zeit=abends`, H1 „Entspannungsmassage (klassisch) in 10115 Berlin“ (`d1440-suche-result.png`). Also E2E T1, mobile and desktop. |
| No-JS submit | `/suche?plz=10115` (above). |
| Validation, unserved PLZ, waitlist | E2E T3, T4 pass. |
| Category links | 7 rows → `/behandlungen/{massage, manikuere, pedikuere, kosmetik, make-up, haare-styling, brows-lashes}`, all 200. „Alle Behandlungen“ → `/behandlungen`. Price chips equal the overview (E2E T19). |
| „Profi werden“ (08, 10, footer) | `/pro/registrieren`, 200, H1 „Werde Profi auf SOMA.“ (E2E T10). „Konditionen ansehen“ → `/fuer-profis#provision` (target exists). |
| Mobile dock → booking sheet | Opens „Termin finden“ with the PLZ focused; inline Was?; submit → `/suche?plz=10115&kategorie=massage`. The hero draft is shared (E2E T12). |
| Desktop persistent CTA | Hero in view → PLZ focus; scrolled → booking bar (E2E T13 and my keyboard run). |
| Final CTA (10) | `href="/suche"`, upgraded to `?plz=` when known (E2E T5 and T16). |
| Deep links | `/?plz=…&leistung=…&datum=…&zeit=…` prefill (E2E T21). |
| FAQ truth (`docs/STATUS.md`, `src/server`, `supabase/migrations`) | Cancellation tiers (15-min Bedenkzeit, free ≥ 24 h, 50 % ≥ 2 h, 100 % plus travel below 2 h, free on provider cancel); passwordless account at checkout; manual-capture payments ("reserviert … erst nach dem Termin belastet"); no service fee (data-bound); address revealed only while confirmed or in progress and for 24 h after completion (`0004_rls.sql:339`); expired documents auto-suspend (`booking-maintenance.ts:15`); reviews only after real bookings; 48 h dispute and payout hold. **All true.** |
| Data truth | No invented testimonials, counts or badges. Ratings only from ≥ 3 reviews; „Verifiziert“ only for approved providers; demo and AI labels on cards, the 04 stage, the 07 screen and the footer. Commission strip from terms, with the `/fuer-profis` default as fallback (`page.tsx:39`). |

---

## 11. Performance measurements

### 11.1 Mobile, Slow 4G, 4× CPU, cold (3 runs; `audit-1/data/perf-mobile-slow4g-masked.json`, webdriver masked so `content-visibility` behaves as for real users)

| Run | FCP | LCP (element) | CLS | TBT | Long tasks | Dialog open (overlay) |
|---|---|---|---|---|---|---|
| 1 | 2,244 ms | 2,356 ms (hero `<img>`) | 0 | 447 ms | 6 | 208 ms |
| 2 | 2,276 ms | 2,376 ms | 0 | 515 ms | 5 | 264 ms |
| 3 | 2,424 ms | **2,640 ms** | 0 | 473 ms | 5 | 232 ms |

Two more sets of 3 runs, without the mask:
- **Set A:** LCP 2,328 / 2,340 / 2,360 ms; TBT 523 / 429 / 486 ms; overlay 328 / 296 / 200 ms. This file was overwritten.
- **Set B** (a repeat at the end of the audit, `perf-mobile-slow4g.json`): LCP **2,544** / 2,344 / 2,476 ms; TBT **803** / 628 / 457 ms; overlay **400** / 240 / 256 ms.

**Across all 9 mobile runs:**
- LCP median 2.36 s (range 2.33–2.64 s; 2 of 9 runs > 2.5 s);
- TBT median 486 ms (range 429–803 ms);
- overlay-open median 256 ms (range 200–400 ms);
- CLS always 0.

The spread comes from background load on the shared container (the `next dev` server). The verdict does not depend on the noisier set: even the best runs miss the TBT target by more than 2×.

- **LCP element:** always the hero image (`hero-home-4x5.jpg`, 828 w AVIF, 29 KB). The FCP element is the German H1 line, so text is never hidden.
- **INP-like** (Event Timing, worst entry per interaction, 4× CPU):

| Interaction | Duration |
|---|---|
| Place switch | 72–184 ms |
| FAQ toggle | 40–64 ms |
| 04 step button | 72–80 ms |
| 07 tab | 112–128 ms |
| Was? (in the sheet) | 112–136 ms |
| **Chapter overlay open** | **200–400 ms** |
| **Dock → booking sheet** | **296–328 ms** |
| Escape | 120–208 ms |

- **Long-task attribution** (`scripts/lt.js`, `scripts/prof.js`): one 297 ms task at 3.26 s (framework evaluation), then 56–221 ms tasks from 3.9 to 4.9 s as the late chunks land and hydration runs. react-dom has 626 ms of self-time at 4× CPU. The motion runtime takes 30 ms and is not the cause.

### 11.2 Other profiles

| Profile | FCP | LCP | TBT | CLS |
|---|---|---|---|---|
| Mobile, Fast 4G, 4× CPU | 1,024–1,104 ms | 1,080–1,196 ms | 466–528 ms | 0 |
| Desktop 1350 × 940, Fast 4G | — | 656–700 ms | 0–16 ms | 0 |
| Desktop, no throttling | — | 256–304 ms | 0 | 0 |

On the desktop runs, interactions take ≤ 104 ms.

### 11.3 Transfer at first load (mobile, CDP `encodedDataLength`)

| Type | Requests | Size |
|---|---|---|
| Document | 1 | 59 KB gz (414 KB raw; 210 KB of it inline RSC) |
| CSS | 3 | 40 KB gz (one is the 186 KB-raw global sheet) |
| Fonts | 3 preloaded | 103 KB (Instrument Sans 57 KB, Newsreader roman 22 KB, italic 23 KB) |
| JS | — | **≈ 244 KB transferred** (225 KB gz in the HTML's module scripts; the 40 KB polyfill chunk is `noModule` and not fetched) |
| Images | 14 | 173 KB above and near the fold (hero 29 KB) |

- **Biggest JS chunks:** react-dom 72 KB, the Next runtime 45 KB, next/image 23 KB, BookingEntry 13 KB, nav and overlay 12 KB, tailwind-merge 10 KB, lucide 9 KB.
- **Full scroll:** images ≈ 0.37 MB on desktop and ≈ 0.64 MB on mobile, well inside the 2.4 / 1.5 MB budgets. Served AVIF sizes are modest (16–80 KB).

### 11.4 Prefetch overhead

Scrolling the page fires **54–65 RSC prefetches (≈ 250–300 KB)**. Next `<Link>` viewport prefetch hits every category, city, Profi, footer and legal route (`scripts/fetches.js`).

### 11.5 Estimated Lighthouse score

Computed with Lighthouse v10 log-normal scoring. Speed Index is approximated as ≈ FCP, because the hero paints whole.
- **Mobile 83–86** for the typical runs, and ≈ 75 for the noisiest (TBT 803 ms). TBT is the drag (score 0.56–0.65 in typical runs). With TBT ≈ 200 ms the estimate would be 93.
- **Desktop ≈ 100.**

### 11.6 Against the spec budget (§ 10)

| Budget | Result |
|---|---|
| LCP ≤ 2.5 s | Met in 7 of 9 runs (median 2.36 s) |
| CLS ≤ 0.05 | **0** |
| TBT ≤ 200 ms | **Missed** (429–803 ms; median 486) |
| INP ≤ 200 ms | **Missed** for dialog opens |
| Route JS ≤ 90 KB gz | **Missed** (≈ 225 KB total first load) |
| Lighthouse mobile ≥ 90 | **Missed** (estimated 83–86) |
| Desktop LCP ≤ 1.2 s | **Met** (≤ 0.7 s on Fast 4G) |

---

## 12. Accessibility findings

**axe-core 4** (WCAG 2.0/2.1/2.2 A and AA plus best practice; `data/a11y-d1440-full.json`, `a11y-m390-lite.json`):
- **2 violations at both widths:**
  - `aria-allowed-role` (minor): `role="tabpanel"` on a `<figure>`, `src/components/landing/digital/screen-tabs.tsx:88`;
  - `region` (moderate): the „Bilder: KI-generierte Entwicklungsassets“ note sits outside every landmark, `src/components/landing/nav/footer-note.tsx:8` (rendered after `<SiteFooter/>`).
- **Contrast "incomplete" (over images):** 12–14 entries, resolved by pixel sampling (`scripts/contrast.js`). On the 08 band, the worst pixel under the title is **3.98–4.17:1** (display-l is large text, AA needs 3:1), the lead is **≥ 7.7:1** and the Ortszeile **≥ 13:1** at 1024, 1280, 1440 and 1920. The 05 night band uses the token pairs 13.9 / 7.8:1.

**Keyboard** (`scripts/keyboard.js`):
- The focus order matches spec § 5.8: skip links → header → hero radios → link → PLZ → Standort → Was? → Wann? → submit → chapter feet → 03 rows → … → 07 tabs.
- Every stop has a visible 2 px ring (Oxblood, or Bone in dark scopes). The PLZ shows its ring on the segment (`focus-within`).
- Dialogs trap and restore focus. Chapter jumps focus the `h2`.
- **Skip links** work (the second focuses the PLZ), but render 139 × 18 px without padding (`skip-links.tsx:6`).

**Semantics:**
- landmarks: `header` with `nav "Hauptnavigation"`, `nav "Schnellzugriff"`, `main#inhalt`, ten `section[aria-labelledby]`, `footer` with `nav "Fußzeile"`, and the demo ribbon as `region`;
- headings: 1 `h1` (tagline plus German line, `lang="en"` on the tagline spans), one `h2` per chapter 02–10, `h3` for steps, Profi names, benefits and FAQ questions, with no skipped levels;
- live regions: the booking entry's polite status and the loading `role="status"`;
- all 36 images have an `alt` (decorative ones are empty).

**Targets:**
- mobile ≥ 44 px, except 3 short footer words (29–37 × 44 px) and the skip links;
- desktop header links and the index pill are **40 px** tall, and desktop footer links 32 px. AA (24 px) passes; the spec's 44 px does not.

**Reduced motion:** honoured (tier `none`, no smooth scroll, final frames).

**Not verified:** VoiceOver and NVDA output, and Windows forced colours.

---

## 13. SEO check

| Item | Result |
|---|---|
| `<title>` | „SOMA – Beauty & Wellness bei dir zu Hause, im Hotel und im Büro“ (deck § 0.3). |
| Description | Data-bound categories plus „kostenlos stornierbar bis 24 Std. vorher“. |
| Open Graph | Title „SOMA · Your body. Your place.“, description, `og:url`, `og:image` (absolute, 1200 × 630, alt, the 43 KB JPEG returns 200), `og:locale de_DE`, type `website`. |
| Twitter | `summary_large_image`, title, description, image and alt. |
| Canonical | Present (resolves to this build's `APP_URL`, `http://localhost:3000`; set the production origin at launch, which `check:launch` already guards). |
| Robots (demo) | `<meta name="robots" content="noindex, nofollow">`; `robots.txt` → `Disallow: /`; sitemap empty. **As expected in `DEMO_MODE`** (E2E T17). |
| JSON-LD | One `@graph`: Organization (slogan, logo, areaServed = 6 live cities, no `aggregateRating`), WebSite (no `SearchAction`, per INTEGRATION § 6.2), WebPage, and FAQPage with 9 items. **The FAQPage equals the visible accordion** in order, number and text (E2E T15; `data/faq-ld.json`). |
| Headings and semantics | § 12. Indexable copy is real HTML. Internal links are clean and canonical (no params). |
| Documentation drift | `INTEGRATION.md` § 6.3 says the `h1` is the German line only, with the tagline as a `<p>`. The build follows spec D2 (the `h1` contains both). Harmless, but the doc should be updated. |

---

## 14. Prioritised issues

| ID | Pri | Issue | Where | Evidence |
|---|---|---|---|---|
| I-1 | **P1** | Mobile main-thread cost: TBT median 486 ms (429–803); dialog opens 200–400 ms; JS ≈ 225 KB gz; estimated Lighthouse mobile 83–86 | `src/app/(landing)/layout.tsx:55-58` (overlay, bar and sheet mounted eagerly); client islands; framework hydration | § 11 |
| I-2 | **P1** | 08 band at 1024–1180: CTAs wrap to 2 rows and collide with the absolute Ortszeile (overlap at 1024, 3 px at 1180); text 29 px from the band top | `src/app/(landing)/landing.css:1090-1146` (`height: min(100svh,56.25vw)`; `min-height: 600px` at 1093; `.lp-band-place { position:absolute; bottom:40px }` at 1140-1143; CTA width at 1133-1135) | `band-1024x768.png` |
| I-3 | **P1** | Place-adapted PLZ placeholder truncated at ≥ 1024; the example PLZ is invisible | `src/components/site/booking-entry.tsx:796` (`lg:grid-cols-[1.2fr_1.1fr_1.25fr_auto]`); copy `src/components/landing/booking/hero-booking-entry.tsx:43-47` | `d1280-placeholder-hotel.png` |
| I-4 | **P1** | Mobile booking gap: dock hidden from the moment the hero Ortszeile enters; whole first view on 390 × 844, 412 × 915, 430 × 932 | `src/components/landing/motion/nav-observer.ts:139-161` (rule at 155) | § 6 table |
| I-5 | P2 | No-JS: transparent sticky header overlaps content and is invisible on dark bands | `src/app/(landing)/landing.css:106-121`; `landing-header.tsx:40-43` | `nojs-d1440-header-overlap.png` |
| I-6 | P2 | No-JS: portraits never appear (initials) | `src/components/ui/avatar.tsx:105` | `nojs-d1440-header-portraits.png` |
| I-7 | P2 | Skip links: padding reset, 18 px tall | `src/components/landing/nav/skip-links.tsx:6` | `d1440-kbd-skiplink.png` |
| I-8 | P2 | RSC viewport prefetch of 54–65 routes (≈ 250–300 KB) while scrolling | `src/components/site/site-footer.tsx:97`; `landing/profis/provider-card.tsx:18`; category rows and tiles (`landing/behandlungen/*`) | § 11.4 |
| I-9 | P2 | Seal blank until 60 % visible (full tier); header logo hidden earlier | `src/components/landing/motion/scenes/seal.ts:46`; nav-observer § 5 (30 % rule) | `d1440-full-seal-idle-blank.png` |
| I-10 | P2 | axe: `role="tabpanel"` on `<figure>`; footnote outside landmarks | `digital/screen-tabs.tsx:88`; `nav/footer-note.tsx:8` | `data/a11y-*.json` |
| I-11 | P3 | Light category washes as the load colour on the night band | `src/components/landing/dein-ort/sequence.tsx:17-58` (`tone`) | `t768-05-wash-before-load.png` |
| I-12 | P3 | 02: the closing statement is visible before line 3 arrives | `chapters/02-idee.tsx:45-56`; `motion/scenes/doorway.ts:4` | `d1440-full-02-doorway-70.png` |
| I-13 | P3 | 768 portrait hero: right half empty, card below the fold | `src/app/(landing)/landing.css` hero grid (768–1023) | `hero-t768.png` |
| I-14 | P3 | „10115 ·Berlin“ middle-dot spacing | `src/components/site/booking-entry.tsx:825` | `d1440-was-popover.png` |
| I-15 | P3 | Desktop header targets 40 px (spec 44); desktop footer links 32 px | `landing-header.tsx:63,67`; `site-footer.tsx` | § 12 |
| I-16 | P3 | Imagery: kosmetik-v2 spa-robe look; barefoot Profi (A6); interim hotel and office crops (A2/A3); every image is an AI development asset (A7, launch blocker per spec) | `public/images/...` | `img-check.jpg` |
| I-17 | P3 | Reference close calls: dock anatomy, „Kapitel“ / „Schnellzugriff“ labels, chapter name „Idee“ | `nav/chapters.ts:23`; `nav/landing-dock.tsx:18` | § 8 |
| I-18 | P3 | Doc drift: `INTEGRATION.md` § 6.3 vs spec D2 on the `h1` | docs | § 13 |

---

## 15. Improvement tasks

### 15.1 Performance (7 → ≥ 8): required

**PT-1 · Mount the dialogs on demand.**
- **Where:** `ChapterOverlay`, `BookingBar` and `BookingSheet` are mounted at load in `src/app/(landing)/layout.tsx:55-58`.
- **Change:**
  1. Load them with `next/dynamic` after idle or on the first intent (`pointerenter` or `focusin` on the index, the dock or „Termin finden“), so their React trees are not part of the first hydration.
  2. Keep each dialog's content rendered once it has been opened, so later opens only call `showModal()`.
- **Expected:** TBT ≤ 200 ms (median of 3); dock → sheet and overlay-open interactions ≤ 200 ms at 4× CPU.
- **Verify:** `MASK=1 node docs/landing/audit-1/scripts/perf.js mobile slow4g 3` (TBT, interactions) and `node …/scripts/inp2.js` (sheet open). E2E T12, T13 and the overlay test must still pass.

**PT-2 · Shrink the hydrated client tree.**
- **Where:** `src/components/landing/hero/hero-place-stage.tsx` and `src/components/landing/chapters/01-hero.tsx:33-51` (the provider wraps the whole hero grid).
- **Change:**
  1. Audit every `"use client"` under `src/components/landing/**` and keep static markup out of client components.
  2. Drop `tailwind-merge` from client-only paths where class strings are static (chunk `18rszs…`, 10 KB gz).
  3. Lazy-load the 06 rail and the 07 tabs when they come near the viewport.
- **Expected:** first-load JS ≤ 160 KB gz (framework plus route), react-dom self-time ≤ 300 ms at 4× CPU.
- **Verify:** `scripts/prof.js` (self-time by chunk) and `scripts/perf.js` (Script transfer).

**PT-3 · Stop viewport prefetching of secondary routes.**
- **Where:** `src/components/site/site-footer.tsx:97`, `src/components/landing/profis/provider-card.tsx:18`, and the category rows and tiles.
- **Change:** set `prefetch={false}`, or prefetch on hover or touch intent only. Keep `/suche` and `/pro/registrieren`.
- **Expected:** ≤ 10 `_rsc` requests during a full scroll on mobile.
- **Verify:** `node …/scripts/fetches.js` (prints the count).

**PT-4 · Cut bandwidth contention before FCP.**
- **Where:** the roman preload in the root layout, `src/app/layout.tsx:58-59` (`somaDisplay`); the italic preload in `src/app/(landing)/layout.tsx:22-27`.
- **Change:** preload only Instrument Sans and Newsreader Italic on `/` (the spec's preferred option in § 10.5), and let the roman load on discovery.
- **Expected:** FCP ≤ 1.9 s and LCP ≤ 2.3 s in every run (Slow 4G, 4× CPU).
- **Verify:** `scripts/perf.js`.

**Exit criterion:** median mobile LCP ≤ 2.5 s, TBT ≤ 200 ms, worst interaction ≤ 200 ms, CLS ≤ 0.05; estimated Lighthouse mobile ≥ 90 (formula in § 11.5). Re-run on a quiet machine, or with real Lighthouse in CI.

### 15.2 P1 defects (fix with PT-1…4; the dimensions they affect are at 8 now and drop if left)

**T-1 · 08 band.**
- **Where:** `src/app/(landing)/landing.css:1090-1146`.
- **Change:**
  1. Make `.lp-band-place` part of the flex flow (`margin-top: auto`) instead of `position: absolute`, or reserve its height with `padding-bottom`.
  2. Let `.lp-band-ctas` use the text block's width (≤ 41 vw), so the two buttons stay on one row from 1024.
  3. Raise `min-height` to fit the content (or use `height: auto` with `min-height: min(100svh, 56.25vw)`).
- **Expected:** no overlap and one CTA row at 1024 × 768, 1180 × 820 and 1280 × 720/800; text ≥ 48 px from the band top.
- **Verify:** `node …/scripts/band.js` must print `overlapCtaPlace:false`, `ctaRows:1` and `textTopInBand ≥ 48` for every size.

**T-2 · Place hint.**
- **Where:** `src/components/site/booking-entry.tsx:796` and `src/components/landing/booking/hero-booking-entry.tsx:43-47`.
- **Change:** in the sill variant, either widen the Wo? track (for example `1.45fr_1fr_1.15fr_auto`, or condense the placeholder), or shorten the copy to fit 115 px. If the copy is changed (for example „Hotel-PLZ, z. B. 60306“), it needs the Strategist's sign-off (spec § 13).
- **Expected:** all three placeholders fit at 1024, 1280 and 1440.
- **Verify:** `node …/scripts/placeholder.js` prints no `TRUNCATED`.

**T-3 · Mobile booking access.**
- **Where:** `src/components/landing/motion/nav-observer.ts:146-161`.
- **Change:** hide the dock only while the booking card itself is ≥ 25 % in view, as spec § 5.6 says. If the Ortszeile must stay uncovered, raise the dock or add bottom padding under the figure instead of hiding it.
- **Expected:** at every scroll position on 390 × 664, 390 × 844, 412 × 915 and 430 × 932, the dock or the hero submit is visible.
- **Verify:** `node …/scripts/mobile.js m390 lite` → `noBookingControlAt` lists only footer positions, and `node …/scripts/dockreal.js` → `dock: shown` everywhere. E2E T12a and the motion dock-rules test must be updated and pass.

### 15.3 P2 tasks (lift Technical quality, Accessibility, UX and Animation from 8 to 9)

| Task | Change | Verify |
|---|---|---|
| T-4 No-JS header | Make the glass state the default in `landing.css:106-121`; switch to transparent only under `html[data-motion] .lp-header:not([data-scrolled])`, or use a CSS `animation-timeline: scroll()` for the glass. | `node …/scripts/walk.js d1440 auto 1.0 nojs`: header opaque; no text collision in `02-y1800`. |
| T-5 No-JS portraits | Render the `<img>` at `opacity:1` in server HTML and only animate when JS adds a pending state; or add a `<noscript>` style. File: `src/components/ui/avatar.tsx:105` (shared kit: coordinate with the app owner). | `node …/scripts/conv.js` → `noJsPortraitOpacity: ["1","1"]`. |
| T-6 Skip links | Add `focus:px-4 focus:py-3` (or a `.skip-link` class) after `focus:not-sr-only` in `nav/skip-links.tsx:6`. | Focused link ≥ 44 px tall (`scripts/skip.js`). |
| T-7 axe | `screen-tabs.tsx:88`: use `<div role="tabpanel">` around the `<figure>`. `footer-note.tsx:8`: render it inside the `<footer>` landmark (for example through a `note` prop on `SiteFooter`). | `node …/scripts/a11y.js d1440 full` → 0 violations. |
| T-8 Seal | In `seal.ts:46` use 0.4 in the full tier too (start the draw while the mask completes), or show the static final frame until the trigger. Key the header-logo hide on the lockup itself, not on 30 % of the chapter. | `node …/scripts/scenes.js`: `10-seal-approach` never shows an empty Oxblood field ≥ 40 % of the viewport. |

### 15.4 What lifts each 8 to a 9

| Dimension | What it needs |
|---|---|
| Overall visual | T-1; the 768 hero (I-13: put the figure beside the head at 768–1023, or bring the booking card above the arch); a dark wash on the night band (I-11); real photography (A7) to replace the AI interim crops (I-16). |
| Typography and composition | T-1, T-2, T-6; keep the hero Ortszeile above the fold in demo mode (account for the 33 px ribbon in the hero min-height). |
| Interaction design | T-2, T-3; a no-JS fallback for „Menü“ (an `<a href="#kapitel">` to a static chapter list) and for the dock (render it as a plain `#termin` link when `data-dock` is absent). |
| Animation quality | T-8; gate the 02 closing statement with line 3 (I-12); a lite fallback for weak desktops (`hardwareConcurrency ≤ 4` → lite). |
| Mobile experience | T-3 plus PT-1…3 (sheet open ≤ 150 ms at 4×). |
| User experience | T-3, T-4, T-1. |
| Conversion clarity | T-2, T-3; one CTA row in the 08 band. |
| Technical quality | T-4, T-5, T-7; reduce the inline RSC payload and DOM (≤ 1,400 nodes). |
| Accessibility | T-6, T-7; 44 px header targets (I-15); a VoiceOver and NVDA pass on a real device. |
| Brand fidelity (9 → 10) | I-14 (NBSP middle dot); reshoot per A7. |

---

## 16. Verdict

**Not yet passing.** Ten of the eleven dimensions meet the ≥ 8 threshold on measured evidence. The experience is premium, original, brand-true and genuinely integrated with the marketplace.

**Performance scores 7.** The page meets its LCP (median) and CLS targets, but misses TBT (median 486 ms), INP for its two dialog opens (200–400 ms), the JS budget and the estimated Lighthouse mobile ≥ 90 target.

The four P1 issues (I-1 to I-4) should be fixed and re-tested with the scripts in `audit-1/scripts/` before the landing is signed off:
- the main-thread and dialog-open cost (I-1);
- the 1024 band collision (I-2);
- the truncated place hint (I-3);
- the mobile booking gap (I-4).

The I-1 work goes into a re-audit (audit 2); real Lighthouse or a real-device check is recommended if it can be arranged.

*After the audit I restored the demo data with `cd soma && DEMO_MODE=true npm run demo:refresh` (1 Nov 2026, 23:00; „Demo data ready … Fertig in 4 s“; demo appointment on Mon 2 Nov, 09:00). It was needed because the E2E suites create searches, waitlist entries and bookings.*

---

## 17. Performance remediation 2 (Performance Engineer)

*The engineer's own measurements, 2 Nov 2026. **This is not an audit score**; the dimension stays at 7 until a re-audit.*
*Setup: production build on `:3100` (`next start`), Lighthouse 12.8.2 (Chromium 136, mobile preset; `benchmarkIndex` 1,500–2,000, so 4× is calibrated), the auditor's `perf.js` (`MASK=1 … mobile slow4g 3`) and `inp2.js`. Nothing else heavy ran during a measurement, but the `next dev` server on `:3000` kept using ≈ 40 % of one core. Before = commit `d010cb2`; after = `ee88cdb` built with `npm run build` (incl. the new `postbuild`), no source maps.*

### 17.1 What changed

| Commit | Change | Measured effect (4× CPU) |
|---|---|---|
| `ae26925` | Chapters 02–10, the footer and the hero booking entry sit in `<Activity mode="visible">`: Fizz renders them inline (`<!--&-->`, never outlined like a Suspense boundary, so the page stays complete without JS), React hydrates each after the shell in a low-priority, time-sliced pass; a tap on an unhydrated part hydrates it first. The bar and sheet subscribe to the hero's catalogue (`useEntryData`). `whenChaptersHydrated` removed. `html[data-motion]` is written by a tiny inline script at the end of the landing markup (same detection as `tier.ts`), so the first style pass already has the tier. | Shell hydration split; the post-hydration restyle (70–110 ms task) is gone. |
| `d65f28b` | `fetchpriority="high"` on the hero LCP `<img>` and its preload. | LH insight passes; no measurable simulate change on its own. |
| `a909cc9` | Under `navigator.webdriver` the landing no longer switches `content-visibility` off; a full-page capture asks for it with `html[data-capture="full"]` (`scripts/screenshot.mjs`, and the desktop full-tier E2E that jumps across 06–09 by script). | Removes an automation-only ≈ 450–590 ms layout task that Lighthouse (webdriver) paid and visitors never do. |
| `7a945c0` | `scripts/landing/compile-hints.mjs` (npm `postbuild`) prepends `//# allFunctionsCalledOnLoad` to the 14 module scripts the prerendered `/` loads (V8 explicit compile hints, Chrome 136+; other engines ignore it). Same code and file names, source maps shifted, idempotent. | Main-thread lazy compile 950 → 56 ms (V8 trace, lite tier); boot task 360–580 → 125–230 ms. |
| `ee88cdb` | No forced layouts in taps or at start-up: the nav observer measures nothing behind a modal dialog; reveals find rails by `data-rail` instead of `getComputedStyle` (forced the style and layout of two `content-visibility` chapters, ≈ 140 ms); easing tokens read once; the 07 line uses a media query, not `offsetParent`; `BookingEntry` inline pickers (landing sheet only) open as a transition. | Overlay open 184–256 → 176–192 ms; Was? in the sheet 128–216 → 40–48 ms; 07 tab 104–176 → 120–136 ms. |

Tried and not kept: the tier script at the top of the landing markup (an inline script waits for the stylesheets and split the first render: partial first paint, then a 150–190 ms layout task inside the TBT window); the hero entry removed entirely, as an upper bound for a `BookingEntry` split (TBT −60–80 ms, simulate LCP only −0.05 s, so it was not pursued).

### 17.2 Exit criterion (audit-1 § 15.1), before → after

**Lighthouse, default simulated throttling** (score · LCP s · TBT ms; FCP 1.52 s, SI 1.52 s and CLS 0 in every run unless noted):

| Set | Runs | Median |
|---|---|---|
| Before (5) | 84 · 4.12 · 152 / 82 · 3.71 · 306 / 90 · 3.39 · 138 / 88 · 3.33 · 214 / 86 · 3.63 · 202 | **86** · 3.63 · 202 |
| After, set A (runs 2–6 after a restart; run 1 = 76) | 91 · 3.48 · 13 / 87 · 4.02 · 14 / 87 · 4.03 · 3 / 89 · 3.70 · 10 / 89 · 3.70 · 26 | **89** · 3.70 · 13 |
| After, set B (next 5 runs, same server) | 91 · 3.48 · 15 / 91 · 3.48 · 31 / 91 · 3.49 · 18 / 91 · 3.50 · 40 / 91 · 3.48 · 24 | **91** · 3.48 · 24 |

**Lighthouse, `--throttling-method=devtools`** (score · FCP · LCP · TBT · CLS):

| | Runs | Median |
|---|---|---|
| Before | 70 · 2.23 · 2.62 · 1,292 · 0.001 / 73 · 2.28 · 2.61 · 929 · 0.001 / 73 · 2.35 · 2.63 · 928 · 0.001 | 73 · LCP 2.62 s · **TBT 929 ms** |
| After (runs 2–4; run 1: 95 · TBT 60) | 95 · 2.40 · 2.40 · 55 · 0 / 94 · 2.42 · 2.42 · 84 · 0.001 / 92 · 2.46 · 2.46 · 179 · 0.001 | 94 · LCP 2.42 s · **TBT 84 ms** |

**`MASK=1 perf.js mobile slow4g 3`** (FCP · LCP · TBT · CLS · interactions place / FAQ / third tap / overlay open / Esc, ms):

| | Run 1 | Run 2 | Run 3 | Median |
|---|---|---|---|---|
| Before | 2,172 · 2,308 · 527¹ · 0 · 128/80/80/**256**/32 | 2,208 · 2,248 · 489 · 0 · 160/88/56/**208**/32 | 2,216 · 2,332 · 358 · 0 · 192/80/48/168/24 | LCP 2,308 · **TBT 489** · worst 256 |
| After | 2,116 · 2,288 · 82 · 0 · 104/88/40/176/24 | 2,204 · 2,316 · 64 · 0 · 80/64/72/**192**/40 | 2,132 · 2,300 · 101 · 0 · 88/72/48/184/24 | LCP 2,300 · **TBT 82** · worst 192 |

¹ overlapped by 20 s with one of my traces; kept, it does not change the median.

**`inp2.js`** (Buchen / dock „Termin finden“ / Was? / Esc / 07 tab, ms): before 120/48/128/80/120 and 80/56/**216**/88/104; after 56/40/48/64/120 and 48/40/40/96/**136**.

| Target | Before | After | |
|---|---|---|---|
| LH simulate median ≥ 90 | 86 | 89 (set A) / 91 (set B) | **borderline** (see 17.4) |
| TBT ≤ 200 ms, LH devtools median of 3 | 929 | 84 | met |
| TBT ≤ 200 ms, perf.js median of 3 | 489 | 82 | met |
| LCP ≤ 2.5 s (perf.js / LH devtools) | 2.31 / 2.62 s | 2.30 / 2.42 s | met |
| CLS ≤ 0.05 | 0–0.001 | 0–0.001 | met |
| Worst interaction ≤ 200 ms (perf.js + inp2) | 256 | 192 | met |

### 17.3 Weight and main thread

- **First-load JS (module scripts in the HTML, gz):** 222.4 KB → 222.6 KB (same 14 files, + 29 B each for the hint). The spec's 90 KB route / 160 KB first-load budgets are still missed: the gains come from when and where the JS runs, not from its size. HTML 57 → 58 KB gz (Activity markers, tier script).
- **Main thread, LH devtools (4×):** total 4.5–5.0 s → 2.5–2.9 s; Script Evaluation 1.73–2.11 → 0.99–1.17 s; Style & Layout 0.74–0.83 → 0.20–0.36 s; Other 1.38–1.50 → 0.83–0.95 s; bootup 1.77–2.15 → 1.01–1.17 s; long tasks ≥ 50 ms 8–11 → 3–5, the longest 432–598 → 200–307 ms.
- **No JS:** all ten chapters, the footer and the GET form render in order at 390 and 1440 (no outlined segments, `<div hidden id="S:…">` count 0).
- **Tests:** `tsc --noEmit` clean; `vitest run` 232/232; landing E2E on `:3100` 67 passed, 9 skipped (viewport-gated), 0 failed; `booking.spec.ts` + `audit3.spec.ts` 30/30 (they create bookings in the demo database).

### 17.4 Why the simulate gate is at the edge (measured)

Lantern's LCP graph keeps every script that finished downloading before the *observed* first paint; on localhost that is all 13 module scripts except the one whose evaluation starts the boot, and only when the boot starts after the paint. So the simulated LCP is the transfer of ≈ 400–475 KB on simulated Slow 4G: HTML 58, CSS 40, three preloaded fonts 103, the hero image 29, JS 150–222 KB. The 3.48 s runs exclude the React chunk (its boot started after the paint), the 3.70 / 4.02 s runs include more of it. About one run in six also hits a ≈ 1 s compositor stall in headless Chromium (frames dropped from 258 to 1,225 ms with every thread idle), which moves the observed paint and gives LCP 4.4 s; it shows in the baseline too (the Lead's runs 1–2, SI 3.0 s). TBT, the other lever, is now 0–40 ms simulated and cannot add more.

The bytes that are left are mostly not the landing's own:

| Lever | Saving (gz) | Owner |
|---|---|---|
| Do not preload Newsreader roman on `/` (spec § 10.5 "preferred") | 22 KB | root layout |
| Root `not-found.tsx` renders the client `SiteHeader`: its chunk loads on every route | 11 KB | root |
| Image registry (`scripts/images/sources.json`, 113 KB raw) reaches the client through `resolveImage`/`imageFocal` in shared UI (`Photo`, `Portrait`, `BookingEntry`) | 14 KB | shared |
| `tailwind-merge`, imported by root client components (`toast`, `motion`) | 9 KB | root / shared |
| `BookingEntry` split (light hero form, heavy entry on intent) | 11–25 KB | landing (risky: E2E T1–T22 contracts) |

Together ≈ 60–70 KB, ≈ 0.3 s of simulated LCP, ≈ 2–3 score points: enough to make ≥ 90 robust. They need the Lead's approval (root layout, shared components).

### 17.5 Lead cross-check (`/?motion=lite`, after the commits above)

*Measured by the Lead, not by me:* `?motion=lite` is the tier real phones get (headless Lighthouse gets `none` through the existing webdriver rule). Simulate 89 / 91 / 89 / 91 / 91, median **91**, TBT 10–60 ms; devtools 94 / 95 / 94, TBT 80–90 ms, LCP 2.3–2.4 s. Tier `none` versus `lite` does not distort the result.

### 17.6 Approved follow-ups (Lead decision, 2 Nov 2026): what was done, kept or dropped

| # | Lever | Result | Status |
|---|---|---|---|
| 1 | Newsreader roman not preloaded on `/` (`c341909`): the root declares it without a preload; every other top-level layout (auth, checkout, site, admin, fuer-profis, konto, pro, pro/registrieren, new pass-through layouts for kit and offline) renders in `<DisplayFontScope>`, a preloaded declaration of the same file that the display and accent stacks use. `11d47fe`: on `/` the loader fetches the roman with `document.fonts.load()` in the first idle period after `load`. | `/` loses 22 KB before its LCP. Other routes, mobile Slow 4G 4× and desktop: same preload, roman finished at the same times, CLS unchanged (`/suche`, `/behandlungen` 0; `/behandlungen/massage` 0.0271 before and after; `/anmelden` (also `/pro`, `/admin`), `/fuer-profis` 0; 404 0.0013 / 0.0028). | kept |
| 2 | Root `not-found.tsx` renders `StaticSiteHeader`, server markup with the same look (`f017194`). Below lg the menu is a native `<details>` that opens the same full-screen Bone layer. | The ≈ 11 KB gz `SiteHeader` chunk leaves every route's first load. The header markup is now part of every route's RSC payload, which is the price: `/` HTML 57.7 → 59.5 KB gz. Net: the good simulate runs went from LCP 3.48 to 3.41 s. 404 checked at 390 (closed and open menu) and 1440; links work. | kept |
| 3 | Image registry out of the browser | A build with the registry stubbed out (approximation, not shipped) gave simulate LCP 3.40–3.42 s against 3.41–3.43 s with it, so ≤ 0.02 s. The real change needs server-resolved props through `Avatar`/`Portrait`/`Photo`/`AiLabel`, `RebookRow`'s server action and the admin, pro and checkout client callers. | not done (no measurable gain) |
| 4 | tailwind-merge out of root/shared client components | Not reachable under the rule "keep `cn` where callers pass `className`". `Icon`, `Button`/`ButtonLink` and `IconButton` take caller classes and render in the landing's shell (header, dock), so the chunk and its config build stay in the first load whatever `toast`/`motion` use. Simulate TBT is already 0–30 ms, devtools 84–118 ms. | not done |
| 5 | `BookingEntry` split | Not triggered: the `/` simulate median is 91 (rule: only if < 91). The upper-bound experiment in § 17.1 (hero entry removed) moved simulate LCP by only 0.05 s. | not done |

**Final numbers** (build `11d47fe`, restarted; simulate run 1 discarded):

| Metric | Runs | Median |
|---|---|---|
| LH simulate `/` (score · LCP s) | 87 · 4.03 / 91 · 3.42 / 91 · 3.39 / 91 · 3.41 / 87 · 4.02 (TBT 9–19 ms) | **91** · 3.42 |
| LH simulate `/` (previous set, same code minus `11d47fe`) | 91 · 3.42 / 91 · 3.41 / 87 · 4.00 / 92 · 3.36 / 91 · 3.41 | 91 |
| LH simulate `/?motion=lite` | 87 · 4.00 / 87 · 4.00 / 89 · 3.71 / 87 · 4.01 / 88 · 3.85 (TBT 0–31 ms) | **87** · 4.00 |
| LH simulate `/?motion=lite` (previous set) | 87 · 4.07 / 87 · 4.02 / 87 · 4.00 / 91 · 3.41 / 91 · 3.41 | 87 |
| LH devtools `/` (runs 2–4; run 1: 95 · TBT 100) | 96 · TBT 84 / 95 · 118 / 95 · 103; LCP 2.24–2.27 s; CLS 0.001 | 95 · **TBT 103** · LCP 2.26 s |
| `perf.js` (FCP · LCP · TBT · overlay open) | 2,136 · 2,248 · 94 · 184 / 2,156 · 2,320 · 70 · **248** / 2,164 · 2,332 · 118 · **288** | LCP 2,320 · TBT 94 |
| `perf.js`, a second set right after | LCP 2,244 / 2,260 / 2,232 · TBT 64 / 88 / 76 · overlay 176 / 184 / 184 | LCP 2,244 · TBT 76 |
| `inp2.js` | 80 / 48 / 40 / 96 / 112 and 120 / 48 / 80 / 80 / 160 | worst 160 |

- **First-load JS (module scripts, gz):** 222.6 → **206.4 KB** in 13 files, and 222.4 KB at the start of this work. HTML 59.5 KB gz.
- **Main thread, LH devtools:** 2.55–2.92 s total; Style & Layout 0.34–0.39 s.
- **Tests on this code** (items 1–2 and `11d47fe`): `tsc --noEmit` clean; `vitest run` 232/232. The **full** E2E suite on `:3100` gave 192 passed, 10 skipped, 0 failed (run before `11d47fe`). The landing E2E after `11d47fe` gave 67 passed, 9 skipped, 0 failed.

**Where it stands.**
- **Simulate:** `/` holds a median of 91, but every set is bimodal, at LCP 3.4 s (score 91–92) or 4.0 s (score 87).
  - The 4.0 s runs are the ones where the React boot task starts before the observed first paint. Lantern then counts the React chunk's 71 KB and the boot CPU.
  - Which way it goes is a localhost race. Removing the roman preload made the other first-load requests finish earlier, so the boot now wins it more often on `?motion=lite`: 3–4 of 5 runs at ≈ 4.0 s, median 87, against the Lead's 91 before items 1–2.
  - I found no lever in the page that decides this race without delaying the JS for real visitors.
- **TBT:** met; devtools 103 ms, `perf.js` 76–94 ms.
- **LCP:** met; `perf.js` 2.24–2.32 s, devtools 2.26 s.
- **CLS:** met; 0–0.001.
- **Worst interaction:** at the line. The chapter overlay opens in 144–288 ms at 4× across the last four `perf.js` sets, median ≈ 185. One batch in the same period doubled even the place switch (72 → 168 ms), so part of the spread is the shared host.
  - An A/B with the roman preload restored gave overlay opens of 136–184 ms. That is inside the noise, and the overlay uses no roman.
