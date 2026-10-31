# SOMA — Independent QA & Conversion Audit 5 (design v2)

*Agent 6 (QA & Conversion) · 31 Oct 2026 · audit of the design-v2 overhaul (visual, motion, haptics) · no product code changed*

| | |
|---|---|
| Build under test | production build `next start` on `http://localhost:3100`, `BUILD_ID 0K9Y4kC3dXVP5LB4V3oTr` (built 18:22 UTC). `HEAD 0320a8e` (*„Design v2 surfaces complete …“*, 18:28 UTC). No file under `src/`, `scripts/` or `supabase/` is newer than the build. `DEMO_MODE=true`, `APP_URL=http://localhost:3000` (from `.env.local`). The dev server on :3000 was not used |
| Data | `DEMO_MODE=true npm run demo:refresh` at 18:30 UTC (start), 19:21 UTC (before the E2E run), 19:32 UTC, and **19:34:52 UTC as the last step** (§12). Final state: 215 bookings (requested 6 · confirmed 32 · completed 157 · cancelled 18 · no_show 2), 74 accounts, 0 QA accounts left. The refresh ran outside Selin's hours, so the demo appointment is on **Monday, 2 Nov, 09:00** |
| Accounts | `testkunde@soma.test` (Julia H.), `testkunde-b2b@soma.test` (Selin A.), `testadmin@soma.test`; guests `qa5-gast-mobile@`, `qa5-gast-desktop@`, `qa5-tastatur@kunden.soma.test` (all removed by the refresh) |
| Devices | Chromium 390×844 @2x (touch) and 1440×900; 320 px for layout and targets |
| Tools | Playwright (screenshots, frame sequences, CDP touch and throttling, `getAnimations()`, PerformanceObserver LCP/CLS/long tasks), axe-core 4.14, Lighthouse 12.8 (scratch install from audit 3, mobile simulated, two runs, for trend only), a pixel-sampling contrast probe (text hidden, background sampled across aura drift phases), `navigator.vibrate` instrumentation, psql |
| Evidence | 39 curated screenshots in `docs/qa/audit-5/*.jpg`; raw shots, frame sequences, probe scripts and JSON in the QA scratch dir (`…/scratchpad/qa5/`, not in the repo); new regression tests in `tests/e2e/audit5.spec.ts` |
| Photos | The photo CDN is blocked here, so every image renders as its v2 aura fallback. I judged whether the fallbacks look intentional (§D.4) and did **not** penalise the block |
| `navigator.webdriver` | `Reveal` and `CountUp` render their final state under automation by design. For the motion probes I launched Chromium with `--disable-blink-features=AutomationControlled` (`navigator.webdriver === false`), so they behaved as for a real visitor |

---

## Executive summary

**v2 delivers what the client asked for.** SOMA no longer looks like a print editorial. It looks like a product from a well-funded software company:

- **Lighter:** near-white Kalk surfaces, one night band on the customer side, a lighter and brighter ultramarine.
- **Layered:** floating level-1/2 cards, glass for the sticky header, bottom nav, sheets, toasts and the command palette.
- **Soft geometry:** one radius family per component type.
- **Product-led hero:** real SOMA components floating on the aura.
- **Tactile:** press, lift, settle, spring, draw.

All three experiences share one system. The provider tool and the admin console reach a level I would expect from Linear or Stripe:
- KPI tiles with sparklines;
- countdown rings;
- a ⌘K palette with grouped results and keyboard hints;
- dense tables with mono references.

**Haptics and motion ("Bewegung und Ruhe") are real, measured and disciplined.**
- Every principle-11 effect exists and behaves to spec:
  - press 0.97 with a spring overshoot;
  - hover lift −2 px;
  - focus glow;
  - switch knob spring;
  - slot settle 0.965 → 1.0014 → 1;
  - sheet drag with rubber band;
  - aura drift in 24–38 s loops that pause offscreen;
  - spotlight;
  - parallax;
  - `Reveal`, `CountUp`, `SuccessCheck`, the Start-Code stagger and the shake on a wrong code;
  - View Transitions.
- `navigator.vibrate` fires exactly on the key confirmations: booking, start and cancellation.
- **`prefers-reduced-motion` turns all of it off:**
  - every animation runs for 1 ms;
  - the aura is static and paused;
  - no parallax, reveal or spotlight;
  - `vibrate` is never called.
- **CLS is 0.000** everywhere, including a full scroll of the animated home page. There are 0 long tasks during 8 s of ambient idle and **0 hydration errors** in 184 page loads.

**Nothing broke.**
- **E2E: 108/108 passed (6.1 min).**
- My new `audit5.spec.ts` passes 17/17 (1 skipped). Its five `test.fail()` cases confirm the open findings below.
- Authorization spot checks hold.
- Fonts are fixed: **96 KB, down from 331 KB** (F12).
- Audit-4 items A4-1, A4-2, A4-3, A4-5, A4-6, A4-7, A4-9, A4-10 and A4-11 are fixed.

**What v2 introduced (no blocker, nothing for the demo):**

| ID | Sev. | Finding |
|---|---|---|
| **A5-1** | medium | The customer **cancel dialog** (and the address-delete dialog) is unmounted instead of closed. Focus falls to `<body>` after Esc or *„Termin behalten“*, and the exit animation never plays |
| **A5-2** | medium | **Three screens overflow at 320 px:** `/konto/adressen` +11 px, the booking detail header +6 px, `/pro/verifizierung` +3 px. Audit 4 had 0 px everywhere |
| **A5-3** | medium | **Invalid `<dl>` markup** on the booking detail (`dt`/`dd` in `div > div`) and on `/pro/bewertungen` (`<p>` in `<dl>`). axe: serious, 6 of 98 runs |
| **A5-9** | medium | **Performance regressed slightly behind the bar.** Under Lighthouse-equivalent throttling the Playwright LCP still passes (1.48–2.07 s on 8 routes), but it was 1.0–1.4 s in audit 4. Lighthouse simulated LCP is 2.71–4.11 s and TBT up to 1.37 s. With DevTools "Fast 3G", home, `/pro` and `/admin` miss 2.5 s by 0.1–0.3 s |
| A5-4 … A5-15 | low | Label-in-name, a 36 px secondary button size, a colour-only status on mobile `/pro`, a clipped service select on the profile, `/favicon.ico` 404, a blank interframe in route transitions, NBSP in short dates, the admin not-found heading, the haptic-on-tap policy, a tight contrast margin on aura |

**Scores: every dimension ≥ 8; Premium-Anmutung 9 overall (customer 9, provider 9, admin 9).**
- **Up:** Visual 8 → 9, Security 8 → 9.
- **Down:** Mobile 9 → 8 (A5-2), Accessibility 9 → 8 (A5-1, A5-3, A5-4).

**Demo verdict: yes, hand it over** (§V).

## Scores

