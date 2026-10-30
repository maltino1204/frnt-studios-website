# SOMA — Independent QA & Conversion Audit 3

*Agent 6 (QA & Conversion) · 30 Oct 2026 · final audit, round 3 · no product code changed*

| | |
|---|---|
| Build under test | production build `next start` on `http://localhost:3100`, `BUILD_ID PJhJmI-WXVJrUvw7iecAe` (built 17:43 UTC), `APP_URL=http://localhost:3100`, `DEMO_MODE=true`. No file under `src/` or `scripts/` is newer than the build; the build matches `HEAD 634a46f` |
| Data | freshly reseeded demo DB (17:47 UTC): requested 2 · confirmed 40 · completed 158 · cancelled 22 · no_show 5; 30 providers (27 approved, 1 auto-paused, 2 in verification), 74 accounts. Everything I created was removed again; the counts of all 33 public tables, `auth.users` and the 4 `app_private` tables match the pre-audit baseline (§12) |
| Accounts | `testkunde@soma.test` (Julia Hartmann), `testkunde-b2b@soma.test` (Selin A.), `testadmin@soma.test` (Alex Admin); for cross-account probes also `anna@kunden`, `ben@kunden`, `hanna@profis`, `linh@profis`, `nora@profis` |
| Devices | Chromium 390×844 @2x (touch) and 1440×900, plus 320 / 768 / 1024 for layout |
| Tools | Playwright (scripts and `@playwright/test`), axe-core 4.14, Lighthouse 12 (mobile, simulated, the same five pages as audits 1 and 2, two runs each), psql (RLS, DB cross-checks), Server Action replay with `fetch` (ids from `.next/server/server-reference-manifest.json`, JSON and form-encoded actions) |
| Evidence | curated screenshots in `docs/qa/audit-3/*.jpg`; raw screenshots, page-text dumps, probe scripts and Lighthouse JSON in the QA scratch dir (`…/scratchpad/qa3/`, not in the repo) |

---

## Executive summary

Remediation wave 2 is real. Of the 14 audit-2 items I verified **11 as fixed and 3 as partial** in the running build, the DB and the code. Nothing regressed functionally.

- **Contact lint (N3).** Decline and acceptance notes and both cancellation reasons are now linted. Every bypass audit 2 listed is caught (zero-width characters, full-width digits, *at/punkt*, letter O, *IG*, *Instagramm*), and dates are no longer mistaken for phone numbers.
- **Badge follows the documents (N4).** Rejecting Hanna's insurance paused her at once: out of search, profile 404, booking refused, admin queue item, *du* notice to her. She could only be reinstated after the document was approved again.
- **Rate limits.** The login limit no longer trusts any client header. A global failure budget slows every login by 1 s above 200 failures and 3 s above 400 (N2). Auth e-mails stop at 3 per address and hour behind a neutral message (N8).
- **UX (N5, N6, N10, N11).** Forms keep stars, text and address fields after a server error. The request checkout names the concrete deadline. The cancel dialog says *„Die Stornierung ist jetzt noch kostenlos.“* again. 70 reloads produced 0 hydration errors.
- **Robustness held.** 53 role/IDOR action replays, 65 RLS probes and a 12-way booking race (exactly one winner) behaved as specified. All cancellation tiers matched down to the DB row. axe shows **0 non-decorative violations on 36 pages × 2 viewports**. The full E2E suite is green: **96/96**, including 24 new tests.

Two product problems remain:

1. **Open redirect, again (F1, high).** The control-character vector is closed, but dot segments are not. `safeRelativePath()` returns the *normalised* path. For `/.//evil.example`, `/a/..//evil.example` or `/%2E//evil.example` that path is `//evil.example`. A signed-in visitor of `/anmelden?next=/.//evil.example/phish` lands on `http://evil.example/phish` (observed in Chromium). It is the same class as R2 and N1.
2. **Verification gap per category (F2, medium-high).** An approved massage pro added *Herrenhaarschnitt* (Haare & Styling, which needs a *Meisterbrief* or a Handwerksrolle entry) through the normal action. It was bookable in search at once and the profile still said *Verifiziert*.

**Demo readiness.** The product works end to end on all three accounts, and the numbers add up. Prices, payouts, commissions, credit balance and review aggregates all reconcile with the DB. The demo data, however, would undermine a client's trust in four places:

- Review texts contradict the booked service, and provider replies answer a different review. This shows in the **first quote on the home page** and on Selin's profile.
- The same 35 portfolio photos are shared across all 30 providers; the massage set appears on 7 profiles.
- The data is relative to the seed time.
- Every photo is hot-linked from a third-party generator CDN.

See the demo-blocker list in §D.

## Scores

| # | Dimension | Audit 1 | Audit 2 | Audit 3 | One-line justification (audit 3) |
|---|---|---|---|---|---|
| 1 | Visual quality | 8 | 8 | **8** | Same calm editorial system; mobile home 20 % shorter (8,425 px), 44 px logo targets, NBSP dates; but portfolio photos reused across providers, clipped demo-login button, raw keys in the admin log |
| 2 | UX & navigation | 7 | 8 | **9** | Forms keep input, concrete response deadline, correct cancel copy, thin-supply hints, saved address matched to the searched PLZ; remaining: no price or exact-time filter, rebook list can vanish |
| 3 | Mobile responsiveness | 8 | 8 | **9** | 68 routes × 5 widths: customer and admin 0 px overflow, admin tables scroll in focusable regions; only `/pro` at 320 px (4 px) and a transient admin skeleton overflow |
| 4 | Accessibility | 8 | 9 | **9** | axe 0 non-decorative violations on 36 pages × 2, skip links everywhere incl. `/pro/registrieren`; screen readers and zoom not tested |
| 5 | Functional completeness | 8 | 9 | **9** | Everything from audit 2 still works; gaps: price/exact-time filter, multiple service areas, address autocomplete, category-document gate (F2) |
| 6 | Booking reliability | 9 | 9 | **9** | Race (1 of 12), tiers, Bedenkzeit, fee basis, tampering, crafted slots, replays and business-hour deadlines all verified; Stripe path unverifiable here |
| 7 | Security & permissions | 7 | 7 | **7** | Lint, IP trust, global budget, e-mail throttle, document-driven suspension, RLS and IDOR all hold; **an open redirect is still exploitable** (F1) and the category-document gap (F2) undercuts verification |
| 8 | Performance | 6 | 8 | **8** | Perf 77–97, LCP 2.3–4.3 s, CLS ≈ 0, TTFB ≤ 72 ms, Stripe.js gone in dev mode; fonts still 331 KB on 4 of 5 pages |
| 9 | Trust & conversion | 7 | 8 | **8** | Strong mechanics (badge tied to documents, lint on all channels, concrete deadlines, proof band matches the DB); demo data contradicts itself, legal placeholders, `hallo@soma.example`, F2 |

---

## Verification of audit-2 items (N1–N14) and the open R-items

