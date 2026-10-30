# SOMA — Independent QA & Conversion Audit 4 (final, pre-client)

*Agent 6 (QA & Conversion) · 30 Oct 2026 · final audit before the client demo · no product code changed*

| | |
|---|---|
| Build under test | production build `next start` on `http://localhost:3100`, `BUILD_ID 0jpDwx3v1g3t26ArP3l9e` (built 19:50 UTC, server up since 20:26 UTC), `DEMO_MODE=true`, `APP_URL=http://localhost:3000` (from `.env.local`). No file under `src/`, `scripts/` or `supabase/` is newer than the build; `HEAD 5558123` only changed tests after it |
| Data | `npm run demo:refresh` at 20:49 UTC (start of the walkthrough) and at 21:30 UTC (after the E2E run), and a final refresh at 21:40 UTC as the last step (§12: requested 8 · confirmed 34 · completed 157 · cancelled 22 · no_show 3, demo appointment SM-JMWH54 35 min out). After refresh 1: requested 4 · confirmed 32 · completed 154 · cancelled 24 · no_show 2. After refresh 2: requested 5 · confirmed 33 · completed 166 · cancelled 16 · no_show 1. The seed is randomised, so the totals differ slightly between refreshes. 74 accounts each time |
| Accounts | `testkunde@soma.test` (Julia H.), `testkunde-b2b@soma.test` (Selin A.), `testadmin@soma.test`; for cross-account probes also `anna@kunden`, `ben@kunden`, `hanna@profis`, `linh@profis`, `nora@profis` (all `soma.test`) |
| Devices | Chromium 390×844 @2x (touch) and 1440×900; 320 / 360 / 768 / 1024 for layout |
| Tools | Playwright, axe-core 4.14, Lighthouse 12 (from the audit-3 scratch install, mobile, simulated, two runs, for trend only), a Playwright performance probe (CDP transfer sizes, PerformanceObserver LCP/CLS, with and without 4× CPU / 1.6 Mbps throttling), psql (RLS, DB cross-checks), Server Action replay with `fetch` (ids from `.next/server/server-reference-manifest.json`), `tsx` for direct unit fuzzing of `safeRelativePath` and `findContactDetails` |
| Evidence | curated screenshots in `docs/qa/audit-4/*.jpg`; raw screenshots, text dumps, probe scripts and JSON in the QA scratch dir (`…/scratchpad/qa4/`, not in the repo) |
| Photos | The image CDN (`d8j0ntlcm91z4.cloudfront.net`) is blocked in this sandbox. Every photo rendered as the designed tone-on-tone fallback. I judged the visual design with that in mind and did **not** penalise the block (§1, D.5) |

---

## Executive summary

The last remediation wave delivered. Of the 16 audit-3 items, **11 are fixed, 4 partial and 1 open**. R12 (legal texts) is still open, as announced.

- **The open redirect is closed (F1).** 59 direct inputs to `safeRelativePath` and 208 HTTP probes on `/anmelden` and `/registrieren` (52 vectors, signed in and anonymous) gave no foreign `Location`. So did 22 login-action replays, 19 Chromium navigations with the evil host mapped, `loginUrl` through dynamic segments, and `Host`/`X-Forwarded-Host` spoofing.
- **Verification follows the category (F2), for the reported path.** An approved pro's new *Herrenhaarschnitt* is stored inactive, shows *„Wartet auf Nachweis · nicht buchbar“*, stays out of search and the profile, and appears in the admin queue. The database enforces this too. A new gap remains (A4-3, below).
- **The demo data is believable now.**
  - Reviews match the booked service, and replies answer their own review (F3).
  - Every provider has its own portfolio (F4).
  - Event stamps fall within 08–21 h (F5).
  - The admin status history and audit log are real (F8, mostly).
- **The shared demo logins can't be broken (F7).** Password change, reset, self-deletion, admin block, anonymise, suspend, reject and document rejection are all refused for the demo accounts, with a clear notice.
- **The live Start-Code demo works.** About 35 minutes after `demo:refresh`, Selin started the appointment with Julia's code 29 minutes before it began. A wrong code gave *„Der Start-Code ist falsch. Noch 4 Versuche.“*
- **Robustness held.**
  - 76 role and IDOR action replays and 74 RLS probes behaved as specified (except A4-1).
  - 290 page loads at five widths showed 0 px overflow, 0 hydration errors and 0 page errors.
  - axe found 0 non-decorative violations on 38 pages × 2 viewports.
  - E2E: **96/96** passed, plus 12 new tests in `audit4.spec.ts`.

**New findings**