| # | Dimension | A1 | A2 | A3 | A4 | **A5** | Trend | One-line justification (audit 5) |
|---|---|---|---|---|---|---|---|---|
| 1 | Visual quality | 8 | 8 | 8 | 8 | **9** | ↑ | One coherent, light, layered system on all three surfaces; intentional aura fallbacks; polish left (A5-7, A5-8, A5-12); photos still unverifiable |
| 2 | UX & navigation | 7 | 8 | 9 | 9 | **9** | = | ⌘K palette, keyboard-only checkout in 44 Tab presses, sheets with drag; A5-1 focus loss, A5-8 nested scroll in the booking panel |
| 3 | Mobile responsiveness | 8 | 8 | 9 | 9 | **8** | ↓ | 0 px overflow at 390 on 52 routes, app-grade `/pro` and `/konto`; but three 320 px overflows (A5-2) and 36 px secondary buttons (A5-6) |
| 4 | Accessibility | 8 | 9 | 9 | 9 | **8** | ↓ | Excellent reduced motion, focus glow and dialog initial focus; new axe violations (A5-3, A5-4, A5-5) and lost focus after the cancel dialog (A5-1) |
| 5 | Functional completeness | 8 | 9 | 9 | 9 | **9** | = | Everything from audit 4 works (E2E 108/108); palette, demo-safe Start-Code, `demo:refresh` window logic added |
| 6 | Booking reliability | 9 | 9 | 9 | 9 | **9** | = | Instant guest booking 69 € consistent through confirmation, free cancellation in the Bedenkzeit, Start-Code attempts counted; Stripe still unverifiable |
| 7 | Security & permissions | 7 | 7 | 7 | 8 | **9** | ↑ | A4-3 and A4-1 closed (code and SQL probe); cross-role and IDOR spot checks hold; headers unchanged; CSP `'unsafe-inline'` and the sign-up oracle remain accepted |
| 8 | Performance | 6 | 8 | 8 | 8 | **8** | = | Fonts 331 → 96 KB, CLS 0, LCP < 2.5 s on all 8 routes under Lighthouse-like throttling; regressed render delay (A5-9) |
| 9 | Trust & conversion | 7 | 8 | 8 | 8 | **8** | = | v2 reads as a serious company; A4-3 and A4-6 fixed; R12 legal placeholders, `hallo@soma.example`, `localhost:3000` links remain |
| 10 | **Premium-Anmutung (High-End-Produkt)** | – | – | – | – | **9** | new | Customer **9** · Provider **9** · Admin **9**. Product-led hero, glass and depth, tactile motion and Linear-grade dashboards; held back by small polish and photo-less portraits |

No dimension is below 8. The tasks for the next point are in *Path to the next score*.

---

## V. Demo verdict

**Yes, hand it to the client.** v2 answers each of the client's quotes:
- *„leichter“*: the surfaces are near-white;
- *„technisch viel hochwertiger“*: glass, depth and dashboards;
- *„Haptik … Effekte, Bewegung und Ruhe“*: tactile responses and slow ambient motion that stops when you scroll away or ask for reduced motion.

All three accounts give the full experience, and the guest booking ends on an animated *„Bestätigt.“* with a staggered Start-Code.

Caveats, in order of importance:

1. **Run `npm run demo:refresh` during Selin's hours (Mo–Sa 08:30–18:00), ≤ 1 h before the session,** if you want to show the live Start-Code. My final refresh ran in the evening, so the demo appointment is on **Monday, 2 Nov, 09:00**. Refreshing again on the demo morning puts it 35 minutes out.
2. **Build online on the demo machine (`npm run build`)** so the photos are stored locally. Check that portraits show. The aura fallbacks look intentional (§D.4), but photos are part of the brand promise.
3. **Set `APP_URL` and `NEXT_PUBLIC_SUPPORT_EMAIL`.** Otherwise invite and referral links print `http://localhost:3000/…` and the footer shows `hallo@soma.example`.
4. **Tap a *„Sofort bestätigt“* pro (Hanna B. at 10115)** for the guest booking if the confirmation should show the Start-Code.
5. **Legal texts are labelled placeholders** (R12).
6. **The open findings won't show in a normal walkthrough.**
   - A5-1 is only noticeable with a keyboard or screen reader.
   - A5-2 only on 320 px phones (iPhone SE 1st gen).
   - Present on a ≥ 375 px phone or a desktop.

---

## Verification of audit-4 items

| ID | Verdict | Evidence |
|---|---|---|
| **A4-1** DB seed-mode bypass | ✅ fixed | As `authenticated` (`set local role authenticated; set_config('soma.seed_mode','on',true)`): `select public.seed_mode()` → *permission denied for function seed_mode*. `seed_mode()` now also requires `current_setting('role')` ∉ {anon, authenticated} |
| **A4-2** add overwrites price | ✅ fixed | `audit4.spec.ts` › A4-2 now runs without `test.fail()` and passes on both projects |
| **A4-3** uncategorised qualification unlocks every category | ✅ fixed (code and SQL; not replayed live) | `category_documents_complete()` matches `d.category_id = p_category` (no NULL wildcard). `queryMissingCategoryDocuments` matches `d.categoryId === c.id` (`src/server/services/pro.ts:166ff`). The admin document table names the category (*„Qualifikation für Kosmetik“*, `29-…jpg`). An upload without a category is still accepted, but it no longer satisfies any category |
| **A4-4** lone *„Danach:“* | ◑ not re-verified | Needs a < 2 h booking. The ≥ 24 h detail shows three dated tiers (`18-…jpg`) |
| **A4-5** text after the start | ✅ fixed | After a live start: *„Die Behandlung läuft. Selin A. ist bei Ihnen. Wir wünschen Ihnen eine schöne Behandlung.“* and *„Code bestätigt um 19:56 Uhr.“* (`20-…jpg`). Selin sees *„Abschließen ab 20:20 Uhr (geplanter Beginn).“* |
| **A4-6** no-supply copy | ✅ fixed | `/suche?plz=20457&kategorie=pedikuere` → *„In Hamburg gibt es noch keine Profis für Pediküre.“* with a waitlist form (`10-…jpg`) |
| **A4-7** evening refresh | ✅ fixed | *„Es ist gerade außerhalb von Selins Arbeitszeit, deshalb liegt der Demo-Termin am Montag, 2. November um 09:00 Uhr.“* Her hours stay unchanged |
| **A4-8** `APP_URL` | ◑ documented | DEMO.md §1 explains `APP_URL`. Links still print `localhost:3000` here (configuration) |
| **A4-9** empty stat tile | ✅ fixed | `/konto/guthaben` at 1440 shows 3 tiles |
| **A4-10** DEMO.md drift | ✅ fixed | *„knapp 30 Bewertungen“*, plus the advice to tap *„Sofort bestätigt“* |
| **A4-11** document category | ✅ fixed | See A4-3 |
| **A4-12** lint bypasses | – not re-tested | v2 did not touch `content-lint.ts` |
| **F12** fonts 331 KB | ✅ **fixed** | 96 KB on every customer route: Inter latin variable 72 KB plus Newsreader display italic 23 KB, 2 preloads. `/admin` adds DM Mono 10 KB |
| **F8** (rest) seed artefacts | ◑ open | The admin *Buchungen* chart still ends in a spike on the last day, *Auslastung Profis 0,5 %* (`28-…jpg`) |
| **F14** (rest) support address | ◑ configurable | `NEXT_PUBLIC_SUPPORT_EMAIL` exists; the default is still `hallo@soma.example` |
| **R12** legal texts | ❌ open (expected) | Placeholders |

---

## D. Design-v2 review per experience

### D.1 Customer (*Sie*) — Premium-Anmutung 9

**Home** (`01`, `02`, `03`, `04`):
- **Hero.** *„Wellness, die zu Ihnen kommt. Schon da.“* is engineered Inter 600 with tight tracking and a Newsreader italic accent. A product-led stage floats on a quiet aura to the right: Hanna's result card with slot chips, *Bestätigt.*, *Anfahrt 7,00 €*, a Start-Code card and 4,7 ★. The booking box is one glass-white pill with a focus-within ring.
- **Sections below.** The rhythm alternates generous 96–128 px gaps with floating cards:
  - a proof band;
  - three quote cards;
  - a category rail of seeded aura art with italic labels;
  - *„Drei Schritte. Kein Weg.“*, illustrated with real mini-components;
  - three place cards with Ortszeile pills;
  - the trust grid with the SOMA-Garantie aura panel;
  - the Profis rail;
  - cities;
  - **one** deliberate night band (*Für Profis*);
  - FAQ;
  - a light footer.
