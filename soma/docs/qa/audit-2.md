# SOMA — Independent QA & Conversion Audit 2

*Agent 6 (QA & Conversion) · 30 Oct 2026 · audit round 2 · no product code changed*

| | |
|---|---|
| Build under test | production build `next start` on `http://localhost:3100`, `BUILD_ID ArfaLctBiTEr4Lj-dWZvN` (built 16:04 UTC), `APP_URL=http://localhost:3100`. Every file under `src/` is older than the build, so the build matches `HEAD a4e0e3e` |
| Data | freshly reseeded dev DB `soma` (requested 5 · confirmed 32 · completed 125 · cancelled 13 · no_show 1). Everything I created was removed again (see §14) |
| Devices | Chromium 390×844 @2x (touch) and 1440×900, plus 320 / 768 / 1024 for layout |
| Tools | Playwright (scripts and `@playwright/test`), axe-core 4.14, Lighthouse 12 (mobile, simulated throttling, same five pages as audit 1, two runs each), psql (RLS probes, DB cross-checks), Server Action replay with `fetch` (action ids from `.next/server/server-reference-manifest.json`) |
| Evidence | curated screenshots in `docs/qa/audit-2/*.jpg`; raw screenshots, probe scripts and Lighthouse JSON in the QA scratch dir (`…/scratchpad/qa2/`, not in the repo) |

---

## Executive summary

The remediation wave is real, and most of it holds up under test. I verified 16 of the 23 audit-1 items as **fixed** (5 are partially fixed, 2 not fixed), in the running app as well as in the code:

- **Verification gate (R1).** `decideProvider('approve')` is refused while any required document is unreviewed. The admin UI disables *Freigeben* and lists what is missing.
- **Engine policy (R10, R21).** The 15-minute *Bedenkzeit* works. Fees are charged on the service price only, the travel fee is refunded in the 24–2 h tier, and commission is taken only on the kept service share. Each of these was checked down to the DB row.
- **Customer journey.** The legal pages exist, the checkout no longer asks guests for a password, and a declined request now shows alternatives. *Termin starten* only appears from 30 minutes before the start.
- **Accessibility.** axe reports **zero non-decorative violations on 27 of 29 pages**.
- **Performance.** Mobile Lighthouse performance rose from 76–81 to **82–96**, and LCP fell from about 5.3 s to **2.4–4.0 s**.
- **Robustness.** RLS (55 SQL probes), role and IDOR checks (38 replayed actions), the concurrency race (12 parallel bookings, exactly 1 winner) and the guest-account claim flow all held.

Four problems keep the product from a clean bill:

1. **The open redirect is still exploitable (N1, high).** The login *action* is fixed. But `/anmelden` and `/registrieren` still use their own weak `safe()` check and redirect visitors who are **already signed in**. `/anmelden?next=/%09/evil.example` lands on `http://evil.example/`. This is the same vector as R2, reached through a different door.
2. **The per-IP login limit does nothing in the shipped configuration (N2).** The code ignores `X-Forwarded-For` now. Instead it trusts the client-supplied `X-Real-IP`, or uses no IP bucket at all when that header is missing. The per-e-mail back-off and lock are solid.
3. **The contact lint has holes where it matters most (N3).** Bios, reviews, replies and booking notes are filtered. But the provider's decline or accept note and both parties' cancellation reasons are shown to the other side **unfiltered**. *„Ruf mich direkt an: 0170 1234567, dann machen wir das ohne SOMA“* went through. Two kinds of date are also wrongly rejected as phone numbers: a founding date in a bio and a door-access date in booking notes.
4. **The badge only proves state at approval time (N4).** If an admin later rejects an approved provider's insurance, the profile stays bookable and *Verifiziert*.

The legal texts (R12) are still placeholders, as expected. A lawyer has to write them, and `npm run check:launch` blocks the launch until they exist.

## Scores

| # | Dimension | Audit 1 | Audit 2 | One-line justification (audit 2) |
|---|---|---|---|---|
| 1 | Visual quality | 8 | **8** | Same calm editorial system; proof band, guarantee, alternatives and admin pages fit it; copy slips fixed; mobile home now even longer (~10,500 px) |
| 2 | UX & navigation | 7 | **8** | All legal links resolve, alternatives after decline, Bedenkzeit, passwordless guest checkout, start-button timing, human error texts; but forms lose input after server errors and the request-deadline copy is inaccurate |
| 3 | Mobile responsiveness | 8 | **8** | Customer and `/pro` have zero overflow at 320–1440 and `/fuer-profis` and `/admin/regionen` are fixed; three other admin tables still overflow the page, one even at 1024 px |
| 4 | Accessibility | 8 | **9** | axe: 0 non-decorative violations on 27 of 29 pages, keyboard journey intact, skip links, `h1` on not-found; only admin scroll containers not focusable |
| 5 | Functional completeness | 8 | **9** | Review moderation, credit UI, GDPR export/deletion (self and admin), alternatives all work; gaps: price/exact-time filter, multiple service areas, address autocomplete |
| 6 | Booking reliability | 9 | **9** | Every tier, Bedenkzeit, fee basis, split, response window, request-mode slot filtering, transition and replay verified; seed deadlines and the 12 h vs 2 h default are off-spec |
| 7 | Security & permissions | 7 | **7** | CSP/HSTS, verification gate, GDPR and claim flow solid, RLS/IDOR still hold; but open redirect for signed-in users, ineffective IP limit, contact-lint gaps, no e-mail throttling |
| 8 | Performance | 6 | **8** | Perf 82–96 (median 93), LCP 2.4–4.0 s (from ~5.3 s), CLS 0, TTFB ≤ 74 ms; fonts still 331 KB and LCP < 2.5 s only on `/` |
| 9 | Trust & conversion | 7 | **8** | Real social proof, named SOMA-Garantie, real demand per city, 20 % lead, VAT line, concrete deadlines; legal placeholders, unfiltered contact channels, badge not tied to live document state |

---

## Remediation verification (R1–R23)

Status reflects what I observed in the running build, the DB or the code, not the commit messages.