| ID | Status | Evidence |
|---|---|---|
| **N1** open redirect for signed-in visitors | ◑ **partial (new bypass → F1)** | Both pages now call `safeRelativePath`. `%09`, `%0A`, `%0D`, `%00`, `%7F`, `%5C`, `//`, `/\`, `https:` and `javascript:` all go to `/konto`, and there is no more HTTP 500 for `%0A`/`%0D`. The 4 audit-2 E2E tests run without `test.fail()` and pass. **But** dot segments survive: `/anmelden?next=/.//evil.example/phish` → `307 location: //evil.example/phish` → Chromium lands on `http://evil.example/phish`. The same holds for `/registrieren`, `/a/..//`, `/%2E//`, `/%2e%2e//` and `/./%2F`. The login *action* also returns `x-action-redirect: //evil.example/phish` for `next=/.//evil.example/phish`. The anonymous login form is safe only because the page passes the already-normalised `//…`, which the action then rejects |
| **N2** per-IP limit ineffective | ✅ fixed (config-dependent) | `X-Real-IP` and `X-Forwarded-For` are ignored (stored `ip = unknown`) unless `TRUSTED_IP_HEADER` or `TRUSTED_PROXY_HOPS` is set. With 205 failures simulated in the window, a failed login took **1,163 ms** and a correct one 1,234 ms (baseline 171 ms); with 405 failures it took **3,240 ms**. The per-e-mail back-off still works (*„Bitte warten Sie 3 Sekunden …“*). `check:launch` blocks a production env that sets neither variable (`scripts/check-launch.mjs:43–47`). Without that config only the per-e-mail and global limits apply. That is by design and documented |
| **N3** contact-lint gaps | ✅ fixed (minor residual → F13) | Replayed live: Selin's accept or decline note with a phone number, *WhatsApp*, a spelled-out number or `linh＠gmx．de` → refused with the *du* message. Anna's cancellation reason with `0151 …` or `(at)…(punkt)` → refused with the *Sie* message. Linh's provider cancellation with `0170-1234567` → refused; clean reasons pass. 77 strings tested against `findContactDetails`: all 20 audit-2 bypasses are caught, and `Seit 01.03.2019 …`, `03.11.2026 um 14:30`, prices and PLZ lists pass. Residual bypasses: `anna @ gmx . de` (spaced @, **accepted live** in a cancellation reason), *Telegramm*, `linhnails . de`, `dot de`, `(dot)com`, `.fr/.it/.nl`, mixed words and digits |
| **N4** badge not tied to documents | ✅ fixed | Admin rejected Hanna's approved insurance → `providerSuspended: true`; search for 10719 no longer lists her; `/profis/hanna-b-berlin` → 404; availability and booking refused (*„Dieses Angebot ist nicht verfügbar.“*); `/admin` queue lists her; `/pro` tells her what to upload. Reinstating without the document → refused with the missing list. Approving it alone keeps her paused; *reinstate* then works. Her 2 existing bookings stay. Expiry works too: the seed's Leyla A. (insurance expired 29.10.) is auto-paused, her profile is 404, her 3 reviews are excluded from `public_reviews` (126 of 129), and Charlotte J. shows *„läuft ab am 08.11.“* (`04-admin-status-history-seed-time-desktop.jpg`). Restored afterwards. A new, related gap: F2 |
| **N5** forms lose input | ✅ fixed | Review with a phone number: 4★, the tag and the text are kept, the field error sits at the textarea, the button stays usable (`06-…jpg`). Address with PLZ `00000`: street, number and PLZ are kept, with *„Diese Postleitzahl kennen wir nicht.“* at the field (`07-…jpg`). No rows were written |
| **N6** response-window mismatch | ✅ fixed | Lead decision: 4 business hours (08–21 Europe/Berlin), capped at start − 2 h. `platform_settings.request_response_hours = 4`. Spec §7, architecture §4/§5 and the migration agree. The seed's open requests are due Sa 08:45 and 09:32 (business hours). The checkout says *„… antwortet bis …, HH:MM Uhr“* (E2E `audit3.spec.ts` › N6), the same time as on `/pro` and in the inbox |
| **N7** admin tables overflow / not focusable | ✅ fixed (transient residual → F10) | `scrollWidth == clientWidth` on `/admin/kategorien`, `/admin/provisionen` and `/admin/profis/[id]` at 320/390/768/1024/1440 (crawl and E2E). axe: no `scrollable-region-focusable` (regions are `role="region"`, `tabIndex=0`, named). Residual: the loading skeleton of `/admin/profis/[id]` widens the page to 582 px at 320 for ~200 ms (F10) |
| **N8** auth e-mail throttling | ✅ fixed | 6 *Passwort vergessen* requests for `ben@` → 3 queued e-mails, 3 suppressed (`app_private.auth_email_requests`), the same neutral message each time; an unknown address queues nothing. Guest claim e-mails share the budget (code). Residual: `checkoutSignUp` still answers `{kind:"exists"}` (F16) |
| **N9** fonts and stray Stripe.js | ◑ **partial** | Stripe.js is no longer requested on the dev-mode checkout (Lighthouse request list). The fonts are unchanged: **331 KB** on `/`, profile and `/fuer-profis`, 201 KB on `/suche` (target < 150 KB). LCP < 2.5 s on `/` and once on `/suche` only (§8) |
| **N10** cancel-dialog copy | ✅ fixed | Booking 5 days ahead, dialog opened at once: *„Die Stornierung ist jetzt noch kostenlos. Sie erhalten 47,00 € zurück.“*, without the Bedenkzeit line (`05-…jpg`, E2E › N10). The Bedenkzeit branch still applies when the tier would charge (replayed: free at once on a 15 h booking) |
| **N11** hydration error #418 | ✅ fixed | 10 reloads each of `/konto/benachrichtigungen`, `/konto`, `/pro`, `/pro/termine`, two booking pages and `/admin`: 0 `pageerror`, 0 hydration console errors. Relative times start from `renderedAt` |
| **N12** phone-exchange decision | ✅ fixed | Spec §11 and architecture §3 document the v1 decision. The UI matches: the request shows *„Telefon: Nach Bestätigung sichtbar“* and no street; confirmed shows `+49 170 3334455` as a tel link and the street; completed shows *„—“* and *„Adresse nicht mehr sichtbar“*. No e-mail anywhere |
| **N13** search gaps and thin supply | ◑ **partial** | Thin results (< 3) now show *„So finden Sie mehr Auswahl“* with other days (*„An anderen Tagen: Morgen“*) or *„Ohne Filter suchen“* (`09-…jpg`). Neighbouring-PLZ suggestions exist in code (`listNearbyPostalCodes`) but did not appear in any case I tried. **No price-range and no exact-time filter** (`SearchSchema` has `timeOfDay` only; *Ab Uhrzeit* is declared as not done) |
| **N14** polish | ✅ mostly fixed | `/pro/registrieren` has a skip link (axe). Header logo links are 101×44 and 123×44; provider-name links in rows are 30 px tall. Customer dates use NBSP (`1. November, 17:30 Uhr`). Mobile home is **8,425 px** (anon) instead of ≈ 10,500. Seed review sentences are unique (129 reviews, 0 duplicate texts or replies). Open: CSP still has `'unsafe-inline'` for scripts (documented), and the `/pro` countdown breaks *„08:45⏎Uhr“* |
| **R2** (open redirect) | ◑ → F1 | see N1 |
| **R4** (font budget) | ◑ unchanged | see N9 |
| **R6** (IP trust) | ✅ | see N2 |
| **R7** (contact lint) | ✅ | see N3 |
| **R9** (response deadlines) | ✅ | see N6 |
| **R12** (legal texts) | ❌ not fixed (expected) | Impressum, AGB and Datenschutz still show *„Platzhalter – rechtliche Prüfung erforderlich“*, `[Firmenname]` and `[Anschrift]`; `check:launch` gates it |
| **R22** (price / exact-time filter) | ❌ not fixed (declared) | see N13 |