- This is the v2 brief executed.

**Search** (`05`, `06`):
- Clean result cards with a 64 px aura avatar, *Sofort bestätigt*/*Auf Anfrage*, the price *„inkl. Anfahrt“* and slot tiles.
- The weakest customer screen visually. With 2 results at 10115 the desktop page is mostly white, and the filter panel repeats *„Ihre Suche“* (Ort/Behandlung/Wann), which the chip bar already shows. It is calm, but not "expensive".

**Profile** (`07`, `08`):
- An aura cover band, a 4:5 aura portrait with a glass monogram disc, pills (*Verifiziert*, rating, mode, *34 Termine über SOMA*), fact tiles, a radio list of services and a sticky booking panel.
- Detail flaws:
  - the service select clips to *„Entspannungsmassage (klassisch) · 60 M“* at 1440 (A5-8, `37`);
  - at 900 px height the panel scrolls internally, and *Abends* plus *„Spätere Tage laden“* sit under a frosted footer;
  - the date strip clips its last cell under the arrow.

**Treatments, category, city, *Für Profis*, login, empty search, 404** (`09`–`11`):
- Each has a hero with floating stat cards on category art (*„ab 45 €“*, *„7 von 7 Behandlungen buchbar“*), the search box and a consistent overline/aura line.
- The login screen pairs the form with a large aura panel and floating *Bestätigt*/Start-Code cards.
- The 404 page (*„Hier ist niemand. Noch nicht.“*) and the no-supply empty state use `EmptyArt`. Both are premium.

**Checkout and confirmation** (`12`–`15`):
- **Checkout.** A glass *„Was?“* sheet with category art. The checkout itself:
  - a 4-step indicator;
  - an *Übersicht* card;
  - segmented place picker;
  - inputs with focus glow;
  - a test card with a *Test* pill;
  - the § 356 consent;
  - a glass sticky CTA *„Zahlungspflichtig buchen · 69 €“*.
- **Submit.** The label blurs out as the spinner springs in (*„Ihr Kundenkonto wird angelegt …“*), then the skeleton appears.
- **Confirmation.** *Bestätigt.* with `SuccessCheck` and the Start-Code digits staggering in.
- **Cancellation.** A glass modal with fee and refund tiles, a toast with a drawn check, and *„Storniert.“*

**Account** (`16`, `17`, `19`, `20`):
- *„Guten Abend, Julia.“*, a next-appointment card on aura with a raised Start-Code tile, rebook cards, and credit and referral cards.
- Subpages follow the same pattern: a rail with a raised active item; glass bottom nav on mobile.
- The booking detail is the best customer screen. An aura hero card holds *Bestätigt.* and a glass Start-Code card, followed by fact rows with icon discs, a price card with a dashed total rule, a timeline and the cancellation tiers.

**Why not 10.**
- Search is plain.
- The profile without a photo is a monogram on gradients.
- There are clipped and truncated strings:
  - the select (A5-8);
  - *„Rücken- & Nackenmassage · 45 …“* in the mobile hero card;
  - *„Wellnessmas-sagen bei Ihnen …“* on mobile category cards.
- One blank interframe in route transitions (A5-11).

### D.2 Provider (`/pro`, *du*) — Premium-Anmutung 9

- **Heute** (`21`, `22`):
  - a date overline;
  - *„Guten Abend, Selin.“* with the accent italic;
  - four KPI tiles with sparklines, delta pills and tabular numerals (*107,50 €*, *6*, *4,8*, *34*);
  - request cards with countdown rings (*„Noch 14 Std. 41 Min.“*), a provision chip row and a quoted note;
  - the *„Profil vollständig“* ring;
  - an aura invite card;
  - the *„Heute ist frei.“* empty state with aura art;
  - an agenda timeline.
- **Termine, detail, Kalender** (`23`):
  - the detail splits *Kundschaft*, an aura map tile with a 1 km radius ring, and a *Verdienst* card;
  - the calendar is a 7-day grid with tinted booking blocks and *Angefragt* blocks in warning tone.
- **Leistungen, Einnahmen, Verifizierung, Einstellungen** (`24`): an area chart with a gradient fill; *4/4* verification rings with *Geprüft* pills.
- **Mobile** (`25`): a real app. Glass top bar and glass bottom nav with count badges; sheets for the Start-Code.
- **Start-Code entry** (`26`, `27`): a glass sheet with four digit cells and auto-advance.
  - A wrong code shakes, turns the cells red, shows *„Der Start-Code ist falsch. Bitte frag noch einmal nach. · Noch 4 Versuche“* and returns focus to digit 1.
  - The right code closes the sheet and shows *„Termin läuft“*.
- **Why not 10.**
  - On mobile, the agenda status is a coloured dot only; the word is `sr-only` below `sm` (A5-7).
  - *„Antworte bis So., 1. / Nov.“* breaks the date (A5-12).
  - Invite links print `localhost:3000`.

### D.3 Admin — Premium-Anmutung 9

- **Shell and Übersicht** (`28`–`32`):
  - **Shell:** a sidebar with the σ tile, group labels and a raised active item; *Suchen … Strg K*.
  - **Übersicht:** 4 + 6 KPI tiles with sparklines, the *Zu erledigen* work queues, three trend charts with gradient fills and *„Werte als Tabelle“*, a status distribution and a funnel.
- **Tables:** dense, with mono references and status pills.
- **Provider detail:** a warning notice listing missing documents; *Freigeben* disabled.
- **⌘K** (`31`):
  - glass on a blurred backdrop;
  - grouped results (*Seiten*, *Buchungen*, *Profis*, *Nutzer*);
  - ↑↓/↵/Esc hints, *„7 Treffer“*;
  - `aria-activedescendant`;
  - Enter navigates.
- **Why not 10.** The demo data undermines the dashboard (F8 rest): GMV *−41,2 %*, *Auslastung 0,5 %*, a last-day spike. The not-found state has no `h1` (A5-13). The empty-palette message is printed twice.

### D.4 Imagery fallbacks (the photo CDN is blocked here)

**They look intentional and premium.**
- **Category art** (`AuraArt`) is seeded, layered radial glows with grain and an italic label. On the home rail, the category heroes and the *Zu Hause / Im Hotel / Im Büro* cards it reads like art direction, not a missing image (`03`, `33`).
- **Portfolio tiles** on the profile are untitled aura squares: pleasant, if anonymous.
- **Person fallbacks** are large two-letter monograms on a glass disc over a seeded aura (`04`). They avoid v1's beige boxes, but a row of five *SA/NW/ER/KH* discs is the most "placeholder-like" moment on the site.
- On the client's Netlify deployment photos load and cover this. I could not verify photo crops or captions.

---

## M. Motion and haptics review (principle 11)

All measurements are on the production build, with `navigator.webdriver === false` unless noted.