| ID | Status | Evidence |
|---|---|---|
| **R1** verification gate | ✅ fixed (residual → N4) | Replayed `decideProviderAction(approve)` for Nora (*submitted*) and Paul (*in_review*): refused with the list of the 5 or 4 missing documents, including category documents. *reinstate* from *submitted* is refused. `/admin/profis/[id]` shows the disabled *Freigeben* and the list of missing documents (`04-admin-approval-gate-desktop.jpg`). All 28 approved seed providers have their 3 base documents approved. **Residual:** rejecting an approved provider's insurance afterwards leaves them approved, searchable and *Verifiziert* (N4) |
| **R2** open redirect | ◑ **partially fixed** | `safeRelativePath()` is sound, and the E2E probes on the login form pass (`%09`, `//`, `https:`, `/\`, `javascript:`). **But** for a signed-in visitor, `/anmelden` and `/registrieren` use a local `safe()` and `redirect(next)`. `curl` gives `307 location: /\t/evil.example`. In Chromium the navigation chain is `…/anmelden?next=/%09/evil.example/phish → http://evil.example/phish`. `%0A` and `%0D` give HTTP 500 (N1) |
| **R3** `/widerruf`, `/ranking` | ✅ fixed | Both return 200. `/widerruf` includes the *Muster-Widerrufsformular*, and `/ranking` names the parameters. A link check of **407 unique internal links** from 63 pages (all roles) found **0 broken** |
| **R4** font budget | ◑ partially fixed | Only Instrument Sans latin (57 KB) is preloaded. But Newsreader roman (129 KB) and italic (144 KB) still load on `/`, `/suche`, profile and `/fuer-profis`: **331 KB of fonts** (was 527 KB, target < 150 KB). LCP is 2.4–4.0 s (target < 2.5 s, met on `/` only). Perf ≥ 90 on 3–4 of 5 pages (§8) |
| **R5** CSP / HSTS | ✅ fixed | `Content-Security-Policy` (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, Stripe hosts) and `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` are present. **0 CSP violations** across 320 page loads (64 routes × 5 widths), and the E2E suite is green. The CSP keeps `'unsafe-inline'` for scripts (documented in STATUS §6) |
| **R6** login rate limit | ◑ **partially fixed** | Spoofing `X-Forwarded-For` no longer works, because it is ignored at `TRUSTED_PROXY_HOPS=0`. The per-e-mail back-off (2, 4, 8 s …) and the lock after 5 counted failures work: the correct password is refused while locked. **But** 21 failures from one client with different e-mails and no headers did not limit the next login, because the IP is *unknown* and no bucket is used. 20 failures with `X-Real-IP: 198.51.100.1` locked that value, and the **same client with `X-Real-IP: 198.51.100.2` logged in at once** (N2) |
| **R7** contact lint | ◑ **partially fixed** | It is applied to the provider display name, headline and bio, to reviews, replies and booking notes. 8 of 8 plain patterns are refused (phone, `+49`, e-mail, `@handle`, `www.`, `domain.de`, WhatsApp). **Not applied** to the decline or accept note or to the cancellation reasons. All of these are displayed to the other party. **Bypasses and false positives** are listed in N3. The spec-vs-architecture decision on showing the customer's phone after confirmation is still open (N12) |
| **R8** alternatives after decline/expiry | ✅ fixed | Selin declined a request for *Entspannungsmassage* in 10435. `/buchung/[id]` shows *„Diese Profis haben Zeit“* with Hanna B. (93,50 € incl. travel, slot chips) and *Andere Profis finden* → `/suche?plz=10435&kategorie=massage` (`03-declined-alternatives-mobile.jpg`, E2E `remediation.spec.ts`) |
| **R9** response deadlines | ◑ partially fixed | **Engine is correct.** A request at Fri 17:26 for Mon 17:00 is due Sat 16:26 (12 business hours, 08:00–21:00 Europe/Berlin). For Sat 09:00 it is due at Sat 07:00 (start − 2 h). Request-mode slots that would leave fewer than 30 business minutes are not offered, and a crafted request is refused server-side (*„…bliebe zu wenig Zeit für die Antwort“*). **Residual:** the seed still writes night deadlines (*„bis Sa., 31. Okt., 04:09 Uhr“* and 03:09 on `/pro`, `06-pro-seed-night-deadlines-mobile.jpg`). The default is 12 h, not the spec's 2 h, and the checkout copy says *„innerhalb von 12 Stunden“* (N6) |
| **R10** Bedenkzeit | ✅ fixed (copy nuance → N10) | A short-notice booking (< 24 h) cancelled at once: fee 0. At 14.5 min: fee 0. At 16 min: **50 % of the service** (2100 of 4200 ct), travel 400 ct refunded. The checkout shows *„In den ersten 15 Minuten nach der Buchung immer kostenlos stornierbar. Danach gelten … bereits Stornogebühren“*. The cancel dialog shows *„… noch bis 17:53 Uhr“* (`05-bedenkzeit-cancel-dialog-mobile.jpg`) |
| **R11** `/admin/regionen` overflow | ✅ fixed (similar elsewhere → N7) | `scrollWidth == clientWidth` at 320/390/768/1024/1440. The same overflow exists on `/admin/kategorien`, `/admin/provisionen` and `/admin/profis/[id]` (N7) |
| **R12** legal texts | ❌ not fixed (expected, needs a lawyer) | Impressum, Datenschutz, AGB, AGB-Profis and Widerruf show *„Platzhalter – rechtliche Prüfung erforderlich“* and `[Firmenname]`. `scripts/check-launch.mjs` now blocks launch while placeholders, demo mode or dev adapters remain |
| **R13** a11y fixes (a–g) | ✅ fixed | axe finds no `aria-prohibited-attr`, `label-content-name-mismatch`, `heading-order` or `region`. Not-found states of `/buchung/[id]` and `/pro/termine/[id]` have `h1`. `/anmelden` starts with *Zum Inhalt springen*. The PLZ field has `aria-describedby` with one id. New: `scrollable-region-focusable` on admin scroll containers (N7) |
| **R14** social proof + SOMA-Garantie | ✅ fixed | The home proof band shows *„4,5 ★ aus 105 verifizierten Bewertungen · 28 geprüfte Profis · 6 Städte“*. The DB gives `public_reviews` 105 with avg 4.49 and 28 approved providers. Real quotes with city line, and a named *SOMA-Garantie* (48 h, Nachbesserung / Gutschrift / Erstattung) linking to `/hilfe#garantie` (`01-home-proof-band-desktop.jpg`) |
| **R15** `/fuer-profis` | ✅ fixed | Leads with *20 % · 12 % · 5 % · 0 %*. Adds a monthly projection (6 × 4,33 × 85 € × 0,8 + travel = 1.898 €) and *„Gesucht wird schon.“* with searches, waitlist and profis per city. Berlin showed 150 (page cached hourly) against 152 in the DB for 30 days, and the other cities match exactly (`02-fuer-profis-demand-desktop.jpg`). Provider testimonials are not present yet (allowed by R15) |
| **R16** passwordless guest checkout | ✅ fixed | The contact section asks for first name, surname, e-mail and mobile number, with *„Ein Passwort brauchen Sie dafür nicht.“* and no password input (`07-guest-checkout-no-password-mobile.jpg`). The account is created with a random 43-character password and signed in, and a *Passwort festlegen* e-mail is queued. Claim security is in §7 |
| **R17** copy / typography | ✅ fixed | No `!` in the *Danke* texts; *„Bitte vereinbare“*; *Stammkundschaft*; zod messages are human (*„Bitte mindestens 15 angeben.“*, *„Mindestens 5 €.“*); no *Behand-lung* at 320 px (`hyphens-none`); no dangling *„·“*; `endSentence()` removes the double full stop |
| **R18** *Termin starten* too early | ✅ fixed | A confirmed booking 15 h ahead shows *„Start ab Sa., 31. Okt., 11:30 Uhr möglich“* and no start button (E2E). The server still refuses an early start |
| **R19** `/kit` in production | ✅ fixed (code) | `notFound()` unless `DEMO_MODE`, `force-dynamic`. Not observable here because `DEMO_MODE=true` |
| **R20** admin gaps | ✅ fixed (state override deferred) | `/admin/bewertungen`: hiding a review removes it from the profile and recomputes the rating (5.00/2 → 5.00/1 → 5.00/2). Credits ±10 € are booked, and ±500 € limits and a mandatory note are enforced. GDPR export and *Konto anonymisieren* are on `/admin/nutzer/[id]`, blocked while bookings are open. Every action is audited. The optional state override is listed as a known limitation |
| **R21** fee basis / tiers | ✅ fixed | Spec §8, architecture §5.5, `/stornierung` and the code agree (24 h / 2 h, % of the service price, travel refunded ≥ 2 h). DB, < 2 h: fee 4600 = 4200 + 400 travel. Commission is 504 = 12 % of 4200 only, so travel stays commission-free; payout 4096 |
| **R22** price / exact-time filters | ❌ not fixed (not claimed) | `SearchSchema` has `timeOfDay` only, with no price range or exact time |
| **R23** `APP_URL` / STATUS.md | ✅ fixed | Canonical links, invite links (`…/profis/selin-a-berlin?einladung=…`) and e-mail URLs all use `:3100`. `docs/STATUS.md` exists (with *pending* score cells) |

**Lead's E2E change (`booking.spec.ts`, cancel dialog):** **legitimate.** The test books 3–9 days ahead and cancels within seconds, so the dialog is now in the Bedenkzeit branch. The original assertion (*„Die Stornierung ist jetzt noch kostenlos.“*) can no longer match, and the alternation keeps the important checks: the *Kostenlos stornieren* button, *Storniert.* and *„Es fallen keine Kosten an.“*. The change does hide a copy weakness, though. For a booking that is free until 24 h before anyway, the dialog only says *„… noch bis 17:53 Uhr“*, which suggests urgency (N10). I added a dedicated Bedenkzeit test for a short-notice slot (§12).

---

## 1. Visual quality — 8/10 (=)

**What I did:** full-page screenshots of 19 key views (mobile and desktop) and 320-px crops of the new blocks, compared with `docs/design-guideline.md`.

**Observed**
- **The new surfaces follow the system.**
  - Home proof band: a typographic `dl` with hairline columns, quotes in Newsreader, no logos or badges.
  - *SOMA-Garantie*: an overline, a display-s sentence and one link.
  - `/fuer-profis` demand table and monthly projection card.
  - Alternatives block with standard `ProviderRow`s.
  - Admin *Bewertungen*, *Nutzer* detail and approval banner.
  - The tone panels still read as intentional fallbacks.
- **The R17 slips are gone** (see the table).
- **Image integration is unchanged and correct.** It uses `next/image` with AVIF/WebP and per-use `sizes`; alt texts such as *„Arbeit von Selin A., Bild 2“* come from `caption ?? …`. All photo requests fail with 500 because the CDN is unreachable from the sandbox, so I did not penalise them.

**Findings**
- The mobile home is now **≈ 10,500 CSS px** (audit 1: ≈ 9,700), about 12.5 screens, because the proof band was added without shortening anything else.
- The seed review texts repeat word for word: *„Schnell, präzise und super nett. Fade genau wie gewünscht.“* appears for 3 different customers and providers, and other sentences repeat too. On the home band they are distinct, but on `/admin/bewertungen` and across profiles they read as templated (seed issue).
- *„Kostenlos stornierbar bis Sonntag, 1.⏎November“*: the line breaks between *1.* and *November* at 320 px, so it needs an NBSP.
- *„Sehr empfehlenswert!“* in a quote is user content, so it is not a violation.

## 2. UX & navigation — 8/10 (↑ from 7)

**Fixed and observed**
- `/widerruf` and `/ranking` resolve, both from the consent label and from *So sortieren wir*.
- A dead end after decline is gone.
- Guests book without a password.
- The Bedenkzeit is stated before payment.
- *Termin starten* only appears from 30 minutes before the start.
- Zod messages are human.
- The keyboard journey `/` → `/suche` → slot chip → `/buchen` → consent → CTA still works: the first slot chip comes after 13 tabs, and every focused element has a 2 px ring.

**New findings**
- **Forms lose the user's input after a server-side error** (React 19 resets uncontrolled form actions).
  - **Review composer:** after a rejected review (contact lint), the textarea and the star rating are empty, but the submit button stays enabled. A second submit then fails with the raw *„Ungültige Eingabe.“* because no rating is sent.
  - **`/konto/adressen`:** an unknown PLZ (`00000`) clears all fields and shows the misleading *„Ein verknüpfter Eintrag wurde nicht gefunden.“* (a mapped foreign-key error).
  - Together these are N5.
- **The request deadline copy is wrong** (N6). The checkout says *„Selin A. antwortet spätestens innerhalb von 12 Stunden“*. The window is 12 **business** hours, so a Friday-17:26 request is due **Saturday 16:26**, 23 hours later; the confirmation e-mail states that time correctly.
- **The cancel dialog for a booking more than 24 h ahead** shows only the Bedenkzeit line (*„… noch bis 17:53 Uhr“*), not *„kostenlos bis {24 h vorher}“* (N10).
- **Unchanged from audit 1:**
  - When the searched PLZ differs from the saved address, *Neue Adresse* is still preselected.
  - Thin liquidity is not softened: *„2 Profis mit freien Terminen“* for massage in 10115, with no nearby suggestion.

## 3. Mobile responsiveness — 8/10 (=)

**What I did:** `scrollWidth − clientWidth` on **64 routes × 5 widths** (320, 390, 768, 1024, 1440) for anon, customer, provider and admin (`crawl.js`).

- **Customer and `/pro` surfaces: 0 px overflow everywhere**, including the new pages (`/widerruf`, `/ranking`, the declined booking, the proof band, the deletion dialog). `/fuer-profis` at 320 is fixed. `/admin/regionen` is fixed.
- **The admin tables still overflow the page** (N7):

  | Page | 320 px | 390 px | 768 px | 1024 px |
  |---|---|---|---|---|
  | `/admin/kategorien` | 545 | 475 | 109 | **101** |
  | `/admin/provisionen` | 457 | – | 21 | **13** |
  | `/admin/profis/[id]` (document table) | 376 | – | – | – |
- **Small targets (390 px):**
  - header logo links *„SOMA – zur Startseite“* 85×20 and *„SOMA Pro – Heute“* 123×18;
  - provider-name links in result rows 22 px tall (as in audit 1);
  - admin table links 20 px.

  The sticky CTAs keep the safe-area padding.

## 4. Accessibility — 9/10 (↑ from 8)

**axe-core 4.14** (WCAG 2.0/2.1/2.2 A+AA and best practice) on the **same 16 pages as audit 1 plus 13 new ones**, at 2 viewports each (58 runs):

| Result | Pages |
|---|---|
| 0 violations | `/anmelden`, both checkouts, confirmation, `/konto`, `/konto/termine`, `/konto/profil`, `/pro`, `/pro/termine`, `/pro/kalender`, `/pro/termine/[id]` and its not-found state, `/buchung/[id]` not-found, `/admin`, `/admin/buchungen`, `/admin/bewertungen`, `/admin/nutzer/[id]`, `/widerruf`, `/ranking`, `/stornierung`, `/hilfe` |
| only `color-contrast` on **aria-hidden fallback text** (22/22, 2/2, 1/1 … all inside `aria-hidden`) | `/`, `/suche`, profile, `/fuer-profis`, SEO page, declined booking — exempt (decorative) |
| `scrollable-region-focusable` (serious), mobile only | `/admin/regionen` ×3, `/admin/profis/[id]` ×1: the new `overflow-x-auto` wrappers have no `tabindex="0"` (N7) |

The demo-ribbon `region` violation from audit 1 is gone, and so are the other R13 issues.

**Manual checks**
- **Skip links.** *Zum Inhalt springen* on `/anmelden` and `/registrieren`, and `#pro-main` on `/pro`. `/pro/registrieren` still starts with *Für Profis* and has no skip link (minor).
- **Headings.** One `h1` on every audited page.
- **Focus rings.** Visible 2 px rings across the checkout tab order.
- **Dialog.** The cancel dialog moves focus into the dialog (to the *Grund* textarea).
- **Not tested:** screen readers and 200 % zoom.

## 5. Functional completeness — 9/10 (↑ from 8)

I re-ran the audit-1 checklist; changes only:

| Capability | Audit 1 | Audit 2 | Evidence |
|---|---|---|---|
| View verified profiles | ◑ | ✅ | badge only after all required documents are approved (residual N4) |
| Manage personal info & GDPR | ◑ | ✅ | `/konto/profil`: *Meine Daten exportieren* (JSON with profile, addresses, bookings, notes, reviews, credits …) and *Konto löschen* with password (§7) |
| Admin user management | ◑ | ✅ | credits UI, GDPR export, *Konto anonymisieren* with blocker list, block |
| Provider verification | ◑ | ✅ | gate enforced in UI and server |
| Review moderation | ❌ | ✅ | `/admin/bewertungen` with filters (status, stars, *Mit Kontaktdaten*), hide/show, audit |
| Transparent price, cancellation before confirmation | ◑ | ✅ | breakdown, VAT line (*„inkl. 19 % MwSt. (enthalten: 15,01 €)“* / *„Gemäß § 19 UStG …“*), concrete deadline, Bedenkzeit, Widerruf page |
| Alternatives after decline/expiry | (gap) | ✅ | same service → same category, then CTA |
| Enter postal code or address | ◑ | ◑ | no address autocomplete |
| Compare professionals | ✅ (filters partial) | ✅ (filters partial) | still no price range or exact time (R22) |
| Travel radius & service areas | ◑ | ◑ | one base PLZ + radius |
| Notification preferences | ◑ | ◑ | e-mail only (documented) |
| Admin state override | — | — | deferred (STATUS §6) |

## 6. Booking reliability — 9/10 (=)

All values below were read back from `bookings` and `payments` after replaying the actions.

**Cancellation (instant, Linh N., Klassische Maniküre 42 € + travel 4 €, repeat client 12 %)**

| Case | Fee | Refund | Commission | Payout | Payment |
|---|---|---|---|---|---|
| Cancelled immediately (slot 16 h ahead, i.e. in the 50 % tier) | 0 | 4600 | 0 | 0 | released |
| 14.5 min after booking | 0 | 4600 | 0 | 0 | released |
| 16 min after booking (24–2 h) | **2100** (50 % of service) | 2500 (incl. travel) | 252 (12 % of 2100) | 1848 | captured 2100 |
| 90 min before start | **4600** (100 % + travel) | 0 | 504 (12 % of 4200) | 4096 | captured 4600 |
| Replay cancel | refused: *„… für den aktuellen Buchungsstatus nicht möglich.“* | | | | |

**Request mode (Selin A., response setting 12 h)**
- **Deadlines.**
  - Request Fri 17:26 for Mon 17:00 → `respond_by` **Sat 16:26** (business hours only).
  - Request for Sat 09:00 → **Sat 07:00** (= start − 2 h, spec-conformant even though it is before 08:00).
- **Slot filtering.**
  - With Selin's lead time temporarily at 15 min, today's 18:00/18:30 slots were **not offered**: the response window would be under 30 business minutes.
  - A crafted `createBooking` for 17:30 was refused server-side.
  - I restored the lead time to 180.
- **Decline.** Without a reason: refused. With a reason: `declined`, authorisation voided.
- **Replay.** Accepting after a decline returns *„Diese Anfrage ist nicht mehr offen.“*

**State machine with the Start-Code** (one accepted request, times shifted with `session_replication_role = replica`)
- **Before the start window.**
  - Start 15.5 h early with the correct code: *„frühestens 30 Minuten vor Beginn“*.
  - Wrong code: *„Noch 4 Versuche.“*
  - Another provider with the correct code: *„Termin nicht gefunden.“*
  - Complete before the start, and no-show before start + 15 min: both refused.
- **Start.** 20 min before the start with the correct code → `in_progress`.
  - Replaying the start is refused.
  - The customer cannot cancel while it is `in_progress`.
- **Complete.** After the end → `completed`, captured 9400.
  - Replaying the completion is refused.
  - The event log reads `∅→pending_payment(customer), →requested(system), →confirmed(provider), →in_progress(provider), →completed(provider)`.
- **Payment replay.** `confirmDevPayment` on cancelled or completed bookings is refused.

**Concurrency and availability**
- **Race.** 12 truly parallel `createBookingAction` calls (kundin, anna, ben) for one slot gave **exactly 1 winner** in 299 ms. 9 losers got *„nicht mehr verfügbar“* and 2 got *„gerade vergeben“* from the exclusion constraint.
- **Buffer** (45 min + 30 min). Against the 11:30 booking, 12:00, 12:30 and 10:30 were refused and 13:00 won.
- **Tampering.** `totalCents: 1, priceCents: 1, discountCents: 6000, commissionRate: 0, travelFeeCents: 0` → DB `4600 / 4200 / 400 / 0.20`.
- **Price consistency.** Search = checkout = CTA = confirmation, checked by the E2E suite.

**Findings**
- The seed's open requests have **night deadlines**: 22:09, 00:09, 03:09, 03:09, 04:09. The cause is `scripts/db/seed.ts:442`, which computes now + N h capped at start − 1 h. Anyone opening `/pro` sees *„bis Sa., 31. Okt., 04:09 Uhr“*.
- The default `request_response_hours = 12` contradicts spec §7 (*2 h, counted 08:00–21:00*). `docs/architecture.md:264` still says *„now + request_response_hours (capped at starts_at − 1h)“* (N6).

## 7. Security & permissions — 7/10 (=)

**Open redirect** (N1)
- **Login action.** Fixed: `%09`, `%0A`, `%0D`, `%5C`, `//`, `https://` and `javascript:` all stay on the origin.
- **Signed-in visitors on `/anmelden` and `/registrieren`.**
  - `next=/%09/evil.example` → `307 location: "/\t/evil.example"` → Chromium navigates to `http://evil.example/phish` (observed with a host-resolver rule).
  - `next=/%0A…` and `next=/%0D…` → **HTTP 500**.
- **Cause.** `src/app/(auth)/anmelden/page.tsx:13` and `registrieren/page.tsx:15` define their own `safe()`, unchanged since audit 1.

**Login limit** (N2)
- **What works.**
  - Per-e-mail: exponential back-off (*„Bitte warten Sie 5 Sekunden …“*) and a lock after 5 counted failures, which holds against the correct password and against spoofed `X-Forwarded-For` / `X-Real-IP`.
  - `X-Forwarded-For` is ignored.
- **What does not.**
  - With `TRUSTED_PROXY_HOPS=0` the IP is the client-supplied `X-Real-IP`, so a stored row reads `ip=203.0.113.77` after I sent that header.
  - Without the header the IP is *unknown* and no IP bucket applies.
  - Observed: after 21 failures (different e-mails, no headers) the next login succeeded. After 20 failures with `X-Real-IP: 198.51.100.1`, the same client **logged in with `X-Real-IP: 198.51.100.2`**.
- **Judgement.** The limit protects only behind a proxy that overwrites `X-Real-IP` (e.g. Vercel), and nothing enforces that (`check:launch` does not check it).

**CSP / HSTS:** present on every response and with no console violations (§R5). The policy has **`'unsafe-inline'` scripts** (documented). The Stripe allow-list could not be exercised because there are no keys. Separately, `@stripe/stripe-js` is imported non-pure, so **`js.stripe.com/…/stripe.js` is requested on every checkout even with `PAYMENTS_PROVIDER=dev`** (seen in Lighthouse).

**Contact-data lint** (`findContactDetails`; replayed `updateProProfileAction` as Linh and restored afterwards; booking notes, reviews and cancel and decline paths replayed)

| Input | Result |
|---|---|
| `0170 1234567`, `+49 170 1234567`, `0170/123 45 67`, `0 1 7 0 1 2 3 4 5 6 7`, `linh@example.com`, `@linh.nails`, `www.linh-nails.de`, `linh-nails.de`, `WhatsApp`, `Insta … linhnails`, `Signal: 0170 …` | refused ✅ |
| `null eins sieben null, eins zwei drei …`, `linh at gmail dot com`, `linh (at) gmail (punkt) com`, `O17O 1234567` (letter O), `1701234567` (no leading 0), digits joined by U+2060, full-width `０１７０…`, `IG: linh.nails`, `linh.nails auf Instagramm` | **accepted** |
| `Seit 01.03.2019 selbstständig …` (bio), `… seit 01.01.2020 hier` (booking notes) | **refused as a phone number** (false positive) |
| `Termine 09:00–18:00, Preise ab 45,00 €`, `0,5 bis 1,5 Stunden` | accepted ✅ |
| Review *„… 0170 1234567“* / notes *„… 0170 1234567“* | refused ✅ |
| **Decline note** *„Ruf mich direkt an: 0170 1234567, dann machen wir das ohne SOMA“* | **accepted and shown to the customer** on `/buchung/[id]` (Verlauf) |
| **Provider cancellation reason** with a phone number | **accepted and shown to the customer** |
| **Customer cancellation reason** with a phone number | **accepted and shown to the provider** on `/pro/termine/[id]` |

Judged proportionately:
- Spelled-out numbers are hard to lint and belong in moderation.
- The **unfiltered note and reason channels** are the real gap: they are the most likely place for a leak, at the exact moment of a decline or cancellation.
- NFKC normalisation and stripping format characters are cheap fixes (N3).

**Verification gate:** fixed (R1). Residual: the badge does not follow later document rejections (N4).

**IDOR, role escalation, replay:** **38 replayed Server Actions with foreign or insufficient sessions were all denied**, including the new admin actions:
- `anonymizeUser`, `exportUserData`, `adjustCredits`, `moderateReview` by customer, provider and anon;
- `reviewDocument` by the submitted provider on her own document;
- `replyToReview` on another provider's review;
- other providers' `respond` / `start` / `complete` / `noShow` / `cancel`;
- another customer's `cancel` / `rebook` / `devPay`.

A foreign `Origin` is rejected (CSRF). Private documents: anon 401, customer 403, other provider 403, owner and admin 200. Cron without the right bearer token returns 401. The E2E IDOR tests for pages pass.

**RLS (55 SQL probes, `rls.sh`):** every probe behaved as specified, including the new column `profiles.anonymized_at`, which neither a customer nor a provider can update.
- Customers cannot update `blocked_at`, a booking's `cancellation_policy` or `created_at` (the Bedenkzeit inputs), or a review's `is_published`.
- Providers cannot approve their own documents or insert approved ones.
- `anon` sees only approved providers and `public_reviews`.

**GDPR**
- **Deleting someone else's account is impossible.** The self-service action has no user-id parameter, and the admin actions are admin-only.
- **Deletion is blocked while bookings are open** (*„Sie haben noch offene Termine …“*).
- **A wrong password is refused** and the account stays.
- **With the correct password** you are logged out and redirected to `/` with *„Ihr Konto wurde gelöscht.“*. In the DB:
  - profile names and phone `NULL`, `anonymized_at` and `blocked_at` set;
  - `auth.users.email = deleted+<id>@anonymized.soma.invalid`, password `NULL`, metadata `{}`;
  - 0 sessions, addresses, notifications and outbox rows; login attempts and reset tokens deleted;
  - the booking kept, with address `Anonymisiert`, details, notes and coordinates `NULL`, PLZ kept;
  - audit entry `user.anonymize {"by":"self", …}`; the old session cookie is invalid.
- **Gaps.**
  - `verifyPassword` for deletion is not rate-limited (by design: *„no login attempt recorded“*). A stolen session can guess the password without limit. Low.
  - A guest who never claimed the account must set a password first; the dialog links to *Passwort festlegen*.

**Guest checkout account claim** (replayed `checkoutSignUpAction`)
- An existing e-mail (`kundin@`, `KUNDIN@SOMA.TEST `, `admin@`) returns `{kind:"exists"}`, sets **no session cookie** and sends **no e-mail**. Takeover is impossible (but this is an account-existence oracle).
- **Pre-hijack scenario.**
  1. An attacker registers an unused victim address and gets a session.
  2. The victim claims the account through the e-mail link.
  3. **The attacker's session is revoked** (`resetLocalPassword` deletes all sessions).
  4. The link is **single-use**: a second use gives *„Der Link ist ungültig oder abgelaufen.“*
  5. The victim can log in.
- **No throttling** (N8). 6 *Passwort vergessen* requests for one address within about 10 s queued **6 e-mails**. Guest sign-up queues a claim e-mail to any unused address without limit (code-verified; the same reset path).

**Other**
- `/konto/benachrichtigungen` intermittently throws React hydration error #418 (2 of 8 loads, right after new notifications). `formatRelative()` runs with the client's `new Date()` (N11).
- The `/fuer-profis` JSON-LD is not `<`-escaped. Its content is static, so there is no risk.

## 8. Performance — 8/10 (↑ from 6)

**Lighthouse 12, mobile, simulated** (same five pages as audit 1). Each cell is run 1 / run 2; audit 1 in brackets.

| Route | Perf | FCP | LCP | TBT | CLS | JS (gz) | Fonts |
|---|---|---|---|---|---|---|---|
| `/` | 96 / 96 (76) | 1.00 / 0.98 s | **2.38 / 2.62 s** (5.58) | 169 / 87 ms (207) | 0 | 177 KB / 10 (171) | **331 KB** / 3 |
| `/suche?plz=10115&kategorie=massage` | 93 / 93 (80) | 1.67 / 1.67 s | 3.02 / 3.02 s (5.27) | 105 / 65 ms (79) | 0 | 201 KB / 18 (194) | 201 KB |
| `/profis/selin-a-berlin` | 82 / 94 (80) | 2.72 / 1.67 s | 3.95 / 2.94 s (5.12) | 146 / 72 ms (115) | 0.001 | 189 KB / 12 (182) | 331 KB |
| `/buchen?…` (anon) | 86 / 89 (79) | 0.92 / 1.66 s | 3.44 / 3.16 s (5.57) | **260 / 209 ms** (80) | 0 | 222 / 197 KB / 18 (206) | 57–187 KB |
| `/fuer-profis` | 94 / 83 (81) | 0.93 / 2.72 s | 2.64 / 3.82 s (4.98) | 187 / 146 ms (104) | 0 | **231 KB** / 16 (183) | 331 KB |

- **LCP improved by about 2–3 s on every page.** It is under 2.5 s only on `/`, run 1. Simulated FCP jumps between about 0.9 and 2.7 s from run to run, so treat single values with care.
- **Fonts.** One preload (Instrument Sans 57 KB), but the Newsreader roman (129 KB) and italic (144 KB) variable files with the `opsz` axis load early on four pages. Target < 150 KB not met (N9).
- **JS** grew slightly: +6 to +48 KB. `/fuer-profis` grew the most (calculator and demand table).
- **Checkout TBT** rose to 209–260 ms (from 80 ms). Stripe.js is requested even in dev mode.
- **Server.** TTFB, 5 runs each:

  | Route | TTFB |
  |---|---|
  | `/` | 4–5 ms |
  | `/suche` | 19–22 ms |
  | profile | 41–74 ms |
  | `/buchen` | 9–16 ms |
  | `/konto/termine` | 15–20 ms |
  | `/pro` | 16–28 ms |
  | `/admin` | 26–34 ms |
  | `/fuer-profis` | 3–49 ms |
- **Not measured.** Photo weight and photo LCP (CDN unreachable). The `_next/image` requests fail with 500 here and are excluded.

## 9. Trust & conversion — 8/10 (↑ from 7)

**Strengths (observed)**
- **Real social proof.** The aggregates match the DB, the quotes come from `public_reviews` (rating ≥ 4, one per provider, first name + initial, city), and the *SOMA-Garantie* is named with its 48 h window and remedies.
- **`/fuer-profis`.** It leads with *„20 % nur bei neuer Kundschaft“*, gives an honest monthly projection, and shows live demand per city from `search_events` and `waitlist_signups` with the same counting rule as `/admin/regionen`.
- **Price and cancellation transparency.** Total price including travel on search, profile (with PLZ) and checkout. A VAT line (19 % with the amount, or § 19 UStG), the agency statement, a concrete free-cancellation date, the Bedenkzeit line, and *„Bis zur Zusage … jederzeit kostenlos stornierbar“* for requests. `/stornierung` matches the code.
- **No dead ends.** A declined request offers bookable alternatives in one tap. All 407 internal links resolve.
- **Guest friction removed.** No password.

**Weaknesses**
- Legal pages are still placeholders (R12).
- Contact can still be exchanged through decline notes and cancellation reasons (N3).
- *Verifiziert* survives a later document rejection (N4).
- The response promise *„innerhalb von 12 Stunden“* is inaccurate (N6).
- The spec says *„no phone exchanged“*, but the provider sees the customer's phone after confirmation (N12).
- Duplicate seed review sentences.
- Thin liquidity in the demo is not softened.
- No provider testimonials yet.

---

## Remaining issues (prioritised)

Severity: **blocker** = before launch · **high** = next iteration · **medium** · **low**.

| ID | Sev. | Dim. | Issue → expected behaviour | Where | How to verify |
|---|---|---|---|---|---|
| **R12** | blocker | 9 | Legal texts are placeholders (unchanged, needs a lawyer). **Expected:** lawyer-approved Impressum, Datenschutz, AGB, AGB-Profis, Widerruf; `check:launch` green | `src/app/(site)/{impressum,datenschutz,agb,agb-profis,widerruf}/page.tsx` | `npm run check:launch` passes with the production env |
| **N1** | high | 7 | **Open redirect for signed-in visitors:** `/anmelden?next=/%09/evil.example` and `/registrieren?next=…` redirect to `http://evil.example/`; `%0A`/`%0D` give HTTP 500. **Expected:** both pages use `safeRelativePath(next, APP_URL)` (or `safeNext`) before `redirect()` and before passing `next` to the form; no 500 on control characters | `src/app/(auth)/anmelden/page.tsx:13,19`, `src/app/(auth)/registrieren/page.tsx:15,21` | `tests/e2e/remediation.spec.ts` › *open redirect for signed-in visitors*: remove `test.fail()` and it must pass; `curl -H 'Cookie: …' '/anmelden?next=/%0A/x'` → 307 to the role's home |
| **N2** | medium | 7 | **Per-IP login limit is ineffective by default:** `TRUSTED_PROXY_HOPS=0` trusts the client-supplied `X-Real-IP`, and without it no IP bucket applies. **Expected:** trust a platform header only when configured explicitly (e.g. `TRUSTED_IP_HEADER=x-vercel-forwarded-for`); add a global failure budget (e.g. > 200 failures per 15 min → CAPTCHA or slow-down for all); make `check:launch` fail when neither hops nor a trusted header is configured | `src/server/auth/client-ip.ts`, `src/server/auth/rate-limit.ts`, `scripts/check-launch.mjs` | 20 failures with rotating `X-Real-IP` values → 21st still limited; no headers → limited too |
| **N3** | medium | 7, 9 | **Contact lint gaps:** the decline note, the *Nachricht zur Zusage* and both cancellation reasons are unfiltered and shown to the other party. Bypasses: zero-width/format characters, full-width digits, `at … dot/punkt`, letter O, numbers without a leading 0, `IG`, `Instagramm`. False positives: `dd.mm.yyyy` dates. **Expected:** run `assertNoContactDetails` on `respondToRequest.note`, `cancelBooking.reason` and `cancelBookingAsProvider.reason` (du/Sie messages); normalise with NFKC and strip `\p{Cf}` before matching; treat dates as non-phone; add `ig`/`instagramm`/`(at)…(punkt)` patterns; flag borderline texts to `/admin/bewertungen`-style moderation instead of hard rejection | `src/server/domain/content-lint.ts`, `src/server/services/bookings.ts:447,544`, `src/server/services/booking-engine.ts` | unit tests for the inputs in §7; replay the decline with a phone number → refused; `Seit 01.03.2019 …` → accepted |
| **N4** | medium | 9, 7 | **Badge not tied to current documents:** rejecting an approved provider's insurance leaves them approved, bookable and *Verifiziert* (*„Berufshaftpflicht … geprüft“*). **Expected:** rejecting or expiring a required document of an approved provider triggers suspension (or at least hides the badge and creates an admin queue item); optional `expires_at` for insurance | `src/server/services/admin.ts` (`reviewDocument`), badge in `profile-bits.tsx`, `provider-row.tsx` | reject the insurance of an approved provider → not in search, no badge, queue item on `/admin` |
| **N5** | medium | 2 | **Forms lose input after a server-side error**: the review composer clears text and stars and then sends no rating (*„Ungültige Eingabe.“*); the address form clears all fields; unknown PLZ shows *„Ein verknüpfter Eintrag wurde nicht gefunden.“* **Expected:** keep the submitted values (controlled inputs or return them in the action state); keep the button disabled without a rating; validate the PLZ in `saveAddress` with *„Diese Postleitzahl kennen wir nicht.“* | `src/components/site/review-composer.tsx`, address form in `src/components/site/account-addresses.tsx`, `src/server/services/account.ts`, `src/server/db/errors.ts` | submit a review with a phone number → text and stars still there; address with PLZ 00000 → field error, fields kept |
| **N6** | medium | 2, 6, 9 | **Response-window mismatch:** the default is 12 business hours against spec §7's 2 h; the checkout says *„innerhalb von 12 Stunden“* though the deadline can be 23 h later; the seed writes night deadlines (00:09–04:09) shown on `/pro`; `architecture.md:264` is outdated. **Expected:** decide the default (spec 2 h or 12 h) and align spec, architecture, seed and admin setting; copy states the concrete time (*„antwortet bis Sa., 16:26 Uhr“*) or *„innerhalb von 12 Stunden zwischen 8 und 21 Uhr“*; the seed uses `computeRespondBy` | `scripts/db/seed.ts:442`, `scripts/db/lib/base-seed-data.ts:221`, `src/components/site/checkout-form.tsx` (request intro), `docs/architecture.md:207,264`, `docs/product-spec.md:267` | reseed → no open request due between 21:00 and 08:00 unless `start − 2 h` forces it; checkout copy equals the e-mail deadline |
| **N7** | low | 3, 4 | **Admin tables overflow the page and admin scroll regions are not focusable:** `/admin/kategorien` (101 px at 1024), `/admin/provisionen` (13 px at 1024), `/admin/profis/[id]` (376 px at 320); axe `scrollable-region-focusable` on `/admin/regionen` and `/admin/profis/[id]`. **Expected:** every admin table inside the kit `Table` scroll wrapper with `tabIndex={0}`, `role="region"` and `aria-label`, first column sticky | `src/app/admin/kategorien/page.tsx`, `src/app/admin/provisionen/page.tsx`, `src/app/admin/profis/[id]/page.tsx`, `src/components/admin/table.tsx` | `scrollWidth === clientWidth` at 320/768/1024; axe clean |
| **N8** | low | 7 | **No throttling of auth e-mails:** 6 reset e-mails in about 10 s for one address; guest sign-up sends a claim e-mail to any unused address; `{kind:"exists"}` reveals registered e-mails. **Expected:** per-address and per-IP limits on `requestPasswordReset` and `checkoutSignUp` (e.g. 3 per hour per address), a bot check after N; consider a neutral response for "exists" | `src/server/auth/local.ts`, `src/server/actions/auth.ts`, `src/server/actions/checkout-ext.ts` | 6 resets in a row → at most 3 queued |
| **N9** | low | 8 | **Font weight and stray Stripe.js:** 331 KB of fonts on four of five pages; Stripe.js requested on every checkout in dev mode. **Expected:** Newsreader limited to the weights used (static 300/400 or a subset without the full `opsz` range), italic only where used; `@stripe/stripe-js/pure` plus a `loadStripe` call only when `PAYMENTS_PROVIDER=stripe`; target LCP < 2.5 s and fonts < 150 KB on `/` | `src/app/layout.tsx`, `src/components/site/checkout-stripe.tsx` | Lighthouse mobile (two runs): LCP < 2.5 s on all five pages; no request to `js.stripe.com` in dev mode |
| **N10** | low | 2 | **Cancel-dialog copy:** for a booking > 24 h ahead the Bedenkzeit branch replaces *„kostenlos bis {24 h vorher}“*. **Expected:** show the Bedenkzeit line only when the tier fee would be > 0 now; otherwise the regular free line (then the original E2E assertion holds again) | `src/components/site/checkout-cancel.tsx:113` | book ≥ 3 days ahead, open the dialog at once → *„Die Stornierung ist jetzt noch kostenlos …“* |
| **N11** | low | 2 | **Hydration error #418** on `/konto/benachrichtigungen` (relative times computed on the client). **Expected:** pass `now` from the server or format after mount | `src/components/site/account-notifications.tsx`, `src/lib/format.ts` (`formatRelative`) | 10 reloads without `pageerror` |
| **N12** | low | 7, 9 | **Spec vs implementation on phone exchange** (open from R7): the provider sees the customer's phone (tel link) after confirmation; spec §11 says *„No phone or email exchanged … v1.1: phone relay“*. **Expected:** a decision documented in both docs | `docs/product-spec.md` §11, `docs/architecture.md`, `src/app/pro/(app)/termine/[id]/page.tsx` | docs agree with the UI |
| **N13** | low | 5, 9 | **Search gaps (R22) and thin-supply handling:** no price-range or exact-time filter; *„2 Profis mit freien Terminen“* with no nearby suggestion. **Expected:** filters kept in the URL; with fewer than 3 results, suggest neighbouring PLZ or dates | `src/app/(site)/suche/**`, `src/server/services/search.ts` | filters change results; thin result sets show a suggestion |
| **N14** | low | 1, 3, 4 | **Polish:** `/pro/registrieren` has no skip link; header logo links 18–20 px and provider-name links 22 px tall (target size); NBSP between *„1.“* and *„November“* in deadlines; mobile home is about 10,500 px; duplicate seed review sentences; CSP `'unsafe-inline'` (move to nonces or hashes when feasible) | `src/app/pro/registrieren/page.tsx`, `src/components/site/site-header.tsx`, `src/components/pro/shell.tsx`, `src/components/site/checkout-format.ts`, seed reviews | visual check; axe target-size (2.5.8) |

### Path to ≥ 8 for the dimension below 8
- **Security** (7 → 8+): **N1** (must), **N2** and **N3** (the unfiltered note and reason channels plus normalisation), **N8**. N4 then helps trust as well as security.

### Path to 9 for the 8s
- **UX:** N5, N6, N10, N13.
- **Mobile:** N7, N14.
- **Performance:** N9.
- **Trust:** R12, N3, N4, N6, N12.
- **Visual:** shorten the mobile home, use real photography (outside this sandbox), de-duplicate the seed reviews.

---

## 12. E2E regression suite

**New file `tests/e2e/remediation.spec.ts`** (10 tests × 2 projects). It cleans up after itself: every booking ends cancelled, withdrawn or declined through the UI, also on failure, and the provider-bio probe restores the original text if the server accepted it.

| Test | Covers |
|---|---|
| open redirect for signed-in visitors (×2) | **N1**, marked `test.fail()`. Remove the marker once fixed |
| Widerrufsbelehrung and ranking resolve | R3 |
| admin cannot approve a provider with unreviewed documents | R1 (UI) |
| guest checkout without password | R16 |
| short-notice booking free within the Bedenkzeit | R10. Looks for an instant slot within 24 h and skips with a reason if there is none |
| declined request shows alternatives | R8. Customer requests, Selin declines with a reason, the customer sees alternatives and *Andere Profis finden* |
| provider bio with a phone number refused | R7 |
| no early *Termin starten* | R18 |
| `/admin/regionen` without page overflow | R11 |

**Full suite:** `E2E_BASE_URL=http://localhost:3100 npx playwright test` → **72 passed (2.1 min)** across mobile and desktop. That includes the 4 expected failures that document N1. The 52 audit-1 tests pass unchanged, apart from the Lead's assertion change, which I judged above. `npx tsc --noEmit` is clean.

## 13. Not tested / limits

- **No credentials:** Stripe (Payment Element, Connect, webhook, and whether the CSP's Stripe allow-list is complete), Supabase Auth and Storage, Resend, SMS and push.
- **Production-only paths:** `DEMO_MODE=false` behaviour (`/kit` 404, robots and sitemap, `check:launch` with a production env) and HSTS over HTTPS. I could not restart the servers to test them.
- **Real photography:** the CDN is unreachable, so photo weight, photo LCP and focal points on real images could not be measured. The integration code was reviewed.
- **Other environments:** iOS Safari / WebKit (Chromium only), screen readers, 200 % zoom, geolocation (*Standort verwenden*), PWA/offline.
- **Not run:** payout batch execution (to keep the seeded payouts intact), auto-complete after 24 h, and the full 8-step provider onboarding (audit 1 covered it; the changed steps are covered through the profile action).
- **Not destroyed:** admin *Konto anonymisieren* on a seeded customer. Self-deletion was tested end-to-end on a QA account instead, and the admin path's blocker list was verified in the UI.

## 14. Data hygiene

All QA data was removed at the end with `cleanup.sql` and `cleanup2.sql` (scratch dir). Triggers were bypassed via `session_replication_role = replica` where the append-only event log required it, and FK cascades were then done by hand. What I removed:
- the 48 QA bookings (my probes and the E2E runs) with their payments, events, refunds and notifications. 3 of them had `created_at` shifted into the past for the tier tests and were removed in a second pass;
- the e-mail outbox rows, provider–client links and addresses saved during checkout;
- the QA credit-ledger rows and the QA audit entries (`review.*`, `credits.adjust`, `user.export`, `user.anonymize`, `document.rejected`);
- the anonymised QA guest account (user and profile);
- the 24 h reminders that the lazy maintenance queued on my first logins (`reminder_24h_sent_at` reset);
- all login attempts and sessions from the run.

Restored state:
- Selin's `completed_count` was recomputed;
- Selin's lead time is back to 180 min;
- Linh's profile is unchanged (the probes were refused or restored);
- Hanna's insurance document is back to *approved* with its original reviewer and date;
- the moderated reviews are visible again (Hanna 5.00 / 2).

A table-by-table comparison with the counts taken before the audit matches on all 22 tables I tracked, with one exception. Bookings are back to requested 5 · confirmed 32 · completed 125 · cancelled 13 · no_show 1, there are 0 sessions, 69 login attempts and 0 outbox rows, and no orphaned rows remain. **Not removed:** 87 anonymous `search_events` rows from my searches and the E2E runs. They have no user attribution, but they slightly inflate *Suchen* in `/admin/regionen` and `/fuer-profis` for 30 Oct.

Neither server was restarted or rebuilt. Both were up at the end (`:3100` 200, `:3000` `/api/health` 200).
