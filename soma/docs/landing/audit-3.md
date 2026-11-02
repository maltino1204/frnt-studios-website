# SOMA landing page: independent quality audit 3

*Independent Landing Auditor · 2 Nov 2026 · production build on `http://localhost:3100`. Built at 10:17 UTC (build `MnlVpWZVuzV1k5gi0opuu`) from the code at branch head `e1386f0`; its last code commit, `f94ae08`, is in the build (`lp-hero-how-after` is in the served HTML and CSS). Server started 10:20, route cache freshly written (`x-nextjs-cache: HIT` after the first request), `DEMO_MODE=true`.*
*Evidence: `docs/landing/audit-3/` (screenshots, contact sheets, raw JSON and logs in `data/`, every probe in `scripts/`). Every number below was measured on this build in this audit. I changed nothing in `src/`, tests, configs or other docs, did not restart or rebuild `:3100`, and did not run `demo:refresh`.*
*Audit 2 §§ 17–19 are the engineers' and the Lead's own claims. I re-measured them (§ 6); I did not take them as given.*

---

## 1. Summary and verdict

The three remediation rounds since audit 2 fixed what they set out to fix, and the fixes hold under independent measurement:

| Audit-2 P1 | Now |
|---|---|
| N-1, chapter jumps overshoot | Fixed. They land at every width I tested: 390, 412, 768, 1024 touch, 1024 fine pointer, 1440. |
| N-2, dead 05 stage CTA | Fixed. It takes real clicks at every step. |
| N-3, PLZ typed before hydration | Kept (3 of 3 runs). |

The rest:
- **Lighthouse mobile** on the visitor tier (`?motion=lite`) now has a median of **92** over 9 runs. The engineers claimed 91.
- LCP, TBT and CLS are within target. Desktop scores 100.
- The 768–1023 hero is recomposed, with the booking entry in the first view at 768 × 1024.
- The dock no longer covers the hero Ortszeile.
- The console is clean at 8 widths. The landing E2E suite passes: 71 passed, 11 skipped, 0 failed.

**The gate is still not met: Performance stays at 7.**

1. **Interactions on a throttled phone (4× CPU) are still at or over the line.**
   - The main mobile conversion tap (dock „Termin finden“ → booking sheet) shows the sheet after 148–305 ms. The median is 197 ms; 3 of 6 runs are over 200.
   - Tapped in the first seconds after load, it takes **330–633 ms** (median 382).
   - § 18.5 reported an early median of 303. I did not reproduce that.
2. **Round 3 introduced three latency regressions.**
   - **Was? list (M-2):** the inline list in the sheet appears **345–457 ms** after the tap. The empty frame shows at 85–164 ms, and that frame is what § 17 measured.
   - **Early Was? tap (M-3):** a first tap on Was? right after hydration waits **0.46–1.02 s** for the pickers chunk, on the landing and on the discovery pages.
   - **DevTools TBT (M-4):** median **112 → 199 ms** (2 of 5 runs over 200). The pickers' image chunk now evaluates inside the TBT window.
3. **Constraints outside the page.** Two remaining gate items, accepted and not counted against the score:
   - Lighthouse's "no run below 89": a headless first-frame stall on this machine. I reproduced its signature, and it also hits another route (§ 11.2).
   - First-load JS ≤ 160 KB gz: the framework and root layout alone are about 148 KB of the 177 KB (§ 11.6).

**Verdict: 10 of 11 dimensions ≥ 8 (audit 2: 6 of 11). Not passing, because Performance is 7.**
- Interaction design, mobile, UX and conversion each move from 7 to 8.
- What Performance needs is in § 15: the sheet within 200 ms on a warm open, and the picker cost moved out of the tap and out of the TBT window.

## 2. Scores

| # | Dimension | A1 | A2 | **A3** | One-line basis |
|---|---|---|---|---|---|
| 1 | Overall visual experience | 8 | 8 | **8** | Coherent at every width, and the night band now loads dark. Held back by: the arch below 1024 is noticeably smaller (280 px at 390, 243 px at 768, 265 px at 1023 × 768), so the first view is less immersive; all imagery is AI interim. |
| 2 | Brand fidelity | 9 | 9 | **9** | Middle dots now carry no-break spaces. One italic, one Oxblood moment per view, no logo inside the arch (seal at 42 % / 31 %). Minor: the phone Ortszeile runs past the arch's right edge. |
| 3 | Typography and composition | 8 | 8 | **8** | The 768–1023 single column puts PLZ and CTA in the first view, with focus order = visual order. Minor: the lead sits under the dock at load on phones; the arch cap relies on hard-coded head heights. |
| 4 | Interaction design | 8 | 7 | **8** | Jumps land everywhere, the 05 CTA clicks, rapid input settles, the overlay opens in ≤ 200 ms. Minor to moderate: Was? list 393 ms; Esc leaves the overlay up for 203–308 ms. |
| 5 | Animation quality | 8 | 8 | **8** | 02 statement now arrives with line 3. Seal, tiers and reduced motion are correct. Full tier at 4× CPU: 45 frames > 50 ms (A2 40). |
| 6 | Mobile experience | 8 | 7 | **8** | Booking control always in view. The Ortszeile clears the dock, jumps land, early typing is kept. Held back by sheet and Was? latency at 4× (§ 11.4) and the lead under the dock at load. |
| 7 | User experience | 8 | 7 | **8** | Chapter navigation works, early input is safe, no-JS has real chapter links. |
| 8 | Conversion clarity | 8 | 7 | **8** | Every CTA and hand-off verified (37 routes 200, parameters kept, stage CTA by mouse and keyboard). Minor: the first Was? tap on a slow phone waits up to 1 s. |
| 9 | Technical quality | 8 | 8 | **8** | E2E 71/11/0, console 0 at 8 widths and 10 walks, JSON-LD equals the FAQ, no outlined segments. Minor: the hero `sizes` is stale under the new cap (over-fetch), HTML +70 KB raw. |
| 10 | Accessibility | 8 | 8 | **8** | axe 0 violations at 1440, 768 and 390. Header targets 44 px, skip links 44 px, traps and focus return, hero focus order fixed at 768–1023. Not 9: no screen-reader pass, desktop footer links 32 px. |
| 11 | Performance | 7 | 7 | **7** | LH mobile median 92, LCP 2.30 s, TBT 106 ms, CLS 0, desktop 100. **Sheet open median 197 ms (3/6 > 200), early 382 ms; Was? list 393 ms; DevTools TBT median 199.** |