---

## D. Demo-readiness review

I logged in with each test account (the one-tap *Demo-Zugänge* fill the form; *Anmelden* then lands on `/konto`, `/pro` and `/admin` respectively) and walked through what a client would do in 20 minutes. I cross-checked every number I saw against the DB.

### D.1 Customer — Julia Hartmann (`testkunde@`)

**What works and is believable**
- `/konto` shows *„Guten Abend, Julia.“*, the next appointment (*Mo., 2. Nov., 17:30 · Shellac-Maniküre · Mai T. · Bestätigt*), 3 one-tap rebook suggestions, 15,00 € credit and 2 unread notifications (`10-demo-customer-konto-mobile.jpg`).
- **Termine:** 3 upcoming (2 confirmed, 1 request to Selin with *„Antwort bis morgen, 09:32“*), 10 completed (May–Oct across 6 pros and 6 categories, one in a Frankfurt hotel, one at her Berlin office) and 1 cancelled with a correct 50 % fee (32,50 € of 65 € service, travel refunded).
- **Booking detail:** Start-Code, address with floor details, `.ics`, a cancellation schedule with concrete times, VAT line per pro (*19 %* or *§ 19 UStG*), *„SOMA vermittelt; Vertragspartner ist …“*.
- **Credits:** the ledger reconciles to the balance (15 − 15 + 15 + 10 − 10 = 15 €), and the two redemptions appear on the matching bookings.
- **Other screens:** 3 favourites, 3 saved places (Zuhause, Büro, Hotel Frankfurt) and a notification inbox whose texts match the bookings.
- **One reviewable booking** (Hot-Stone, 22 Oct) lets the client try the review composer.
- **Booking flow:** search 10435 → Linh N. slot → checkout. The default address is preselected, and searching 10117 preselects her *Büro*. *Testmodus* is shown, and *„Zahlungspflichtig buchen · 47 €“* leads to *„Bestätigt.“* with a Start-Code. The cancel dialog is free, ending in *„Storniert.“* Prices are equal in search, checkout, CTA and confirmation.

**What a client would trip over**
- **The first quote on the home page contradicts itself:** *„Die Hot-Stone-Massage war der perfekte Start ins Wochenende.“ — Clara N. · Entspannungsmassage (klassisch) bei Selin A.* (`01-…jpg`). It is also the newest review on Selin's profile.
- **Thin choice at her own PLZ.** *Massage in 10435* lists 2 pros. The first one is *„Hanna B. · Neu auf SOMA“* (a pro active since March with 4 completed appointments), ranked above Selin (4,8 ★, 27 reviews). *Kosmetik in 80331 München* lists 1 pro, with the first slot on Monday.
- **Address mismatch.** The saved home address says *„Vorderhaus, 3. OG rechts“*, but the open request to Selin says *„2. OG links“*.
- **Six different cards.** Her booking history uses six cards (Visa •••• 6281, •••• 1557, Mastercard •••• 3917, •••• 9560, •••• 3206, Amex •••• 8531), while new bookings use Visa •••• 4242.
- **Event times at night:** *„Termin bestätigt Fr., 30. Okt., 05:49“* and *„Termin storniert So., 20. Sept., 04:00“*.
- **Copy:** *„zuletzt letzten Monat“* in the rebook list; *„Kundin oder Kunde seit 13. April 2026“*; the support address *hallo@soma.example* in the footer of every page and in the account-deletion text.
- **The demo account can be broken.** *Passwort ändern* and *Konto löschen* work, and the password is printed on the login page. One curious click locks everyone else out until a reseed.

### D.2 Provider — Selin A. (`testkunde-b2b@`, SOMA's B2B customer)

**What works and is believable**
- **`/pro` (Heute):** *„Guten Abend, Selin.“*, 2 open requests with countdowns (*„Du hast noch 13 Std. 48 Min. … (bis Sa., 31. Okt., 08:45 Uhr)“*), the customer's note *„Gern mit dem Lavendelöl vom letzten Mal.“*, and per-request payouts. Example: *85,32 € für dich* = 89 € − 12 % + 7 € travel, which I checked.
- **Reconciled numbers:**
  - The next 3 appointments with first and last name and address (confirmed only).
  - *Diese Woche 107,50 €*.
  - Rating 4,8 from 27 reviews (22× 5★, 5× 4★ = 4.81).
  - 32 completed.
- **`/pro/einnahmen`:** available 127,32 € + pending 107,50 € + paid 2.798,54 € = 3.033,36 € = the sum of the six monthly rows. Each row shows its tier (20 / 12 / 5 %).
- **`/pro/verifizierung`:** 4 documents *Geprüft*, including the massage certificate.
- **Other screens:**
  - `/pro/kalender` with hours Mon–Sat 09–19.
  - 5 services with guide prices.
  - Area 10405 · 12 km.
  - Settings with request mode and VAT *Regelbesteuert*.
  - Personal invite link.
- **Contact data appears only on confirmed appointments.**

**What a client would trip over**
- **Replies that answer a different review.** These are on her public profile and on `/pro/bewertungen` (`02-…jpg`):
  - *„Ich freue mich, dass du so gut schlafen konntest.“* answers *„Angenehme Gespräche am Anfang …“* (the sleep review is the next one and has no reply).
  - *„Freut mich sehr, dass die Hot-Stones so gut angekommen sind.“* answers a Rücken- & Nackenmassage review.
  - *„Danke, ich drehe die Musik beim nächsten Mal leiser.“* answers a review without a music complaint.
  - *„Sorry für die Verspätung …“* answers a 5★ review about the table setup.
  - *„Schön, dass es im Hotel so gut geklappt hat.“* answers a review about a gift for a mother.
  - Review texts also contradict the service: *„Wunderbare Aromaölmassage“* and *„Mittagspause im Büro, 30 Minuten Rücken und Nacken“* on *Entspannungsmassage (klassisch)*, a 60/90-min service.
  - The same pattern runs through other profiles. Jonas W. answers a 2★ *„Leider wurde deutlich mehr abgeschnitten als besprochen.“* with *„Danke! Es war mir eine Freude.“* Merle P. answers a 5★ hygiene review with *„Tut mir leid, dass es diesmal nicht ganz gepasst hat …“*. Abena O.'s two replies are swapped. Mai T. has a lifting complaint on *Augenbrauen zupfen & färben*.