| Effect | Spec | Observed | Verdict |
|---|---|---|---|
| Press | `scale` 0.97 in 100 ms, spring back | Primary CTA held: 1 → **0.97**. Released: 1.0005 → 1.0017 (overshoot) → 1 | ✅ |
| Hover lift | −2 px + `shadow-float` | Home card: `translate none` → **`0px -2px`**, shadow becomes the level-2 stack. 21 `lift` cards on home | ✅ |
| Focus glow | 2 px accent outline + 6 px glow | Nav, buttons and CTAs: `2px rgb(61,79,240)`, offset 2, glow visible. Inputs: accent border + 4 px glow. The hero field group shows focus-within (`35`) | ✅ |
| Checkbox / switch / radio | Tick draws, knob springs | Consent tick `soma-draw` 640 ms. Switch knob 0 → 11.7 → 18.9 → 18.99 → 18.25 px (overshoot, settle) | ✅ |
| Slot settle | Selection settles into ink | Profile slot: `scale` 0.965 → 0.994 → **1.0014** → 1.0004 → 1, background morphs to ink (`39`). Search slot links settle too | ✅ |
| Loading morph | Label blurs, spinner springs in, same width | Checkout CTA (`14`, frame 1) | ✅ |
| Sheet | Spring entry, drag down to dismiss, rubber band | CDP touch: follows 1:1 (10…150 px). Upwards damped (−30 → −13.7, −120 → −23.7 px). 60 px springs back, 150 px dismisses. Focus to *Schließen*, Esc closes, focus returns to the trigger | ✅ |
| Dialogs | Rise in, fade out, focus on the safe action | Customer cancel modal: initial focus **„Termin behalten“** ✅. Exit animation and focus return ❌ (A5-1). Pro decline sheet and palette restore focus ✅ | ◑ |
| Toast | Springs in, check draws | *„Ihr Termin wurde kostenlos storniert.“* (`15`) | ✅ |
| Aura drift | 20–40 s, transform/opacity, pause offscreen | `soma-aura-drift` 32 s, `-2` 38 s, `-breathe` 24 s, `soma-float` 9 s. At the top of home: 8 running, 4 paused (offscreen). After scrolling to the bottom: **all 12 paused**, `data-ambient="off"` on all 6 gates. `html[data-hidden]` is set on `visibilitychange` | ✅ |
| Spotlight (desktop) | Pointer-following, `pointer: fine` only | 1 on home and 1 on `/fuer-profis`. On hover `--spot-o: 1` and `--spot-x/y` follow the pointer (`38`) | ✅ |
| Parallax | 8–24 px, scroll-linked CSS | 5 hero cards, `animation-timeline: view()`, `--depth` 8/10/16/22/28 px. Translate changes with scroll (e.g. −3.3 → −8.2 px, −15.2 → −28 px) | ✅ (one card at 28 px, a touch above the 8–24 px guideline) |
| `Reveal` | Below the fold only, once | Home: 13 sections hidden at load (none above the fold), all **13 "in"** after scrolling | ✅ |
| `CountUp` | 900 ms expo-out, hydration-safe | Client navigation `/pro/termine` → `/pro`: 11,98 → 58,26 → 79,94 → 89,74 → 99,24 → 104,30 → **107,50 €**; screen readers get the final value | ✅ |
| `SuccessCheck` / Start-Code stagger | Ring pops, check draws; digits staggered | Guest confirmation frames: *„0 3“* then *„0 3 6 6“* (`14`). A wrong pro code shakes (`27`) | ✅ |
| Route transitions | View Transitions with a cross-fade fallback | `document.startViewTransition` called once per pathname change. Old page out 140 ms, new in 260 ms. One **blank interframe** between home and the `/suche` skeleton (`34`, A5-11) | ◑ |
| Shimmer skeletons | Geometry-true | `/suche` skeleton matches the final cards (`34`) | ✅ |

**`haptic()` calls** (`navigator.vibrate` instrumented):

| Moment | Pattern | Where |
|---|---|---|
| Slot tap (search) | `8` (tap) | `/suche` |
| *„Zahlungspflichtig buchen“* | `8` (tap) | `/buchen` |
| Booking confirmed | `[12,60,14]` (success), **once per booking** (a reload does not repeat it; `audit5.spec.ts`) | `/buchung/[id]` |
| Booking cancelled | `[14,80,14]` (warning) | `/buchung/[id]` |
| Wrong Start-Code | `[14,80,14]` | `/pro/termine/[id]` |
| Treatment started | `[12,60,14]` | `/pro/termine/[id]` |
| Any of the above under reduced motion | **none** | |

The `tap` ticks on slot and CTA presses contradict guideline §10.3 (*„only on key confirmations … never on every tap“*) but match `haptic.ts`. Decide which one is right (A5-14).

**`prefers-reduced-motion: reduce`.**
- Home: every animation reports duration 1 ms and 1 iteration; the aura is paused (static).
- `data-ambient="off"` on all gates; parallax `animation: none`; 0 hidden reveals after scrolling.
- Spotlight not activated.
- `CountUp` shows *107,50 €* immediately after a client navigation.
- The slot settle runs in 0.001 s.
- 0 skeletons left shimmering.
- `vibrate` is never called.
- View transitions still start, at 0 s duration (acceptable: *„instant“*).

**Layout shift and stability.**
- CLS 0.000 on home during load plus a full scroll in 300 px steps, and on all 8 routes in every throttle profile.
- Ambient idle: **0 long tasks in 8 s**.
- Hydration: **0 errors** in 104 walk loads (52 routes × 2) and 80 crawl loads (40 routes × 320/390).
- The only console errors are the blocked CDN images (`/_next/image` 500) and `/favicon.ico` 404 (A5-10). Sporadic *„preloaded but not used“* warnings for the two font files appear on `/suche` (empty), `/kit` and the mobile profile.

---

## 1. Visual quality — 9/10 (↑ from 8)

- **The system is coherent from the home hero to the admin table:**
  - tokens are used consistently;
  - one radius family per component;
  - level-1/2/3 elevation with built-in hairlines;
  - glass only on sticky and overlay layers;
  - the aura as a signature, not a fill.
- **Every visual principle of the brief is executed:**
  - lighter (Kalk, one night band);
  - depth;
  - soft geometry;
  - one signature;
  - product-led;
  - premium without photos (§D.4);
  - typography with intent (Inter optical sizes, `num` everywhere, balanced headlines, one italic accent);
  - data looks expensive.
- **Findings (all low):**
  - A5-7: colour-only status on mobile `/pro`;
  - A5-8: clipped select, nested scroll and a clipped date-strip cell on the profile;
  - A5-12: *„1. / Nov.“* breaks;
  - truncations in marketing cards on mobile;
  - the doubled empty-palette message.
- **Not verifiable:** photography (the CDN is blocked), which is why this is not a 10.

## 2. UX & navigation — 9/10 (=)

