# SOMA landing page: independent quality audit 2

*Independent Landing Auditor · 2 Nov 2026 · production build on `http://localhost:3100` (`next start`, build `_FDZn5bLrEVFuJWtJeTi1`, 04:14 UTC, code = `11d47fe`; HEAD `ef84ceb` adds docs only), `DEMO_MODE=true`.*
*Evidence: `docs/landing/audit-2/` (screenshots, contact sheets, raw JSON in `data/`, the E2E log, and every probe script in `scripts/`). Every number below was measured on the running build during this audit. Nothing in `src/`, the tests, configs or other docs was changed.*
*Re-run: `node docs/landing/audit-2/scripts/<name>.js` from `soma/` (axe-core from `/tmp/audit-tools`, Lighthouse 12.8.2 from `/tmp/lh`). Audit 1's § 16–17 (the engineers' remediation notes) were treated as claims and re-measured.*

---

## 1. Summary and verdict

Since audit 1 the team fixed most of what was asked, and the fixes hold up when measured:
- **TBT is solved.** It dropped from a median of 486 ms to 124 ms (5 lab runs at Slow 4G and 4× CPU). Lighthouse with DevTools throttling measures 112 ms.
- **The band collision, the truncated place hint, the mobile booking gap, the no-JS header and portraits, the skip links, prefetching, the blank seal and both axe violations are fixed.** Every one was re-measured with audit 1's own scripts.
- **LCP stays inside the target** (perf.js median 2.30 s; DevTools Lighthouse 2.33 s), and CLS is 0.

The gate is still not met:
1. **Performance did not reach its own exit criterion.**
   - Default Lighthouse mobile has a **median of 89** for the tier real phones get (`?motion=lite`, 7 runs, range 86–91). It is also **89** for `/` as Lighthouse sees it (5 runs, 84–91). The target is ≥ 90. § 17's "`/` median 91" was not reproduced.
   - The main mobile conversion tap is still slow at 4× CPU. Dock „Termin finden“ opens the booking sheet **270–290 ms** after the tap (3 of 3 runs), and **450–520 ms** if the visitor taps in the first seconds. The target is ≤ 200.
   - § 17's 40–56 ms for that tap only appears when another control had focus just before. It is a property of the probe sequence, not of the tap (§ 11.4).
   - First-load JS is 207 KB gz against a budget of 90 KB (route) or 160 KB (first load).
2. **Three P1 defects found in this audit.** Each one breaks a primary path:
   - **N-1 · Chapter jumps miss on phones.** From the chapter overlay, 5 of 6 long jumps at 390 px land 780–1,960 px past the chapter heading, often in the wrong chapter („Fragen“ ends in the footer). The hero's secondary CTA „So funktioniert’s“ lands with the 04 heading 245 px above the screen. On desktop the jumps to 09 and 10 overshoot by 194 and 403 px. On phones this is a **regression**: the mobile `content-visibility` rules added for performance (`landing.css:79-97`) feed estimated heights into a smooth `scrollIntoView` (`nav/jump.ts:12`). The desktop part probably predates audit 1, because 06–09 were already `content-visibility: auto` then. With reduced motion, the same jumps land exactly. The E2E suite's own overlay test failed on it once in the full run (§ 4.9).
   - **N-2 · A dead primary CTA in 05.** In the desktop full tier, the Espresso „Freie Termine finden“ button on the pinned stage is covered by the active stage item (`landing.css:852-858, 897-906`). 19 of 19 hit tests landed on the `li`, and a real mouse click opens nothing. It works from the keyboard. It predates audit 1, which missed it.
   - **N-3 · A PLZ typed before hydration is wiped.** On a throttled phone the field paints at about 2.2 s, but the hero form hydrates only at **4.8–4.9 s**: it sits in its own `<Activity>` (`01-hero.tsx:51`) and hydrates after the shell. A visitor who types the PLZ in that window sees it erased, and the submit then does nothing (3 of 3 runs).

**Verdict: not passing. Six of the eleven dimensions score ≥ 8 (audit 1: ten).**
- Performance stays at **7**.
- Interaction design, mobile experience, UX and conversion clarity drop to **7**.

The drop is not a sign that the page got worse overall. It is mostly the result of testing paths audit 1 did not test (real clicks on every visible control, typing before hydration, where a jump lands). One of the three P1s is a regression caused by the performance work. All three are small, local fixes (§ 15).

## 2. Scores

| # | Dimension | A1 | **A2** | One-line basis |
|---|---|---|---|---|
| 1 | Overall visual experience | 8 | **8** | Coherent and premium at every width. Band and seal fixed. The 768 hero is still half-empty, the dock sits over the hero Ortszeile at load on tall phones, and all imagery is AI interim. |
| 2 | Brand fidelity | 9 | **9** | Tokens, faces, the one italic, one Oxblood moment per view, and the copy deck all hold. The logo is never inside the arch (seal verified frame by frame). Minor: the middle-dot spacing (I-14), now also in „Wo? · Im Hotel“. |
| 3 | Typography and composition | 8 | **8** | Placeholder, band and skip links fixed. Tagline 2 lines from 320 to 1920. Held back by the 768 hero, the desktop Ortszeile below the fold in demo mode, and the 4-line band headline at 1024. |
| 4 | Interaction design | 8 | **7** | Place switch, overlay, tabs, FAQ and the sheet work. But long chapter jumps miss their target on phones (N-1), the 05 stage CTA is dead to the mouse (N-2), and the sheet opens 270–290 ms after the tap. |
| 5 | Animation quality | 8 | **8** | Seal fixed (it plays at 42 % full / 31 % lite with the header logo). Tiers and reduced motion are correct. 02's statement still arrives before line 3. Full tier at 4× CPU: 40 frames > 50 ms. |
| 6 | Mobile experience | 8 | **7** | Booking access is always one tap away now. But the overlay's chapter jumps land in the wrong place, an early-typed PLZ is lost, and the booking sheet opens in 270–520 ms. |
| 7 | User experience | 8 | **7** | Same navigation and input-loss defects. A first-time visitor who uses the chapter index on a phone ends up somewhere else in 5 of 6 cases. |
| 8 | Conversion clarity | 8 | **7** | Every link resolves (37 routes, 200), parameters are preserved, and the hand-offs are clear. But a visible primary CTA in 05 does nothing on desktop (N-2), and an early PLZ entry is erased (N-3). |
| 9 | Technical quality | 8 | **8** | Landing E2E: 66 passed, **1 failed** (the overlay → Fragen jump landed in 10: N-1; it passes 11/11 alone), 9 skipped. 0 errors, 1 benign console warning. JSON-LD equals the FAQ. No-JS header and portraits fixed. 0 outlined segments. N-3 is a hydration defect. Borderline 8. |
| 10 | Accessibility | 8 | **8** | axe: 0 violations (1440 full, 390 lite). Skip links 44 px. Traps and focus return verified. Header targets still 40 px. After a missed jump, the focused `h2` is off-screen (N-1). |
| 11 | Performance | 7 | **7** | TBT met, LCP and CLS met, desktop 99–100. **Lighthouse mobile median 89 (gate 90), dock → sheet 270–290 ms (gate 200), JS 207 KB gz.** |

The target is ≥ 8 in every dimension. **Five dimensions are below 8. The tasks are in § 15.**

---

## 3. Method and environment

- **Browser:** Playwright with Chromium 153 (`/opt/pw-browsers/chromium`), headless, software compositing.
- **Viewports:** 1920 × 1080, 1440 × 900, 1280 × 800 and 1280 × 720; 1024 × 768 (touch); 768 × 1024 (touch, DPR 2); 430 × 932, 412 × 915, 390 × 844, 390 × 664, 360 × 740 and 320 × 640 (DPR 2, mobile, touch).
- **Which runs represent real visitors.** I checked this instead of assuming it:
  - Lighthouse's browser reports `navigator.webdriver = true`. A probe page loaded through Lighthouse printed `webdriver=true` (its final screenshot is `data/lighthouse-webdriver-probe.jpg`).
  - So Lighthouse, PageSpeed Insights and Playwright get the `none` tier on `/` (`motion/tier.ts:25`, the inline copy at `:36`). Every Lighthouse run on `/` loaded no motion runtime chunk, and every run on `?motion=lite` loaded it (`runtimeLoaded` in `data/lighthouse-runs.json`).
  - Real phones get `lite`: `(max-width: 1023px)` matches. Real desktops with a fine pointer and ≥ 4 GB get `full`.
  - **So the representative runs are `/?motion=lite` for mobile and `/?motion=full` for desktop.** `/` itself was measured too, for comparison with § 17.
  - The HTML is byte-identical with and without the query (same ETag, `x-nextjs-cache: HIT`), so the override changes only the tier.
- **Lighthouse 12.8.2**, mobile preset, sequential runs only:
  - default simulated throttling (the gate) and `--throttling-method=devtools`;
  - desktop preset;
  - `benchmarkIndex` 1,362–2,061.