- **No appointment can be started in a demo.** *„Heute ist frei.“* The next appointment is Sat 16:30, and *Termin starten* only appears 30 minutes before. The Start-Code check-in and *Abschließen*, a key differentiator, cannot be shown live.
- **Requests expire overnight.** Both open requests are due **Sat 31 Oct, 08:45 and 09:32**. A demo after that shows no open requests, and Julia's request turns into *„abgelaufen“*.
- **Night-time confirmations.** Request-mode bookings were *„Bestätigt Fr., 30. Okt. · 04:47“* by Selin.
- **Stock-photo portfolio.** Her 4 portfolio photos are the same images as on Hanna's, Bernd's, Luca's, Márcia's, Theresa's and Thomas's profiles, while `/pro/profil` says *„Zeig echte Arbeiten – keine Stockfotos.“*
- **Minor layout issues:** at 320 px the request card is 4 px wider than the screen and its right border is cut off (`08-…jpg`); the meta line repeats *„Stammkundschaft“*.

### D.3 Admin — Alex Admin (`testadmin@`)

**What works and is believable**
- `/admin` KPIs and work queues:
  - Nora K. and Paul A. in verification, with 5 and 4 documents open.
  - 1 open dispute (Greta L. ↔ Merle P., 54 €, with a clear description).
  - 2 unanswered requests with expiry.
  - *„Dokumente & Sperren“*: Leyla A. *Automatisch pausiert*, Charlotte J. *Läuft bald ab*.
- **The approval gate holds.** *Freigeben* for Nora and *Reaktivieren* for Leyla are refused, with a list of the missing documents.
- Users (74), bookings, payments (all *dev*, clearly labelled), commission rules, regions with real supply gaps (*„Pediküre in Hamburg 13 Suchen, 0 Profis“*), review moderation with filters, and the audit log.

**What a client would trip over**
- **A seed spike in the charts.** *Buchungen erstellt* jumps from 0–3 per day to ≈ 25 on 29–30 Oct, because the seed creates all 42 upcoming bookings in the last two days (`03-…jpg`). That spike drives *„Buchungen +70,7 %“*, while GMV is −14,3 % and *Auslastung Profis* 0,7 %.
- **Status history at seed time.** Every provider's *Statusverlauf* reads *„Entwurf → Freigegeben 30.10.2026, 18:47“*, even for pros approved in 2025 with dozens of appointments (`04-…jpg`). Leyla is *„Automatisch pausiert … seit vor 10 Minuten“* although her insurance expired the day before.
- **Seed artefacts in the audit log.** Every entry shows *„demo: true“*, and the new action appears as the raw key `provider.auto_suspend`, also in the filter list.
- **Three different search counts:** 424 (KPI and funnel), 421 (chart) and 402 (`/admin/regionen`) for the same 30 days.
- **Copy:** *„seit vor 20 Stunden“*.

### D.4 Cross-cutting