| ID | Sev. | Finding |
|---|---|---|
| **A4-3** | high | **Category gate bypass.** A qualification uploaded *without* a category, once an admin approves it, satisfies **every** category's requirement. A massage certificate made Hanna bookable for *Herrenhaarschnitt*, and her public profile then listed *„Meisterbrief oder Eintragung in die Handwerksrolle“* as verified. The admin page doesn't show which category a certificate belongs to, so this mistake is easy to make |
| **A4-2** | demo | **„Leistung hinzufügen“ overwrites prices.** The dialog opens on a service the pro already offers, with the guide price. Saving it unchanged silently overwrites the existing price (Selin's 89 € → 75 €), and the toast says *„… hinzugefügt.“* A client exploring Selin's account will plausibly hit this |
| **A4-1** | low | **DB-level bypass of the F2 trigger.** It is `SECURITY DEFINER` and honours the `soma.seed_mode` setting, which any SQL session can set. It can't be reached through the app |
| A4-4 … A4-12 | low | Copy, docs, configuration and polish (see the issue table) |

**Demo verdict: yes, ready to hand to the client, with the caveats in §V.** Fix A4-2 first, or brief the client. Run `demo:refresh` right before each session and during the day.

## Scores

| # | Dimension | A1 | A2 | A3 | **A4** | One-line justification (audit 4) |
|---|---|---|---|---|---|---|
| 1 | Visual quality | 8 | 8 | 8 | **8** | Calm, consistent system; unique portfolios, coherent quotes, NBSP and hyphenation fixes. Photography still unverifiable here; small polish left (A4-9, A4-5) |
| 2 | UX & navigation | 7 | 8 | 9 | **9** | Guest booking in 3 screens, concrete deadlines, rebook robust, price filter added; A4-2 (silent price overwrite), no exact-time filter, A4-4 copy |
| 3 | Mobile responsiveness | 8 | 8 | 9 | **9** | 290 loads × 5 widths: 0 px overflow incl. `/pro` at 320 (F9) and the admin skeleton (F10). Admin table links 21 px; WebKit/iOS not tested |
| 4 | Accessibility | 8 | 9 | 9 | **9** | axe: 0 non-decorative violations on 38 pages × 2; one `h1`, `lang="de"` and skip links everywhere; screen readers and zoom not tested |
| 5 | Functional completeness | 8 | 9 | 9 | **9** | Category gate, demo protections, price filter, rebook fix; gaps: exact-time filter, multiple service areas, address autocomplete, SMS toggle without delivery |
| 6 | Booking reliability | 9 | 9 | 9 | **9** | Instant and request flows, double-booking E2E, Start-Code window and attempt counter, fee previews, money reconciles; Stripe path unverifiable |
| 7 | Security & permissions | 7 | 7 | 7 | **8** | F1 closed, F2/F7/F13/F16 in place, IDOR/RLS hold; A4-3 lets an uncategorised document unlock gated trades, A4-1 is a defence-in-depth gap |
| 8 | Performance | 6 | 8 | 8 | **8** | Unchanged: Lighthouse perf 81–97, LCP 2.0–4.2 s, CLS ≈ 0, TTFB ≤ 94 ms; fonts still 331 KB (F12 open) |
| 9 | Trust & conversion | 7 | 8 | 8 | **8** | F2/F3/F4 fixed and the demo story holds together; R12 placeholders, `hallo@soma.example`, A4-3 false *„Meisterbrief geprüft“*, A4-6 copy |

No dimension is below 8. The tasks that lead to the next point are in *Path to the next score*.

---

## V. Demo verdict

**Yes, hand it to the client.** All three accounts give the real experience:
- the guest booking ends with a Start-Code;
- Julia's account is rich and internally consistent;
- Selin's dashboard, requests, Start-Code check-in, calendar, earnings and invite link all work;
- the admin's verification gate, regions and commissions work.

Every money figure I checked reconciled with the DB.

Caveats, in order of importance:

1. **Fix A4-2 before the client tests on their own,** or tell them not to use *„Leistung hinzufügen“* without changing the service. The fix is small (`src/components/pro/services-editor.tsx:49–61`): skip offered service/duration pairs, or make the server refuse duplicates on *add*.
2. **Run `npm run demo:refresh` ≤ 1 h before every session and between sessions.**
   - Client actions are real: accepting, cancelling, starting, editing prices.
   - Run it **during the day**. A refresh after about 18:30 extends Selin's working hours for that weekday (seen: *„Buchbar 09:00–23:30“* and *09:00–24:00*) and puts the demo appointment at night (A4-7).
   - Never run `npm run test:e2e` after the last refresh.
3. **Build on the demo machine with internet (`npm run build`),** so `images:fetch` stores the photos locally. Check that portraits show before the client arrives. With `npm run dev`, photos come from the CDN.
4. **Set `APP_URL` to the URL the client will use.** Invite, referral and e-mail links print `http://localhost:3000/…` (A4-8).
5. **For the guest booking, tap a *„Sofort bestätigt“* pro** (Hanna B. at 10115) if the confirmation should show the Start-Code. Request-mode pros (Selin) show it only after acceptance (A4-10).
6. **Legal texts are labelled placeholders** (R12). Say so if the client opens Impressum, AGB or Datenschutz.

---

## Verification of audit-3 items (F1–F16) and R12

| ID | Verdict | Evidence |
|---|---|---|
| **F1** open redirect (dot segments) | ✅ **fixed** | `src/server/auth/redirect.ts:28–30` rejects normalised paths starting with `//`, containing `\`, or starting with `/%2f`. **Unit fuzz (59 inputs via `tsx`):** `/.//x`, `/a/..//x`, `/%2E//x`, `/%2e%2e//x`, `/./%2Fx`, `/%2e/%2fx`, `/x/%2e%2e/%2e%2e//x`, `/.\t//x`, `/./%5Cx`, `//x`, `\\x`, `https:`, `javascript:` and `data:` → `null`. Everything else that passes keeps a single leading `/` followed by a non-slash (e.g. `/%20//x`, `/%EF%BC%8E%EF%BC%8E//x`, `/?//x`), so it stays on the same origin. **HTTP:** 52 vectors × `/anmelden` and `/registrieren` × signed in and anonymous = **208 probes, 0 foreign `Location`**; the anonymous form only ever carries the sanitised value. **Login action replay (22 vectors):** `x-action-redirect` is always same-origin (`/konto` or the sanitised path). **Chromium** (evil host mapped to :3000): 19 navigations, all ended on `localhost:3100`. **`loginUrl` via dynamic segments:** `/buchung/..%2F..%2F%2Fevil.example` (not decoded in params) and the `.ics` route lead to `/anmelden`, which drops the value. **`Host` / `X-Forwarded-Host` / `Forwarded` spoofing:** `Location` unaffected. The 8 audit-3 F1 tests now run without `test.fail()` and pass |
| **F2** category qualification | ◑ **partial** (reported path fixed; new bypass **A4-3**) | **Action replay:** Hanna and Selin `upsertProServiceAction(herrenhaarschnitt)` → `isActive:false, awaitingDocuments:true`, message *„… sobald dein Nachweis geprüft ist: Meisterbrief oder Eintragung in die Handwerksrolle. Lade ihn unter „Verifizierung“ hoch.“* A second upsert stays inactive. Not in `/suche?…&kategorie=haare-styling` (10719, 10405, 10115), not on either profile. **UI:** the add dialog warns *„Für Haare & Styling brauchen wir zusätzlich …“*, and the list shows *„Wartet auf Nachweis · nicht buchbar“* (`04-…`, `05-…jpg`). **Admin:** the queue lists *„Hanna B. · Wartet auf Nachweis: Herrenhaarschnitt“*. **DB (as `authenticated`):** a direct active insert is stored `is_active=f, awaiting_documents=t`; `UPDATE awaiting_documents` and a `service_id` swap → *permission denied*; `category_documents_complete()` cannot be executed. The trigger is in `supabase/migrations/0008_reauth_and_category_documents.sql`. **But:** A4-3 (an uncategorised qualification satisfies all categories) and A4-1 (GUC bypass) |
| **F3** reviews vs services, replies | ✅ fixed | The home quote *„90 Minuten, die sich wie Urlaub angefühlt haben.“* sits on a 90-min Entspannungsmassage. All 29 of Selin's reviews match their service, and each of the 13 replies answers its own review (e.g. the music reply on the music review). A keyword scan over all 120 reviews found 0 real mismatches (3 false positives: *Fußmassage* in pedicure, *Wimpern* in make-up). All 6 reviews ≤ 3★ get apologetic or constructive replies. 112 distinct texts; the 8 duplicates are empty, rating-only reviews |
| **F4** shared portfolios | ✅ fixed | `provider_portfolio`: 84 rows, **84 distinct files**; 0 rows in a category the pro does not offer; all 121 DB image paths exist in `scripts/images/sources.json` (131 entries), and every ratio matches width/height |
| **F5** time-relative demo data | ✅ fixed (residual A4-7) | `npm run demo:refresh` (`scripts/db/demo-refresh.ts`). The Julia ↔ Selin appointment started 35 min (refresh 1) and 39 min (refresh 2) after the refresh, and was startable from 30 min before (seen: started at 21:56 for 22:25). Open requests are due the next day at 11:47/11:48 (≥ 13 h). **0 of 870** booking events and 0 bookings are stamped outside 08–21 h Berlin |
| **F6** hot-linked photos | ✅ fixed in code (not verifiable here) | `prebuild: node scripts/images/fetch.mjs \|\| true` downloads before every `npm run build`; `resolveImage()` (`src/lib/images.ts:23–28`) serves local files once they are listed in `images.local.json`. Here the CDN is blocked, so the manifest stays `[]` and the remote URLs are used (`/_next/image` → 500 → fallback panel). DEMO.md documents it. On the client's machine, run the build online and check (caveat 3) |
| **F7** demo accounts breakable | ✅ fixed | **Replayed:** `changePasswordAction` (Julia, Selin, admin), `requestAccountDeletionAction` (Julia, Selin), and as admin `setUserBlocked` (Julia, Selin), `anonymizeUser` (Julia), `decideProvider` suspend and reject (Selin), `reviewDocument` reject (Selin's insurance). Each gave *„Im Demo-Zugang ist diese Aktion deaktiviert, damit alle mit denselben Zugangsdaten testen können.“* Password hashes are unchanged, and no profile was blocked or anonymised. Password-reset requests for all three addresses (case and spaces varied) answer neutrally and create **0** reset tokens and **0** e-mails. The UI shows the notice in place of the forms on `/konto/profil` and `/pro/einstellungen`. Admins can still change *shared* data (categories, commission rules, cancelling Selin's appointment), which only a refresh undoes (caveat 2) |
| **F8** seed artefacts in admin | ◑ **partial** | **Fixed:** the status history is real (Leyla: *Entwurf → Eingereicht 07.05.*, *In Prüfung → Freigegeben 08.05.*, *Freigegeben → Gesperrt 30.10.*); 0 audit rows carry `demo`; `provider.auto_suspend` reads *„Profi automatisch pausiert (Dokumente)“*; KPI, chart and funnel agree (422 searches). **Left:** upcoming bookings were created over 13 days, but 9 of them on the seed day, so the *Buchungen erstellt* chart still ends in a spike (*+79,5 %* next to GMV *−25,8 %*); `/admin/regionen` sums to 411 searches (vs 422); *Auslastung Profis 0,6 %*; the global commission rule reads *„Geändert 30.10.2026, 17:03“* |
| **F9** `/pro` card at 320 px | ✅ fixed | *„Entspannungsmas-sage (klassisch)“* hyphenates; `scrollWidth == clientWidth` on `/pro` and `/pro/termine` at 320, 360 and 390; card right edge 300 px of 320 (`08-…jpg`) |
| **F10** admin skeleton overflow | ✅ fixed | `scrollWidth` sampled every 10 ms during client navigation `/admin/profis` → `/admin/profis/[id]` at 320: max **0 px** (audit 3: 582 px) |
| **F11** rebook list vanishes | ✅ fixed | `listRebookSuggestions` queries the last completed booking distinct per provider (`src/server/services/bookings.ts:761ff`). After the full E2E run (dozens of cancellations, 30 unread notifications), `/konto` still shows 3 suggestions (`audit4.spec.ts` › F11) |
| **F12** fonts 331 KB | ❌ **open** | Unchanged: 331 KB of fonts (3 files) on `/`, the profile and `/fuer-profis`; 201 KB on `/suche` unthrottled and 331 KB throttled; 57–187 KB on checkout. `src/app/layout.tsx:17–23` still loads Newsreader with italic and the `opsz` axis |
| **F13** contact-lint residuals | ✅ fixed (new low residuals → A4-12) | All 10 listed residuals are caught (`anna @ gmx . de`, *Telegramm*, `linhnails . de`, `dot de`, `(dot) com`, `.fr/.it/.nl`, mixed digits and words). Portfolio captions are linted live: `0170 1234567` and `linhnails . de` are refused with the *du* message, a clean caption passes. No false positives on 12 normal texts (dates, times, prices, PLZ lists, *„Das Signal war schlecht …“*). 20 of 46 **new** attempts pass (A4-12) |
| **F14** copy | ◑ **mostly fixed** | Fixed: *„zuletzt vor 3 Wochen“*, *„Bei SOMA seit 13. April 2026“*, no *„seit vor …“*, labelled audit actions, NBSP before *Uhr* in the countdown, *„Stammkundschaft“* only once per request card, demo tiles no longer clipped. **Open:** `hallo@soma.example` (`src/lib/brand.ts:10`) in every footer and in the account-deletion text |
| **F15** search filters | ◑ **partial** | Price cap added (`preis=60/90/120`; at 10435 massage, `preis=60` → 1 of 2 pros). No exact-time filter (`zeit` = time of day only). The neighbouring-PLZ hint did not appear in 7 thin or empty searches I tried |
| **F16** account-existence oracle, re-auth | ✅ fixed (accepted trade-off) | **Re-auth limit (live):** Ben's 6th wrong deletion password → *„Zu viele Versuche. Bitte warten Sie 15 Minuten …“* (21 ms; `src/server/auth/reauth.ts`). **Oracle:** `checkoutSignUp` still answers `{kind:"exists"}`, and 26 calls took 3 s without a throttle. This is documented as an accepted trade-off in `docs/architecture.md:171ff`, which audit 3 allowed as an option |
| **R12** legal texts | ❌ open (expected) | Placeholders; `check:launch` gates it |

---

## D. Demo-readiness review (DEMO.md §3, mobile and desktop)

### D.1 Home and guest booking (DEMO §3.1–3.2)

- **Home.**
  - The promise *„Wellness, die zu Ihnen kommt.“* comes with the booking box above the fold.
  - The proof band reads *4,7 ★ aus 118 verifizierten Bewertungen · 27 geprüfte Profis · 6 Städte*. This matches the DB: `public_reviews` 118, average 4.71; 27 approved.
  - The SOMA-Garantie is shown, and the trust block now promises *„… und für jede angebotene Behandlung die Qualifikation“* (true after F2, except A4-3).
  - The mobile home is 8,425 px tall.
- **Guest on mobile.**
  - Search: 10115 → *Was?* sheet → *Massage: alle Leistungen* → *„Verfügbare Profis anzeigen“* → *„2 Profis mit freien Terminen“*: Hanna B. *Sofort bestätigt* 69 € and Selin A. *Auf Anfrage* 54 €, both *„inkl. Anfahrt“*.
  - Checkout: tap *Morgen 09:00* (Hanna) → *„Termin buchen. Prüfen Sie Ihre Angaben. Der Termin ist sofort bestätigt.“*
  - The page offers home, hotel or office; contact without a password (*„Ein Passwort brauchen Sie dafür nicht.“*); *Testmodus*; the breakdown 62 € + 7 € Anfahrt = 69 € with *§ 19 UStG*; *„In den ersten 15 Minuten … kostenlos stornierbar“*; and the § 356 consent.
  - *„Zahlungspflichtig buchen · 69 €“* leads in 1.7 s to *„Bestätigt. Hanna B. kommt am Samstag, 31. Oktober um 09:00 Uhr zu Ihnen.“*, the account-created notice and **Start-Code 7004** (`01-…jpg`).
  - The price is the same in search, CTA and confirmation.
- **Guest on desktop (request mode).** Selin *Morgen 10:30*. The checkout says *„Selin A. antwortet bis morgen, 08:30 Uhr – belastet wird erst nach der Zusage.“* (capped at start − 2 h). The confirmation reads *„Angefragt – Antwort bis morgen, 08:30“*, with no Start-Code (shown after acceptance), and the 54 € price matches.
- **What a client may notice:**
  - Only 2 massage pros at the suggested PLZ 10115.
  - The demo slot is short-notice, so the *„kostenlose Stornierung bis …“* in DEMO.md is only the 15-min Bedenkzeit. A slot more than 24 h ahead shows a concrete date.

### D.2 Customer — Julia H. (DEMO §3.3)

- **What works.**
  - `/konto`: *„Guten Abend, Julia.“* The next appointment is *Heute, 22:25 · Entspannungsmassage (klassisch) · Bestätigt* with Selin.
  - *Erneut buchen* offers 3 suggestions, the credit is 15,00 €, and there are 2 unread notifications.
  - *Termine*: 4 upcoming (3 confirmed, 1 request), 10 completed with 6 pros in 6 categories, and 1 cancellation with a 32,50 € fee.
  - Other data: 7 reviews, 3 with replies; 3 favourites; 3 addresses.
  - The credit ledger reconciles (+15 −15 +15 −10 +10 = 15 €). All of this matches DEMO.md.
- **Booking detail.**
  - The demo appointment shows **Start-Code 1839**, the address, a VAT line and *„Vertragspartner ist Selin A.“*.
  - The cancel preview reads *„Es fällt eine Stornogebühr von 94,00 € an (100 % des Behandlungspreises zzgl. Anfahrt). Sie erhalten 0,00 € zurück.“* (`06-…jpg`).
  - For the Mai T. booking 3 days ahead, the preview reads *„Die Stornierung ist jetzt noch kostenlos. Sie erhalten 55,50 € zurück.“*, with three dated tiers.
- **After Selin started the appointment,** Julia sees *„Die Behandlung läuft.“* and `/konto` shows *Läuft*.
- **What a client may notice:**
  - In the demo appointment's *Stornierung* block, the only line is *„Danach: 100 % der Behandlung zzgl. Anfahrt“* (A4-4, `07-…jpg`).
  - After the start, the Start-Code card still says *„Nennen Sie diesen Code … bei Ankunft“*, and the headline reads *„Eine gute Behandlung.“* (A4-5).
  - The footer shows `hallo@soma.example`.

### D.3 Provider — Selin A. (DEMO §3.4)

- **Heute.**
  - *„Guten Abend, Selin. 2 offene Anfragen · 1 Termin heute · 6 bevorstehend“*.
  - Request cards show the countdown *„Du hast noch 13 Std. 52 Min. Zeit zu antworten (bis Sa., 31. Okt., 11:48 Uhr).“*.
  - The payout reconciles: 85,96 € = 92 € − 12 % + 5 € travel.
  - The notes are in place (*„Gern wieder mit dem Lavendelöl.“*).
- **Accepting a request.** Fatma's request → *Offene Anfragen (1)*; the booking appears as *Bestätigt* in the calendar.
- **Start-Code.**
  - *Termin starten* is visible 29 min before the start.
  - The dialog says *„Bitte Julia um den vierstelligen Start-Code …“*.
  - `1234` gives *„Der Start-Code ist falsch. Noch 4 Versuche.“* (`02-…jpg`).
  - `1839` gives the toast *„Termin gestartet. Viel Freude bei der Behandlung.“* and *„Läuft jetzt“* (`03-…jpg`); the DB shows `in_progress`, attempts 1.
  - *Termin abschließen* is disabled until the scheduled start: *„Ab 22:25 Uhr möglich, sobald der Termin begonnen hat.“* (A4-5).
- **Contact data appears only around the confirmed appointment** (*+49 170 1112233*, street).
- **Kalender:** Mon–Sat, the open request shown as *Angefragt* with PLZ only.
- **Einnahmen:** available 257,14 € + pending 107,50 € + paid 2.830,48 € = 3.195,12 € = the year total = the sum of the 6 monthly rows. The tier is shown per booking (20 / 12 / 5 %).
- **Other screens:**
  - *Einstellungen*: invite link and code, with the demo notice instead of *Passwort ändern*.
  - *Verifizierung*: 4 × *Geprüft*.
  - *Leistungen*: 5 services.
  - Reviews: coherent replies.
- **What a client may notice:**
  - *„Leistung hinzufügen“ → „Hinzufügen“* overwrote 89 € with 75 € (A4-2, `05-…jpg`).
  - The invite link is `http://localhost:3000/…` (A4-8, `11-…jpg`).
  - After the evening refresh, *„Buchbar 09:00–23:30“* on Friday (A4-7).
  - DEMO.md says 27 reviews; she has 29 (A4-10).

### D.4 Admin (DEMO §3.5)

- **Übersicht** (`09-…jpg`):
  - KPIs.
  - Work queues: Nora K. and Paul A. in verification (5 and 4 documents open), 1 dispute, 3 unanswered requests with expiry.
  - *Dokumente & Sperren*: Leyla A. *Automatisch pausiert* and Charlotte J. *Läuft bald ab*.
  - KPI, chart and funnel all agree on 422 searches.
- **Profis & Verifizierung.** Nora's *Freigeben* is disabled, with the 5 missing documents listed (`10-…jpg`).
- **Regionen.** Supply gaps (*„Pediküre in Hamburg 12 Suchen, 0 Profis“*) and per-city thresholds.
- **Provisionen.** Rules 20 / 12 / 5 %, worked example, cancellation tiers 0 / 50 / 100 %, Bedenkzeit 15 min.
- **Protokoll.** Labelled actions with real dates.
- **What a client may notice:**
  - The chart spike on the last day.
  - *Auslastung Profis 0,6 %*.
  - Nora's two *„Qualifikation · Zertifikat.pdf“* rows without a category (A4-11).

### D.5 Cross-cutting

- **Console.** 290 crawl loads (anon, customer, provider, admin; 320 / 390 / 768 / 1024 / 1440) gave **0 hydration errors, 0 page errors, 0 non-image console errors**. The only console errors are the blocked CDN images (`/_next/image` 500).
- **Sie/du.** Correct everywhere I read:
  - customer UI and lint messages use *Sie*;
  - `/pro` uses *du*;
  - the demo notice uses neutral phrasing.
  - Provider bios address customers with *Sie*; public provider replies use *du* (provider voice, acceptable).
- **Fallbacks.**
  - Tone panels with initials or the category name in italics.
  - The dark home hero shows *„Schon da.“* on near-black (`13-…jpg`). It looks intentional, but it is a large empty block until the photo loads.
- **German.** Clean, with these exceptions: A4-4 (*„Danach:“* alone), A4-5 (*„Eine gute Behandlung.“*) and A4-6 (*„die Profis in Ihrer Nähe … keine freien Termine“* where no pro exists).

---

## 1. Visual quality — 8/10 (=)

- **The system is intact on all three surfaces:**
  - ink actions;
  - ultramarine pointers;
  - Newsreader display type;
  - hairlines;
  - tone-panel fallbacks with italic labels.
- **Improvements I saw:**
  - unique portfolios (F4);
  - coherent quotes (F3);
  - hyphenated request titles at 320 (F9);
  - NBSP in times;
  - demo tiles stacked and no longer clipped.
- **Findings:**
  - an empty fourth stat tile on `/konto/guthaben` at 1440 (A4-9, `12-…jpg`);
  - the hero fallback is a large dark block (sandbox only);
  - the demo tiles deliberately shorten the address to *„testkunde@…“* (`14-…jpg`, fine).
- **Not verifiable:** photography. I could not see a single portrait or portfolio image, so I can't judge crop, faces, captions vs content, or LCP with photos. That is the main reason this is not a 9.

## 2. UX & navigation — 9/10 (=)

- **The journey is short:** home → search → slot chip → checkout → *Zahlungspflichtig buchen* → *Bestätigt.*
- **Fixed since audit 3:**
  - rebooking is robust (F11);
  - price filter (F15);
  - cleaner copy (F14);
  - clear F2 feedback with a link to *Verifizierung*.
- **New:**
  - **A4-2.** The add dialog defaults to an existing offering and overwrites its price, with a misleading *„hinzugefügt“* toast.
  - **A4-4.** *„Danach: …“* is shown without context.
  - **A4-5.** *„Läuft jetzt“* next to *„Abschließen ab 22:25, sobald der Termin begonnen hat“*.
- **Still missing:** an exact-time filter and the nearby-PLZ suggestion.

## 3. Mobile responsiveness — 9/10 (=)

- **Overflow:** 58 routes × 5 widths across 4 roles = **290 loads, 0 px horizontal overflow**. That includes `/pro` at 320 with long service names (F9) and admin navigation at 320 (F10, 0 px transient).
- **Targets at 390 (elements < 24 px):**
  - 0 on checkout, `/konto/termine` and `/pro/kalender`;
  - only inline text links elsewhere (15–18 px tall, WCAG 2.5.8 inline exception);
  - admin table reference links are 21 px (25 on `/admin/buchungen`).
- **Not tested:** WebKit/iOS Safari, real devices.

## 4. Accessibility — 9/10 (=)

- **axe-core 4.14** (WCAG 2.0/2.1/2.2 A+AA + best practice) on 38 pages × 2 viewports = 76 runs:
  - **66 with 0 violations**;
  - 10 with only `color-contrast` on **aria-hidden** fallback labels (`/`, `/suche`, profile, `/fuer-profis`, SEO page), which is decorative and exempt.
- **Manual:**
  - one `h1`, one `main` and `lang="de"` on every page;
  - skip link `#inhalt`, or `#pro-main` on `/pro`;
  - the Start-Code is also announced digit by digit (*„1 8 3 9“*);
  - Lighthouse accessibility 96–100.
- **Not tested:** screen readers, 200 % zoom, keyboard-only walkthrough of the sheets.

## 5. Functional completeness — 9/10 (=)

Everything from audit 3 still works. I exercised it during the walkthrough: booking (instant and request), cancel previews, Start-Code, accept, calendar, earnings, invite and referral, favourites, credits, notifications, the verification gate, regions, commissions, protocol and demo logins.

**New since audit 3:**
- category-document gate with *„wartet auf Nachweis“* and automatic activation on approval;
- protected demo accounts;
- re-auth limit;
- price filter;
- `demo:refresh`.

**Gaps:**
- exact-time filter;
- multiple service areas;
- address autocomplete;
- admin state override;
- the *„Erinnerung per SMS“* toggle without SMS delivery (documented);
- the category of a qualification upload (A4-3).

## 6. Booking reliability — 9/10 (=)

- **E2E:**
  - instant booking with a consistent price and free cancellation;
  - request mode with deadline and withdrawal;
  - two customers on one held slot (one wins);
  - Bedenkzeit cancellation;
  - decline with alternatives.
- **Live walkthrough:**
  - price equal across search, CTA and confirmation (69 € and 54 €);
  - payout figures exact (85,96 €, 83,32 €);
  - fee previews 94,00 € (< 2 h) and free (> 24 h);
  - Start-Code window 30 min, attempt counter (4 left after 1 wrong), state `in_progress`, completion blocked until the start.
- **Not re-run this round:** the 12-way race and the full fee-tier DB matrix from audit 3. The code paths are unchanged since then.
- **Not verifiable here:** Stripe (Payment Element, Connect, webhook).

## 7. Security & permissions — 8/10 (↑ from 7)

**Open redirect (F1): closed.** Evidence in the F-table (59 unit inputs, 208 HTTP, 22 action, 19 browser, dynamic-segment and host-spoof probes).

**Server actions, wrong role or owner: 76 replays, all denied.** Bookings unchanged (hash), credit sum unchanged.
- Customer → customer: cancel, rebook options and confirm payment on Julia's booking → *„Buchung nicht gefunden.“*; delete or set-default on Anna's address → *„Adresse nicht gefunden.“*
- Provider → provider: accept a request, start with the right code, complete, no-show, cancel, reply to a review, delete an offering on Selin's data → *„nicht gefunden“*.
- Customer ↔ provider role swaps (5).
- Customer, provider and anon → the **18 admin actions**, including +500 € credit, export of Anna's data, approving Nora and her document, 0 % commission, admin cancel, refund, dispute resolve and status, payout batch and paid, platform setting, content block, hiding a review, block, anonymise and category deactivation. All denied: *„Dafür fehlt die Berechtigung.“* / *„Bitte melden Sie sich an.“*
- A foreign `Origin` is rejected.

**Pages and routes.**
- Anna on Julia's booking → *„Diese Buchung finden wir nicht.“*; `.ics` → 404 (owner 200).
- Hanna on Selin's appointment, and Selin on a Julia–Friederike booking → *„Termin nicht gefunden.“*
- Role homes redirect across roles.
- Private document: anon 401, other customer or provider 403, owner and admin 200.
- `/api/cron/*` → 401.
- Before confirmation, Selin's request page shows *„Telefon: Nach Bestätigung sichtbar“* and no last name or street.

**RLS: 74 SQL probes.** All as specified, except A4-1. New this round:
- the F2 trigger on direct inserts;
- the `awaiting_documents` flag is not writable;
- `service_id` swap denied;
- `category_documents_complete()` not executable;
- `app_private.reauth_attempts` unreadable.

**Demo protections (F7), lint (F13), re-auth limit (F16):** see the F-table.

**New:**
- **A4-3 (high):** a qualification can be uploaded without a category (`uploadDocumentAction`, `src/server/actions/pro.ts:119–124`). Both `category_documents_complete()` (`0008_…sql:53`) and `queryMissingCategoryDocuments` / `queryMissingDocuments` (`src/server/services/pro.ts:175`, `:452`) treat `category_id IS NULL` as valid for **every** category. Repro (live): Hanna uploads *„Massage-Zertifikat-2.pdf“* as *Qualifikationsnachweis* with no category (the *„Weiteres Dokument“* form has no category field). The admin approves it; the page lists it as *„Qualifikation · Massage-Zertifikat-2.pdf“* with no category. Hanna then adds *Herrenhaarschnitt*: it is **active**, she appears in `/suche?plz=10719&kategorie=haare-styling`, and her profile's *„Was wir geprüft haben“* lists *„Meisterbrief oder Eintragung in die Handwerksrolle“*.
- **A4-1 (low):** `provider_services_require_documents()` is `SECURITY DEFINER` and returns early when `public.seed_mode()` is true (`0008_…sql:73`). `seed_mode()` (`0001_core.sql:69–75`) checks `current_user`, which inside a definer function is the owner. So `select set_config('soma.seed_mode','on',true)` as role `authenticated`, followed by an active gated insert, gives `is_active = t` (rolled back). The app never runs raw SQL as users, and the Data API is to stay off, so this can't be reached today.

**Unchanged and accepted:**
- `checkoutSignUp` existence oracle without a throttle (documented);
- CSP `'unsafe-inline'` for scripts (documented).

**Why 8, not 9.** The audit-3 bar for 9 was F1 + F2 + F13 + F16. F1, F13 and F16 are met, and F2's reported path is enforced down to the DB. But A4-3 lets a provider be shown as verified for a regulated trade without the document, which is exactly what F2 was about. A4-3 needs one admin mistake, and the admin UI makes that mistake likely. Fixing A4-3 (and A4-1) is a 9.

## 8. Performance — 8/10 (=)

**Lighthouse 12, mobile, simulated** (two runs; for trend vs audits 1–3):

| Route | Perf | FCP | LCP | TBT | CLS | JS | Fonts |
|---|---|---|---|---|---|---|---|
| `/` | 94 / 96 | 1.00 / 0.99 s | 2.32 / 2.68 s | 231 / 110 ms | 0 | 183 KB | **331 KB** |
| `/suche?plz=10115&kategorie=massage` | 95 / 92 | 0.92 / 0.91 s | 2.80 / 2.81 s | 83 / 234 ms | 0 | 198 KB | 201 KB |
| `/profis/selin-a-berlin` | 93 / 82 | 1.66 / 2.72 s | 3.01 / 3.97 s | 108 / 144 ms | 0.001 | 200 KB | **331 KB** |
| `/buchen?…` (anon) | 96 / 97 | 0.91 / 0.92 s | 2.23 / 1.97 s | 181 / 160 ms | 0 | 221 KB | 57 KB |
| `/fuer-profis` | 81 / 83 | 2.72 / 2.73 s | 4.21 / 3.75 s | 119 / 146 ms | 0 | 220 KB | **331 KB** |

**Playwright probe** (390×844, CDP transfer sizes, PerformanceObserver), two runs each:
- Unthrottled: TTFB 7–94 ms; LCP 148–472 ms.
- With 4× CPU and 1.6 Mbps / 150 ms: FCP = LCP 1.0–1.4 s on all five pages; CLS ≤ 0.048 (on `/suche`).
- Page weight 384–649 KB, of which fonts are 57–331 KB, with 0 third-party requests.
- The LCP element is text: the hero lead, the demo ribbon, or the avatar initials, because photos cannot load here.

**Verdict.** No change since audit 3. F12 (fonts) is still open, and LCP with real photos was not measurable.

## 9. Trust & conversion — 8/10 (=)

**Stronger.**
- The demo story holds together: home quote, reviews and replies, unique portfolios, believable times, admin history.
- *Verifiziert* now also depends on category documents (F2).
- The live Start-Code proof works and is persuasive.
- Price transparency from search to confirmation.
- The proof band matches the DB.

**Holding it back.**
- R12 legal placeholders.
- `hallo@soma.example`.
- A4-3, which can produce a false *„Meisterbrief … geprüft“*.
- A4-6: the empty-state copy implies pros exist where there are none.
- Thin supply at the demo PLZ (2 massage pros at 10115 and 10435).
- *Auslastung 0,6 %* on the admin dashboard.

Audit 3's bar for 9 was R12 + F2 + F3 + F4; R12 is still open.

---

## Remaining issues (prioritised)

Severity: **blocker** = before launch · **demo** = before the client tests on their own · **high** = next iteration · **medium** · **low**.

| ID | Sev. | Dim. | Issue → expected behaviour | Where | How to verify |
|---|---|---|---|---|---|
| **R12** | blocker | 9 | Legal texts are placeholders (needs a lawyer) | `src/app/(site)/{impressum,datenschutz,agb,agb-profis,widerruf}/page.tsx` | `npm run check:launch` with the production env |
| **A4-2** | demo | 2, 5 | **„Leistung hinzufügen“ overwrites an existing offering.** `openAdd()` preselects the first service of the first offered category at the guide price; `upsertProService` upserts `on conflict … do update set price_cents`, and the toast says *„… hinzugefügt.“* Repro: Selin → *Leistungen* → *Leistung hinzufügen* → *Hinzufügen* (no changes) → *Entspannungsmassage 60 Min.* goes from 89 € to 75 €. **Expected:** the add dialog omits offered service/duration pairs (or preselects a free one), and the server refuses a duplicate on add (*„Diese Leistung bietest du schon an – bearbeite sie in der Liste.“*) | `src/components/pro/services-editor.tsx:49–61, 76`; `src/server/services/pro.ts:204–206` | `tests/e2e/audit4.spec.ts` › A4-2 (remove `test.fail()`; it restores the price itself) |
| **A4-3** | high | 7, 9 | **An uncategorised qualification unlocks every category** (repro in §7). **Expected:** a qualification upload requires `categoryId` (form field on *Verifizierung*); `category_id IS NULL` never satisfies a category requirement (`0008` function and both TS helpers); the admin document table shows the category; existing NULL qualifications are flagged for re-review | `src/server/actions/pro.ts:119–124`; `supabase/migrations/0008_reauth_and_category_documents.sql:53`; `src/server/services/pro.ts:175, 452`; `src/app/admin/profis/[id]/page.tsx` | Upload a qualification without category → refused; approve a massage-category doc → *Herrenhaarschnitt* stays *„wartet auf Nachweis“* |
| **F12** | medium | 8 | Fonts 331 KB, LCP > 2.5 s on 3–4 of 5 pages (unchanged). **Expected:** Newsreader static weights without the full `opsz` axis, italic only where used; < 150 KB on `/` | `src/app/layout.tsx:17–23` | Lighthouse mobile ×2: fonts < 150 KB, LCP < 2.5 s |
| **A4-1** | low | 7 | The F2 trigger is `SECURITY DEFINER` and trusts `soma.seed_mode`, which any session can set. **Expected:** no seed bypass in this trigger (seed offerings before approval, or check `session_user` / a role-only setting) | `supabase/migrations/0008_…sql:73`, `0001_core.sql:69–75` | As `authenticated`: `set_config('soma.seed_mode','on',true)` + active gated insert → still `is_active=f` |
| **F8** (rest) | low | 1, 9 | 9 of the 38 upcoming bookings are created on the seed day (chart spike, *+79,5 %*); `/admin/regionen` sums to 411 vs 422; *Auslastung 0,6 %*; the commission rule shows *„Geändert …, 17:03“* of today. **Expected:** `created_at` spread over the lead time; one search-counting rule or a labelled difference; seed rules stamped in the past | `scripts/db/seed.ts`, `src/app/admin/regionen/page.tsx` | Chart without an end spike; equal totals |
| **F15** (rest) | low | 2, 5 | No exact-time filter; the nearby-PLZ hint was never observed. **Expected:** *„Ab Uhrzeit“* in the URL; a fixture that shows the hint | `src/app/(site)/suche/**`, `src/server/services/search.ts` | Filter changes the results; a thin search shows the nearby-PLZ hint |
| **F14** (rest) | low | 9 | Support address `hallo@soma.example` in the footer and the deletion text. **Expected:** the real (demo) address | `src/lib/brand.ts:10` | grep |
| **A4-4** | low | 2 | The cancellation block shows only *„Danach: 100 % …“* once earlier tiers have passed. **Expected:** *„Ab jetzt: 100 % der Behandlung zzgl. Anfahrt“* (or *„Jetzt storniert: …“*) when it is the only line | `src/components/site/checkout-format.ts:216–223` | Booking < 2 h ahead → no lone *„Danach:“* |
| **A4-5** | low | 2, 1 | After the start: the customer still sees *„Nennen Sie diesen Code … bei Ankunft“*, and the headline reads *„… Eine gute Behandlung.“* The pro sees *„Läuft jetzt“* next to *„Ab 22:25 Uhr möglich, sobald der Termin begonnen hat.“* **Expected:** hide or dim the code card once `in_progress` (*„Code bestätigt um 21:56“*), *„Wir wünschen Ihnen eine schöne Behandlung.“*, and *„Abschließen ab 22:25 Uhr (geplanter Beginn)“* | `src/app/(checkout)/buchung/[id]/page.tsx:70`; `src/components/pro/booking-actions.tsx:283` | Start a booking early and read both pages |
| **A4-6** | low | 9 | An empty search in a category with **no** pro in the city says *„… haben die Profis in Ihrer Nähe derzeit keine freien Termine“* (e.g. 20457 Pediküre; the admin shows 0 Profis). **Expected:** distinguish *no supply* (*„In Hamburg gibt es noch keine Pediküre-Profis – wir melden uns.“* + waitlist) from *no free slots* | `src/app/(site)/suche/page.tsx:340–352` | `/suche?plz=20457&kategorie=pedikuere` |
| **A4-7** | low | 9 | `demo:refresh` in the evening extends Selin's weekday hours (to 23:30 / 24:00) so the demo appointment fits, and leaves the appointment at night. **Expected:** keep her hours and refuse with a hint outside 08:00–19:00 (or place the appointment on the next morning and say so) | `scripts/db/seed.ts:880–895` | Refresh at 21:30 → Kalender still *09:00–19:00* |
| **A4-8** | low | 9 | Invite, referral and e-mail links use `APP_URL` (`http://localhost:3000`) while the build runs elsewhere. **Expected:** DEMO.md tells the presenter to set `APP_URL` to the demo URL (or derive it from the request in `DEMO_MODE`) | `.env.example`, `DEMO.md` §1 | Invite link matches the address bar |
| **A4-9** | low | 1 | `/konto/guthaben` at 1440 shows an empty fourth stat tile. **Expected:** 3 columns, or the grid background not visible | `src/app/konto/guthaben/page.tsx:41` (`StatGrid`) | Screenshot at 1440 |
| **A4-10** | low | 9 | DEMO.md drift: Selin has 29 reviews (doc: 27); *„Die Bestätigung zeigt den Start-Code“* is only true for instant pros; the code is in the booking detail, not the *Termine* list. **Expected:** update the doc, recommend Hanna B. (*Sofort bestätigt*) for the guest booking | `DEMO.md` §2–3 | Read-through |
| **A4-11** | low | 7 | The admin document table lists two *„Qualifikation · Zertifikat.pdf“* rows (Nora) without saying which category each proves | `src/app/admin/profis/[id]/page.tsx` | See A4-3 |
| **A4-12** | low | 7 | New lint bypasses (20 of 46 attempts): `a n n a @ g m x . d e`, `annaATgmxDOTde`, `1 5 1 1 2 3 4 5 6 7 8`, `linhnails,de`, `linhnails·de`, `linh@gmail`, `linh at gmail`, `gmail: linh.nails`, *Skype*, *Discord*, `h t t p s : / /`. **Expected:** collapse single-letter spacing before matching, add Skype/Discord, treat `@` + a known mail host without TLD as e-mail, send borderline texts to moderation | `src/server/domain/content-lint.ts` | Unit cases |

### Path to the next score
- **Security 8 → 9:** A4-3 and A4-1. **→ 10:** CSP nonces, a sign-up throttle or CAPTCHA, A4-12.
- **Trust 8 → 9:** R12, A4-3, the real support address, A4-6.
- **Visual 8 → 9:** verify the photography on the demo machine (portraits, crops, captions vs content), A4-9, A4-5.
- **Performance 8 → 9:** F12.
- **UX 9 → 10:** A4-2, an exact-time filter, A4-4, A4-5.
- **Mobile 9 → 10:** a WebKit / iOS Safari pass; admin table links ≥ 24 px.
- **Accessibility 9 → 10:** screen-reader (VoiceOver/NVDA) and 200 % zoom passes over booking and `/pro`.
- **Functional 9 → 10:** exact-time filter, multiple service areas, address autocomplete; hide or implement the SMS toggle.
- **Booking 9 → 10:** the Stripe path verified with test keys (Payment Element, manual capture, webhook, payouts).

---

## 10. E2E regression suite

- **Full suite.** `E2E_BASE_URL=http://localhost:3100 npx playwright test` gave **96 passed (3.2 min)** on mobile and desktop. That includes the 8 F1 tests from audit 3, now without `test.fail()`.
- **New file `tests/e2e/audit4.spec.ts`** (6 tests × 2 projects = 12; all pass, including 2 expected failures):

| Test | Covers |
|---|---|
| open-redirect variants for signed-in visitors | F1 re-probe (6 vectors × 2 pages) |
| demo customer / demo provider sees the demo notice | F7 |
| the account home still offers one-tap rebooking | F11 (runs after the suite's cancellations) |
| a service in an unverified category waits for the document and is not bookable | F2 UI path; removes the probe service in `finally` |
| adding a service never overwrites the price of an existing offering | **A4-2**, marked `test.fail()`; restores the original price in `finally` |

- **Unit tests.** `npx vitest run --project unit` gave **109 passed**. Integration tests and `tsc` were not run (they write to the DB or the build cache).

## 11. Not tested / limits

- **No credentials:** Stripe, Supabase Auth and Storage, Resend, SMS and push.
- **Production-only paths:** `DEMO_MODE=false`, HSTS over HTTPS, `TRUSTED_*` IP configuration, and `check:launch` with a production env.
- **Photography:** CDN blocked. I could not check portraits, crops or photo-LCP, or whether `npm run build` really stores all 131 images on the client's machine.
- **Other environments:** WebKit/iOS, real devices, screen readers, 200 % zoom.
- **Not re-run this round:** the 12-way booking race, the full cancellation-tier DB matrix, the global login failure budget, payout batch execution, auto-complete and the 8-step onboarding. Their code is unchanged since audit 3.
- **Completion of the demo appointment:** not possible inside its window here; it is blocked until the scheduled start, by design.

## 12. Data hygiene

**Created during the audit:**
- 2 guest accounts: `qa4-gast-mobil@` and `qa4-gast-desktop@kunden.soma.test`, with bookings SM-W7ME45 (Hanna, confirmed) and SM-4EXZ8Q (Selin, requested).
- Accepted request SM-H8RA2F and the started appointment SM-ZF63KP.
- Probe services: *Herrenhaarschnitt* for Hanna and Selin, both deleted.
- Selin's 60-min price was overwritten by A4-2 several times (my first UI probe and the A4-2 test runs) and restored to 89 € each time.
- One portfolio image (deleted through the action).
- One probe qualification document for Hanna (A4-3).
- The E2E suite's bookings.

**Restored:**
- `npm run demo:refresh` ran after the walkthrough, and a **final `DEMO_MODE=true npm run demo:refresh` ran as the last step**. The seed deletes every `%soma.test` account (all my accounts used that domain) and rebuilds the data relative to now.
- The probe document file was deleted from `.data/uploads`.

**Left behind (harmless, outside the seed's scope):**
- `app_private` counters: login attempts, auth-e-mail requests, 7 re-auth failures for Ben's *old* user id. They are keyed to ids or addresses and expire with their windows.

Neither server was restarted or rebuilt; `:3100` and `:3000` were up at the end.