**10 of 11 dimensions are ≥ 8. Performance is below the gate. The tasks are in § 15.**

---

## 3. Method and environment

- **Browser and viewports.** Playwright with Chromium 153 (headless, software compositing).
  - Desktop: 1920 × 1080, 1440 × 900, 1280 × 800 and 720, 1024 × 768 (fine pointer).
  - Tablet: 1024 × 768 (touch), 1023 × 768 (touch), 820 × 1180, 768 × 1024.
  - Phone: 430 × 932, 412 × 915, 390 × 844, 390 × 664, 360 × 740, 320 × 640.
- **Visitor tiers, as in audit 2.** Lighthouse and PSI run with `navigator.webdriver = true`, so a plain `/` gets the `none` tier.
  - Mobile gates use `/?motion=lite`, which loaded the motion runtime in 9 of 9 runs.
  - Desktop uses `/?motion=full`. `/` is reported for comparison.
  - Playwright probes mask `webdriver` where the visitor code path matters.
- **Lighthouse 12.8.2** (`/tmp/lh`): mobile default simulate, mobile DevTools throttling, desktop preset. Every run is reported; none were discarded (§ 11.1).
- **Throttled lab runs.** Moto-G-like context (412 × 823, DPR 1.75), 4× CPU, Slow 4G, cold:
  - `perf.js` (audit 1's);
  - `latency.js`: Event Timing next to the *visible* response; it now also records the inline list separately from its height-holding frame;
  - `hydration.js`, `early.js`.
- **Order of runs.** Measurements ran strictly one after another (`scripts/perf-chain.sh`). Functional probes ran after that (`scripts/func-chain.sh`), then the E2E suite. The `next dev` server on :3000 was idle.
- **Not verified:** WebKit and iOS Safari, real devices, screen readers. In §§ 4.4 and 7: whether the native smooth scroll yields to a real finger (synthetic touch and wheel in headless do not interrupt it; the library itself makes no correction after visitor input).

---

## 4. Per-dimension evidence

### 4.1 Overall visual experience: 8

**Contact sheets:**
- desktop and tablet: `sheet-walk-d1440-full.jpg`, `sheet-walk-d1024-full.jpg`, `sheet-walk-t768-lite.jpg`, `sheet-walk-t820-lite.jpg`;
- phones: `sheet-walk-m430-lite.jpg`, `sheet-walk-m390-lite.jpg`, `sheet-walk-m320-lite.jpg`;
- reduced motion: `sheet-walk-d1440-auto-reduce.jpg`;
- no JS: `sheet-walk-d1440-auto-nojs.jpg`, `sheet-walk-m390-auto-nojs.jpg`.

**Better than audit 2:**
- The 768 hero is no longer half-empty: one centred column, with the arch, the entry and the CTA in the first view (`hero-t768.png`, `hero-t820.png`).
- With images blocked, the night band loads on Espresso `rgb(37,33,31)` at 768 and 390 (`t768-05-wash-images-blocked.jpg`; I-11 fixed).
- The Ortszeile is no longer under the dock on phones (`hero-m390.png`, `hero-m412.png`).

**What keeps it at 8:**
- **The capped arch is small below 1024.**

  | Viewport | Arch width | Share of the viewport |
  |---|---|---|
  | 390 | 280 px | 72 % |
  | 768 | 243 px | 32 % |
  | 820 | 364 px | 44 % |
  | 1023 × 768 | 265 px | 26 %, in a mostly empty Bone field (`hero-t1023.png`) |

  It solves the first-view problem by trading away the immersive photo. That is a design trade-off rather than a defect, but at 1023 × 768 the hero reads sparse.
- All imagery is AI interim (I-16).

### 4.2 Brand fidelity: 9

- **Type and accents:** the italic leaves are the two tagline spans; `h1 em, h2 em` = 0 (`data/a11y-*.json`).
- **Middle dots:** a no-break space on both sides now (`site/booking-entry-shared.ts:14`, `DOT = " · "`; `d1440-hero-filled.png`: „10115 · Berlin“, „Morgen · Abends“; I-14 fixed). Instrument Sans still sets them narrow, as the brand note says.
- **Seal:** plays at a 42 % share (full) and 31 % (lite), the header logo steps back with it, and no mark sits inside the arch (`sheet-seal-approach.jpg`).
- **Minor:** on phones the Ortszeile runs past the arch's right edge (`landing.css` `.lp-hero-figure > figcaption { width: max-content }`). It is still left-aligned to the arch and wraps between segments.

### 4.3 Typography and composition: 8

| Viewport | Arch (incl. caption) | Ortszeile | Dock top | Lead top | Submit in view |
|---|---|---|---|---|---|
| 1440 | 628 × 784 | 901–917 (below the fold, demo ribbon) | — | 503 | yes |
| 1024 | 373 × 673 | 790–806 | — | 423 | yes |
| 1023 × 768 | 265 × 359 | 777–793 | 700 | 1161 | no (one scroll) |
| 820 | 364 × 482 | 876–892 | hidden | 1260 | yes |
| 768 | 243 × 332 | 720–735 | hidden | 1103 | yes |
| 430 | 364 × 483 | 836–852 | 864 (12 px clear) | 876 (under the dock) | no |
| 412 | 350 × 466 | 817–833 | 847 (14 px clear) | 857 (under the dock) | no |
| 390 | 280 × 393 | 726–758 (2 lines) | 776 (18 px clear) | 782 (under the dock) | no |

Source: `data/firstview.json`. The tagline is 2 lines at every width. Placeholders fit everywhere (`placeholder.js`).

- **08 band:** 1 CTA row, no overlap, at 1024–1920 (`band.js`).
- **Skip link:** 179 × 44 px.
- **What keeps it at 8:**
  - The lead's first line is under the dock glass at load on phones (M-7).
  - The cap is computed from hard-coded head heights (`landing.css:373` `322px`, `:401` `292px + 10.9vw`). A longer H1, another font or user text scaling would shift it without warning (M-8).

### 4.4 Interaction design: 8 (A2 7)

**N-1, chapter jumps: fixed.** Measured on a fresh page per target, 4 s after the tap. Values are `h2` top / section top, followed by the active chapter (`data/logs/jump.log`, `data/jump-t768_t1024_d1024_d1440.json`):

| From the overlay | 390 | 412 | 768 (Menü) | 1024 touch | 1024 fine | 1440 |
|---|---|---|---|---|---|---|
| 03 | 239/136 · 03 | 238/136 · 03 | 278/152 · 03 | 311/152 · 03 | 311/152 · 03 | 310/152 · 03 |
| 05 | 239/136 · 05 | 238/136 · 05 | 279/152 · 05 | 311/152 · 05 | 556/152 · 05 | 599/152 · 05 |
| 06 | 239 · 06 | 246 · 06 | 279 · 06 | 311 · 06 | 310 · 06 | 310 · 06 |
| 07 | 238 · 07 | 236 · 07 | 279 · 07 | 311 · 07 | 311 · 07 | 311 · 07 |
| 09 | 238 · 09 | 239 · 09 | 273 · 09 | 310 · 09 | 311 · 09 | 311 · 09 |
| 10 | 269 · 10 | 303 · 10 | 358 · 10 | 264 · 10 | 263 · 10 | 313 · 10 |

- Every section lands at its scroll margin (134–153 px) with the target active.
- The `h2` sits lower only where the layout puts something above it (05 in the full tier under the dusk spacer, 10 at 768).
- The hero „So funktioniert’s“ lands at 238 (390) and 310 (1440); the foot links and reduced-motion jumps land as well (`jump2.js`).
- From tap to scroll start: 22–35 ms (`data/jump-delay.json`).
- **Visitor input during a jump** (`jump-user.js`, `scrollIntoView` instrumented): the library issued **0 corrective calls after the input** at 1440. The page still travelled on because the native smooth scroll in headless Chromium is not interrupted by synthetic wheel or touch. I cannot confirm how a real finger behaves here.

**N-2, 05 stage CTA: fixed.**
- `stagecta.js`: `hitIsCta: true`, and a mouse click gives „dialog open: Termin finden“ at steps 1–7 (1440) and 0–6 (1024 fine pointer).
- `hittest.js` at 1440, 1024 full, 1024 touch, 768 and 390: no covered control. The only flag is the disabled rail arrow, which is `pointer-events: none` by design.

**Other checks:**
- Overlay: focus in, 17–18 stops, 0 escapes, Esc returns focus.
- Bar: focuses the PLZ, and Esc returns to „Termin finden“.
- Place switch: radios (arrows, End) and swipe.
- 07 tabs and FAQ work by keyboard.
- Rapid input settles on the last switch (`rapid.js`).

**What keeps it at 8, not 9:**
- The inline Was? list arrives 345–457 ms after the tap (M-2).
- Esc on the chapter overlay: Event Timing 16–24 ms, but the overlay stays on screen for 203–308 ms (M-6).
- The sheet's warm open is at the line (§ 11.4).

### 4.5 Animation quality: 8

- **I-12 fixed:** at f = 1.2 the closing statement is at opacity 0 together with line 3, and it rises with it (`data/seal-doorway-d1440-full.json`).
- **Seal:** idle → active at 42 % (full) and 31 % (lite) (`data/logs/sealtrig-*.log`).
- **Tiers:** E2E for tiers, reduced motion, reveals and pins all passes. Reduced motion shows final frames (`sheet-walk-d1440-auto-reduce.jpg`).
- **Scroll smoothness** (`scrollperf.js`; A2 in brackets):

| Run | p95 | p99 | Frames > 50 ms | Long tasks | Scroll CLS |
|---|---|---|---|---|---|
| 1440 full, 1× | 33.4 (33.4) | 49.9 (50.0) | 1 (2) | 0 | 0.0073 (0.0056) |
| 1440 full, 4× | 66.7 (66.6) | **133.2** (100.0) | **45** (40) | 26, max 172 (19, max 97) | 0.0109 (0.0093) |
| 390 lite, 4× | 33.3 (33.3) | 50.1 (33.4) | 8 (4) | 6, max 89 (5) | 0 |
| 390 lite, 1× | 16.7 | 16.8 | 0 | 0 | 0 |

  The full tier at 4× has drifted a little worse in each audit (N-11). Not a defect at 1×.

### 4.6 Mobile experience: 8 (A2 7)

**Fixed:**
- **Booking access:** `dockreal.js` shows the dock at load on 6 phone sizes; `mobile.js` at 390 and 412 has `noBookingControlAt: []`.
- **Dock and sheet:** the sheet opens with the PLZ focused, one dialog, and submits `/suche?plz=10115&kategorie=massage`. The swipe works. The header hides and returns.
- **Footer:** the legal row stays clear of the dock.
- **Hydration:** early typing is kept (§ 11.5), and the hero form now hydrates at 4.43–4.72 s (A2 4.80–4.89).

**What keeps it at 8:**
- On a 4× phone the sheet opens in 148–305 ms (warm) and 330–633 ms (early).
- The inline list takes 393 ms.
- The first Was? tap right after hydration takes 0.8–1.0 s on the hero (§ 11.4).
- The lead is under the dock at load.

None of these blocks a task; all are counted under Performance.

### 4.7 User experience: 8 (A2 7)

- A phone visitor who picks any chapter in „Kapitel“ lands on it.
- A visitor who types the PLZ in the first seconds keeps it, sees „· Berlin“, and reaches `/suche?plz=10115` (3 of 3).
- No-JS visitors get real „Kapitel“ / „Menü“ links to a static chapter list (`sheet-walk-m390-auto-nojs.jpg`; N-10 fixed).
- For returning customers, the lazy „Erneut buchen“ row appears under the hero entry (logged in as `testkunde@soma.test`: „Erneut buchen: Hot-Stone-Massage bei Selin A.“, CLS 0.0001, no console messages; `rebook-d1440.png`).

### 4.8 Conversion clarity: 8 (A2 7)

| Flow | Result (`conv.js`, `conv2.js`, `mobile.js`, E2E) |
|---|---|
| Hero (desktop), all four parameters | `/suche?plz=10115&kategorie=massage&leistung=entspannungsmassage&datum=2026-11-03&zeit=abends`; H1 „Entspannungsmassage (klassisch) in 10115 Berlin“ |
| Deep link `/?plz=10435&…&zeit=abends#termin` | Prefilled and submitted unchanged |
| Mobile sheet: 50667 + Maniküre + Morgen / Nachmittags | `/suche?plz=50667&kategorie=manikuere&datum=2026-11-03&zeit=mittags`; H1 „Maniküre in 50667 Köln“ |
| 05 stage CTA (mouse and keyboard) | Opens the booking bar with the shared PLZ |
| Final CTA (10), now an `IntentLink` | `/suche` → `/suche?plz=20095` after a PLZ is typed |
| Profi CTAs | `/pro/registrieren` 200; `/fuer-profis#provision` present |
| Unserved PLZ 99998 | Waitlist path |
| No JS | GET form → `/suche?plz=10115` |
| Links | 37 unique routes 200; 11 anchors; 0 RSC prefetches during a full mobile scroll (A2: 2) |

**Not 9:** the first Was? tap on a slow phone waits for the pickers chunk (M-3).

### 4.9 Technical quality: 8

- **E2E** (`data/e2e-landing.log`, landing suites, both projects): **71 passed, 11 skipped, 0 failed** (3.7 min). This matches § 18.9.
- **Console:** 0 errors and 0 warnings at 8 widths with a full scroll (`tech.js`), and 0 in all 10 walks (N-6 fixed).
- **Markup:** 11 Activity markers, 0 outlined segments; 1 `h1`; DOM 1,433 nodes; JSON-LD has Organization, WebSite, WebPage and FAQPage, with the 9 FAQ items equal to the accordion.
- **No JS:** header glass; portraits at opacity 1; the dock shows the „Kapitel“ link and „Termin finden“.
- **What keeps it at 8:**
  - **M-5:** the hero `sizes` (`hero/places.ts:55`) still describes the uncapped arch, so the LCP image is over-fetched below 1024:

    | Viewport | Rendered | Loaded | Needed |
    |---|---|---|---|
    | 390 | 280 css px | 828 w (29.0 KB) | 640 w (19.1 KB) |
    | 768 | 243 css px | 1080 w (45.6 KB) | 640 w (19.1 KB) |
    | 820 | 364 css px | 1280 w (58.9 KB) | 828 w (29.0 KB) |
    | 1023 × 768 | 265 css px | 828 w (29.0 KB) | 384 w (8.6 KB) |

  - **HTML** is 496 KB raw / 65.0 KB gz (A2 426 / 58.8), because the `srcSet` strings now sit in the RSC payload too.

### 4.10 Accessibility: 8

See § 12.

### 4.11 Performance: 7

See § 11.

---

## 5. Status of every open audit-2 item

| ID | Audit-2 issue | Status | Evidence |
|---|---|---|---|
| N-1 / RT-1 | Chapter jumps overshoot | **Fixed** | § 4.4 table; E2E asserts the landing |
| N-2 / RT-2 | 05 stage CTA dead to the mouse | **Fixed** | `stagecta.js`, `hittest.js` |
| N-3 / RT-3 | Early PLZ wiped | **Fixed** | `early.js` 3/3: „10115“, „· Berlin“, `/suche?plz=10115` |
| N-4 / RT-4 | Booking sheet 270–520 ms | **Partly fixed** | Warm open 148–305 (median 197, 3/6 ≤ 200); early 330–633 (median 382). Gate (3/3 ≤ 200, early ≤ 300) not met |
| N-5 / RT-6 | Lighthouse scores `/` in `none` | **Fixed** (documented) | spec § 8.1 and § 10.1, `motion/tier.ts:8-11`; no bypass; gates quoted on `?motion=lite` |
| N-6 / RT-9a | Console warning (unused CSS preload) | **Fixed** | 0 messages at 8 widths and 10 walks |
| N-7 / RT-8 | Dock over the hero Ortszeile | **Fixed** for the Ortszeile (12–18 px clear); the lead is still under the dock (M-7) | `data/firstview.json` |
| N-8 / RT-13 | Stale font comment | **Fixed** | `(landing)/layout.tsx:14-22` |
| N-9 / RT-9b | Italic downloaded twice on routes that prefetch `/` | **Kept by Lead decision** (§ 19). Unchanged: `/suche` and `/behandlungen` fetch both italic URLs; the 404 fetches both roman and both italic | `data/routes.json` |
| N-10 / RT-12 | No-JS „Kapitel“ / „Menü“ inert | **Fixed** | `<noscript>` links to `#kapitel`; `sheet-walk-*-nojs.jpg` |
| N-11 | Full tier at 4× drops frames | **Not fixed** (45 vs 40 frames > 50 ms) | § 4.5 |
| N-12 / RT-7 | Was? no pending feedback | **Partly fixed:** frame and `aria-expanded` at the tap (85–164 ms), but the list arrives at 345–457 ms (M-2) | `data/latency-settled-*.json` |
| I-11 | Light washes on the night band | **Fixed** | Espresso at 768 and 390 |
| I-12 / RT-11 | 02 statement before line 3 | **Fixed** | `seal.js` doorway part |
| I-13 / RT-12 | 768 hero half-empty | **Fixed** (recomposed; trade-off in § 4.1) | `hero-t768.png` |
| I-14 / RT-10 | Middle dots | **Fixed** | `booking-entry-shared.ts:14` |
| I-15 / RT-12 | 40 px header targets | **Fixed** for the header (44 px). Desktop footer links still 32 px (AA passes) | `data/a11y-d1440-full.json` |
| I-16 | AI interim imagery | **Open** (launch blocker, labelled) | — |
| RT-5 | LH ≥ 90 median, no run < 89, JS ≤ 160 KB | **Median met** (92). "No run < 89" is a constraint (§ 11.2). JS 177.2 KB is a constraint (§ 11.6) | § 11 |

## 6. The claims in audit-2 §§ 17–19, re-measured

| Claim | Audit 3 | Holds? |
|---|---|---|
| `jump.js m390` 239 / 239 / 239 / 238 / 238 / 268, all in view | 239 / 239 / 239 / 238 / 238 / 269 | Yes, to the pixel |
| `jump-residual`: 768 and 1024 land at the scroll margin | 768 (via Menü): sections at 147–153 | Yes |
| Stage CTA 6/6 at 1440 and 1024 | 7/7 (1440), 7/7 (1024) | Yes |
| `early.js` 3/3 | 3/3 | Yes |
| RT-4 settled 209 / 196 / 190 (§ 18.5) | 148 / 222 / 305 / 170 / 276 / 172 (median 197) | Consistent; gate not met (agreed) |
| RT-4 early median 303 (§ 18.5) | 366 / 335 / 633 / 330 / 398 / 485 (median 382) | **No:** slower than claimed |
| RT-7 Was? median 89 (§ 17) / 86–128 (§ 18.5) | Frame 85–164 (median 123); **list 345–457 (median 393)** | The number is the frame, not the list |
| perf.js TBT 89 / 84 / 128 | 106 / 189 / 103 / 92 / 116 (median 106) | Yes |
| LH simulate `?motion=lite` final median 91, lowest 86 | 9 runs: median 92, lowest 85 (2 stalled runs) | Yes |
| First-load JS 177.2 KB gz, 12 files; HTML 64.9 KB gz | 177.2 / 12; 65.0 | Yes |
| Console 0 at 8 widths | 0 (and 0 in 10 walks) | Yes |
| § 18.6 geometry (390 Ortszeile 726–758, 18 px clear; 412 14; 430 12; 768 PLZ 786) | Same values | Yes |
| § 18.8 "no regressions" | DevTools TBT median 112 → 199; Was? list 156–276 → 345–457; new early-Was? wait 0.46–1.02 s; LCP over-fetch below 1024 | **No:** four regressions (§ 9) |
| § 19 focus order at 768–1023 | Place switch → PLZ → Standort → Was? → Wann? → Submit → „So funktioniert’s“ at 768, 820 and 1023; one link displayed | Yes |
| E2E landing 71 / 11 / 0 | 71 / 11 / 0 | Yes |
| § 18.4 stall is a headless presentation artefact | Stalled runs: observed FCP 1.26–1.28 s while `load` fired at 0.33–0.35 s; main-thread totals equal to normal runs; the same signature on `/behandlungen/massage` (1/6) | Consistent; accepted as a lab constraint |

## 7. Regression check of the round-2 and round-3 changes

| Change | Finding |
|---|---|
| **Jump re-targeting** (`lib/scroll-jump.ts`) and measured `contain-intrinsic-size` (`landing.css:65-103`, `chapter.tsx` `cv`) | Lands everywhere (§ 4.4). Scroll CLS 0 on phones, 0.0073 / 0.0109 on desktop (A2 0.0056 / 0.0093). No correction after visitor input. No new console output. **No regression.** Spec § 10.4 still lists the old sizes (documentation drift, P3). |
| **`getImageProps` server images + `FadeImage`** (`primitives/landing-image.tsx`, `landing-img.tsx`, `fade-image.tsx`, `landing-portrait.tsx`) | One hero preload (`fetchPriority=high`, the same `imageSrcSet`); LCP element still the hero `<img>`; no-JS portraits at opacity 1; 06 and 04 portraits fade in. **Regression M-5:** `HERO_SIZES` not updated to the capped arch (over-fetch below 1024). HTML +70 KB raw / +6 KB gz. |
| **BookingEntry pickers chunk** (`site/booking-entry-pickers.tsx`, `booking-entry.tsx:108-140`) | Works on the landing, `/behandlungen/massage` and `/staedte/berlin`. **Regressions M-2, M-3, M-4:** the list renders later; a first tap right after hydration waits 0.46–1.02 s with nothing on screen in the mobile (non-inline) layout; the idle preload pulls `next/image` and the full image registry (`2l9alz8fskj3l.js`, 121 KB raw) into the TBT window, only for 44 px category thumbnails (`booking-entry-pickers.tsx:109`). A blocked-chunk test was inconclusive: the pickers code sits in 8 route chunks. |
| **IntentLink prefetching** (`ui/intent-link.tsx`) | The 10 CTA still upgrades to `/suche?plz=…`; 0 viewport prefetches during a full scroll; the N-6 console warning is gone. **No regression.** |
| **svh-capped hero arch below 1024** (`landing.css:346-420`) | Ortszeile clear of the dock on 390, 412 and 430; CLS 0 at load; unchanged at ≥ 1024. Design trade-off (smaller arch, § 4.1), M-5 (sizes) and M-8 (hard-coded head heights). Without `sign()` the declaration is dropped (fallback = the old size). |
| **768–1023 single column, duplicated link** (`01-hero.tsx:51-63`) | Exactly one link displayed per width, and the focus order follows the visual order at 390, 768, 820, 1023, 1024 and 1440 (`data/kb-hero.json`). T14 anchors pass. **No regression.** |
| **Pre-rendered sheet** (`booking/booking-sheet.tsx`) | The closed pre-render does not write the shared draft (E2E T12 shared PLZ passes; the bar shows the hero's 20095). Off-screen page parts are restored on close (no stuck `content-visibility`, scroll intact). Its idle render adds work late in the TBT window (`1b-li-eaqwmx2.js`, 55–84 ms tasks at about 13.9 s in DevTools runs). |
| Dialog chunks from the page's chunk group (`nav/surface-loader.ts`) | Overlay open 103–196 ms visible (median 138) in `latency.js`; perf.js 184–296 (median 200). No functional regression. |

## 8. Integrity

| Rule | Result |
|---|---|
| No invented testimonials, ratings, counts, identities or badges | Holds. Ratings come from data (≥ 3 reviews), „Verifiziert“ only for approved providers, „Demo-Profil · Foto KI-generiert“ on every portrait, no `aggregateRating`. The 06 line-up changed with the refreshed demo data (real rows, not hard-coded). |
| AI images labelled | Holds: the footer line inside `<footer>`, per-portrait labels, „Vorschau · Demo-Daten“, „Live-App · Demo-Daten“, the demo ribbon. |
| Nothing unfinished looks functional | Holds. N-2 and N-10 are fixed. M-3 is a wait, not a dead control: the picker opens when its chunk arrives. |
| Nothing behaves differently for automation in a way that flatters measurements | Searched `src/` again: no new automation branches. `tier.ts` webdriver → `none` is unchanged, documented and not bypassed; this audit's gates use the visitor tier, where the medians are the same as `/` (92 / 92). The pattern where Event Timing reads lower than the visible response remains for Esc on the overlay (16–24 ms vs 203–308 ms, M-6) and for Was? (frame vs list, M-2). These are not automation-specific; I report both numbers. |

---

## 9. New findings

| ID | Pri | Finding | Where | Evidence |
|---|---|---|---|---|
| M-1 | **P1** (gate) | Dock → sheet still at or over 200 ms on a 4× phone: warm 148–305 (median 197, 3/6 > 200), early 330–633 (median 382). Continues N-4. | `booking/booking-sheet.tsx` (`showModal()` inert restyle of what is in view), `nav/surfaces.ts` | `data/latency-*-slow4g-batch*.json` |
| M-2 | P2 (regression) | Inline Was? list in the sheet appears 345–457 ms after the tap (median 393; A2 156–276). The frame paints at 85–164. | `site/booking-entry.tsx:310` (`useDeferredValue`), `:729-730`; pickers' `Photo` thumbnails | same |
| M-3 | P2 (regression) | First Was? tap right after hydration on a throttled phone waits for the pickers chunk: landing hero 835 / 1,020 ms, `/behandlungen/massage` 463 / 568, `/staedte/berlin` 495 / 881. In the mobile non-inline layout nothing is shown until the chunk arrives. | `booking-entry.tsx:108-140, 836-856` (`P && …`) | `data/pickers.json` |
| M-4 | P2 (regression) | Lighthouse DevTools TBT median 112 → **199** (133–274; 2/5 > 200). New post-FCP tasks: the pickers' image chunk `2l9alz8fskj3l.js` (next/image + image registry, 121 KB raw, 78–103 ms) and the sheet pre-render. Simulate TBT (37) and perf.js (106) stay low. | `booking-entry-pickers.tsx:21, 109`; `booking-sheet.tsx` (idle pre-render) | `data/lighthouse-runs.json` (`dev-lite`) |
| M-5 | P3 (regression) | Hero `sizes` not updated to the capped arch below 1024: the LCP image over-fetches by 1.5–3.4× (+10 KB at 390, +26 KB at 768, +30 KB at 820, +20 KB at 1023). | `hero/places.ts:55` (`HERO_SIZES`) | `data/firstview.json` (`heroImg`) |
| M-6 | P3 | Esc on the chapter overlay: Event Timing 16–24 ms, but the overlay is gone only after 203–308 ms (median 252; A2 154–226), because `dismiss()` defers the close by a task plus a frame. | `nav/chapter-overlay.tsx` (`dismiss`) | `data/latency-settled-*.json` |
| M-7 | P3 | Lead's first line under the dock at load on phones (lead 782 / 857 / 876 vs dock 776 / 847 / 864). | hero spacing below 768 | `data/firstview.json` |
| M-8 | P3 | Arch cap built on hard-coded head heights (`322px`; `292px + 10.9vw`). It breaks without warning under copy or text-size changes. The arch is small at 768 and 1023 × 768. | `(landing)/landing.css:373, 401` | `hero-t768.png`, `hero-t1023.png` |
| M-9 | P3 | Spec § 10.4 still lists the old `contain-intrinsic-size` values. | `docs/landing/LANDING_DESIGN_SPEC.md` § 10.4 | — |

---

## 10. Chapter walkthrough (changes against audit 2)

| Ch | Desktop | 768–1023 | Phones |
|---|---|---|---|
| 01 | Unchanged | Single column; entry and CTA in the first view at 768 and 820; small arch | Arch 280–364 px; Ortszeile clear of the dock; lead under the dock at load |
| 02 | Statement gated with line 3 | — | — |
| 05 | Stage CTA clicks | Arches load on Espresso | Same |
| 06 | Server portraits fade in | — | — |
| 08–10 | Unchanged; seal correct | — | — |
| No JS | Header „Kapitel“ / „Menü“ are links to the static list above the footer | — | Dock „Kapitel“ link |

---

## 11. Performance measurements (all runs, none discarded)

### 11.1 Lighthouse 12.8.2

Score · LCP · TBT · SI · CLS.

| Set | Runs | Median |
|---|---|---|
| **Mobile simulate, `/?motion=lite`** (runtime loaded 9/9) | 92 · 3.25 · 56 · 1.53 · 0 / 92 · 3.26 · 27 / 92 · 3.26 · 37 / **85 · 4.16 · 25 · 3.06 ᶜ** / 90 · 3.48 · 88 / **85 · 4.18 · 25 · 3.02 ᶜ** / 92 · 3.25 · 77 / 92 · 3.26 · 29 / 92 · 3.26 · 78 | **92** · LCP 3.26 · TBT 37 |
| Mobile simulate, `/` (runtime 0/5) | 92 · 3.26 · 43 / 89 · 3.78 · 16 / 92 · 3.26 · 26 / 94 · 2.96 · 26 / **85 · 4.20 · 23 · 2.90 ᶜ** | 92 |
| Mobile DevTools, `/?motion=lite` | 93 · 2.35 · 152 / 93 · 2.40 · 133 / 90 · 2.40 · **245** / 92 · 2.35 · 199 / 90 · 2.32 · **274** (CLS 0.0011 each) | 92 · LCP 2.35 · **TBT 199** |
| Desktop, `/?motion=full` | 100 · 0.73 · 0 / 100 · 0.81 · 0 / 100 · 0.65 · 0 | 100 |
| Comparison route, mobile simulate, `/behandlungen/massage` | 95 / 80 / **83 ᶜ** / 81 / 93 / 80 (LCP 2.82–5.07) | 82 (not the landing; for the stall rate) |

ᶜ the first-frame stall (§ 11.2). `benchmarkIndex` 997–2,050.

**Against audit 2:**
- simulate lite median 89 → 92;
- DevTools TBT median 112 → 199 (M-4);
- desktop 99 → 100.

### 11.2 The Lighthouse stall (constraint, verified as far as I can)

| Run | Observed FCP | `load` fired | Score |
|---|---|---|---|
| Stalled (2 of 9 lite, 1 of 5 `/`) | 1.26–1.28 s | 0.33–0.35 s | 85 |
| Normal | 0.24–0.30 s | — | 90–92 |

- In the stalled runs the main-thread breakdown equals that of normal runs (script 631–691 ms, style and layout 502–571 ms, other 826–853 ms).
- The same signature hits a different route of the app (`/behandlungen/massage` run 3: observed FCP 1.17 s, `load` 0.28 s).
- This supports § 18.4: a presentation stall of headless Chromium on this machine, not page work.
- **The median gate (≥ 90) is met. "No run below 89" cannot be met on this localhost setup.** Settling it needs a deployed preview or field data.

### 11.3 `perf.js` (`MASK=1 … mobile slow4g 5`, `?motion=lite`)

| Run | FCP | LCP | CLS | TBT | Place · Place · FAQ · Overlay open · Esc (ms) |
|---|---|---|---|---|---|
| 1 | 2,300 | 2,300 | 0 | 106 | 160 · 120 · 72 · 200 · 40 |
| 2 | 2,220 | 2,364 | 0 | 189 | 128 · 96 · 48 · **264** · 32 |
| 3 | 2,244 | 2,244 | 0 | 103 | 144 · 128 · 48 · **296** · 40 |
| 4 | 2,184 | 2,348 | 0 | 92 | 144 · 112 · 64 · 184 · 24 |
| 5 | 2,132 | 2,280 | 0 | 116 | 120 · 72 · 48 · 184 · 24 |
| **Median** | 2,220 | **2,300** | **0** | **106** | overlay 200 |

LCP element: the hero `<img>` every time.

### 11.4 Interactions (`latency.js`, 2 batches × 3 runs, 412 × 823, 4× CPU, Slow 4G, cold)

| Interaction | INP-like (ms) | Visible response (ms) | Median visible |
|---|---|---|---|
| Place switch | 112 / 160 / 160 / 120 / 152 / 136 | 195 / 174 / 242 / 194 / 228 / 216 | 206 |
| **Dock → sheet (warm)** | 152 / 224 / 272 / 168 / 272 / 168 | 148 / **222 / 305** / 170 / **276** / 172 | **197** |
| Was? in the sheet: frame / **list** | 112 / 128 / 104 / 88 / 136 / 120 | frame 127 / 123 / 112 / 85 / 164 / 123 · **list 391 / 457 / 365 / 395 / 409 / 345** | 123 / **393** |
| Esc (sheet) | 64 / 64 / 48 / 56 / 48 / 72 | 55 / 55 / 38 / 50 / 41 / 63 | 53 |
| Dock → overlay | 208 / 184 / 112 / 136 / 128 / 160 | 196 / 175 / 103 / 121 / 126 / 150 | 138 |
| Esc (overlay) | 24 / 16 / 16 / 16 / 16 / 24 | **241 / 262 / 203 / 308 / 223 / 264** | **252** |
| FAQ | 48 / 72 / 48 / 64 / 56 / 64 | 113 / 161 / 141 / 155 / 144 / 65 | 143 |
| 07 tab | 112 / 104 / 120 / 168 / 152 / 136 | 104 / 107 / 105 / 148 / 145 / 126 | 117 |
| **Dock → sheet, tapped 1.5 s after load** | 296 / 288 / 528 / 280 / 328 / 416 | **366 / 335 / 633 / 330 / 398 / 485** | **382** |

First Was? tap right after hydration (`pickers.js`, 2 runs each), tap → picker on screen:

| Page | Runs (ms) |
|---|---|
| landing hero | 1,020 / 835 |
| `/behandlungen/massage` | 568 / 463 |
| `/staedte/berlin` | 881 / 495 |

### 11.5 Hydration and early input (`hydration.js`, `early.js`, 3 runs each)

- **Hydration:** FCP 2.22–2.32 s; dock and header 3.49–3.59 s; place switch 3.75–3.95 s; **hero form 4.43–4.72 s** (A2 4.80–4.89); footer 4.56–4.89 s.
- **Early input:** „10115“ typed at 3.12–3.29 s is kept in all three runs, with „· Berlin“ and the submit to `/suche?plz=10115`.

### 11.6 Weight (`weight.js`)

- **First-load module scripts:** 12 files, 573 KB raw, **177.2 KB gz** (A2 207.1).
  - Framework and root: react-dom 70.1, Next 44.0, tailwind-merge 9.0, 8.5, root 8.0, Turbopack 4.3, plus 2.2, 2.0, 0.3 and 0.2. That is ≈ 148.6 KB gz before any landing code.
  - The landing's two chunks are 14.4 and 14.2 KB.
- **CSS** 37.5 KB gz; **HTML** 496 KB raw / 65.0 KB gz.
- **≤ 160 KB is a framework-budget constraint, not reachable by the landing alone.** I accept it as such. The spec's 90 KB route budget would need a framework decision.

### 11.7 Against the exit criterion (audit 1 § 15.1, audit 2 RT-4 / RT-5)

| Target | A2 | A3 | |
|---|---|---|---|
| Median mobile LCP ≤ 2.5 s | 2.30 s | 2.30 s (perf.js) · 2.35 s (DevTools) | **Met** |
| TBT ≤ 200 ms | 124 / 112 | 106 (perf.js) · 37 (simulate) · **199 (DevTools, 2/5 > 200)** | Met, at the edge in DevTools |
| CLS ≤ 0.05 | 0 | 0 at load; scroll ≤ 0.011 | **Met** |
| Lighthouse mobile ≥ 90 (median) | 89 | **92** | **Met** |
| No run below 89 | — | 2/9 at 85 (stall) | **Constraint** (§ 11.2) |
| Worst interaction ≤ 200 ms | sheet 270–290 | sheet warm median 197 (3/6 > 200), early 382; overlay perf.js 184–296 | **Not met** |
| First-load JS ≤ 160 KB gz | 207 | 177.2 | **Constraint** (§ 11.6) |
| Desktop LCP ≤ 1.2 s, LH ≥ 95 | 0.88 s, 99 | 0.73 s, 100 | **Met** |

---

## 12. Accessibility

- **axe-core 4:** **0 violations** at 1440 full, 768 lite and 390 lite (`data/a11y-*.json`).
  - Colour-contrast "incomplete" items are over images. The 08 band was re-sampled: title worst 4.15:1 (large text), lead ≥ 8.25:1, Ortszeile ≥ 14.7:1, second CTA ≥ 11.8:1.
- **Keyboard:**
  - Order: skip links → header (44 px) → hero → entry → chapter feet → rows.
  - Visible ring on every stop.
  - Overlay: 0 escapes in 25 Tabs, Esc restores focus.
  - Chapter jumps focus the `h2`, which is now in view at every width.
  - The hero focus order follows the visual order at 768–1023 (§ 7).
- **Targets:** header links and index pill 44 px. What stays below 44 px is the sr-only skip links, the PLZ input's inner box (its segment is the target) and the desktop footer links (32 px, AA passes).
- **No JS:** chapter links instead of inert buttons.
- **Reduced motion:** instant jumps that land, final frames.
- **Not 9:**
  - no VoiceOver or NVDA pass;
  - the deferred Was? list is announced with `aria-busy` for about 400 ms on a slow phone;
  - Esc leaves the overlay visible for about 250 ms, with focus already back on the trigger.

---

## 13. SEO

Unchanged and correct:
- title, description, Open Graph and Twitter;
- canonical = `APP_URL` (localhost in this build);
- `noindex` in `DEMO_MODE`;
- the FAQPage equals the visible FAQ (E2E T15–T18).

---

## 14. Open issues, prioritised

| ID | Pri | Issue | Dimension |
|---|---|---|---|
| M-1 | **P1** | Sheet open not reliably ≤ 200 ms (warm) / ≤ 300 ms (early) | Performance, Mobile |
| M-2, M-3, M-4 | P2 | Picker split: late list, slow first tap, TBT in the DevTools window | Performance, Interaction, Mobile |
| M-5 … M-9, N-9, N-11, I-16 | P3 | See §§ 5 and 9 | Technical, Visual, Brand |

---

## 15. Remediation tasks (for Performance 7 → 8)

**PR-1 · The booking sheet within 200 ms (M-1).**
- **Where:** `src/components/landing/booking/booking-sheet.tsx` (`openSheet`, `hideOffscreenParts`), `nav/surfaces.ts` (`requestBooking`).
- **Change:** take the inert restyle out of the frame that shows the sheet.
  - Open the sheet with `show()` (non-modal) plus the kit's own focus trap, and set `inert` on `#inhalt` and the footer one frame later. The visible response is then the sheet's first frame.
  - Or keep `showModal()` but render the sheet's first frame before calling it: make the dialog visible with `[open]`-equivalent styles in the tap's task, and call `showModal()` in the next frame.
  - For the early path, start the dialogs' chunk on the first `pointerdown` or `touchstart` anywhere, and measure the TBT cost against PT-1.
- **Expected:** `latency.js 3 settled` (two batches) gives a visible dock → sheet ≤ 200 ms in 6 of 6; `latency.js 3 early` gives a median ≤ 300 ms.
- **Verify:** those runs plus `perf.js mobile slow4g 5` (TBT ≤ 200) and E2E T12 / T12a.

**PR-2 · Pickers without `next/image` and the image registry (M-2, M-4).**
- **Where:** `src/components/site/booking-entry-pickers.tsx:21, 109` (`Photo` with `images.category()`), plus the catalog passed to `BookingEntry`.
- **Change:** pass each category's thumbnail as server-built attributes (the `landingImgAttrs()` pattern, 44 px, `sizes="44px"`), or as a plain `src`/`srcSet` in the catalog entry. The pickers chunk then no longer imports `@/lib/images` or `next/image`.
- **Expected:**
  - the image chunk (`2l9alz8fskj3l.js`, 121 KB raw) no longer loads after hydration;
  - Lighthouse DevTools TBT median ≤ 150 ms (5 runs);
  - Was? list visible ≤ 250 ms (median of 6).
- **Verify:** `lh-batch.sh dev-lite 5 … --throttling-method=devtools`, `lh-table.js`, `latency.js` (`list`).

**PR-3 · A first Was? tap that answers at once (M-3).**
- **Where:** `src/components/site/booking-entry.tsx:836-856` (`P && !desktop && !inline …`) and the desktop `Popover`.
- **Change:** when the chunk is not there yet, open the picker shell at once (kit sheet or popover with title, a height-holding frame and `aria-busy`), and fill it when the chunk arrives. Also start `loadBookingPickers()` when the entry enters the viewport, not only in idle.
- **Expected:** `pickers.js` gives tap → picker shell ≤ 200 ms on all three pages, and the list ≤ 600 ms on the hero at 4× CPU and Slow 4G.
- **Verify:** `pickers.js` (add a shell condition).

**PR-4 · Hero `sizes` that match the capped arch (M-5).**
- **Where:** `src/components/landing/hero/places.ts:55`.
- **Change:** below 1024, describe the capped width. For example: `(max-width: 399px) 72vw, (max-width: 767px) 85vw, (max-width: 1023px) 36vw`, tuned to `firstview.json`. Keep ≥ 1024 as it is.
- **Expected:** `heroImg.srcW` ≤ 1.3 × the rendered width × DPR at 390, 412, 430, 768, 820 and 1023.
- **Verify:** `firstview.js`, plus the hero bytes on the LCP path (`perf.js` image list).

**PR-5 · Esc closes the overlay at once (M-6).**
- **Where:** `src/components/landing/nav/chapter-overlay.tsx` (`dismiss`).
- **Change:** call `close()` in the key's task and restore the page parts (`showPage`) in the next frame, behind the closing fade, instead of the reverse.
- **Expected:** `latency.js` Esc (overlay) visible ≤ 120 ms.
- **Verify:** `latency.js`.

**P3 follow-ups:**
- **M-7 (lead under the dock):** add room under the hero figure below 768.
- **M-8 (hard-coded head heights):** derive the arch cap from a measured custom property (one `ResizeObserver` writing `--lp-hero-arch-top`), or test it under 120 % text size.
- **M-9:** update spec § 10.4.
- **N-11:** a lite fallback for desktops with `hardwareConcurrency ≤ 4`.

**Performance reaches 8 with PR-1 and PR-2.** PR-3 to PR-5 polish Interaction and Mobile toward 9. The Lighthouse "no run < 89" and JS ≤ 160 KB items remain documented constraints (§§ 11.2, 11.6) until they are measured on a deployed preview or with field data.

---

## 16. Verdict

**Not passing: 10 of 11 dimensions at ≥ 8. Performance is 7.**

**What is fixed:**
- The audit-2 P1s are fixed and independently verified: chapter navigation, the 05 CTA and early PLZ input.
- The Lighthouse median (92), LCP, TBT and CLS are within target.

**What fails:**
- The phone's main booking tap still does not reliably answer within 200 ms at 4× CPU.
- Splitting out the pickers moved cost into the first Was? tap, the list render and the DevTools TBT window.

**Constraints, accepted and not counted:**
- the headless first-frame stall (Lighthouse "no run < 89");
- the framework's share of first-load JS.

*Database: I ran the landing E2E suites once (they create searches and waitlist entries) and logged in once as `testkunde@soma.test`. No `demo:refresh`. `:3100` was left running, not restarted, not rebuilt.*