- **Photos are hot-linked.** `src/lib/images.local.json` is `[]`. Every portrait, portfolio, category and editorial image is loaded through `/_next/image` from `d8j0ntlcm91z4.cloudfront.net/user_…` (a generator's user bucket). If that host is slow, purged or blocked on the demo network, the client sees tone panels with initials everywhere.
  - In this sandbox I could not load a single photo. The fallbacks looked finished, and I did not penalise them.
  - I could not verify that the 47 new images exist or match their captions.
- **Image integration in code is correct.**
  - All 30 avatar paths and all 120 portfolio rows (35 distinct files) exist in `scripts/images/sources.json`.
  - All ratios match width/height (4:5 portraits at `50% 36%`, 1:1 portfolio).
  - Alt texts are *„Porträt von Selin A.“* and the caption (e.g. *„Leinentücher und Massageöl, mitgebracht“*).
  - The captions fit the categories (each portfolio row's `category_id` is one of the provider's categories).
  - The portraits follow `art-direction.md` §4.2 for pro-01…10 (e.g. pro-09 non-binary → Kiran D., pro-10 → Chidi O.). pro-11…30 are not documented there.
- **Running the E2E suite pollutes the demo accounts.** The suite books as `testkunde` and declines as `testkunde-b2b`. After two runs, Julia had **48 bookings and 69 unread notifications**, and *„Erneut buchen“* had disappeared from `/konto` (F11). I removed everything again, but the suite must never run after the final pre-demo reseed.

### D.5 Demo blockers (fix or mitigate before the client test)

| # | Blocker | Fix |
|---|---|---|
| **DB1** | Review texts contradict the booked service, and replies answer other reviews. Visible on the **home page** and on the B2B persona's profile | Seed: pick review sentences from a pool keyed by **service** (or neutral ones), and write replies per review (or tag each reply with the review it answers); `scripts/db/seed.ts:223–255`, `scripts/db/lib/demo-data.ts` (`REVIEWS`, `PROVIDER_REPLIES`, `SELIN_REPLIES`) |
| **DB2** | Time-relative data: requests expire Sat 08:45 / 09:32, there is no startable appointment, and night-time event stamps | **Reseed ≤ 1 h before the demo.** Add one confirmed Selin appointment that starts ~20–40 min after the planned demo start (Start-Code demo), and clamp seeded event times to 08–21 h |
| **DB3** | Photos depend on a third-party CDN | Run `npm run images:fetch`, commit or deploy the files (so `images.local.json` is filled), rebuild, and check on the demo machine and network |
| **DB4** | Shared demo logins can be broken by the client (password change, account deletion, admin *Sperren* or *Anonymisieren* of the demo users) | In `DEMO_MODE`, refuse these actions for the three demo accounts with a friendly notice; or reseed between sessions |

Should fix for credibility (not blockers): give each provider distinct portfolio photos, or show only 2–3 and vary them (F4); spread the seed's `created_at` for upcoming bookings over 30 days and stamp the status history at `approved_at` (F8); replace `hallo@soma.example` with the real demo domain (F14).

---

## 1. Visual quality — 8/10 (=)

**What I did:** full-page screenshots of 40 views across the three roles (mobile and desktop), 320-px crops, and the guideline check.

- **The system is intact.** Ink primary actions, ultramarine only as a pointer, roof lines, hairlines, Newsreader for display text, and finished tone-panel fallbacks.
- **The new elements fit:**
  - auto-pause queue;
  - *Läuft bald ab*;
  - thin-supply hint (a left rule, not a banner);
  - field-level lint errors;
  - demo-login tiles.
- **Improvements:** mobile home 8,425 px, down ~20 % from audit 2; NBSP in customer dates; logo targets 44 px.
- **Findings:**
  - Portfolio photos are reused across providers: 35 files for 120 rows, the massage set on 7 profiles. This becomes visible as soon as photos load (F4).
  - The middle demo-login tile *„Testkunde B2B (Profi)“* wraps and clips its e-mail line at 390 px.
  - `/pro` request card at 320 px: the right border is cut off (F9).
  - Raw `provider.auto_suspend` in the admin log (F14).
  - *„08:45⏎Uhr“* in the `/pro` countdown.

## 2. UX & navigation — 9/10 (↑ from 8)

- **Fixed and observed:**
  - N5: review and address forms keep input.
  - N6: the concrete deadline in checkout.
  - N10: the cancel copy.
  - N11: hydration.
  - N13: thin-supply hints for other days and without filters.
  - The saved address now matches the searched PLZ: 10117 → *Büro* preselected; 10435 → *Zuhause*; an unknown PLZ → *Neue Adresse*.
- **The journey is unchanged and still fast:** home → search → slot chip → checkout → *Zahlungspflichtig buchen* → *Bestätigt.* (3 screens).
- **Remaining:**
  - No price-range or exact-time filter (R22/N13).
  - Neighbouring-PLZ hints never appeared in my cases.
  - `/konto`'s rebook list takes the first 30 *past* rows and filters for completed. 30 or more newer cancelled or declined bookings hide it completely (F11).
  - Sie/du is still consistent (lint messages: *Sie* for customers, *du* for pros).

## 3. Mobile responsiveness — 9/10 (↑ from 8)

**What I did:** `scrollWidth − clientWidth` on **68 routes × 5 widths** (340 loads) for anon, customer, provider and admin; target sizes at 390 px.

- **Customer and admin: 0 px overflow at every width.** That includes `/admin/kategorien` (101 px at 1024 in audit 2), `/admin/provisionen` and `/admin/profis/[id]`.
- **`/pro` at 320 px: 4 px.** The request card's heading *„Entspannungsmassage“* (min-content 186 px) sits next to the price column, giving a 303.5 px card in a 288 px column (F9). New with this seed's data.
- **Transient:** the `/admin/profis/[id]` loading skeleton (`TableSkeleton`, fixed-width rows) widens the page to 582 px at 320 for ~200 ms. It made one E2E run flaky until the test waited for the rendered table (F10).
- **Targets:**
  - Header logos are 44 px tall; provider names in rows are 30 px.
  - The checkout's inline *Ändern* link is 16 px tall.
  - Admin table links are 20 px.
  - Checkboxes are 20 × 20 with full-width labels.

## 4. Accessibility — 9/10 (=)

**axe-core 4.14** (WCAG 2.0/2.1/2.2 A+AA and best practice) on the 29 audit-2 pages plus 7 new ones (`/pro/registrieren`, `/admin/kategorien`, `/admin/provisionen`, a reviewable booking, `/konto/benachrichtigungen`, `/pro/einnahmen`, `/pro/bewertungen`), at 2 viewports each: **72 runs**.

| Result | Pages |
|---|---|
| 0 violations | 31 of 36 pages, incl. both checkouts, confirmation, review composer, all `/konto`, `/pro` and `/admin` pages tested |
| only `color-contrast` on **aria-hidden fallback text** (18/18, 21/21, 2/2, 1/1 …) | `/`, `/suche`, profile, `/fuer-profis`, SEO page — exempt (decorative) |

- **Manual checks:**
  - One `h1` per page and `lang="de"`.
  - Skip links on every surface: `#inhalt`, and `#pro-main` on `/pro`; `/pro/registrieren` is now included.
  - Field errors are linked from the review textarea and the rating fieldset (`aria-describedby`).
  - Lighthouse accessibility 96–100.
- **Not tested:** screen readers, 200 % zoom.

## 5. Functional completeness — 9/10 (=)

Everything in the audit-2 checklist still works. I re-used it in passing during the demo walkthrough:
- rebook;
- favourites;
- addresses;
- credits and referrals;
- notification inbox and preferences;
- GDPR export and deletion UI;
- review moderation;
- credit adjustments;
- disputes;
- payouts;
- regions;
- the audit log.

**New since audit 2**
- Document expiry with `expires_at` and auto-pause.
- An admin queue *„Dokumente & Sperren“*.
- Thin-supply hints.

**Gaps**
- Price-range and exact-time filters.
- Multiple or excluded service areas.
- Address autocomplete.
- Admin state override (deferred).
- The category-document gate (F2).
- Only e-mail notifications are delivered (documented).

## 6. Booking reliability — 9/10 (=)

All values were read back from `bookings` and `payments`.

**Race.** 12 parallel `createBookingAction` calls for Linh · Thu 05.11 15:00 gave **1 winner** in 309 ms:
- 6 losers got *„nicht mehr verfügbar“*;
- 1 got *„gerade vergeben“* (exclusion constraint);
- 4 (Ben, address outside the radius) got *„außerhalb des Einsatzgebiets“*.

**Tampering and crafted slots**
- Sending `totalCents: 1, priceCents: 1, discountCents: 6000, commissionRate: 0, travelFeeCents: 0` → DB `4750 / 4200 / 550 / 0.20`.
- All of these were refused: off-step 09:07, a past slot, 06:00 (outside hours), more than 60 days ahead, a Sunday without hours, and 80331 (outside the radius).

**Cancellation (Linh, 42 € + 5,50 € travel, base 20 %)**

| Case | Fee | Refund | Commission | Payout | Payment |
|---|---|---|---|---|---|
| 15 h ahead, cancelled at once (Bedenkzeit) | 0 | 4750 | 0 | 0 | cancelled |
| 16 min after booking (24–2 h tier) | **2100** (50 % of service) | 2650 (incl. travel) | 420 | 1680 | captured 2100 |
| 90 min before start | **4750** (100 % + travel) | 0 | 840 (20 % of service only) | 3910 | captured 4750 |
| Replay cancel | refused: *„… für den aktuellen Buchungsstatus nicht möglich.“* | | | | |

**Request mode (Selin)**
- Seeded deadlines: Fri 18:32 + 4 business hours → Sat 09:32. ✔
- Decline without a reason is refused by the schema. Decline with a reason → `declined`, the authorisation is voided, and the customer sees *„Leider abgesagt.“* with alternatives (E2E).
- Accept after decline → *„Diese Anfrage ist nicht mehr offen.“*

**Repeat-client commission.** It is applied correctly: Julia ↔ Linh 12 %, Anna ↔ Linh 20 %.

**Not verifiable here.** The Stripe Payment Element, Connect and the webhook (no keys). That is the only reason this is not a 10.

## 7. Security & permissions — 7/10 (=)

**Open redirect (F1, high)**
- **Now closed:** `%09 %0A %0D %00 %7F %5C // /\ https: javascript:`.
- **Still open:** dot segments.
  - Chain: `/anmelden?next=/.//evil.example/phish` → `307 location: //evil.example/phish` → `http://evil.example/phish` (Chromium, host-resolver rule).
  - Also on `/registrieren`, and with `/a/..//`, `/%2E//`, `/%2e%2e//` and `/./%2F`.
- **Cause:** `src/server/auth/redirect.ts:26` returns `resolved.pathname…`. URL normalisation can turn an allowed input into a `//host` path.
- **The same helper backs** `safeNext` (login and register actions) and `loginUrl()`. The login action replies `x-action-redirect: //evil.example/phish` when it gets that input directly. In the real browser flow the page has already normalised the value, and the action rejects it.

**Verification per category (F2, medium-high)**
- `upsertProService` accepts any active service.
- Hanna (massage only) added *Herrenhaarschnitt* (30 min, 35 €) through the action. She stayed `approved`, appeared in `/suche?plz=10719&kategorie=haare-styling`, and her profile listed the service with *Verifiziert*.
- The required *„Meisterbrief oder Eintragung in die Handwerksrolle“* was never uploaded.
- The admin detail page lists the document as missing, but the overview queue does not flag Hanna.
- The same insert works directly under RLS.
- I removed the service again.

**Login limit (N2) and e-mail throttle (N8):** fixed; see the table above.

**Contact lint (N3):** fixed on every channel that the other party can read. Residual bypasses in F13. Portfolio captions (used as alt text) are not linted.

**Document-driven suspension (N4):** fixed. A provider cannot review its own document, cannot delete an approved one (*„Nur noch nicht geprüfte Dokumente …“*, and RLS deletes 0 rows), and cannot set `expires_at` by `UPDATE`.

**IDOR, role escalation and replay: 53 replayed actions, all denied.**
- New in this round:
  - `deleteDocument` on another provider's document;
  - `markPayoutPaid`, `resolveDispute`, `updateDisputeStatus`, `upsertCategory` and `upsertContentBlock` by a customer or provider;
  - `createReview` and `openDispute` on another customer's booking;
  - `saveAddress`, `deleteAddress` and `setDefaultAddress` on another customer's address;
  - `createBooking` with someone else's `addressId`;
  - `reinstate` of an auto-paused provider while a document is missing.
- A foreign `Origin` is rejected.
- Page-level IDOR: Anna on Julia's `/buchung/[id]` → *„Diese Buchung finden wir nicht.“*; `.ics` → 404; Hanna on Selin's `/pro/termine/[id]` → *„Termin nicht gefunden.“*
- Private document: anon 401, other customer 403, other provider 403, owner and admin 200.
- Before confirmation, the provider's request page contains neither the last name *Hartmann*, the street, the phone nor the e-mail.

**RLS (65 SQL probes):** every probe behaved as specified. Added this round:
- `provider_documents.expires_at` cannot be updated;
- an approved document cannot be inserted;
- a suspended provider cannot set itself `approved`;
- `app_private` (login attempts, e-mail requests) is not readable by `anon` or `authenticated`;
- `anon` sees neither the suspended Leyla nor her reviews.

**Headers**
- CSP and HSTS are present on every response, with 0 CSP violations across the 340 crawl loads.
- `'unsafe-inline'` for scripts remains (documented).

**Other**
- **Account-existence oracle:** `checkoutSignUp` → `{kind:"exists"}` (F16).
- **Unthrottled password check:** the self-deletion `verifyPassword` is not rate-limited (audit 2, unchanged, low).

**Why 7.** Everything audit 2 asked for in N2, N3, N4 and N8 holds. But audit 2's must-have for an 8, *no exploitable open redirect*, is still not met (F1), and F2 lets a provider be shown as verified for a trade it never proved. With F1 fixed this is an 8; with F1 and F2, a 9.

## 8. Performance — 8/10 (=)

**Lighthouse 12, mobile, simulated** (same five pages as audits 1 and 2). Each cell is run 1 / run 2; audit 2 in brackets.

| Route | Perf | FCP | LCP | TBT | CLS | JS (gz) | Fonts |
|---|---|---|---|---|---|---|---|
| `/` | 96 / 96 (96/96) | 1.01 / 0.96 s | **2.42 / 2.45 s** (2.38/2.62) | 160 / 137 ms | 0 | 180 KB / 11 | **331 KB** |
| `/suche?plz=10115&kategorie=massage` | 92 / 97 (93/93) | 1.67 / 0.92 s | 3.17 / **2.32 s** (3.02) | 52 / 127 ms | 0 | 195 KB / 18 | 201 KB |
| `/profis/selin-a-berlin` | 96 / 77 (82/94) | 0.92 / 2.74 s | 2.68 / 4.30 s (3.95/2.94) | 108 / 237 ms | 0.001 | 196 KB / 13 | 331 KB |
| `/buchen?…` (anon) | 93 / 89 (86/89) | 0.91 / 1.67 s | 2.80 / 3.69 s (3.44/3.16) | 173 / 61 ms | 0 | 218 KB / 17 | 57–187 KB |
| `/fuer-profis` | 82 / 81 (94/83) | 2.59 / 2.58 s | 4.17 / 4.12 s (2.64/3.82) | 101 / 165 ms | 0 | 195–226 KB / 16 | 331 KB |

- **Overall:** Perf 77–97 (median 92.5) and LCP 2.3–4.3 s. Essentially unchanged from audit 2; run-to-run FCP variance (0.9 ↔ 2.7 s) dominates the differences.
- **Stripe.js** is no longer requested on the dev checkout (N9). Checkout TBT is 61–173 ms (audit 2: 209–260 ms).
- **Fonts** are still 331 KB on 3 of 5 pages (N9 residual → F12).
- **LCP element:** in `DEMO_MODE` it is the demo ribbon text on `/suche` and `/buchen`.
- **TTFB, 5 runs each:**

  | Route | TTFB |
  |---|---|
  | `/` | 4–6 ms |
  | `/suche` | 19–45 ms |
  | profile | 45–72 ms |
  | `/buchen` | 11–15 ms |
  | `/konto/termine` | 16–22 ms |
  | `/pro` | 26–34 ms |
  | `/admin` | 31–59 ms |
  | `/fuer-profis` | 4–10 ms |

- **Not measured:** photo weight and photo LCP (CDN unreachable).

## 9. Trust & conversion — 8/10 (=)

**Stronger than in audit 2**
- *Verifiziert* now follows the live document state (N4).
- No free-text channel carries contact data (N3).
- The checkout names the deadline (*„Selin A. antwortet bis morgen, 09:32 Uhr – belastet wird erst nach der Zusage.“*).
- The phone rule is documented and visible (*„Nach Bestätigung sichtbar“*).
- The proof band matches the DB (*4,6 ★ aus 126 verifizierten Bewertungen · 27 geprüfte Profis · 6 Städte* = `public_reviews` 126, avg 4.63; 27 approved).
- The thin-supply hint gives a way onward.

**Weaker or unchanged**
- **The demo data contradicts itself** where trust is built: the home quote, the reviews and replies, and identical portfolios (DB1, F4).
- **F2** lets *Verifiziert* stand for an unproven trade.
- **Legal placeholders** (R12) and `hallo@soma.example`.
- **Thin supply** at the demo customer's own PLZ (2 massage pros, the first labelled *Neu auf SOMA*).
- **No provider testimonials** on `/fuer-profis`.

---

## Remaining issues (prioritised)

Severity: **blocker** = before launch · **demo** = before the client demo · **high** = next iteration · **medium** · **low**.

| ID | Sev. | Dim. | Issue → expected behaviour | Where | How to verify |
|---|---|---|---|---|---|
| **R12** | blocker | 9 | Legal texts are placeholders (unchanged; needs a lawyer). **Expected:** approved Impressum, Datenschutz, AGB, AGB-Profis, Widerruf; `check:launch` green | `src/app/(site)/{impressum,datenschutz,agb,agb-profis,widerruf}/page.tsx` | `npm run check:launch` with the production env |
| **F1** | high | 7 | **Open redirect via dot segments** for signed-in visitors: `/anmelden?next=/.//evil.example/phish` (also `/registrieren`, `/a/..//`, `/%2E//`, `/./%2F`) → `Location: //evil.example/phish`. **Expected:** after resolving, reject when `resolved.pathname` starts with `//` (or `/\`), or reject inputs with dot segments (`/./`, `/../`, `%2e`) before resolving; never return a path that a browser reads as protocol-relative. The same helper backs `safeNext` and `loginUrl` | `src/server/auth/redirect.ts:12–27` | `tests/e2e/audit3.spec.ts` › *dot-segment open redirect* (remove `test.fail()`, 8 tests must pass); unit cases `/.//x`, `/a/..//x`, `/%2E//x`, `/%2e%2e//x`, `/./%2Fx` → `null` |
| **F2** | high | 7, 9 | **Category qualification not enforced:** an approved provider can add a service in a category whose required document (e.g. *Meisterbrief* for Haare & Styling) is missing or unreviewed; it is bookable at once and the profile says *Verifiziert*. **Expected:** `upsertProService` refuses (or stores inactive) offerings in categories without approved category documents, with a *du*-message pointing to `/pro/verifizierung`; search and availability ignore such offerings; the admin queue lists the provider | `src/server/services/pro.ts:171` (`upsertProService`), `src/server/services/search.ts`, `src/server/services/verification.ts`, `src/app/admin/page.tsx` (queue) | Replay `upsertProServiceAction` as Hanna with `herrenhaarschnitt` → refused or inactive; `/suche?plz=10719&kategorie=haare-styling` without Hanna |
| **F3** | demo | 9, 1 | **Seed reviews contradict services; replies answer other reviews** (DB1; home quote, Selin, Jonas, Merle, Abena, Mai, Maximilian …). **Expected:** review pools per service; replies written per review or linked to it; no positive reply on a 1–2★ review | `scripts/db/seed.ts:223–255`, `scripts/db/lib/demo-data.ts` | Reseed; for every review `comment` mentions no other service than `service_name`; manual read of Selin's first page and the home band |
| **F4** | demo | 1, 9 | **Portfolio photos shared across providers** (35 files for 120 rows; the massage set on 7 profiles, `haare-styling-2` on 6). **Expected:** each provider gets a distinct subset (fewer images if needed), or more images per category | `scripts/db/lib/demo-data.ts` (`PORTFOLIO_CAPTIONS`), `scripts/images/sources.json` | `select storage_path, count(distinct provider_id) from provider_portfolio group by 1 having count(*) > 2` → 0 rows |
| **F5** | demo | 2, 9 | **Time-relative demo data** (DB2): requests expire the next morning, no appointment startable during a demo, night-time event stamps (04:47, 05:49, 22:47). **Expected:** a reseed procedure right before the demo; one confirmed appointment starting ≈ 30 min after a configurable `DEMO_START`; event stamps within 08–21 h | `scripts/db/seed.ts` | Reseed, log in as Selin → *Termin starten* appears within the demo window; no booking event between 21:00 and 08:00 |
| **F6** | demo | 1, 8 | **All photos hot-linked** from a generator CDN (`images.local.json` = `[]`) (DB3). **Expected:** `npm run images:fetch`, local files served, rebuild | `scripts/images/fetch.mjs`, `src/lib/images.local.json`, `public/images/` | Network panel on the demo machine: no request to `cloudfront.net`; portraits visible |
| **F7** | demo | 7 | **Demo accounts can be broken** by the client (DB4): password change, *Konto löschen* (password printed on `/anmelden`), admin *Sperren* or *Anonymisieren* of the demo users. **Expected:** in `DEMO_MODE`, these actions are refused for the three demo e-mails with a friendly notice | `src/server/actions/account.ts`, `src/server/actions/admin.ts`, `src/lib/brand.ts` (`DEMO_MODE`) | As `testkunde`, *Passwort ändern* → notice, password unchanged |
| **F8** | medium | 1, 9 | **Seed artefacts in admin:** 42 upcoming bookings created within 2 days (chart spike, *+70,7 %*); every `provider_status_events` row at seed time; `demo: true` in all audit details; three different search counts (424 / 421 / 402). **Expected:** spread `created_at` over the lead time, stamp status events at `submitted_at` / `approved_at`, drop the `demo` flag from visible details, and use one counting rule (or label the difference) | `scripts/db/seed.ts`, `src/app/admin/page.tsx`, `src/app/admin/regionen/page.tsx` | Chart without a spike; Leyla's *Statusverlauf* shows May 2026 |
| **F9** | low | 3 | `/pro` request card is 4 px wider than a 320-px screen (long one-word service name next to the price column). **Expected:** `min-w-0` and `hyphens-auto`/`break-words` on the heading, or the price below the title under 360 px | `src/components/pro/bookings.tsx` (request card) | Crawl at 320: `scrollWidth == clientWidth` on `/pro` and `/pro/termine` |
| **F10** | low | 3 | Admin `TableSkeleton` (fixed-width rows) widens the page to 582 px at 320 while loading. **Expected:** skeleton rows `min-w-0`/`overflow-hidden` like the real table region | `src/components/admin/skeletons.tsx:40` | Sample `scrollWidth` during navigation to `/admin/profis/[id]` at 320 |
| **F11** | low | 2 | `/konto` *Erneut buchen* disappears when the 30 newest *past* rows are cancelled or declined (the page fetches 30 and filters for `completed`). **Expected:** query completed bookings distinct per provider directly | `src/app/konto/page.tsx:30–44` | Customer with 30+ recent cancellations still sees 3 suggestions |
| **F12** | low | 8 | Fonts 331 KB (N9 residual); LCP > 2.5 s on 4 of 5 pages in at least one run. **Expected:** Newsreader limited to the used weights (static 300/400) without the full `opsz` axis; italic only where used; < 150 KB on `/` | `src/app/layout.tsx` | Lighthouse mobile (two runs): fonts < 150 KB, LCP < 2.5 s on all five pages |
| **F13** | low | 7 | Contact-lint residual bypasses: `anna @ gmx . de` (accepted live), *Telegramm*, `linhnails . de`, `dot de`, `(dot)com`, TLDs `.fr/.it/.nl`, mixed words + digits; portfolio captions not linted. **Expected:** allow whitespace around `@` and `.`, add `telegramm` and common TLDs, lint captions; borderline texts to moderation | `src/server/domain/content-lint.ts`, `src/server/services/pro.ts:359,375` | Unit cases for the strings listed |
| **F14** | low | 1, 9 | **Copy:** *„zuletzt letzten Monat“* (`konto/page.tsx:100`), *„Kundin oder Kunde seit“* (`konto/profil/page.tsx:16`), *„seit vor 20 Stunden“* (`admin/page.tsx:163,230`), raw `provider.auto_suspend` (missing label in `admin/protokoll/page.tsx:31ff`), *„08:45⏎Uhr“* in the `/pro` countdown (NBSP), *„Stammkundschaft“* twice on request cards, support e-mail `hallo@soma.example` (`src/lib/brand.ts:10`), clipped *„Testkunde B2B (Profi)“* tile at 390 px (`auth-login-form.tsx:74`) | listed | Visual check; grep |
| **F15** | low | 5, 2 | Search: no price-range or exact-time filter (R22); neighbouring-PLZ hint never shown in my cases. **Expected:** filters kept in the URL; nearby-PLZ hint verified with a fixture | `src/app/(site)/suche/**`, `src/server/services/search.ts`, `site-ext-2.ts:151` | Filters change results; a thin search near a well-covered PLZ shows the hint |
| **F16** | low | 7 | `checkoutSignUp` reveals registered e-mails (`{kind:"exists"}`) and the self-deletion password check is not rate-limited. **Expected:** neutral reply plus e-mail ("Sie haben schon ein Konto"), or accept the trade-off explicitly; count deletion password failures like logins | `src/server/actions/checkout-ext.ts:64`, account deletion service | Two sign-ups with an existing e-mail look identical to a new one |

### Path to the next score
- **Security 7 → 8:** F1. **→ 9:** F1 + F2, plus F13 and F16.
- **Trust 8 → 9:** R12, F2, F3, F4.
- **Visual 8 → 9:** F4, real photography served locally (F6), F14.
- **Performance 8 → 9:** F12.

---

## 10. E2E regression suite

**New file `tests/e2e/audit3.spec.ts`** (12 tests × 2 projects = 24). It cleans up after itself: every booking ends declined or cancelled through the UI, also when an assertion fails half-way. The form tests submit input the server refuses, so nothing is written.

| Test | Covers |
|---|---|
| dot-segment open redirect for signed-in visitors (4 × 2) | **F1**, marked `test.fail()`; remove the marker once fixed |
| a decline note with a phone number is refused; a clean reason declines | N3 (UI path) |
| a refused review keeps stars and text | N5 |
| the address form keeps its values and names an unknown PLZ | N5 |
| request checkout states the concrete answer deadline | N6 |
| cancel dialog for a booking days ahead says it is free now | N10 |
| an auto-paused provider is not public and shows up in the admin queue | N4 (seeded Leyla A.) |
| admin tables do not overflow the page (320/768/1024) | N7; waits for the rendered table, because the skeleton overflows (F10) |
| notification inbox reloads without hydration errors | N11 |

**Full suite:** `E2E_BASE_URL=http://localhost:3100 npx playwright test` → **96 passed (3.2 min)** across mobile and desktop:
- the 72 existing tests, including the 4 N1 tests, which now pass without `test.fail()`;
- the 24 new ones, including 8 expected failures that document F1.

The first full run had 1 flaky failure (N7 measured during the loading skeleton) and 1 skip. I fixed both in the test, and the second full run was clean. Unit tests: `npx vitest run --project unit` → 106 passed. `npx tsc --noEmit` is clean. Integration tests were not run (they write to the DB).

**Bookings created during this audit (all cancelled or declined, then deleted, §12):**
- **E2E suite (32):** SM-32U8C2, SM-5MJ5ZE, SM-77Q99C, SM-MZF8WQ, SM-T9X2D6, SM-59PPXM, SM-HYGGB2, SM-HAQC9H, SM-VGBMBM, SM-ZTDFK5, SM-JJDTZA, SM-U2PX8Y, SM-W2XWRD, SM-P32AMM, SM-MW5ZNC, SM-SYME3Z, SM-J8Z6D8, SM-66RA6Q, SM-G28QKV, SM-BTM3AM, SM-7A5BUS, SM-UN4TBA, SM-CWR27H, SM-SDF77Y, SM-VWRUXR, SM-YWWKCX, SM-WAHSYC, SM-XUG8F7, SM-SQ9JCJ, SM-U5M2MY, SM-N3H73Q, SM-99A738.
- **My probes (9):** SM-ZSPTEC, SM-9KM8GB, SM-SN326D, SM-9ZW75F, SM-JGQ3QH, SM-4WNSVD, SM-AQQMYA, SM-2N6UXS, SM-CX68SZ.

## 11. Not tested / limits

- **No credentials:** Stripe (Payment Element, Connect, webhook; whether the CSP's Stripe allow-list is complete), Supabase Auth and Storage, Resend, SMS and push.
- **Production-only paths:** `DEMO_MODE=false` (`/kit` 404, robots and sitemap, `check:launch` with a production env), HSTS over HTTPS, and `TRUSTED_IP_HEADER` / `TRUSTED_PROXY_HOPS` behaviour (needs a restart; covered by unit tests only).
- **Photography:** the CDN is unreachable, so I could not see a single portrait or portfolio image. Whether the 47 new images exist, match names, genders and captions, and crop well at their focal points was **not verifiable**. Only paths, ratios, focal-point syntax and alt text were checked.
- **Other environments:** iOS Safari / WebKit (Chromium only), screen readers, 200 % zoom, geolocation, PWA/offline.
- **Not run:**
  - payout batch execution;
  - auto-complete after 24 h;
  - the full 8-step provider onboarding;
  - admin *Konto anonymisieren* on a seeded user;
  - the integration test project.
- **Global login budget:** simulated by inserting 205 and 405 failure rows (then deleted), not by 200 real failed logins.

## 12. Data hygiene

**Removed** with `cleanup.sql` (scratch dir; triggers bypassed via `session_replication_role = replica` where the append-only logs required it):
- the 41 bookings above with their payments and events;
- 2 new provider–client links;
- 152 notifications and 155 outbox e-mails, including the 24 h reminders that lazy maintenance queued on my first logins (`reminder_24h_sent_at` reset on SM-K7TC8P and SM-97J7ZB);
- 86 anonymous `search_events`;
- the N4 probe's 2 status events, 4 audit entries and 2 notifications;
- all sessions, login attempts, auth-e-mail requests and the reset token created during the audit.

**Restored:**
- Hanna's insurance document (`reviewed_at`, note) and her status;
- the probe service *Herrenhaarschnitt*, deleted.

A table-by-table count of all 33 public tables, `auth.users` and the 4 `app_private` tables matches the baseline taken before the audit. Bookings are back to requested 2 · confirmed 40 · completed 158 · cancelled 22 · no_show 5. My final verification logins were cleaned the same way.

Neither server was restarted or rebuilt. Both were up at the end: `:3100` returns 200, and `:3000` `/api/health` is ok.