- **Lab runs with applied throttling:**
  - `perf.js` (audit 1's script): Moto-G-like context, 4× CPU, Slow 4G, cold, webdriver masked.
  - `latency.js` (new) adds a **visible-response** measure next to the Event Timing duration: the time from the event to the first frame in which the requested UI is on screen.
- **Machine:** 4 shared cores. Measurements never ran in parallel with each other. The `next dev` server on :3000 stayed up, idle at about 0 % CPU during the Lighthouse batches.
- **Not verified:** WebKit and iOS Safari, real devices, VoiceOver and NVDA, real GPUs. The compile hints (§ 13) are a Chrome 136+ feature, so the main-thread gains measured here do not carry over to Safari visitors.

---

## 4. Per-dimension evidence

### 4.1 Overall visual experience: 8 (A1 8)

**Contact sheets:**
- `sheet-walk-d1440-full.jpg`, `sheet-walk-d1280-full.jpg`, `sheet-walk-d1024-full.jpg` (fine pointer), `sheet-walk-t1024-lite.jpg` (touch), `sheet-walk-t768-lite.jpg`;
- `sheet-walk-m430-lite.jpg`, `sheet-walk-m390-lite.jpg`, `sheet-walk-m320-lite.jpg`;
- `sheet-walk-d1440-auto-reduce.jpg`;
- no-JS: `sheet-walk-d1440-auto-nojs.jpg`, `sheet-walk-m390-auto-nojs.jpg`.

**Better than audit 1:**
- The 08 band at 1024 is clean (`band-1024x768.png`): one CTA row, the Ortszeile in the flow, text 96 px from the band top.
- Chapter 10 never sits empty in view (`sheet-seal-approach.jpg`).

**What keeps it at 8:**
- **768 × 1024** (`hero-t768.png`): the right half of the first view is still empty above a large arch, and the booking card is at y = 1,275 (I-13).
- **Tall phones** (`hero-m390.png`, `hero-m412.png`): the dock now sits over the hero Ortszeile and the first line of the lead at load. This is the side effect of the I-4 fix (N-7).
- **Imagery:** every image is still an AI development asset (I-16). The kosmetik robe and barefoot crops are unchanged.
- **I-11** (light washes on the night band before the photos load) is unchanged in `dein-ort/sequence.tsx:17-58`.

### 4.2 Brand fidelity: 9 (A1 9)

- **Italic and headings:** the italic leaves in `<main>` are exactly „Your body.“ and „Your place.“, and `h1 em, h2 em` count is 0 (`data/a11y-*.json`).
- **Faces:** only Instrument Sans and Newsreader.
- **Oxblood:** one moment per view, unchanged.
- **The seal under the new 40 % mask range** (`d1440-full-seal-live-10.png`, `-25.png`, `-40.png`): at 25 % the Oxblood arch rises with no mark in it; the mark only draws once the mask is square. Spec § 4.10 and brand § 5.1 ("never put the logo inside the curve") hold.
  - (An earlier probe of mine showed the mark inside the arch. That came from stale page geometry and is withdrawn; `scripts/sealtrig.js` measures on live geometry.)
- **Copy:** du-voice and the copy deck are verbatim.
  - The place hint is new microcopy: placeholder „PLZ, z. B. {PLZ}“, the visible caption „Wo? · Im Hotel“ and the screen-reader label „Postleitzahl des Hotels“. The code marks it ✎ "needs the Strategist's sign-off" (`booking/hero-booking-entry.tsx`). I found no sign-off in `brand/` or `docs/`.
- **Middle dots:** they are still set without no-break spaces. „10115 ·Berlin“ comes from `site/booking-entry.tsx:836`, and the new „Wo? · Im Hotel“ (`:810`) uses plain spaces, so the dot sits tight (`d1440-hero-filled.png`, `d1280-placeholder-hotel.png`). This is brand § 4.4 (I-14).

### 4.3 Typography and composition: 8 (A1 8)

**Measured hero geometry** (`data/firstview.json`):

| Viewport | Tagline lines | Tagline size | Placeholder (needed / available) |
|---|---|---|---|
| 1920 | 2 | 104 px | 105 / 122 px |
| 1440 | 2 | 104 px | 105 / 122 px |
| 1280 × 800 / 720 | 2 | 73.8 px | 105 / 122 px |
| 1024 | 2 | 63.8 px | 88 / 115 px (condensed) |
| 768 | 2 | 66.7 px | 106 / 451 px |
| 430, 412, 390, 360, 320 | 2 | 44–47.9 px | 106 / 208–318 px |

- **Placeholder:** `placeholder.js` shows the hotel and office hints (117 px) fitting 122 px at 1280 and 1440, and 98 px fitting 115 px at 1024 (`font-stretch` 86 %). No truncation (I-3 fixed).
- **08 band** (`band.js`): `overlapCtaPlace: false` and `ctaRows: 1` at 1024 × 768, 1180, 1280 × 720 and 800, 1366, 1440 and 1920. Text starts 96–295 px from the band top (I-2 fixed). At 1024 the headline still sets „Dein / Können.“ in 4 lines.
- **Skip link:** 179 × 44 px (`d1440-kbd-skiplink.png`; I-7 fixed).
- **What keeps it at 8:**
  - the 768 hero (above);
  - the hero Ortszeile below the fold at 1280–1440 in demo mode (`captionInView: false`);
  - the Was? value truncating once a long service is picked („Entspannungsmas…“, `d1440-hero-filled.png`).

### 4.4 Interaction design: 7 (A1 8)

**What works (verified):**
- **Place switch:** radios, arrows and End (`placeAfterRight: IM HOTEL`, `placeAfterEnd: IM BÜRO`), and swipe (`placeAfterSwipe: IM HOTEL` at 390 and 412).
- **Overlay:** focus moves to „Schließen“, `aria-current` is set, 0 focus escapes in 25 Tabs (`trap.js`), Esc returns focus, and the page behind does not scroll (0 px).
- **Desktop header „Termin finden“:** opens the booking bar with the PLZ focused; Esc returns to the trigger (`d1440-booking-bar.png`).
- **Sheet:** PLZ focused, inline Was?, one dialog open, submit → `/suche?plz=10115&kategorie=massage`.
- **07 tabs and FAQ:** keyboard-correct.
- **Rail arrows** are disabled at the edges.
- **Rapid input:** 6 place clicks 60 ms apart settle on the last input with 1 `current` layer and a consistent caption and placeholder (`rapid.js`).

**Why 7:**
1. **N-1, chapter jumps miss** (`scripts/jump.js`, `data/jump.json`, `sheet-jump-miss-m390.jpg`). The overlay is the page's chapter navigation, a "defining part of the experience" in the brief. Fresh page, jump from the top, heading position 4 s after the tap:

| From the overlay → | 390 × 844 (lite): h2 top after 4 s | Chapter shown afterwards | 1440 × 900 (full) |
|---|---|---|---|
| 03 Behandlungen | 239 px ✓ | 03 | 310 ✓ |
| 05 Dein Ort | **−784** | 05 (mid-chapter) | 599 ✓ |
| 06 Profis | **−1,053** | **07** | 310 ✓ |
| 07 Deine Buchung | **−1,483** | **08** | 136 ✓ |
| 09 Fragen | **−1,957** | **10 / footer** | **−194** (10) |
| 10 SOMA | **−1,129** | footer | **−403** |

   Other jumps (`jump2.js`):
   - the hero „So funktioniert’s“ at 390 lands with the 04 `h2` at **−245 px**;
   - the 02 foot „Weiter: Behandlungen“ (a short jump) lands correctly at 239 px;
   - with **reduced motion** (instant scroll), overlay → Fragen lands correctly at 238 px (390) and 311 px (1440).
   - So the cause is the smooth scroll toward a target whose position changes during the scroll (§ 9, N-1).
2. **N-2, the dead stage CTA** (`scripts/stagecta.js`, `scripts/hittest.js`, `data/stage-cta-d1440.json`).
   - In the 05 pinned stage (1440, full), `a[data-cta="ch05-stage-termin"]` is visible at opacity 1 at all six steps.
   - `elementFromPoint` at its centre returns `li.lp-essay-item` (19 of 19 samples at 1440; 17 of 17 at 1024 × 768 fine pointer, `data/hittest-d1024-full.json`), and a real mouse click there opens nothing (`no dialog`).
   - The occlusion scan (`hittest.js`) found no other covered control at 1440, 1024 or 390. It only flagged disabled rail arrows (`pointer-events: none` by design).
3. **Sheet open latency** (§ 11.4): 270–290 ms to the first visible frame after the surfaces have mounted.
4. **Was? in the sheet** now expands as a React transition (`booking-entry.tsx:715-721`). The tap paints at once, but the list and `aria-expanded` arrive **156–276 ms** later, with no pending state in between (N-12).

### 4.5 Animation quality: 8 (A1 8)

- **Seal (I-9 fixed)** (`scripts/sealtrig.js`, live geometry):
  - full tier: idle until the band is 42 % in view, then the mark draws while the mask is square, and the header logo hides at the same moment;
  - lite: plays at 31 %;
  - `sheet-seal-approach.jpg`.
- **Tiers:**
  - `none` under webdriver and reduced motion;
  - `?motion=` overrides it;
  - pins only in full;
  - reduced motion shows final frames (`sheet-walk-d1440-auto-reduce.jpg`);
  - E2E tiers and the no-loop test pass.
- **Scroll smoothness** (`scrollperf.js`):

| Run | p50 | p95 | p99 | Frames > 50 ms | Long tasks | Scroll CLS | A1 |
|---|---|---|---|---|---|---|---|
| 1440 full, 1× | 16.7 | 33.4 | 50.0 | 2 | 0 | 0.0056 | p95 33.4, 0 > 50 ms, CLS 0.0056 |
| 1440 full, 4× | 16.7 | **66.6** | **100.0** | **40** | 19 (max 97 ms) | 0.0093 | p95 50, p99 83, 29 > 50 ms |
| 390 lite, 4× | 16.7 | 33.3 | 33.4 | 4 | 5 (max 79 ms) | 0 | 7 > 50 ms |
| 390 lite, 1× | 16.7 | 16.7 | 16.8 | 0 | 0 | 0 | — |

  The full tier at 4× is somewhat worse than in audit 1. The 04 chapter-foot shift (0.0056) is unchanged.
- **Still open:**
  - **I-12:** the 02 closing statement is at opacity 1 in view while „Kein Wartebereich.“ is at opacity 0 (`data/seal-doorway-d1440-full.json`, f = 1.2).
  - There is still no lite fallback for weak desktops (`hardwareConcurrency`).

### 4.6 Mobile experience: 7 (A1 8)

**Fixed:**
- **I-4, the booking gap** (`dockreal.js`): `dock: shown` at load on 390 × 664, 390 × 844, 430 × 740, 430 × 932, 412 × 915 and 360 × 740.
- `mobile.js` at 390 and 412: `noBookingControlAt: []`.
- The header hides and returns; no horizontal overflow at 320–768 (`overflowX: false` on every walk).
- The footer legal row sits clear above the dock (`m390-footer.png`).

**Why 7:**
- **N-1:** at 390 the chapter index sends the reader to the wrong place for 5 of 6 targets.
- **N-3:** an early-typed PLZ is erased.
- **N-4:** dock → sheet takes 270–290 ms (settled) and 450–520 ms (early tap).
- **N-7:** the dock covers the hero Ortszeile at load.

### 4.7 User experience: 7 (A1 8)

- **Better than audit 1:** pacing and chapter feet are unchanged and good. Booking is always reachable. The no-JS header is fixed. Deep links prefill (`conv2.js`).
- **Why 7:**
  - a phone visitor who opens „Kapitel“ and picks Profis lands in „Deine Buchung“ (N-1);
  - a visitor who types the PLZ in the first seconds loses it (N-3);
  - on desktop, the most prominent button on the 05 stage does nothing on click (N-2).

### 4.8 Conversion clarity: 7 (A1 8)

**Hand-offs verified on the live build** (`conv.js`, `conv2.js`, `mobile.js`, E2E):

| Flow | Result |
|---|---|
| Hero (desktop): 10115 + Massage → Entspannungsmassage + Morgen / Abends | `/suche?plz=10115&kategorie=massage&leistung=entspannungsmassage&datum=2026-11-03&zeit=abends`; H1 „Entspannungsmassage (klassisch) in 10115 Berlin“ (`d1440-suche-result.png`) |
| No-JS submit | `/suche?plz=10115`, H1 „Beauty & Wellness in 10115 Berlin“ |
| Mobile dock → sheet → Was? Massage | `/suche?plz=10115&kategorie=massage` (390 and 412) |
| Deep link `/?plz=10435&kategorie=massage&leistung=…&datum=2026-11-10&zeit=abends#termin` | Prefilled („· Berlin“, „Entspannungsmassage (klassisch)“, „Di., 10. Nov. · Abends“) and submitted with the same parameters; H1 „Entspannungsmassage (klassisch) in 10435 Berlin“ (`data/conversion2.json`) |
| Mobile sheet: 50667 → Was? Maniküre → Wann? Morgen + Nachmittags | `/suche?plz=50667&kategorie=manikuere&datum=2026-11-03&zeit=mittags`; H1 „Maniküre in 50667 Köln“; one dialog open throughout (`m390-sheet-filled.png`) |
| Final CTA (10) | `/suche`, upgraded to `/suche?plz=20095` after a PLZ is typed in the hero |
| 05 stage CTA via keyboard (focus + Enter) | Opens the booking bar with the shared PLZ (20095); focus returns to the CTA on Esc. **By mouse: nothing (N-2)** |
| Unserved PLZ 99998 | „· noch nicht verfügbar“ and „In … gibt es noch keine Profis auf SOMA.“ (waitlist path) |
| Links | 39 internal links and 37 unique routes, all 200; 11 anchors, none missing. Category rows → the 7 `/behandlungen/{slug}`. „Profi werden“ (08, 10, footer) → `/pro/registrieren` (200). „Konditionen ansehen“ → `/fuer-profis#provision` (anchor present). |
| Prefetch | 2 RSC prefetches during a full mobile scroll (`/suche`, `/pro/registrieren`), down from 54–65 (I-8 fixed) |

**Why 7:**
- **N-2:** the 05 stage CTA, the primary button of the most immersive chapter, is dead to the mouse in the desktop full tier.
- **N-3:** the PLZ, the only required field, is lost if typed before hydration, and the following submit does nothing.

The CTA wording and hierarchy themselves would score 8–9.

### 4.9 Technical quality: 8 (A1 8)

- **E2E** (`data/e2e-landing.log`; `landing.spec.ts`, `landing-conversion.spec.ts` and `landing-motion.spec.ts` on :3100, both projects): **66 passed, 1 failed, 9 skipped** (viewport-gated), 3.3 min.
  - The failure is `landing-motion.spec.ts:176` [desktop], "chapter overlay … a jump focuses the heading": `chapterActive` expected `"09"`, received `"10"` after the overlay jump to Fragen. That is the N-1 overshoot, caught by the suite itself.
  - Repeated alone it passed 11 of 11 (`data/e2e-overlay-jump-repeat.log`), so it is timing-dependent. The suite is not reliably green.
- **Console** (`tech.js`, 8 viewports, visitor tier, full scroll; and all 10 walks):
  - **0 errors and 0 page errors, no hydration errors.**
  - One warning per visit at ≤ 768 (and on desktop walks): `11sda7nbphjp0.css was preloaded … but not used`. That chunk is the `DisplayFontScope` font CSS (`brand/display-font.tsx`), preloaded by the RSC prefetch of `/suche` and `/pro/registrieren` (N-6; new since `c341909`).
- **Markup:**
  - `<Activity>`: 11 `<!--&-->` markers; **0 outlined segments** (`<div hidden id="S:…">`) and 0 pending Suspense fallbacks;
  - all ten chapters render without JS;
  - one `h1`;
  - DOM 1,429 nodes (audit 1: 1,522);
  - HTML 426 KB raw / 58.8 KB gz; inline RSC ≈ 236 KB (audit 1: 210 KB).
- **JSON-LD:** Organization, WebSite, WebPage and FAQPage. The 9 FAQ items equal the visible accordion. No `aggregateRating`, no `SearchAction`.
- **No-JS** (`tech.js`, `conv.js`):
  - the header is glass (`rgba(251,249,245,.92)`, blur) at the top and over the night band (I-5 fixed);
  - portraits at opacity 1 (I-6 fixed);
  - the dock is visible on mobile with a working `#termin` link;
  - but „Kapitel“ and „Menü“ are inert `<button>`s, and the dock label stays „01 Bei dir“ (N-10).
- **Root 404:** server header; at 390 the `<details>` menu opens full screen with all links; at 1440 the links resolve (`404-*.png`). Esc does not close the `<details>` (no JS by design).
- **Why only a borderline 8:**
  - N-3 is a hydration defect, and N-1 is an implementation defect in the scroll logic that makes one E2E test flaky.
  - Both are scored mainly under Interaction, Mobile, UX and Conversion, so they are not counted a third time here.
  - If RT-1 and RT-3 are not done, this drops to 7.

### 4.10 Accessibility: 8 (A1 8)

See § 12.

### 4.11 Performance: 7 (A1 7)

See § 11.

---

## 5. Status of the audit-1 findings

| ID | Pri | Issue | Status | Evidence |
|---|---|---|---|---|
| I-1 | P1 | Mobile main-thread cost, dialog INP, JS weight, Lighthouse < 90 | **Partly fixed** | TBT 486 → 124 ms (perf.js median), 112 ms (LH DevTools). Overlay open 124–200 ms. **Dock → sheet 270–290 / 450–520 ms; LH simulate median 89; JS 207 KB gz** (§ 11) |
| I-2 | P1 | 08 band collision at 1024–1180 | **Fixed** | `band.js`: no overlap, 1 row, text ≥ 96 px from the top at all 7 sizes |
| I-3 | P1 | Place-hint placeholder truncated | **Fixed** | `placeholder.js`: needed ≤ available everywhere; the place moved into the caption (copy needs sign-off) |
| I-4 | P1 | Mobile booking gap | **Fixed** | `dockreal.js`: dock shown at load on 6 phones; `noBookingControlAt: []`. Side effect N-7 |
| I-5 | P2 | No-JS header transparent | **Fixed** | `landing.css` `@media (scripting: none)`; measured glass |
| I-6 | P2 | No-JS portraits invisible | **Fixed** | `avatar.tsx:106` `noscript:opacity-100`; measured `["1","1","1","1"]` |
| I-7 | P2 | Skip links 18 px | **Fixed** | 179 × 44 px |
| I-8 | P2 | 54–65 RSC prefetches | **Fixed** | 2 prefetches (`data/fetches-m390.txt`) |
| I-9 | P2 | Seal blank until 60 % | **Fixed** | Starts at 42 % (full) and 31 % (lite); no mark inside the arch |
| I-10 | P2 | 2 axe violations | **Fixed** | 0 violations at 1440 full and 390 lite |
| I-11 | P3 | Light washes on the night band | **Not fixed** | `dein-ort/sequence.tsx:17-58` unchanged |
| I-12 | P3 | 02 statement before line 3 | **Not fixed** | `02-idee.tsx:56` ungated; measured opacity 1 vs 0 |
| I-13 | P3 | 768 hero half-empty | **Not fixed** | `hero-t768.png`; `landing.css:301-314` unchanged |
| I-14 | P3 | „10115 ·Berlin“ middle dot | **Not fixed** (and repeated) | `booking-entry.tsx:836`, new at `:810` |
| I-15 | P3 | Desktop header targets 40 px, footer 32 px | **Not fixed** | `landing-header.tsx:63,67`, `chapter-index.tsx:20` (`h-10`): 5 header controls at 40 px, 28 footer links at 32 px |
| I-16 | P3 | All imagery AI interim | **Not fixed** (launch blocker, known) | Labelled |
| I-17 | P3 | Reference close calls („Kapitel“, „Schnellzugriff“, „Idee“) | Unchanged | Client decision |
| I-18 | P3 | Doc drift on the `h1` | **Fixed** | `INTEGRATION.md` § 6.3 updated |
| PT-1 | — | Dialogs on demand | **Done, partly effective** | The overlay meets ≤ 200 ms. The sheet's entry still renders on the first open (`booking-sheet.tsx:75`) |
| PT-2 | — | Shrink the hydrated tree | **Partly** | Hydration moved off the shell (Activity), compile hints. **Weight not reduced** (207 KB vs ≤ 160 target) |
| PT-3 | — | No viewport prefetch | **Done** | 2 prefetches |
| PT-4 | — | No roman preload on `/` | **Done** | `/` preloads 2 fonts. Roman fetched after `load`. FCP 2.14–2.28 s (target ≤ 1.9 s not met) |

## 6. The engineers' § 17 claims, re-measured

| § 17 claim | Audit 2 measurement | Holds? |
|---|---|---|
| LH simulate `/` median 91 | 84 / 89 / 91 / 87 / 89 → **89** | No |
| LH simulate `/?motion=lite` median 87 | 86 / 89 / 89 / 91 / 87 / 91 / 91 → **89** | Roughly (both below 90) |
| LH DevTools `/` 95, TBT 103 ms, LCP 2.26 s | 95 / 94 / 95, TBT 73–142 (median 86), LCP 2.29–2.32 s | Yes |
| perf.js LCP 2.24–2.32 s, TBT 76–94 ms | LCP 2.24–2.39 s (median 2.30), **TBT 104–164 (median 124)** | LCP yes, TBT slightly higher (still ≤ 200) |
| Worst interaction 160–192 ms ("at the line") | perf.js overlay 152–200 ✓. **Dock → sheet 272–288 (settled), 464–520 (early)** ✗ | No |
| `inp2.js`: dock „Termin finden“ 40–56 ms | Reproduced with `inp2.js` (32 / 56 ms), but only because the previous step („Buchen“) left focus on a control. The focus ring moving away paints a frame before the deferred render. Without that, Event Timing is 248–464 ms, and the sheet appears at the same moment (`scripts/dock-focus.js`, `data/dock-focus-debug.txt`; § 11.4) | The number is real; the conclusion is not |
| First-load JS 206.4 KB gz | 207.1 KB gz (13 module scripts, all tagged) | Yes |
| E2E landing 67 passed, 9 skipped | 66 passed, **1 failed** (overlay jump → 10 instead of 09, N-1), 9 skipped; the test passes 11/11 alone | No: flaky, and the flake is a real defect |
| "No JS: all ten chapters … no outlined segments" | 10 chapters, 0 `S:` segments | Yes |

## 7. Regression check of the changes since audit 1

| Change | Finding |
|---|---|
| **`<Activity>` hydration boundaries** (`page.tsx:61`, `01-hero.tsx:51`, `layout.tsx:50`) | Markup intact: 0 outlined segments, no-JS complete, 0 hydration errors. **Regression in exposure (N-3):** the hero form hydrates 0.7 s after the place switch and 1.3 s after the header (4.8–4.9 s at 4× / Slow 4G, `data/hydration-timing.json`), and input typed before that is erased (`data/early-input.json`, 3/3). Whether the audit-1 build lost early input too was not measurable (no old build); its window was shorter. |
| **Inline motion-tier script** (`layout.tsx:64`, `tier.ts:36`) | Writes `data-motion` before the first style pass; the CSP allows inline scripts. The webdriver rule is the spec's (§ 8.1), but it means that **Lighthouse and PageSpeed measure the `none` tier on `/`**. In this build that does not flatter the median (89 both), but the gate must be read from `?motion=lite` (N-5). |
| **Root 404 server header** (`not-found.tsx`, `static-site-header.tsx`) | Works at 390 (menu `<details>` full screen) and 1440. The `SiteHeader` chunk is gone from `/`. Esc does not close the no-JS menu (acceptable). |
| **Newsreader roman moved to `DisplayFontScope`** (`brand/display-font.tsx`) | On `/`: 2 preloads, roman fetched once after `load`, CLS 0. On other routes: roman preloaded, CLS 0 (`data/routes.json`). **New:** the console warning on `/` (N-6). Cross-route duplication (N-9, outside the landing's budget): routes that prefetch `/` download the italic twice (two URLs, `-s.` from the root and `-s.p.` from the landing layout), and the 404 downloads both roman URLs. The stale comment in `(landing)/layout.tsx:14-19` still says the roman is preloaded on `/` (N-8). |
| **Compile hints in `postbuild`** (`scripts/landing/compile-hints.mjs`) | All 13 first-load module scripts start with `//# allFunctionsCalledOnLoad`. Netlify runs `npm run build`, so production gets them. This is a browser-level hint that applies to every Chrome visitor, not to automation. The gain is Chromium-only (Safari and iOS untested). No defect found. |
| **Booking-entry transition** (`booking-entry.tsx:715-721`) | Event Timing for Was? is 40–64 ms, but the list arrives 156–276 ms after the tap with no pending state, and `aria-expanded` lags with it (N-12). E2E T12 passes. |
| Lazy surfaces with yield-to-main (`nav/surfaces.ts:65-74`) | Legitimate pattern. But Event Timing then reports the dialog's latency only when the tap itself paints something; with a fresh tap it does not (§ 11.4). |
| Mobile `content-visibility` on 02–05 and 10 (`landing.css:79-97`) | **Regression N-1** (chapter jumps overshoot). |

## 8. Integrity rules

| Rule | Result |
|---|---|
| No invented testimonials, qualifications, review counts, identities or badges | Holds. Ratings only from ≥ 3 reviews (`provider-card.tsx:28-30`), counts from data. „Verifiziert“ only for approved providers. Every portrait card carries „Demo-Profil · Foto KI-generiert“. No `aggregateRating` in the JSON-LD. FAQ and trust-row claims match the product (audit 1 § 10; copy unchanged). |
| AI images labelled | Holds: the footer line now sits inside `<footer>`, plus per-portrait labels, „Vorschau · Demo-Daten“ (04) and „Live-App · Demo-Daten“ (07), and the demo ribbon. |
| Nothing unfinished looks functional | **One violation, by defect (N-2):** the 05 stage CTA looks functional and is not (mouse, desktop full). Without JS, „Kapitel“ and „Menü“ look functional and do nothing (N-10, P3). |
| Nothing behaves differently for automation in a way that flatters measurements | Searched `src/` and `scripts/` for `webdriver`, `data-automation`, `data-capture` and UA checks. (1) `tier.ts:25/36`: webdriver → `none`, so Lighthouse and PSI measure `/` without the motion runtime. That is spec'd, and in this build `/` and `?motion=lite` medians are equal, but any score quoted for `/` is not the visitor's (N-5). (2) `ui/motion.tsx:41` + `tokens.css:760`: under webdriver the footer renders in full, which is pessimistic for automation, not flattering. (3) `data-capture` is opt-in, used only by `scripts/screenshot.mjs`. (4) The yield-to-main pattern is not automation-specific, but it makes Event-Timing probes after a focus change read 40–56 ms for a sheet that appears 250–460 ms later (§ 11.4). |

---

## 9. New findings

| ID | Pri | Finding | Where | Evidence |
|---|---|---|---|---|
| N-1 | **P1** (regression) | Long chapter jumps overshoot. The E2E suite's own overlay test failed on it once (`landing-motion.spec.ts:199`, 10 instead of 09). At 390: 5 of 6 overlay jumps land 784–1,957 px past the `h2` (Profis → 07, Fragen → footer); the hero „So funktioniert’s“ lands at −245 px. At 1440: Fragen −194, SOMA −403. Instant jumps (reduced motion) land exactly. Cause: smooth `scrollIntoView` computed against `content-visibility: auto` placeholders whose estimated `contain-intrinsic-size` differs from the real height. At 1440 the page is 18,575 px tall at load and 17,221 px after a scroll. | `nav/jump.ts:12`; `(landing)/landing.css:79-97` (mobile 1450 / 1350 / 4200 / 760 px, added after audit 1); `chapters/chapter.tsx:37-38` with the 06–09 `cv` sizes | `data/jump.json`, `data/jump2.json`, `sheet-jump-miss-m390.jpg`, `d1440-jump-fragen-miss.png`, `d1440-jump-soma-miss.png` |
| N-2 | **P1** | The 05 stage CTA „Freie Termine finden“ is covered by the active stage item (absolute, inset 0, `pointer-events: auto`, z-index 1). A mouse click does nothing in the desktop full tier. | `(landing)/landing.css:852-858, 880-884, 897-906`; `motion/landing-motion.css:554-566` | `data/stage-cta-d1440.json`, `data/hittest-d1440-full.json` |
| N-3 | **P1** | A PLZ typed before the hero form hydrates is erased. The field paints at about 2.2 s and the form hydrates at 4.8–4.9 s (4× CPU, Slow 4G). The value goes from „10115“ to „“ and the submit then does nothing. | `chapters/01-hero.tsx:51-53` (own `<Activity>`); `site/booking-entry.tsx:508` (`useState` ignores the DOM value) | `data/early-input.json`, `data/hydration-timing.json` |
| N-4 | P1 (performance gate) | Dock → booking sheet: first visible frame 270–285 ms after the tap (Event Timing 272–288), 454–502 ms when tapped 1.5 s after load. The sheet renders its `BookingEntry` only on the first open. | `booking/booking-sheet.tsx:75-90`; `nav/lazy-surfaces.tsx` | `data/latency-settled-slow4g.json`, `data/latency-early-slow4g.json` |
| N-5 | P2 (measurement integrity) | Lighthouse and PSI report `navigator.webdriver = true`, so `/` is scored in the `none` tier. Quote and gate the visitor tier (`?motion=lite` / `full`). | `motion/tier.ts:25,36` | § 3, `data/lighthouse-runs.json` (`runtimeLoaded`) |
| N-6 | P3 | Console warning on every visit: the `DisplayFontScope` CSS chunk is preloaded by the RSC prefetch and not used. | `brand/display-font.tsx`, prefetching `<Link>`s to `/suche` and `/pro/registrieren` | `data/tech.json`, `data/walk-*.json` |
| N-7 | P3 | At load on tall phones the dock covers the hero Ortszeile and the lead's first line. | `nav-observer.ts:139-160, 219-222` (new rule); hero spacing | `hero-m390.png`, `hero-m412.png` |
| N-8 | P3 | A stale comment says the roman is preloaded on `/` ("3 files, 102 KB"). | `(landing)/layout.tsx:14-19` | — |
| N-9 | P3 | Cross-route font duplication: the italic downloads twice on routes that prefetch `/`, and the 404 downloads both roman URLs. | root `layout.tsx` + `(landing)/layout.tsx:20-27` + `display-font.tsx` | `data/routes.json` |
| N-10 | P3 | No-JS: „Kapitel“ (header, dock) and „Menü“ are inert buttons; the dock label stays „01 Bei dir“. | `nav/landing-dock.tsx:19-27`, `landing-header.tsx` | `data/tech.json` (`nojs_*`) |
| N-11 | P3 | The full tier at 4× CPU drops more frames than in audit 1 (40 vs 29 frames > 50 ms). | full-tier scenes | § 4.5 |
| N-12 | P3 | Was? in the sheet: no pending feedback during the 156–276 ms transition; `aria-expanded` changes late. | `site/booking-entry.tsx:715-721` | `data/latency-settled-slow4g.json` |

---

## 10. Chapter walkthrough (changes against audit 1 only)

| Ch | Desktop (1440, 1280 full; 1024 lite) | Tablet 768 | Phones 430 / 390 / 320 |
|---|---|---|---|
| 01 | Placeholder fits; caption „Wo? · Im Hotel“ | Unchanged (I-13) | Dock visible at load, over the Ortszeile (N-7). Early typing lost (N-3) |
| 02 | I-12 unchanged | — | Short foot jump lands correctly |
| 04 | Unchanged | — | Hero „So funktioniert’s“ jump lands at −245 px (N-1) |
| 05 | **Stage CTA dead to the mouse (N-2)** | — | Jump from the overlay lands mid-chapter (N-1) |
| 06–07 | Unchanged | — | Overlay jumps land one chapter late (N-1) |
| 08 | Band fixed at every size | Stacked, fine | Fine |
| 09 | Overlay jump overshoots by 194 px (N-1) | — | Overlay jump lands in the footer (N-1) |
| 10 | Seal fixed; header logo hides at the sequence start | — | Lite sequence at 31 % |
| Footer | AI note inside `<footer>` | — | The dock stays over the footer; the legal row stays clear (`m390-footer.png`) |

---

## 11. Performance measurements

### 11.1 Lighthouse 12.8.2, mobile, default simulated throttling (the gate). All runs, none discarded.

Score · FCP · LCP · TBT · SI · CLS. LCP element in every run: the hero `<img>` (`hero-home-4x5.jpg`, `fetchpriority="high"`).

| Set | Runs | Median |
|---|---|---|
| **`/?motion=lite`** (real phones' tier; runtime loaded in 7/7) | 86 · 1.53 · 4.09 · 64 · 1.53 · 0 / 89 · 1.52 · 3.70 · 36 / 89 · 1.53 · 3.71 · 20 / 91 · 1.52 · 3.40 · 77 / 87 · 1.52 · 4.00 · 1 / 91 · 1.52 · 3.40 · 58 / 91 · 1.52 · 3.40 · 40 | **89** · LCP 3.70 s · TBT 40 ms |
| `/` (Lighthouse's own tier: `none`; runtime loaded in 0/5) | 84 · 1.52 · 4.36 · 65 · **2.83** · 0 / 89 · 1.52 · 3.69 · 13 / 91 · 1.53 · 3.41 · 38 / 87 · 1.52 · 4.00 · 0 / 89 · 1.53 · 3.71 · 15 | **89** · LCP 3.71 s · TBT 15 ms |

- **Simulated LCP is tri-modal:** 3.40, 3.70 or 4.00 s, plus one 4.36 s run with the compositor stall that § 17.4 describes (SI 2.83).
- **The observed metrics are tiny:** FCP and LCP 0.20–0.30 s on localhost. The breakdown attributes 2.27–2.85 s to "render delay": Lantern charges the scripts that finished before the observed paint.
- This is the localhost artefact § 17.4 explains. It is still the number the brief's "Lighthouse mobile ≥ 90" names, and it is **not met**.

### 11.2 Lighthouse, applied throttling and desktop

| Set | Runs | Median |
|---|---|---|
| Mobile DevTools, `/?motion=lite` | 91 · LCP 2.45 · TBT 200 · CLS 0.0011 / 95 · 2.23 · 114 / 94 · 2.37 · 112 / 95 · 2.29 · 107 / 95 · 2.33 · 101 | **95** · LCP 2.33 s · TBT 112 ms |
| Mobile DevTools, `/` | 95 · 2.30 · 86 / 94 · 2.32 · 142 / 95 · 2.29 · 73 | 95 · LCP 2.30 s · TBT 86 ms |
| Desktop, `/?motion=full` | 99 · LCP 0.89 · TBT 0 / 99 · 0.88 · 0 / 100 · 0.72 · 0 | **99** · LCP 0.88 s |
| Desktop, `/` | 100 · 0.74 / 100 · 0.73 | 100 |

Mobile DevTools main thread (lite): script evaluation 0.95–1.16 s, other 1.00–1.09 s, style and layout 0.37–0.46 s.

### 11.3 `perf.js` (audit 1's script; `MASK=1 … mobile slow4g 5`, `?motion=lite`)

| Run | FCP | LCP | CLS | TBT | Place · Place · FAQ · Overlay open · Esc (ms) |
|---|---|---|---|---|---|
| 1 | 2,244 | 2,392 | 0 | 104 | 88 · 72 · 48 · **200** · 24 |
| 2 | 2,140 | 2,236 | 0 | 151 | 152 · 80 · 64 · 176 · 40 |
| 3 | 2,192 | 2,304 | 0 | 124 | 104 · 104 · 40 · 160 · 32 |
| 4 | 2,276 | 2,276 | 0 | 113 | 88 · 96 · 56 · 152 · 24 |
| 5 | 2,240 | 2,392 | 0 | 164 | 120 · 64 · 64 · 160 · 32 |
| **Median** | 2,240 | **2,304** | **0** | **124** | overlay 160 |

Transfer per run: document 60 KB, CSS 40 KB, fonts 103 KB (two preloaded plus the roman after `load`), script 226–230 KB, images 51 KB.

### 11.4 Interactions: Event Timing next to the visible response (`latency.js`, 412 × 823, 4× CPU, Slow 4G, cold)

*Visible* is the time from the event to the first frame in which the requested UI is on screen: the sheet with its PLZ field, the overlay's chapter links, the inline list, or the start of the close.

| Interaction | Run 1 | Run 2 | Run 3 |
|---|---|---|---|
| Place switch | 144 / 230 | 88 / 119 | 80 / 143 |
| **Dock „Termin finden“ → sheet** | **288 / 284** | **288 / 285** | **272 / 270** |
| Was? (inline, in the sheet) | 64 / 209 | 56 / **276** | 40 / 156 |
| Esc (sheet) | 80 / 74 | 72 / 64 | 72 / 62 |
| Dock chapter button → overlay | 128 / 124 | 176 / 171 | 160 / 156 |
| Esc (overlay) | 16 / 154 | 24 / 226 | 16 / 165 |
| FAQ summary | 56 / 133 | 88 / 156 | 72 / 131 |
| 07 tab | 128 / 113 | 128 / 114 | 120 / 114 |
| **Dock → sheet, tapped 1.5 s after load** | **464 / 459** | **464 / 454** | **520 / 502** |

**Why `inp2.js` (audit 1's script, also used in § 17) reads 32–56 ms for the same tap.** I re-ran it and got 56 and 32 ms. A debug variant (`scripts/dock-focus.js`, `data/dock-focus-debug.txt`) then isolated the cause:
- tapped as the first action: the click lasts **248–464 ms** (first open) and 184–224 ms (second open);
- right after tapping another control („Buchen“, as `inp2.js` does): **48 ms**.
- The handler only queues the render behind `requestAnimationFrame` + `setTimeout` (`nav/surfaces.ts:65-74`). A frame is presented before the render only if the tap itself changed something visible, here the focus ring leaving the previous control.
- On a real phone the `:active` press style may provide that frame, so field INP could be lower. But the sheet the visitor asked for still appears 270–290 ms (settled) or 450–520 ms (early) after the tap.

**Verdict on "worst interaction ≤ 200 ms": not met for the booking sheet; met for the overlay (124–200 ms).**

### 11.5 Hydration timeline (`hydration.js`, same profile, 3 runs)

PLZ field in the DOM at 0.7 s; FCP 2.20–2.29 s; dock and header hydrated 3.50–3.62 s; place switch 4.04–4.15 s; **hero form 4.80–4.89 s**; chapter 03 4.80–4.95 s; footer 5.03–5.05 s.

### 11.6 Weight (`scripts/weight.js`)

- **First-load module scripts:** 13 files, 722 KB raw, **207.1 KB gz** (audit 1: ≈ 225). All carry the compile hint. The largest are react-dom 70.1, the Next runtime 44.0, next/image 21.1, the nav and overlay 14.0, BookingEntry 13.6, the landing islands 10.5 and tailwind-merge 9.0 KB.
- **Other first-load weight:** CSS 37 KB gz in 3 files; HTML 58.8 KB gz.
- **Fonts before `load`:** 80 KB (Instrument Sans 57 KB, italic 23 KB).

### 11.7 Against the exit criterion (audit 1 § 15.1) and the spec budget (§ 10)

| Target | A1 | A2 | |
|---|---|---|---|
| Median mobile LCP ≤ 2.5 s | 2.36 s | 2.30 s (perf.js) · 2.33 s (LH DevTools) · simulate 3.70 s | **Met** (observed); simulate is the Lantern artefact |
| TBT ≤ 200 ms | 486 ms | 124 ms (perf.js) · 112 ms (DevTools) · 40 ms (simulate) | **Met** |
| Worst interaction ≤ 200 ms | 200–400 ms | overlay 124–200; **sheet 270–290 (450–520 early)** | **Not met** |
| CLS ≤ 0.05 | 0 | 0 at load; scroll 0–0.0093 | **Met** |
| Lighthouse mobile ≥ 90 | est. 83–86 | **89** (simulate, lite and `/`); 95 DevTools | **Not met** (by 1 point, median of 7 and 5) |
| Route JS ≤ 90 KB gz (≤ 160 first load) | ≈ 225 KB | 207 KB | **Not met** |
| Desktop LCP ≤ 1.2 s, LH ≥ 95 | ≤ 0.7 s | 0.72–0.89 s, 99–100 | **Met** |
| FCP ≤ 1.9 s (PT-4) | 2.24–2.42 s | 2.14–2.28 s | **Not met** |

---

## 12. Accessibility

- **axe-core 4** (WCAG 2.0/2.1/2.2 A and AA plus best practice; `data/a11y-d1440-full.json`, `data/a11y-m390-lite.json`): **0 violations.**
  - 14 and 12 "incomplete" colour-contrast items over images.
  - These were resolved by pixel sampling on the 08 band (`contrast.js`, `data/contrast-band.txt`): title worst 3.98–4.17:1 (large text, AA 3:1), lead ≥ 7.9:1, Ortszeile ≥ 14.6:1, and the second CTA (Bone over the photo since the one-row change) ≥ 11.8:1.
- **Keyboard** (`keyboard.js`):
  - order: skip links → header → hero radios → link → PLZ → Standort → Was? → Wann? → submit → 02 foot → 03 rows → … → 07 tabs;
  - a visible 2 px ring on every stop (the PLZ on its segment);
  - the overlay traps (17–18 stops, 0 escapes, one browser-chrome stop) and Esc restores focus;
  - jumps focus the `h2`;
  - the bar focuses the PLZ, and Esc returns to „Termin finden“;
  - the radios, the FAQ and the tabs (arrows, End) work.
  - **After an overshooting jump (N-1) the focused `h2` is off-screen at 390**, so a sighted keyboard user loses the focus position.
- **Skip links:** 179 × 44 px; the second focuses the PLZ.
- **Landmarks and headings:** unchanged and correct; the footnote is now inside `<footer>`; 1 `h1`; `lang="de"` with `lang="en"` on the taglines; 36 images with `alt`.
- **Targets:**
  - mobile ≥ 44 px except 3 footer words (29–37 × 44);
  - **desktop header links and the index pill are 40 px, footer links 32 px** (WCAG 2.2 AA passes; the spec's 44 px does not; I-15).
- **Reduced motion:** tier `none`, instant jumps (which land correctly), final frames.
- **Not verified:** screen readers, forced colours.

---

## 13. SEO

Unchanged from audit 1 and still correct:
- title and description;
- Open Graph (1200 × 630, alt) and Twitter;
- canonical = `APP_URL` (`http://localhost:3000` in this build);
- `noindex` in `DEMO_MODE`;
- one `@graph` with the FAQPage equal to the accordion (E2E T15–T18 pass).

---

## 14. Prioritised issues (open)

| ID | Pri | Issue | Dimension(s) |
|---|---|---|---|
| N-1 | **P1** | Chapter jumps overshoot (phones: 5 of 6; desktop: 09 and 10) | Interaction, Mobile, UX, A11y |
| N-2 | **P1** | 05 stage CTA dead to the mouse (desktop full) | Interaction, Conversion, UX |
| N-3 | **P1** | Early-typed PLZ erased at hydration | Conversion, Mobile, UX, Technical |
| N-4 / I-1 | **P1** | Sheet open 270–520 ms; LH simulate 89; JS 207 KB | Performance, Mobile |
| N-5 | P2 | Gate and quote Lighthouse on the visitor tier | Performance (method) |
| I-11…I-16, N-6…N-12 | P3 | See §§ 5 and 9 | Visual, Typography, Brand, Technical |

---

## 15. Remediation tasks

### 15.1 P1: required for the gate

**RT-1 · Chapter jumps that land (N-1). Lifts Interaction, Mobile, UX.**
- **Where:** `src/components/landing/nav/jump.ts:12`, `src/components/ui/motion.tsx:53` (same smooth `scrollIntoView` for other `#` links), `src/app/(landing)/landing.css:79-97`.
- **Change:** make an explicit jump robust to `content-visibility` placeholders. One of:
  1. **Re-target at the end** (preferred, keeps the smooth scroll): after `scrollIntoView({ behavior: "smooth" })`, listen for `scrollend` (fallback: 1,200 ms). If the section's top is more than 8 px from its scroll-margin position, call `section.scrollIntoView({ block: "start" })` without smoothing.
  2. **Render ahead:** before smoothing, set `content-visibility: visible` on the chapters between the current position and the target, and restore `auto` on `scrollend`.
  3. Or replace the mobile estimates (1,450 / 1,350 / 4,200 / 760 px) with measured per-breakpoint heights. This is fragile across copy changes, so not on its own.
- **Expected:** every overlay target, the hero „So funktioniert’s“ and the header links end with the chapter's `h2` between 0 and 320 px from the top at 390, 412, 768, 1024 and 1440, with `data-chapter-active` equal to the target.
- **Verify:** `node docs/landing/audit-2/scripts/jump.js m390,m412,t768,d1440` (all `inView true`, active = target) and `jump2.js`. Add the same assertion to the motion E2E test that already checks the jump's focus.

**RT-2 · A clickable 05 stage CTA (N-2). Lifts Interaction, Conversion.**
- **Where:** `src/app/(landing)/landing.css:880-884` (`.lp-stage-cta` in the full tier) and `897-906` (active item `pointer-events: auto`).
- **Change:** give `.lp-stage-cta` `z-index: 2` inside the pinned stage. Or keep the active `li` at `pointer-events: none` and enable it only on the `li`'s own interactive descendants (there are none today).
- **Expected:** a real mouse click on the stage CTA at each of the 6 steps opens the booking bar.
- **Verify:** `node docs/landing/audit-2/scripts/stagecta.js d1440 full` (`hitIsCta: true`, `after: dialog open: …`) and `hittest.js d1440 full` (0 covered). Add an E2E check: click `[data-cta="ch05-stage-termin"]` with `?motion=full` at step 3 → bar open.

**RT-3 · Keep what the visitor typed before hydration (N-3). Lifts Conversion, Mobile, UX.**
- **Where:** `src/components/site/booking-entry.tsx:508` (`plz` state), and `src/components/landing/chapters/01-hero.tsx:51-53` (the hero entry's own `<Activity>`).
- **Change:** in `BookingEntry`, adopt a non-empty DOM value on mount. In a layout effect, read `inputRef.current.value`; if it differs from the initial state, `setPlz` and run the same lookup as `onChange`. Do the same for a focused field's selection. Alternatively, take the hero entry out of the separate `<Activity>` so it hydrates with the shell. That shortens the window but does not close it, so do the first.
- **Expected:** typing „10115“ 0.1–2.5 s after FCP at 4× CPU and Slow 4G keeps the value, shows „· Berlin“ after hydration, and the submit reaches `/suche?plz=10115`.
- **Verify:** `node docs/landing/audit-2/scripts/early.js 3` → `after.value: "10115"`, `hint: "· Berlin"`, `submitted: "/suche?plz=10115"` in 3 of 3 runs. E2E T1–T22 must still pass.

**RT-4 · The booking sheet opens within 200 ms (N-4 / I-1). Lifts Performance, Mobile.**
- **Where:** `src/components/landing/booking/booking-sheet.tsx:75-90` (the entry renders only once `session` exists), `nav/lazy-surfaces.tsx`.
- **Change:**
  1. Pre-render the sheet's `BookingEntry` in an idle period after the surfaces mount, the same way `ChapterOverlay` sets `rendered`. Use an empty seed session, closed, so the first open only seeds `syncDraft` and calls `showModal()`.
  2. If the first open is still above 200 ms, apply the overlay's page-hiding trick (`chapter-overlay.tsx:42-58`, `content-visibility: hidden` on the page parts) only for a sheet that covers the full height, or reduce the inert recalculation another way.
  3. For the early tap, start `preloadSurfaces()` on the first `pointerdown` anywhere (it already starts on intent) and render a static sheet frame (title, PLZ field) synchronously, with the rest in a transition.
- **Expected:** with `latency.js 3 settled`, dock → sheet visible ≤ 200 ms in 3 of 3 runs. With `latency.js 3 early`, ≤ 300 ms.
- **Verify:** `latency.js` (both scenarios), `perf.js mobile slow4g 5`, E2E T12 and T12a.

**RT-5 · Lighthouse mobile ≥ 90 on the visitor tier (I-1). Performance.**
- **Measure on `/?motion=lite`** (N-5). The median is 89 with three LCP modes (3.40 / 3.70 / 4.00 s), so the remaining levers are bytes before the observed paint:
  1. **The `BookingEntry` split** (§ 17.4 lever 5: a light hero form, the full entry on intent). Measured upper bound −0.05 s, so on its own it is not enough.
  2. **Move the motion runtime import** (lite) out of the window Lighthouse counts. The lite median equals `/`'s, so it is not the main lever.
  3. **The real lever is JS weight:** 207 KB gz against the 160 KB first-load budget. Candidates:
     - `next/image` (21 KB) on the landing's own images: a static `<img srcset>` built at render, with the hero preload already in place;
     - tailwind-merge (9 KB) in the shell components;
     - the image registry (§ 17.4).
- **Expected:** a simulate median ≥ 91 over 7 runs on `/?motion=lite`, with no run below 89, and first-load JS ≤ 160 KB gz.
- **Verify:** `scripts/lh-batch.sh sim-lite 7 "http://localhost:3100/?motion=lite"` then `node scripts/lh-table.js`. Weight: `node docs/landing/audit-2/scripts/weight.js`.
- If this is not reachable without hurting real visitors, **document it as a constraint** (Lantern on localhost; real-device field data needed) rather than counting the DevTools 95 as the gate. The brief requires that honesty.

### 15.2 P2 and P3 (lift the 8s, keep the 9)

| Task | Change | Verify |
|---|---|---|
| RT-6 (N-5) | State in `docs/landing/` and in the `tier.ts` comment that Lighthouse and PSI score `/` in the `none` tier, and quote `?motion=lite` / `full`. Or let the boot script ignore `webdriver` when `?lh=1`. | `lh-sum.js` shows `runtimeLoaded: true` for the quoted runs |
| RT-7 (N-12) | Was? / Wann? in the sheet: set `aria-expanded` and a lightweight open frame (header row, empty list area) synchronously; render only the list in the transition. | `latency.js`: Was? visible ≤ 120 ms |
| RT-8 (N-7) | At load on phones, reserve space so the dock never overlaps the hero Ortszeile: hero `padding-bottom: 80px + safe area` under the figure below 1024, or start the dock hidden until the first scroll if the Ortszeile is in the bottom 80 px. | `hero-m390.png` at 390 × 844, 412 × 915, 430 × 932: Ortszeile fully visible |
| RT-9 (N-6, N-9) | Avoid the unused CSS preload: prefetch `/suche` and `/pro/registrieren` on intent only, or give the scope's CSS to the same chunk as the root fonts. Remove the duplicate italic declaration (one declaration of each file, preloaded per route through a prop). | 0 console warnings in `tech.js`; `routes.js`: each font file fetched once per route |
| RT-10 (I-14) | Use a no-break space on both sides of the middle dot (`\u00a0·\u00a0`) in `booking-entry.tsx:810` and `:836` (and `Morgen · Abends`). | `d1440-hero-filled.png` |
| RT-11 (I-12) | Gate the 02 closing statement with line 3 (`data-reveal-order={3}` in the same clause group). | `seal.js` (doorway part): statement opacity follows line 3 |
| RT-12 (I-13, I-15, I-11, N-10) | As audit 1 § 15.4: the 768 hero composition; 44 px header targets; a dark wash on the night band; a no-JS `<a href="#kapitel">` for „Kapitel“ / „Menü“. | Audit 1 scripts |
| RT-13 (N-8) | Fix the stale font comment in `(landing)/layout.tsx:14-19`. | Read |

### 15.3 What each dimension needs

| Dimension | Back to ≥ 8 |
|---|---|
| Interaction design | RT-1, RT-2 (and RT-4 for 9) |
| Mobile experience | RT-1, RT-3, RT-4 |
| User experience | RT-1, RT-3 |
| Conversion clarity | RT-2, RT-3 |
| Performance | RT-4 and RT-5, or a documented constraint for the simulate score with field data |

---

## 16. Verdict

**Not passing: 6 of 11 dimensions at ≥ 8.**

**What improved:**
- The remediation since audit 1 is real and measurable: TBT ÷ 4, the overlay inside budget, the band, the placeholder, the booking gap, no-JS, axe, skip links, prefetching and the seal.
- The engineers' DevTools-mode and TBT numbers reproduce.

**What fails:**
- The default Lighthouse score does not reach 90 for the tier real phones get (median 89), and § 17's "91" for `/` does not reproduce.
- The booking sheet, the page's main mobile conversion tap, still opens in 270–520 ms.
- Three P1 defects break primary paths:
  - chapter navigation on phones (a regression of the performance work);
  - the 05 stage CTA on desktop;
  - early PLZ input on slow phones.

They are local fixes (RT-1…RT-4) with scripts in `audit-2/scripts/` to verify them.

*Database: the landing E2E suites were run once on :3100, plus 11 repeats of one motion test. They create searches and waitlist entries, no bookings. I did not run `demo:refresh`. The production server on :3100 was left running and was not rebuilt.*

---

## 17. Remediation after audit 2 (engineer's measurements)

*The remediation engineer's own claims, 2 Nov 2026. **This is not an audit score**: the dimensions stay as scored above until a re-audit. Nothing in §§ 1–16 was changed.*
*Setup: production build on `:3100` (`npm run build` incl. `postbuild`, then `next start`), the machine idle during every latency run (no build or E2E in parallel), `DEMO_MODE=true`. "Before" is the auditor's data in `audit-2/data/` and, where marked, my own run of the same script on the unchanged code (`ef84ceb`) on this machine. Evidence: `docs/landing/audit-2-remediation/`: `scripts/` are copies of `audit-2/scripts/` with only `OUT`/`DATA` in `lib.js` pointed there (so the auditor's evidence stays untouched), plus a few marked variants; `data/` holds their output.*

### 17.1 Commits

| Commit | RT | Change |
|---|---|---|
| `1c763cb` | RT-1 | `lib/scroll-jump.ts`: the native smooth `scrollIntoView` is kept (spec § 7); at `scrollend` (fallback: a quiet period) the target is checked and corrected without smoothing until the layout holds (≤ 4×, 8 px). Chapter jumps (`nav/jump.ts`) and `MotionRoot`'s same-page anchors (`ui/motion.tsx`) use it. Visitor input cancels the correction. |
| `151ea9f` | RT-1 | Measured `contain-intrinsic-size` estimates (phones, a new 768–1023 band, desktop), width-linear `calc()` where a chapter grows with the width, so the end correction stays small. |
| `8ed9c40` | RT-2 | `.lp-stage-cta` `z-index: 2` in the pinned stage. |
| `f2bf046` | RT-3 | `BookingEntry` adopts a non-empty DOM value on mount (layout effect) with the same lookup; it wins over `?plz=` and the remembered PLZ; caret kept. E2E T2a. |
| `3762d8e` | RT-7 | Inline Was?/Wann?: panel, `aria-expanded` and a height-holding placeholder with the tap; only the list is deferred (`useDeferredValue`). |
| `040fcd6` | RT-10 | ` · ` in the booking entry (caption, city and unserved hints, Wann? value, service meta). |
| `4f52923` | RT-4 | Booking sheet: entry pre-rendered closed in idle (memoised, never writes the draft), page parts off screen `content-visibility: hidden` around `showModal()`, open in the request's task, no yield on a warm phone open; `nav/surfaces.ts` loads the modules first and mounts the dialogs in one synchronous render (no `React.lazy`/`Suspense`). |
| `df466be` | RT-4 | A dialog chunk that fails to load resolves the mount promise, so a trigger reaches `openBooking()` and booking-access's fallback instead of doing nothing. |
| `713e01e` | RT-11 | 02: the three lines and the statement are one clause group (`data-doorway-lines`, statement `data-reveal-order={3}`); the doorway triggers it with line 3. |
| `f9bc3c9` | RT-12 | 44 px header links and index pill; `<noscript>` links „Kapitel“/„Menü“ to a static chapter list (`#kapitel`) above the footer; tone „nacht“ under the 05 photos. |
| `5f489de` | RT-13 | Font comment in `(landing)/layout.tsx`. |
| `4fba621` | tests | Motion E2E: the overlay jump asserts where it lands; a phone jump test; the 05 stage CTA click. |

### 17.2 Before → after per task

**RT-1 · Chapter jumps (N-1).**

| Script | Before | After |
|---|---|---|
| `jump.js m390` (h2 top after 4 s · active) | 239 · 03 / **−784** · 05 / **−1,053** · 07 / **−1,483** · 08 / **−1,957** · 10 / **−1,129** · 10 (my run reproduced the audit to the px) | 239 · 03 / 239 · 05 / 239 · 06 / 238 · 07 / 238 · 09 / 268 · 10, all `inView: true` |
| `jump.js m412` | — | 238 · 03 / 238 · 05 / 246 · 06 / 236 · 07 / 239 · 09 / 303 · 10 |
| `jump.js d1440` | 310 / 599 / 310 / 136 / **−194 · 10** / **−403** | 310 · 03 / 599 · 05 / 310 · 06 / 311 · 07 / 311 · 09 / 313 · 10 |
| `jump2.js` | hero „So funktioniert’s“ at 390: **−245** | 238 · 04; foot 02 239 · 03; header and hero links at 1440 310 · 04; reduced motion 238 (390) / 311 (1440) · 09 |
| `jump-residual.js` (variant: dock or header by visibility, all targets; `jump.js` cannot run `t768`, it uses the header „Kapitel“ below 1024) | correction at the end, before the new estimates: phones up to **2,195 px**, 768 up to **814**, 1440 up to **712** | phones ≤ 43 px, 768 ≤ 9, 1024/1440 ≤ 84. At 768, 1024 (touch and fine pointer) every section lands at its scroll margin (147–153 px) with the target active |
| `jump-nojs.js` (variant, JS off) | — | hero link and chapter foot: 238 (390), 278 (768), 310 (1440) |
| E2E | overlay → Fragen flaked (10 instead of 09) | the test now asserts the landing (h2 0–320 px, 09 active, after the scroll settled): **10/10** alone; the new phone test (Profis, Fragen, hero link at 390 × 844): **10/10** |

Upward jumps (`jump-up.js`, after an instant scroll to the end) missed before too (390: 04 at −245, 06 at −30). After: 03 239 / 04 238 / 06 238 at 390 and 310 / 310 / 310 at 1440, the target active each time.
Three headings sit below 320 px **by layout** while their section lands exactly under the header: 05 at 1024/1440 in the full tier (556/599 px, under the dusk spacer; the audit already marked 599 ✓), 08 below 1024 (744 px at 390, 994 at 768: the band's arch comes first) and 10 at 768 (358 px). Landing on the heading instead of the section would skip those openings; I left it as a design question.

**RT-2 · 05 stage CTA (N-2).**
- `stagecta.js d1440 full`: before, the pinned rows 1–7 had `hitIsCta: false` (`LI.lp-essay-item`) and „no dialog“. After, rows 1–7 have `hitIsCta: true` and „dialog open: Termin finden“. Rows 0 and 8 are the probe's edges, with the same values as in the audit (the CTA centre below the fold at y 916, or under the header at y 16).
- `stagecta-steps.js` (variant, steps 1–6 positioned as in the E2E): the hit target is the CTA and the bar opens at **6/6** steps at 1440 and at 1024 (fine pointer).
- `hittest.js d1440 full` / `d1024 full`: covered 2 → **1**, the disabled rail arrow „Zurück“ that the audit also listed (`pointer-events: none` by design).

**RT-3 · Early PLZ (N-3).** `early.js 3`: before, `after.value ""`, `hint null`, no navigation (3/3). After, `"10115"`, `"· Berlin"`, `/suche?plz=10115` (**3/3**; typed at 3.2–3.5 s).

**RT-4 · Booking sheet (N-4).** `latency.js`, 412 × 823, 4× CPU, Slow 4G; „visible“ = event → first frame with the sheet.

| Scenario | Before | After |
|---|---|---|
| settled, dock → sheet (visible) | audit 284 / 285 / 270; my run on `ef84ceb` 325 / 263 | 3 batches on this architecture: 138 / 197 / 170 · 244 / 136 / 257 (first batch after a build, load 1.7) · 166 / 177 / 211 → **median 177, 6 of 9 ≤ 200** |
| early (1.5 s after load, cold surfaces) | audit 459 / 454 / 502; my run 536 / 518 / 466 | 431 / 387 / 379 · 384 / 329 / 351 → **median 381** |

- **Where the time went** (`showModal()` patched with timestamps, same profile): the request reached `showModal()` 50–60 ms after the tap, and `showModal()` itself took **145–148 ms**: the inert restyle of 538 rendered elements, among them the off-screen hero, chapters near the viewport and the footer. Now the request reaches it 23–65 ms after the tap, and the call takes 41–86 ms (303 elements). In place, with the visible chapter, header, dock and dialog content also hidden, it would take 18–36 ms, so roughly 25 ms each is the visible chapter and the dialog's own first styles. That remainder is inherent to a modal over a visible page.
- **Tried and not kept**, each measured in 10 runs: `flushSync` without the other steps (median 185 against 176); writing the page lock before the render (226: the root's `overflow` change made the browser render an extra frame before React's render). The CSS selector cost of a full restyle is 7 ms at 1× over 749 selectors, with no single hot selector.
- **INP vs visible:** a warm phone open no longer yields a frame first, so Event Timing now equals the visible time (80–256 ms) instead of 80–112 ms for a press-state paint. The desktop bar and a cold mount without a presented frame still yield.
- **Not met:** „≤ 200 ms in 3 of 3“ (settled) and „≤ 300 ms“ (early). On the cold path the dialogs' chunk is evaluated inside the tap (≈ 125 ms at 4×). That chunk (`booking-sheet`/`booking-bar`, 28.8 KB raw) also carries ≈ 20 KB of modules that are already in the first-load chunk with `BookingEntry` (the kit `Sheet`, `RebookRow`, `format`, the form field, booking-draft, icons). The dynamic imports live in the layout's chunk group, which cannot assume the page's modules. Moving the loader into the page's chunk group, or a smaller entry, is the remaining lever. It is JS weight, so I left it for RT-5. Loading the chunk before the first engagement would add ≈ 75 ms of TBT, which was audit-1's PT-1 trade-off.

**RT-7 · Was? / Wann? (N-12).** `latency.js` Was? visible: before 209 / 276 / 156 (audit), 213 / 297 (my run). After: 68 / 73 / 114 · 75 / 89 / 99 · 135 / 122 / 82 → **median 89, 7 of 9 ≤ 120**. `aria-expanded` follows the tap.

**Performance kept (`MASK=1 perf.js mobile slow4g 3`).** After: TBT 120 / 177 / 222 (the first runs after a server restart), then 115 / 121 / 155 → median 138 ms (audit: 124). Same machine, same hour, `ef84ceb` rebuilt: 120 / 175 / 88. Overlay open (4th interaction): after 152–232, `ef84ceb` 176–272. LCP 2.25–2.42 s, CLS 0. `content-visibility` and every `<Activity>` boundary are unchanged.

**RT-10 · Middle dot (I-14).** `d1440-hero-filled.png`: „Wo? · Im Hotel“, „10115 · Berlin“ (one no-break space each side), „Morgen · Abends“.

**RT-11 · 02 statement (I-12).** `seal.js d1440 full` (doorway part): at f = 1.2, before: statement opacity **1** while „Kein Wartebereich.“ was 0 (audit). After: statement 0 with line 3 at 0. Continuing the scroll, the statement rises right after line 3 (full tier) or with it (lite, 390).

**RT-12** (`rt12.js`, variant).
- **Header targets:** 1440 / 1280 / 1024: links and index pill **40 → 44 px**; „Termin finden“ and „Anmelden“ 48; „Menü“ and the wordmark 44.
- **No-JS:** the dock (390) and header (1280, 1440) show „Kapitel“ as a link. It reaches `#kapitel` (list top 76 / 84 px), and a chapter link there jumps (Fragen `h2` at 238 / 310). No inert button is visible (`m390-nojs-kapitel.png`). With JS the links and the list are not in the DOM (T14 unchanged).
- **Night band:** with images blocked at 768, all six 05 arches load on `rgb(37, 33, 31)`, the band's Espresso, instead of the light washes (`t768-05-wash-before-load.png`).
- **Not done: the 768 hero (I-13).** Audit 1 offers two recompositions („figure beside the head“ or „booking card above the arch“) against the spec's validated stacked layout. That is a design decision.

**RT-13.** The comment now says: 2 preloaded files (≈ 80 KB), and the roman is fetched once after `load` by the motion loader.

**RT-8 · not done (design decision).** Geometry at load (DEMO build, `rt8-hero-*.png`):
- **390 × 844:** Ortszeile 814–829 under the dock 776–832.
- **412 × 915:** 844–860 under 847–903; the lead starts at 884, also under the dock.
- **430 × 932:** 869–884 under 864–920; the lead starts at 908.
- **Without the 47 px demo ribbon** (production): the Ortszeile clears the dock at 412 and 430 and is covered by 6 px at 390. The leads stay covered.
- **The audit's second option** (dock hidden until the first scroll) would bring back the I-4 booking gap at load. The dock is the only booking control in view there, and E2E „a booking control is in view at every scroll position from load“ fails.
- **The first option** (80 px under the figure) keeps the lead clear, but it leaves the Ortszeile covered in the audited demo build and adds 80 px for every visitor.
- **What a real fix needs:** shortening the hero arch on tall phones (or moving the Ortszeile), which changes the spec's validated 390 composition (arch 4:5, full width).

### 17.3 Tests

- `tsc --noEmit` clean; `vitest run` **232/232**.
- Landing E2E (`landing`, `landing-motion`, `landing-conversion`, both projects): **71 passed, 11 skipped, 0 failed** (82 tests, 6 new; the extra skips are the new viewport-gated tests).
- Full suite (`E2E_PORT=3100 npx playwright test`), build before `df466be`: **194 passed, 2 failed, 12 skipped** (208, 12.2 min). Both failures are `audit5.spec.ts:24` A5-1 (mobile and desktop). The demo customer's first upcoming booking is today at 09:00 Berlin. The run was after 09:00, so the server reports `canCancel: false` and there is no „Termin stornieren“ button to focus. This depends on the clock and the demo data, not on this work: the booking page and `checkout-cancel.tsx` are untouched. I did not run `demo:refresh`.
- Full suite on the final build: see 17.5.

### 17.4 Open, and handed on

- **RT-4 is not at its gate.** Settled: 6 of 9 runs ≤ 200 ms, not 3 of 3. Early: median 381 ms, not ≤ 300.
  - The remaining lever is the dialogs' async chunk: 28.8 KB raw, about 20 KB of it duplicated from the first-load chunk, because the loader lives in the layout's chunk group.
  - That is JS weight, so it goes with RT-5.
- **RT-8 and the 768 hero (RT-12, I-13)** need a composition decision; the geometry is in § 17.2.
- **Spec § 10.4** still lists the old 06–09 sizes (1000/1150/1600/1300 desktop, 1200/1500/2100/2200 mobile). The code now carries measured values; the spec owner should update the line.
- **`audit-2/scripts/jump.js` cannot run `t768`**: below 1024 it still uses the header „Kapitel“. `jump-residual.js` covers 768 and 1024.
- **Headings below 320 px by layout** (05 in the full tier, 08 below 1024, 10 at 768): whether a jump should land on the heading instead of the section is a design question.
- **The `none` tier still scrolls smoothly on jumps** unless reduced motion is set. That was the case before; spec § 8.2's table says "off". Unchanged.

### 17.5 Full E2E suite on the final build

Final build (`df466be`, build `Xao0MaO2OX_wgYFaPfts2`, left running on `:3100`):
- `E2E_PORT=3100 npx playwright test`: **194 passed, 2 failed, 12 skipped** (208 tests, 12.9 min).
- The only failure is A5-1 in both projects, for the time-of-day reason above. Every landing test passes, including the 6 new ones.
- `tsc --noEmit` clean; `vitest run` 232/232.

*Database: two full E2E runs and the landing suites as listed. They create searches, waitlist entries and the bookings the booking specs make and cancel. `demo:refresh` was not run.*

---

## 18. Remediation round 3 (engineer's measurements)

*The round-3 performance engineer's own claims, 2 Nov 2026. **This is not an audit score**; the dimensions stay as scored above until a re-audit. §§ 1–17 are unchanged.*

*Setup: production build on `:3100` (`npm run build` incl. `postbuild`, then `next start`), `DEMO_MODE=true`. No build, E2E run or other measurement ran in parallel with a measurement (the `next dev` server on `:3000` was idle). Lighthouse 12.8.2 from `/tmp/lh` (Chrome 153 headless, mobile, default simulated throttling). "Before" is my own run of the same script on the unchanged code (`4efc009`, build `Xao0MaO2OX…`) on this machine today, unless it is marked as § 17's or the auditor's. Final build: `1NNAjbrwzqoXKUo0jg2wz` (`62db5da`), left running on `:3100`.*

*Evidence: `docs/landing/audit-2-remediation-3/`. `scripts/` holds copies of `audit-2/scripts/` with only the output paths changed (the auditor's `audit-2/data/` stays untouched), plus new ones: `hero-geom.js` (hero geometry and first-view screenshots), `ab-proxy.js` + `lh-n.sh` + `lh-blocked.sh` (the Lighthouse A/B harness of § 18.4), `lantern.mjs` (re-runs Lantern on a saved trace and lists its graph), `chunk-modules.js` (modules of a Turbopack chunk), `fonts-probe.js`. `data/` holds their output; `before-hero-*.jpg` and `after-hero-*.jpg` are the first views.*

### 18.1 Commits

| Commit | Lever | Change |
|---|---|---|
| `500601b` | 5 (RT-6) | Spec § 8.1 and § 10.1, and the `tier.ts` comment: headless Lighthouse and PSI set `navigator.webdriver`, so they score `/` in the `none` tier; visitor numbers come from `?motion=lite` / `full`. No bypass. |
| `c5bd1b7` | 1 | `LandingImage` is a server component (`server-only`): `getImageProps()` builds the same optimiser URLs, `srcSet`, `sizes`, `loading` and fill style; the hero photo keeps `fetchPriority="high"` and its preload (React `preload()` with the same `imageSrcSet`/`imageSizes`). The hero arch, the 03 preview and the 07 screens get these attributes from the server as data and render a plain `<img>`. The 04/06 portraits are a server `LandingPortrait` with a small client `FadeImage` for the 640 ms fade-in; without JS the photo shows at once. |
| `8743b47` | 1, 3 | `RebookRow` fetches the suggestion as before; the row itself (Avatar with `next/image`, AiLabel, the image registry) is a separate chunk, loaded only when there is a suggestion. |
| `962038c` | 2 | The dialogs' `import()`s move from `nav/surfaces.ts` (layout chunk group) to `nav/surface-loader.ts`, imported by the hero's booking slot (page chunk group). |
| `56ad2f8` | 3 | `BookingEntry` split: Was?, Wann?, the waitlist form and the kit sheet of the mobile pickers are their own chunk (`booking-entry-pickers.tsx`), loaded in the first idle period after the entry mounts and at once on intent inside the form. Same on `/suche` and the discovery pages. |
| `20a72af` | 6 (RT-9) | `IntentLink`: the 10 search link and the 08/10 „Profi werden“ CTAs prefetch on intent only. |
| `62db5da` | 8, 9 | The hero's first view below 1024 (§ 18.6). |

**Not done, with the reason:**
- **tailwind-merge (lever 4):** every kit component in the shell takes a caller `className` (`Icon`, `Button`, `IconButton`, the sheet), and the root's toast and `MotionRoot` use `cn` too, so the 9.0 KB chunk stays in every route's first load (audit-1 § 17.6 #4 reached the same result).
- **A compact image registry (lever 3):** after the commits above no client module of `/`'s first load imports `@/lib/images`, so a smaller registry JSON would no longer change `/`'s gates. Not done.
- **The duplicate italic declaration (lever 6, second half):** see § 18.7.

### 18.2 Weight (`weight.js`, gzip -9)

| | Before | After |
|---|---|---|
| **First-load module scripts** | 13 files, 725 KB raw, **208.0 KB gz** | 12 files, 573 KB raw, **177.2 KB gz** (−30.8) |
| of which framework + root (react-dom 70.1, Next 44.0 + 8.5 + 2.0, Turbopack 4.3, root layout 8.0, tailwind-merge 9.0, loader manifests) | 146.2 | 146.4 |
| of which the landing | 61.9 (incl. `next/image` + registry 21.1) | 30.8 |
| CSS | 37.1 KB gz, 3 files | 37.4 KB gz (the hero rules of § 18.6) |
| HTML | 435 KB raw, 59.7 KB gz | 495 KB raw, **64.9 KB gz** (+5.2: the `srcSet` strings are now in the RSC payload too, 499 optimiser URLs) |

What left the first load (module analysis with `chunk-modules.js`):
- `next/image` (≈ 7 KB gz) and the image registry (`sources.json` 13.4 + `images.local.json` 0.9 KB gz): lever 1, the RebookRow row and the picker split. They now load only with the pickers (idle, after hydration) or a rebook suggestion.
- `BookingEntry` 7.9 → 6.5 KB gz, plus the date strip, chips, the waitlist form, the success check and the kit sheet.

Async chunks (raw): booking bar **25.3 → 6.3 KB**, booking sheet **28.8 → 9.9 KB**, chapter overlay 5.5 → 5.2 KB (lever 2). The pickers chunk is 28.9 KB raw (9.0 gz) plus the image chunk (21.2 gz).

**First-load JS ≤ 160 KB gz is not reachable without removing visitor function.** The framework and the root layout alone are 146.4 KB gz. That leaves 13.6 KB for the landing, whose header, dock and chapter navigation alone are 14.2 KB gz.

### 18.3 RT-5: Lighthouse 12 mobile, simulated, `/?motion=lite`

Score · LCP s · TBT ms. FCP 1.51–1.54 s and CLS 0 in every run; the motion runtime loaded in every run (the visitor tier). The first run after each server start is discarded and listed.

| Set | Runs | Median | Lowest |
|---|---|---|---|
| **Before** (`4efc009`; discarded: 84 · 4.40) | 89 · 3.70 · 29 / 91 · 3.41 · 46 / 87 · 4.00 · 10 / 84 · 4.35 · 48 ᶜ / 84 · 4.33 · 28 ᶜ / 84 · 4.41 · 83 ᶜ / 89 · 3.71 · 34 | **87** · LCP 4.00 | 84 |
| After levers 1–3, 6 (build `PcUpi…`; discarded: 92 · 3.26) | 89 · 3.71 · 21 / 89 · 3.71 · 5 / 92 · 3.25 · 48 ¹ / 92 · 3.25 · 54 / 92 · 3.26 · 33 / 84 · 4.27 · 81 ᶜ / 91 · 3.48 · 52 | 91 · LCP 3.48 | 84 |
| **Final** (`62db5da`, build `1NNAj…`; discarded: 90 · 3.49) | 89 · 3.77 · 27 / 91 · 3.26 · 134 / 92 · 3.24 · 23 / 91 · 3.47 · 42 / 92 · 3.26 · 12 / 92 · 3.26 · 64 / 86 · 4.12 · 5 ᶜ | **91** · LCP 3.26 · TBT 27 | **86** |

ᶜ the first-paint stall of § 18.4 (Speed Index 2.4–3.0 s instead of 1.5 s). ¹ a 10 s geometry probe of mine overlapped this run by mistake; it is kept and does not change the median.

Interleaved comparison of builds (same machine, same hour, `lh-n.sh`, 6 runs each): the audited `513f417` gave 84 ᶜ / 91 / 91 / 91 / 91 / 91 (median 91); `4efc009` (§ 17's final code, before this round) gave 91 / 76 ᶜ / 84 ᶜ / 94 / 87 / 82 ᶜ (median 85.5).

**Against the gate:**
- median ≥ 91: **met** (91; it was 87);
- no run below 89: **not met** (one stalled run at 86; § 18.4);
- first-load JS ≤ 160 KB gz: **not met** (177.2; § 18.2).


### 18.4 Why RT-5's "no run below 89" is not reachable here (measured constraint)

Lantern's LCP on this page is the transfer of everything that finished loading before the **observed** first paint, minus the scripts whose evaluation started after it (`lantern.mjs` re-runs Lantern on saved traces and reproduces Lighthouse's LCP to the millisecond). On localhost that paint happens at 0.2–0.3 s, in a race with the scripts' evaluation. Three outcomes show up in every set:

| Mode | Observed FCP | What Lantern counts | Simulated LCP · score, before → after |
|---|---|---|---|
| A | 0.25–0.30 s, before react-dom evaluates | HTML, CSS, fonts, the hero image, all scripts but react-dom (a saved baseline run: 21 requests, 387 KB) | 3.40 s · 91 → **3.24–3.26 s · 91–92** |
| B | the boot starts before the paint | the same plus react-dom (71 KB) and part of the boot (audit-1 § 17.4) | 3.70–4.00 s · 87–89 → **3.47–3.77 s · 89–91** |
| C | **1.2–1.3 s** (frame lost, see below) | everything loaded in the first 1.2 s, incl. the motion loader | 4.33–4.50 s · 76–84 → **4.12–4.27 s · 84–86** |

The weight work moved every mode down by 0.15–0.25 s. Mode C stays below 89 because it counts ≈ 480 KB, all of the first load.

**Mode C is a headless-Chromium presentation stall, not page work.** In the traces the first contentful frame is committed and activated at ≈ 0.28 s, then dropped (`PipelineReporter` `STATE_DROPPED`, `BACKFILL`). For ≈ 850 ms no main frame is requested while every thread is idle. FCP is recorded with the next presented frame. The A/B harness (`ab-proxy.js` injects CSS or rewrites the HTML on its way from `:3100`; `lh-blocked.sh` blocks URLs) gives these counts, 6 runs each unless noted (`data/stall-ab.json`):

| Variant | Stalled runs |
|---|---|
| control (same build through the proxy) | 4/6, later 0/2 |
| hero photo settle off / progress-arch animation off / both / every animation and transition off | 2/6 · 3/6 · 3/3 · 2/3 |
| tier `none` (`/`) · `@view-transition` off · `startViewTransition` removed · service worker 404 | 2/2 · 3/5 · 1/1 · 5/5 |
| JS blocked · fonts blocked · images hidden · LCP image `decoding=sync` | 1/5 · 2/5 · 2/2 · 2/2 |
| no `backdrop-filter` · audit-2's `contain-intrinsic-size` values · header and dock hidden | 1/2 · 2/3 · 1/6 |
| **only the hero rendered** (chapters 02–10 and the footer `display: none`) | **0/6** |
| a static one-paragraph page | 0/5 |
| the audited build (`513f417`, rebuilt in a worktree on `:3200`), interleaved with `4efc009` | 1/6 against 3/6 |

So the stall does not come with one feature. It goes away only when the first frame holds the hero alone, it also hits the audited build, and its rate varies with the machine's state: the auditor saw 1 in 12 runs, I saw 0 to 5 in 6. I found no change that avoids it without taking content out of the first frame. It is a lab artefact of headless Chromium on this machine: `perf.js` (CDP throttling, no screenshot tracing) gives FCP 2.14–2.26 s in every run (§ 18.8).

What would make the gate deterministic is a measurement off localhost (a deployed preview, where mode A/B is decided by real network order) or field data (CrUX/RUM).

### 18.5 RT-4: the booking sheet (`latency.js`, 412 × 823, 4× CPU, Slow 4G, cold; visible = event → first frame with the sheet)

| Scenario | Before (§ 17's final code, its runs) | After (final build) | Gate |
|---|---|---|---|
| settled, dock → sheet | 138 / 197 / 170 · 244 / 136 / 257 · 166 / 177 / 211 (median 177, 6 of 9 ≤ 200) | **209 / 196 / 190** (INP 216 / 200 / 192) | ≤ 200 in 3 of 3: **not met** (2 of 3) |
| early (1.5 s after load, dialogs cold) | 431 / 387 / 379 · 384 / 329 / 351 (median 381) | **386 / 283 / 303** (INP 344 / 272 / 264), median 303 | ≤ 300: **not met** (1 of 3) |

The other interactions of the settled run (visible, ms):
- Was? in the sheet: 108 / 128 / 86 (§ 17: median 89);
- overlay open: 144 / 215 / 188;
- place switch: 234 / 192 / 153;
- FAQ: 156 / 93 / 162;
- 07 tab: 125 / 102 / 140;
- Esc in the sheet: 67 / 51 / 42;
- Esc in the overlay: 199 / 179 / 335.

What changed for the sheet:
- **The early tap** got about 50–80 ms faster. The dialogs' chunks no longer repeat 38 KB raw of the page's modules (§ 18.2), so the evaluation inside the cold tap is shorter. The cold open still loads and mounts the dialogs and renders the sheet's entry inside the tap.
- **The settled open** is unchanged within the noise: 190–209 ms, against 136–257 ms in § 17. It is the modal's inert restyle of what is in view plus the sheet's first styles, which § 17.2 measured as inherent to a modal over a visible page.
- **Remaining levers:** a chunk preload before the first engagement would add TBT (audit-1 PT-1's trade-off). Pre-rendering the dialogs at idle without the visitor engaging is the same trade.

### 18.6 Layout items 8 and 9 (`hero-geom.js`, at load, visitor tier, demo build with its ribbon)

**How it works (`landing.css` § 5, `62db5da`).** Below 1024 the hero figure's width is `min(100%, 0.8 × --lp-arch-h)`, centred, so the arch keeps 4:5. The height cap is `100svh` minus where the arch starts at load (header, the hero's head, the 28 px figure margin, plus the demo ribbon when `[data-demo-ribbon]` is on the page) minus what must fit under it.
- **Phones:** the Ortszeile (one line, two below 400 px, where the narrower arch makes it wrap after a „ · “), 12 px of air and the dock with its inset. The cap only applies when the natural Ortszeile would start above the fold (a `sign()` term). When it lies below the fold anyway (390 × 664, 360 × 740), nothing changes. The Ortszeile stays aligned to the arch's left edge and may run on to the column edge.
- **768–1023:** one centred 36rem column, ordered text → arch → booking entry → lead → „So funktioniert’s“ (CSS `order`; the DOM and reading order are unchanged: head, figure, lead, link, entry). The cap is sized so that the stacked entry fits. If that would leave less than 300 px of arch (1023 × 768), the arch is instead tall enough that the Ortszeile starts below the fold, never under the dock.
- **Fallback:** without `sign()` support the declaration is dropped and the arch keeps its natural size.
- **Unchanged:** the dock (visible at load, the I-4 rule and its E2E), DOM order, ≥ 1024.

| Viewport | Arch before → after (px) | Ortszeile vs dock top, before → after | PLZ top / CTA bottom, before → after |
|---|---|---|---|
| 390 × 844 | 350 × 438 → **280 × 350** | 814–829 under 776 (−53) → 726–758, **18 px clear** | 1068 / 1290 → 996 / 1218 |
| 412 × 915 | 372 × 465 → **350 × 438** | 844–860 under 847 (−13) → 817–833, **14 px clear** | — |
| 430 × 932 | 390 × 488 → **364 × 455** | 869–884 under 864 (−20) → 836–852, **12 px clear** | — |
| 390 × 664 | 350 × 438, unchanged | 814 > fold 664 (not visible), unchanged | — |
| 360 × 740 | 320 × 400, unchanged | 773 > fold 740 (not visible), unchanged | — |
| **768 × 1024** | 523 × 654 (8-col grid, right part empty) → **243 × 304**, centred column | dock hidden (entry in view) | 1301 / 1523 → **786 / 1007: both in the first view** |
| 820 × 1180 | 562 × 703 → **364 × 455** | dock hidden | 1357 / 1578 → **942 / 1164: in view** |
| 1023 × 768 | 714 × 893 → **265 × 331** | Ortszeile 777–793, below the fold (dock 700–756) | 1574 / 1795 → 843 / 1065 (one scroll) |
| 1024 × 768 · 1440 × 900 | 373 × 645 · 628 × 756, **identical** | — | 664 / 696 · 775 / 807, identical |

Screenshots: `before-hero-{m390,m412,m430,m390s,m360,t768,t820,l1023,d1024,d1440}.jpg` and `after-hero-*.jpg`.
- **Brand checks:** the arch geometry is the kit's O-curve at 4:5; one italic (the tagline); Oxblood once per view (the hero CTA at 768/820; none in the phone first view, where the dock CTA is Espresso).
- **Production:** without the ribbon every number above moves up by 47 px (phones) / 33 px (768–1023), the cap adapts, and the clearances stay the same.

The 768–1023 visual order puts the entry before the lead and „So funktioniert’s“, while the DOM keeps them before it. Keyboard focus therefore reaches „So funktioniert’s“ before the PLZ field there. That follows the Lead's order (text, arch, entry); an auditor may want to weigh it under 2.4.3.

### 18.7 RT-9 and RT-6

- **N-6 (unused CSS preload):** `IntentLink` (`20a72af`). `tech.js` (visitor tier, webdriver masked, a full scroll at 1440, 1280, 1024, 768, 430, 412, 390, 320): **0 console warnings or errors at every width** (the audit had the `11sda7nbphjp0.css … preloaded but not used` warning on every visit at ≤ 768 and on desktop walks).
- **N-9 (the italic declared twice):** not done; this is a measured constraint of `next/font`.
  - The file name encodes the preload flag: `newsreader_display_italic-s.<hash>.woff2` for the root's non-preloaded declaration, `-s.p.<hash>.woff2` for the landing's preloaded one.
  - The preload list is per route entry (`next-font-manifest.json`), taken from the declarations its module graph imports.
  - So **one** declaration is either preloaded on every route that imports it (the root: all routes, which A5-9 rejected) or on none. If it is on none, `/` loses the tagline font's preload (spec § 10.5), and on a slow network the tagline renders in the Times fallback first and then swaps.
  - Keeping `/`'s preload with a single declaration would need the hashed URL in a manual preload, which `next/font` does not expose. The workarounds are a hand-written `@font-face` with copied fallback metrics, or reading build manifests at runtime. Both are more fragile than the duplicate.
  - What N-9 actually costs: routes that prefetch `/` (the logo link, on viewport) fetch the landing's `.p.` copy next to their own. `routes.js`: `/` fetches each font file once (Instrument Sans `.p.`, italic `.p.`, roman `-s.` after `load`); `/suche`, `/behandlungen`, `/staedte`, `/fuer-profis`, `/hilfe` and `/impressum` still fetch both italic URLs, and the 404 both roman and both italic URLs, unchanged from the audit's `routes.json`.
  - Lead decision needed: italic preloaded everywhere, nowhere, or the duplicate kept.
- **RT-6:** `500601b` (spec § 8.1 and § 10.1, `tier.ts`). The tier gate numbers above are all `/?motion=lite`.

### 18.8 No regressions

| Check | Before | After |
|---|---|---|
| TBT, `MASK=1 perf.js mobile slow4g 3` | § 17: 115 / 121 / 155 (median 121) | **89 / 84 / 128 (median 89)**: ≤ 200 met |
| LCP / FCP, same runs | 2.25–2.42 s | LCP 2,288 / 2,260 / 2,320 ms, FCP 2,144 / 2,260 / 2,172 (LCP element the hero `<img>` every time): ≤ 2.5 s met |
| CLS, same runs; Lighthouse | 0 | **0** in all 3 and in all Lighthouse runs: ≤ 0.05 met |
| Overlay open (perf.js 4th interaction) | 152–232 ms | 208 / 168 / 184 ms |
| No JS (`tech.js`, 1440 and 390) | 10 chapters, GET form | **10 chapters in order, form `action="/suche"`, portraits at opacity 1**, 11 Activity markers, 0 outlined segments, 0 Suspense fallbacks |
| Motion tiers, reduced motion | — | landing E2E: tiers (`none` under automation, `?motion=` overrides), reduced-motion final states, pins below the fold, reveals: pass |
| Desktop hero (1024 × 768, 1440 × 900) | — | identical geometry (§ 18.6) |
| Console | 1 warning per visit (N-6) | 0 at 8 widths |

### 18.9 Tests

- `npx tsc --noEmit`: clean. `npx vitest run`: **232/232** (27 files).
- Landing E2E (`landing`, `landing-motion`, `landing-conversion`, both projects) on the final build: **71 passed, 11 skipped, 0 failed** (82).
- Full suite on the final build (`E2E_PORT=3100 npx playwright test`): **196 passed, 12 skipped, 0 failed** (208 tests, 10.1 min).

*Database: the E2E runs create searches, waitlist entries and bookings as before; `demo:refresh` was not run.*

### 18.10 Open, and handed on

- **RT-5, "no run below 89":** a headless-Chromium first-frame stall on this machine (§ 18.4); the median gate is met. A deployed preview or field data would settle it.
- **First-load JS ≤ 160 KB:** framework + root are 146.4 KB gz (§ 18.2). Further cuts would have to come from the root (tailwind-merge needs the "keep `cn`" rule relaxed) or from the landing shell (header, dock, navigation: 14.2 KB).
- **RT-4:** settled 2 of 3 ≤ 200 ms, early median 303 ms (§ 18.5).
- **N-9:** needs a Lead decision on the italic preload (§ 18.7).
- **768–1023:** focus order differs from visual order between the lead link and the entry (§ 18.6).
- **The 404** still fetches both roman and both italic URLs (outside the landing).

---

## 19. Lead follow-ups after remediation round 3 (Lead's own notes, not an audit score)

- **768–1023 focus order (round-3 open item):** fixed. The hero renders „So funktioniert’s“ twice in the DOM: after the lead (shown below 768 and from 1024) and after the booking entry (shown only at 768–1023, where the entry sits visually before the lead). The copy that isn't shown has `display: none`, so exactly one is in the focus order and the a11y tree. Tab walk, `?motion=none`:
  - **768 × 1024:** place switch → PLZ (786) → location button → Was? → Wann? → „Freie Termine finden“ (955) → „So funktioniert’s“ (1201).
  - **390 × 844 and 1440 × 900:** unchanged (place switch → link → entry).
  - Landing E2E on the rebuilt :3100: 71 passed, 11 skipped, 0 failed.
  - Files: `chapters/01-hero.tsx`, `(landing)/landing.css` (§ 5), `tests/e2e/landing-motion.spec.ts` (the jump test clicks the visible link).
- **Duplicate italic declaration (N-9, P3):** kept, by Lead decision.
  - Preloading the italic on every route would reverse the font-budget decision of Design-v2 audit A5-9: most routes have no accent above the fold.
  - Dropping the preload on `/` would let the italic hero tagline swap late.
  - Net effect of keeping it: the italic downloads twice only on a route that prefetches `/`. This is a documented constraint of `next/font`: the preload flag is part of the file URL.
- **Measurement gotcha for anyone rebuilding locally:** Next 16.4 writes ISR output to `.next/server/route-cache/`. If the old `next start` is still running when a new build finishes, it can write stale HTML there, and the new server then serves it (`x-nextjs-cache: HIT`). Stop the server before building, or delete `.next/server/route-cache` before restarting. Fresh CI and Netlify builds are not affected. Whether any earlier local measurement hit a stale entry is not known; audit 3 starts from a cleared route cache.