- **New:**
  - the ⌘K palette (grouped, keyboard-complete, opens on *Strg K*/*⌘K* or the sidebar button);
  - sheets with drag;
  - a guest checkout that is fully keyboard-operable: **44 Tab presses** from the search page to *„Bestätigt.“*, and 3 to cancel.
- **The journey is unchanged and short:** home → *Was?* sheet → results → slot → checkout → *Bestätigt.*
- **Findings:**
  - A5-1 (focus lost after the cancel dialog);
  - A5-8 (the 1440×900 booking panel hides the evening slots in an inner scroll area);
  - A5-11 (blank interframe);
  - open from audit 4: no exact-time filter.

## 3. Mobile responsiveness — 8/10 (↓ from 9)

- **At 390 px:** 0 px overflow on all 52 walked routes (both roles), and app-grade `/pro` and `/konto` with glass bottom navs and safe areas.
- **At 320 px (40 routes): 37 at 0 px, 3 regressions (A5-2):**
  - `/konto/adressen` +11 px: the action row with *Bearbeiten*, *Als Standard* and the delete icon;
  - booking detail +6 px: checkout header back pill + wordmark + *„Sicher“* pill;
  - `/pro/verifizierung` +3 px: document rows.
- **Targets (non-inline, below 44 px):**
  - S buttons are 36 px tall with no extended hit area: *„Erneut buchen“* (/konto), *„Termin wählen“* (/konto/favoriten), *„Öffentlich antworten“* (/pro/bewertungen);
  - *„Alle 4 anstehenden Termine“* is 16 px tall;
  - the `/pro` greeting links are 20 px;
  - admin table links are 18–21 px (unchanged from audit 4; axe `target-size` on `/admin/bewertungen`).
- **Not tested:** WebKit/iOS Safari, real devices.

## 4. Accessibility — 8/10 (↓ from 9)

- **Strong:**
  - reduced motion is exemplary (§M);
  - the focus outline and glow are visible on every control I tabbed through;
  - dialogs open on the safe action, and sheets on *Schließen*;
  - the palette is a proper combobox with `aria-activedescendant`;
  - the Start-Code cells are labelled *„Ziffer 1 von 4“*;
  - `CountUp` keeps the final value for screen readers;
  - decorative stages are `aria-hidden` and `inert`;
  - Lighthouse accessibility 100 on 5 routes × 2 runs.
- **axe-core 4.14** (WCAG 2.0–2.2 A/AA + best practice), 49 pages × 2 viewports = 98 runs:
  - **82 with 0 violations**;
  - 3 with only `color-contrast` inside `aria-hidden` (decorative TOC numbers on `/hilfe`, `/stornierung`, `/widerruf`; exempt);
  - **13 with real violations:**
    - `definition-list`/`dlitem` on the booking detail ×4 and `/pro/bewertungen` ×2 (A5-3);
    - `label-content-name-mismatch` on `/pro/kalender` (7 blocks) and the `/pro/registrieren` logo ×2 (A5-4);
    - `target-size` on `/admin/bewertungen` ×2 (A5-6);
    - `scrollable-region-focusable` on the mobile home quotes carousel and `/kit` (A5-5).
- **Manual:**
  - A5-1: focus falls to `<body>` after the customer cancel and address-delete dialogs (WCAG 2.4.3);
  - A5-7: colour-only status on mobile `/pro` (guideline §4.3; WCAG 1.4.1);
  - A5-13: the admin not-found state has no `h1`.
- **Contrast:** AA everywhere, with a thin margin on aura (§T.4).
- **Not tested:** screen readers, 200 % zoom.

## 5. Functional completeness — 9/10 (=)

- **Regression:** E2E 108/108 covers every audit-1…4 journey.
- **Exercised live:**
  - guest booking and cancellation (mobile, desktop and keyboard-only);
  - Start-Code wrong and right (attempt counter 1);
  - the customer view while the treatment runs;
  - the palette search by reference;
  - all `/pro` and `/admin` pages.
- **v2 adds:** the palette, sheet drag, haptics and the time-aware `demo:refresh`. The admin rail toggle (`[`) was not tested.
- **Gaps (unchanged):**
  - exact-time filter;
  - multiple service areas;
  - address autocomplete;
  - SMS toggle without delivery.

## 6. Booking reliability — 9/10 (=)

- **Guest instant booking (Hanna B., 10115):**
  - 69 € in search = 69 € in the CTA = 69 € on the confirmation (62 € + 7 € Anfahrt, § 19 UStG);
  - Start-Code shown;
  - the cancel preview reads *„Stornogebühr 0,00 € · Erstattung 69,00 € … noch bis 20:02 Uhr“* (Bedenkzeit);
  - after cancelling: *„Zahlung: Reservierung aufgehoben – nichts belastet“*.
- **Start-Code:** start possible from 30 min before. A wrong code gives `start_code_attempts = 1` and *„Noch 4 Versuche“*; the right code gives `in_progress`.
- **E2E:** instant, request and double-hold tests all pass.
- **Not verifiable:** Stripe.

## 7. Security & permissions — 9/10 (↑ from 8)

- **A4-3 and A4-1 are closed** (see the verification table). That was the audit-4 bar for 9.
- **Spot checks after v2:**
  - Julia → `/admin` and `/pro` redirect to `/konto`;
  - Selin → `/admin` redirects to `/pro`;
  - Julia on another customer's booking → *„Diese Buchung finden wir nicht.“*;
  - Selin on Hanna's appointment → *„Termin nicht gefunden.“*;
  - anonymous `/konto` and `/buchung/[id]` → `/anmelden`;
  - `/api/cron/booking-maintenance` → 401 (GET and POST).
- **Headers:** CSP, HSTS (2 y, preload), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` and `Permissions-Policy` are unchanged.
- **E2E:** the F1, F7, R1 and N1 security tests pass.
- **Not re-run:** the 76-action replay and the 74 RLS probes. v2 touched UI, not server actions.
- **Accepted, unchanged:** CSP `'unsafe-inline'` for scripts, and the `checkoutSignUp` existence oracle.

## 8. Performance — 8/10 (=)

The full tables are in §T.1. In short:
- fonts fixed (96 KB);
- CLS 0.000 everywhere;
- TTFB ≤ 141 ms;
- 0 third-party requests;
- **LCP < 2.5 s on all 8 measured routes** (home, search, profile, checkout, `/pro`, *Für Profis*, `/konto`, `/admin`) with Lighthouse-equivalent throttling (150 ms RTT, 1.6 Mbps, 4× CPU): 1.48–2.07 s.

That meets the brief. **But (A5-9):**
- under the same probe, audit 4 measured 1.0–1.4 s;
- Lighthouse simulated LCP rose to 2.71–4.11 s (audit 4: 1.97–4.21 s), with perf 63–92 (audit 4: 81–97);
- with DevTools "Fast 3G" (562 ms RTT), home (2.70/2.79 s), `/pro` (2.68/2.59 s) and `/admin` (2.68/2.66 s) miss 2.5 s.

**The cause is render delay, not decoration.**
- Suppressing every aura, grain and glass layer did not change FCP (2.10–2.23 s vs 1.91–2.20 s).
- First paint waits for the render-blocking CSS (30 KB, done at about 1.1 s) and the hydration long tasks (50–650 ms at 4× CPU). Meanwhile the 93 KB of preloaded fonts and about 200 KB of JS compete for the link.
- Home ships 390 KB raw HTML (51 KB gzip), of which 180 KB is the inline RSC payload.

## 9. Trust & conversion — 8/10 (=)

- **Stronger:**
  - v2 itself is a trust signal: precise, calm, technically confident;
  - the verification story is now correct per category (A4-3);
  - the empty state is honest (A4-6);
  - the confirmation and running-treatment copy is right (A4-5);
  - the proof band is DB-backed (128 reviews at 4,70 and 27 approved pros in the current seed; the seed is randomised).
- **Holding it back:**
  - R12 placeholders;
  - `hallo@soma.example` and `localhost:3000` links unless configured;
  - the admin demo data (F8 rest);
  - thin supply at the demo PLZ (2 massage pros at 10115).

## 10. Premium-Anmutung (High-End-Produkt) — 9/10 (new)

| Experience | Score | Why | What a 10 needs |
|---|---|---|---|
| Customer | **9** | A product-led hero on a quiet aura; glass sheets; the confirmation moment (check draws, digits stagger, haptic); intentional fallbacks; a consistent rhythm | A richer search results page (featured slot, map or aura header, no duplicated summary); real photos verified; no clipped or truncated strings (A5-8) |
| Provider | **9** | Mobile-app-grade: countdown rings, KPI sparklines, an agenda timeline, the Start-Code sheet with shake/settle and empty states with aura art | A5-7 visible status words; A5-12 NBSP; an animated tab indicator on *Termine* |
| Admin | **9** | Linear-grade shell, palette, dense tables, gradient charts with table fallbacks | Believable demo metrics (F8 rest); an `h1` on not-found (A5-13); one empty-palette message |
| **Overall** | **9** | All three read as one premium product, and *Bewegung und Ruhe* is genuinely felt | The items above plus A5-1 and A5-9 (a high-end product never drops focus and paints in < 2.5 s on slow networks) |

---

## T. Technical measurements

### T.1 Performance

**Playwright probe, 390×844 @2x, cold context, two runs each.** LCP/CLS via PerformanceObserver; long tasks via the `longtask` observer; transfer sizes via CDP.

| Route | Unthrottled LCP | **Slow 4G + 4× CPU** LCP (FCP = LCP) | **Fast 3G + 4× CPU** LCP | CLS | JS (unthrottled) | Fonts |
|---|---|---|---|---|---|---|
| `/` | 416 / 340 ms | **1.98 / 2.07 s** | 2.70 / 2.79 s | 0 | 202 KB (12) | 96 KB (2) |
| `/suche?plz=10115&kategorie=massage` | 368 / 300 ms | **1.71 / 1.48 s** | 2.02 / 2.05 s | 0 | 220 KB (21) | 96 KB |
| `/profis/selin-a-berlin` | 344 / 308 ms | **1.72 / 1.65 s** | 2.21 / 2.15 s | 0 | 222 KB (14) | 96 KB |
| `/buchen?…` (guest) | 332 / 264 ms | **1.92 / 1.82 s** | 2.03 / 1.97 s | 0 | 252 KB (18) | 96 KB |
| `/pro` (Selin) | 776 / 652 ms | **1.91 / 1.82 s** | 2.68 / 2.59 s | 0 | 215 KB (13) | 96 KB |
| `/fuer-profis` | 368 / 256 ms | 1.80 / 1.95 s | 2.35 / 2.21 s | 0 | 252 KB (17) | 96 KB |
| `/konto` (Julia) | 280 / 616 ms | 1.60 / 1.55 s | 2.43 / 2.47 s | 0 | 213–235 KB (20) | 96 KB |
| `/admin` | 600 / 620 ms | 1.89 / 1.82 s | 2.68 / 2.66 s | 0 | 208 KB (12) | 105 KB (3) |

- **Profiles.** Slow 4G = 150 ms RTT, 1.6 Mbps down, 750 kbps up (Lighthouse's mobile values and audit 4's probe). Fast 3G = DevTools preset: 562.5 ms RTT, 1.44 Mbps.
- **Other figures:**
  - TTFB 12–141 ms;
  - page weight 390–573 KB;
  - 0 third-party hosts;
  - LCP elements are text (hero `h1`, demo ribbon, bio, admin meta) or a decorative aura layer on `/pro` and `/konto`;
  - long tasks at 4× CPU: 2–8 per load, max 271–751 ms (hydration).

**Lighthouse 12.8, mobile simulated, two runs (trend only):**

| Route | Perf A4 → **A5** | LCP A4 → **A5** | TBT A4 → **A5** | CLS | A11y | BP | SEO |
|---|---|---|---|---|---|---|---|
| `/` | 94/96 → **63/77** | 2.32/2.68 → **3.78/4.11 s** | 231/110 → **1374/381 ms** | 0 | 100 | 96 | 69 |
| `/suche` | 95/92 → **82/83** | 2.80/2.81 → **3.69/3.69 s** | 83/234 → **325/300 ms** | 0 | 100 | 96 | 63 |
| profile | 93/82 → **83/92** | 3.01/3.97 → **3.87/3.35 s** | 108/144 → **238/90 ms** | 0 | 100 | 96 | 66 |
| checkout | 96/97 → **86/87** | 2.23/1.97 → **3.33/2.71 s** | 181/160 → **288/394 ms** | 0 | 100 | 96 | 63 |
| `/fuer-profis` | 81/83 → **83/87** | 4.21/3.75 → **3.75/3.26 s** | 119/146 → **256/269 ms** | 0 | 100 | 100 | 69 |

- **Lighthouse-observed LCP** (the real trace) equals FCP at 0.23–1.25 s. The simulated LCP adds 2.3–3.7 s of *Render Delay* from main-thread bootup:
  - home: 2.2–2.5 s for the inline RSC script plus 1.3–1.8 s for the main chunk at simulated 4× CPU.
- **SEO 63–69** comes from `noindex, nofollow` in demo mode (intended).
- **Best-practices 96** comes from console errors (blocked CDN images; `/favicon.ico`).

**Decoration A/B** (home, Slow 4G + 4× CPU, three runs each): with every `.grain`, `[data-ambient]`, `.glass` and `.glass-strong` layer hidden, FCP was 2.20/1.91/2.16 s vs 2.23/2.10/2.16 s normal. **The v2 visuals do not cost first paint.**

**HTML payloads** (raw / gzip / inline RSC):

| Route | Raw | Gzip | Inline RSC |
|---|---|---|---|
| `/` | 390 KB | 51 KB | 180 KB (1,160 elements) |
| `/suche` | 190 KB | 25 KB | 97 KB |
| profile | 219 KB | 29 KB | 104 KB |
| `/fuer-profis` | 223 KB | 34 KB | 123 KB |

### T.2 Fonts

- `/`: 2 files, 2 preloads, **96 KB** (Inter latin variable `wght`+`opsz` 72 KB; Newsreader display italic 23 KB), all `font-display: swap` with metric-adjusted fallbacks. That is within the brief's budget (≤ 2 preloads, ≤ 150 KB).
- `/admin` adds DM Mono (10 KB, not preloaded).
- Newsreader is preloaded on routes that show no accent above the fold (`/suche`, checkout). The *„preloaded but not used“* warnings point there (A5-9).

### T.3 JS per route

Transfer, unthrottled, fresh context:
- `/` 202 KB;
- `/suche` 220 KB;
- profile 222 KB;
- checkout 252 KB;
- `/pro` 215 KB;
- `/fuer-profis` 252 KB;
- `/konto` 213–235 KB;
- `/admin` 208 KB.

Audit 4 (Lighthouse): 183–221 KB, so v2 added about 20–30 KB. No animation library is shipped; motion is CSS.

### T.4 Contrast (WCAG 2.2 AA), computed on rendered pixels

Method:
1. Text colour from the computed style.
2. Hide all text, screenshot the element box, take the 2nd-percentile darkest background pixel (and the absolute darkest).
3. Hero texts were sampled at drift phases 0, 25, 50, 75 and 100 % of the aura animations.

| Text | Colour | Min ratio (p2) | Darkest pixel | Level |
|---|---|---|---|---|
| Home hero lead, 390 | muted `#6B665E` on aura | **4.84** | 4.56 | AA |
| Home hero lead, 1440 | muted on aura | 4.92 | 4.82 | AA |
| Category hero lead, 390 | muted on aura | 4.83 | 4.59 | AA |
| *Für Profis* hero lead, 390 | muted on aura | 4.93 | 4.64 | AA |
| City hero lead, 390 | muted on aura | 4.86 | 4.65 | AA |
| `/pro` greeting meta, 390 | muted on aura band | 4.66 | **4.46** | AA (tight) |
| `/pro` greeting meta, 1440 | muted on aura band | **4.52** | **4.37** | AA at p2, below at the darkest pixel |
| Booking hero sentence (*läuft*), 390 | muted on aura card | 4.70 | **4.48** | AA (tight) |
| `/konto` next-appointment time | muted on aura card | 5.19 | 5.09 | AA |
| Footer links | muted on faint aura | 4.97 | – | AA |
| Bottom nav labels (`/pro`, `/konto`) | muted on glass | 5.50–5.70 | – | AA |
| Search chips on the sticky glass bar | ink on glass | ≥ 11.44 | – | AAA |
| Admin KPI captions | muted on raised | 5.70 | – | AA |
| Login aura caption | ink (decorative, `aria-hidden`) | 16.17 | – | – |

The lighter palette holds AA. On aura bands behind `/pro` and the booking hero, the margin is 0.02–0.2 (A5-15).

### T.5 Keyboard paths

- **Home Tab order** (desktop): skip link → logo → nav pills → *Anmelden* → *Termin buchen* → *Wo?* (field-group focus-within) → *Standort verwenden* → *Was?* → *Wann?* → *Verfügbare Profis anzeigen*. Every step is visible (`35`).
- **Checkout (guest, keyboard only):**
  1. Tab to *„Morgen 09:00 Uhr bei Hanna B. buchen“*, then Enter.
  2. Type street, number, name, e-mail and mobile.
  3. Space on the couch checkbox and on the § 356 consent.
  4. Enter on *„Zahlungspflichtig buchen · 69 €“* → *„Bestätigt.“*
  - **44 Tab presses** in total, no trap, no invisible focus (the textarea shows the accent border plus a 4 px ring).
- **Cancel by keyboard:** Enter on *Termin stornieren* → focus on *Termin behalten* → Tab → *Kostenlos stornieren* → Enter → *„Storniert.“* Tab cycles inside the `<dialog>` (plus the browser-chrome stop).
  - **After Esc, focus is on `<body>`** (A5-1).
- **⌘K:**
  - *Strg+K* opens the palette with focus in the combobox; ↑↓ moves `aria-activedescendant`; Enter on *SM-…* opens the booking.
  - Esc restores focus to the sidebar *Suchen* button when it opened the palette.
  - When the palette was opened by the shortcut, focus returns to `<body>`, which had it before (correct).
- **Sheets and pro dialogs:** the *Was?* sheet opens on *Schließen*; Esc returns focus to *Was?*. The decline sheet returns focus to *Ablehnen*.

### T.6 Targets and overflow

See §3. Full lists are in the scratch `targets-out.json`: 40 routes × 320/390, with pseudo-element hit areas and label boxes counted.

---

## 10a. E2E regression suite

- **Full suite:** `E2E_BASE_URL=http://localhost:3100 npx playwright test` → **108 passed (6.1 min)**, mobile and desktop. That covers booking, access, remediation and audits 3–4, with A4-2 now without `test.fail()`.
- **New `tests/e2e/audit5.spec.ts`:** 9 tests × 2 projects → **17 passed, 1 skipped** (the palette test is desktop only). `test.fail()` cases pass while the defect exists; remove the line once fixed.

| Test | Covers | State |
|---|---|---|
| the cancel dialog opens on the safe action and returns focus to its trigger | A5-1 | `test.fail()` (confirmed) |
| saved addresses fit a 320 px screen | A5-2 | `test.fail()` (confirmed) |
| the booking detail header fits a 320 px screen | A5-2 | `test.fail()` (confirmed) |
| the provider document list fits a 320 px screen | A5-2 | `test.fail()` (confirmed) |
| the hero aura drifts while visible and pauses offscreen | principle 11 | passes |
| reduced motion: no looping animation, no parallax, no scroll reveal | principle 11, WCAG 2.3.3 | passes |
| an instant booking vibrates once on confirmation and once on cancellation | `haptic()` (books and cancels; `finally` clean-up) | passes |
| the admin palette finds a booking by reference and gives focus back | ⌘K keyboard path | passes (desktop) |
| booking facts are a valid description list | A5-3 | `test.fail()` (confirmed) |

---

## Remaining issues (prioritised)

Severity: **blocker** = before launch · **demo** = before the client tests on their own · **high** = next iteration · **medium** · **low**.

| ID | Sev. | Dim. | Issue → expected behaviour | Where | How to verify |
|---|---|---|---|---|---|
| **R12** | blocker | 9 | Legal texts are placeholders | `src/app/(site)/{impressum,datenschutz,agb,agb-profis,widerruf}/page.tsx` | `npm run check:launch` with the production env |
| **A5-1** | medium | 4, 2 | **The dialog is unmounted instead of closed.** `{open ? <Modal open …/> : null}` removes the `<dialog>` without `close()`. No platform focus restore (focus → `<body>` after Esc or *Behalten*) and no exit animation. **Expected:** keep `<Modal open={open}>` mounted and let `useDialogMotion` play the exit and call `close()`. Focus returns to *Termin stornieren* / *Löschen* | `src/components/site/checkout-cancel.tsx:138–178`; `src/components/site/account-addresses.tsx:176` | `audit5.spec.ts` › A5-1 (remove `test.fail()`); visually, the modal fades out |
| **A5-2** | medium | 3 | **Overflow at 320 px.** **Expected:** `scrollWidth == clientWidth`. (a) Let the address action row wrap or drop the button labels below 360 px. (b) Shrink the checkout header gap and back-pill padding, or hide the pill text below 360 px. (c) Remove the `-mr-1` overhang or let the document row's action column shrink | (a) `src/components/site/account-addresses.tsx:139–152`; (b) `src/components/site/checkout-header.tsx:21–42`; (c) `src/components/pro/documents-manager.tsx:183–200` | `audit5.spec.ts` › A5-2 ×3 |
| **A5-3** | medium | 4 | **Invalid description lists.** `Fact` wraps `dt`/`dd` in `div > div`; `/pro/bewertungen` puts a `<p>` inside `<dl>`. **Expected:** one `<div>` per group directly in `<dl>` (move the icon into it or render it via `::before`); the footnote `<p>` goes after `</dl>` | `src/app/(checkout)/buchung/[id]/page.tsx:150–162` (used at `:377`); `src/app/pro/(app)/bewertungen/page.tsx:39–53` | axe `definition-list`/`dlitem` = 0; `audit5.spec.ts` › A5-3 |
| **A5-9** | medium | 8 | **Render delay.** Lighthouse LCP 2.7–4.1 s and TBT up to 1.37 s; Fast-3G LCP 2.59–2.79 s on home, `/pro` and `/admin`. **Expected:** home LCP ≤ 2.5 s on DevTools Fast 3G and Lighthouse perf ≥ 85. **How:** (1) preload Newsreader only on routes with an above-the-fold `<em>` (not `/suche`, checkout, `/pro`, `/admin`); (2) cut the home RSC payload (180 KB inline) by keeping the floating stage, rails and cards server-only and passing fewer props to client islands; (3) defer hydration of below-the-fold client components; (4) consider merging the two CSS files | `src/app/layout.tsx:23–37`; `src/app/(site)/page.tsx`; `src/components/site/discovery-*.tsx` | The Playwright probe in this report (Fast 3G) and Lighthouse ×2 |
| A5-4 | low | 4 | **Label in name.** Calendar blocks are labelled *„13:00–14:00, Julia, Aromaölmassage, Angefragt“* while showing *„13:00 · Anfrage …“*; the *Pro* logo link is labelled *„SOMA für Profis“* while showing *„soma Pro“*. **Expected:** the visible text starts the accessible name | `src/components/pro/calendar.tsx:199`; `src/app/pro/registrieren/layout.tsx:27` | axe `label-content-name-mismatch` = 0 |
| A5-5 | low | 4 | The mobile quotes carousel is a horizontal scroll region with no keyboard access. **Expected:** `tabIndex={0}`, `role="region"` and `aria-label="Stimmen"` (or the rail's arrow buttons) | `src/app/(site)/page.tsx:231` | axe `scrollable-region-focusable` = 0 |
| A5-6 | low | 3, 4 | **Targets.** Size-S buttons are 36 px with no hit-area extension; *„Alle 4 anstehenden Termine“* is 16 px tall; the `/pro` greeting links are 20 px; admin table links 18–21 px. **Expected:** ≥ 44 px on touch (an `::before` inset on size S; `py-3 -my-3` on section links) and ≥ 24 px in admin tables | `src/components/ui/button.tsx` (size `s`); `src/app/konto/page.tsx:70` (section link); `src/app/admin/bewertungen/page.tsx:124` and the other admin table links | targets crawl: 0 non-inline targets < 44 px on customer and `/pro` routes; axe `target-size` = 0 |
| A5-7 | low | 1, 4 | The mobile `/pro` agenda shows the status as a coloured dot only (`sr-only sm:not-sr-only`). **Expected:** a visible word, e.g. *Bestätigt*, *Angefragt*, *Jetzt* (guideline §4.3) | `src/components/pro/bookings.tsx:97–99` | 390 px screenshot of *Als Nächstes* |
| A5-8 | low | 1, 2 | **Profile booking panel.** The select clips (*„… · 60 M“*); at 1440×900 the panel scrolls internally and the evening slots sit under the frosted footer; the date strip clips a cell under the arrow. **Expected:** drop the price from the option text (it is in the list) or let the select grow; a panel tall enough or a single page scroll; fade the strip edge instead of clipping | `src/components/site/slot-picker.tsx:161–173`; `src/app/(site)/profis/[slug]/_components/profile-booking.tsx` | Screenshot at 1440×900 |
| A5-10 | low | 8, 9 | `/favicon.ico` → 404 (browsers request it; a console error and the Lighthouse BP penalty). **Expected:** add `src/app/favicon.ico` (ink tile with σ) | `src/app/` | `curl -I /favicon.ico` → 200 |
| A5-11 | low | 1, 2 | One blank interframe between the old page and the new skeleton on client navigation (home → `/suche`). **Expected:** overlapping cross-fade (start `vt-in` at 0 ms or keep the old snapshot until the skeleton paints) | `src/app/globals.css:239–244` | Frame sequence (`34`) |
| A5-12 | low | 1 | Short dates break inside (*„So., 1. / Nov.“* in the pro countdown). **Expected:** NBSP inside the short date (guideline §3) | `src/lib/format.ts:46` (`formatDayShort`); `src/components/pro/countdown.tsx:40` | 1440 screenshot of a request card |
| A5-13 | low | 4 | The admin not-found state (*„Eintrag nicht gefunden.“*) renders its title as an `h2`, so the page has no `h1`. It answers HTTP 200, because the `loading.tsx` boundary has already streamed (framework behaviour; acceptable). **Expected:** an `h1` (e.g. `EmptyState` with a heading level prop) | `src/app/admin/not-found.tsx:8` | `/admin/buchungen/<random uuid>` → exactly one `h1` |
| A5-14 | low | 2 | **Haptic policy conflict.** `haptic("tap")` fires on slot taps, the sticky *Termin wählen* button and the checkout submit, but guideline §10.3 says key confirmations only. **Expected:** decide and align the code or the guideline | `src/components/site/slot-picker.tsx:217`, `discovery-slot-link.tsx:30`, `profis/[slug]/_components/profile-booking.tsx:228`, `checkout-form.tsx:276`; `docs/design-guideline.md` §10.3 | grep and the vibrate log |
| A5-15 | low | 4 | Muted text on aura bands reaches 4.37–4.48:1 at the darkest pixels (`/pro` greeting, booking hero). **Expected:** `subtle` aura intensity or `placement` away from text there | `src/app/pro/(app)/page.tsx` greeting band; `src/app/(checkout)/buchung/[id]/page.tsx` hero | Contrast probe ≥ 4.6 at the darkest pixel |
| F8 (rest) | low | 1, 9 | Admin demo metrics: the *Buchungen* chart spikes on the last day; *Auslastung Profis 0,5 %*; GMV −41,2 % | `scripts/db/seed.ts` | Overview without an end spike, believable utilisation |
| F14 (rest) / A4-8 | low | 9 | `hallo@soma.example`, `localhost:3000` links | `.env` (`NEXT_PUBLIC_SUPPORT_EMAIL`, `APP_URL`) | Footer and invite link |
| F15 (rest) | low | 2, 5 | No exact-time filter | `src/app/(site)/suche/**` | Filter changes results |

### Path to the next score
- **Mobile 8 → 9:** A5-2, A5-6 (customer and `/pro`). **→ 10:** WebKit/iOS pass, admin targets ≥ 24 px.
- **Accessibility 8 → 9:** A5-1, A5-3, A5-4, A5-5, A5-7. **→ 10:** screen-reader and 200 % zoom passes, A5-13, A5-15.
- **Performance 8 → 9:** A5-9 (Fast-3G LCP ≤ 2.5 s on all 5 brief routes, Lighthouse ≥ 85) and A5-10.
- **Trust 8 → 9:** R12, a real support address and `APP_URL` in the demo env, F8 rest.
- **Visual and Premium 9 → 10:** photography verified on the Netlify build; a richer search page; A5-7, A5-8, A5-11, A5-12.
- **UX 9 → 10:** A5-1, A5-8, an exact-time filter.
- **Functional 9 → 10:** exact-time filter, multiple service areas, address autocomplete; hide or implement the SMS toggle.
- **Booking 9 → 10:** Stripe test-mode path (Payment Element, manual capture, webhook, payouts).
- **Security 9 → 10:** CSP nonces, a sign-up throttle or CAPTCHA, A4-12 lint residuals.

---

## 11. Not tested / limits

- **No credentials:** Stripe, Supabase Auth and Storage, Resend, SMS and push.
- **Photography:** CDN blocked; photo crops, captions and photo LCP are unverified.
- **Other environments:** WebKit/iOS Safari, Firefox, real devices (real `navigator.vibrate` on Android), screen readers, 200 % zoom.
- **Not re-run this round:**
  - the 76-action authorization replay and 74 RLS probes;
  - the 12-way booking race;
  - the fee-tier DB matrix;
  - lint fuzzing (A4-12);
  - the 8-step onboarding beyond step 1 (viewed only, as asked).
- **Not specifically measured:** the shared-element glide of `TabLinks` and the `BottomNav` pill.
- **A4-4** needs a booking < 2 h ahead and was not re-checked.

## 12. Data hygiene

**Created during the audit:**
- guests `qa5-gast-mobile@` and `qa5-gast-desktop@` (bookings with Hanna B., cancelled) and `qa5-tastatur@kunden.soma.test` (keyboard checkout, cancelled);
- the E2E suite's and `audit5.spec.ts`'s bookings (all cancelled in clean-up).
- For the live Start-Code test, I moved the Julia–Selin demo booking (`SM-7X6MKX`) to *now + 25 min* in a `seed_mode` transaction, started it (one wrong code, then the right one), reset it once and started it again.

**Restored:**
- `npm run demo:refresh` at 19:21 UTC (before the E2E run);
- a **final `DEMO_MODE=true npm run demo:refresh` at 19:34:52 UTC as the last step**, after the last browser test.
- The seed deletes every `%soma.test` account and rebuilds the data relative to now. Afterwards: 0 `qa5…` accounts, 74 accounts, 215 bookings, demo appointment Mon 2 Nov 09:00.

**Repository:** only `docs/qa/audit-5.md`, `docs/qa/audit-5/*.jpg` (39 files) and `tests/e2e/audit5.spec.ts` were added. No product code changed. Neither server was restarted or rebuilt; `:3100` and `:3000` were up at the end.
