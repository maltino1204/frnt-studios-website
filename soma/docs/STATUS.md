# SOMA — Implementation status

> Snapshot of what exists, what was verified and what still blocks a production launch.
> Last updated at the end of the build session (see git log for the exact commit).

## 1. What was implemented

### Customer app (German, *Sie*)
| Area | Routes | Notes |
|---|---|---|
| Home | `/` | Editorial hero with the booking entry above the fold (PLZ · Behandlung · Wann), category rail, how-it-works, home/hotel/office band, trust and SOMA-Garantie, social proof from real reviews, featured professionals, cities, provider band, FAQ (FAQPage JSON-LD) |
| Discovery | `/behandlungen`, `/behandlungen/[kategorie]`, `/staedte`, `/staedte/[stadt]`, `/behandlungen/[kategorie]/[stadt]` | Data-driven taxonomy (7 categories, 32 services); 42 statically generated SEO city pages with canonical URLs, BreadcrumbList/Service JSON-LD, `noindex` below the supply threshold |
| Search & compare | `/suche` | PLZ → centroid → radius match; only providers with real slots; total price incl. travel; slot chips go straight to checkout; filters, sort, waitlist for unserved areas; demand logged without PII |
| Profiles | `/profis/[slug]` | Verified badge (backed by approved documents), ratings with provider replies, services and prices, portfolio, service area, policy summary, slot picker; invite links (`?einladung=`) |
| Checkout | `/buchen` | One scrolling page: Übersicht · Ort (home/hotel/office, saved addresses) · Kontakt (inline account creation without password, or login) · Zahlung (dev "Testmodus" or Stripe Payment Element) · Preis & Bedingungen (breakdown, VAT/§ 19 note, concrete free-cancellation deadline, 15-min Bedenkzeit, § 356 consent) · CTA "Zahlungspflichtig buchen/anfragen · 84 €" |
| Booking detail | `/buchung/[id]` | Status (bestätigt / angefragt with deadline), Start-Code, timeline, .ics export, cancel with live fee preview, rebook, review composer, problem report; alternatives after decline/expiry |
| Account | `/konto`, `/konto/{termine,favoriten,adressen,profil,guthaben,benachrichtigungen}` | Upcoming/past/cancelled bookings, one-tap rebooking, favourites, addresses, profile and password, credits and referral programme, notification preferences and inbox, data export and account deletion |
| Content | `/hilfe`, `/stornierung`, `/ranking`, `/widerruf`, `/impressum`, `/datenschutz`, `/agb`, `/agb-profis` | Legal pages are structured placeholders that need legal review |
| Auth | `/anmelden`, `/registrieren`, `/passwort-vergessen` | Safe `next` redirects, rate-limited login |

### Professional app (`/pro`, *du*)
Self-registration and an 8-step onboarding wizard (profile, services and prices, service area with
live travel-fee example, weekly hours, verification documents incl. category-specific ones such as the
Meisterbrief for Haare & Styling, payout setup, review and terms acceptance). Daily tool: *Heute*
dashboard with open requests and countdowns, bookings with accept/decline, Start-Code check-in,
complete, no-show and cancel; calendar (weekly hours, time off); services and prices; service area;
profile and portfolio; verification status; earnings (pending/available/paid out, commission tier per
booking); reviews with replies; settings (instant vs request mode, lead time, buffer, VAT mode,
notifications, personal invite link). Acquisition page `/fuer-profis` with real commission terms,
earnings calculator and live demand per city.

### Admin platform (`/admin`)
KPIs and time series (GMV, net revenue, conversion, repeat rate, rating, utilisation), work queues,
provider verification (approval blocked until all required documents are approved), users (detail,
credits adjustment, GDPR export and anonymisation), categories and services CRUD, bookings and
admin cancel/refund, disputes, payments/refunds/payouts (48 h hold, batches), commission rules and
platform settings, regions (supply vs demand, zero-result searches, waitlist), review moderation,
content blocks, audit log. Every page and action is admin-only and audited.

### Marketplace engine
- **Database as the final guard:** PostgreSQL with RLS on all public tables (switched per transaction
  exactly like Supabase), a `btree_gist` exclusion constraint that makes double bookings impossible,
  triggers that reject invalid slots (weekly hours in Europe/Berlin, time off, lead time, approval) and
  invalid state transitions, and an append-only booking event log.
- **Booking states:** `pending_payment → requested | confirmed → in_progress → completed`, plus
  `declined`, `expired`, `cancelled` (customer/provider/admin/system) and `no_show`. Instant and
  approval modes; response deadlines counted within 08:00–21:00.
- **Availability** is computed from real data only (weekly hours − time off − bookings with travel buffer,
  lead time, horizon), DST-safe.
- **Pricing:** service price + distance-based travel fee; commission 20 % (new), 12 % (repeat via SOMA),
  5 % (client brought via the provider's invite link), 0 % on travel; VAT mode per provider (19 % or § 19 UStG).
- **Cancellation policy:** 15-min Bedenkzeit; free ≥ 24 h; 50 % of the service price ≥ 2 h; 100 % + travel
  < 2 h or no-show; full refund when the provider cancels.
- **Payments:** `PaymentProvider` interface with a dev simulator (clearly labelled) and a Stripe Connect
  implementation (manual capture, destination charges, application fee, webhook).
- **Anti-disintermediation:** contact details masked until confirmation, contact-data filter on bios,
  reviews and notes, lower repeat commission, Start-Code proof of service, on-platform guarantee,
  favourites and one-tap rebooking, credits and referrals.
- **Notifications:** in-app inbox plus an e-mail outbox for every booking event, respecting preferences.

## 2. How to run

See `README.md` → Quick start. In short: `npm install`, create the database, `npm run db:setup -- --reset`,
`DEMO_MODE=true npm run db:seed`, `npm run dev`. Demo logins: `testkunde@soma.test` (customer),
`testkunde-b2b@soma.test` (provider), `testadmin@soma.test` (admin), all with password `soma-demo-2026`.

## 3. What was actually tested

| Kind | Scope | Result |
|---|---|---|
| Type check | `tsc --noEmit`, strict | clean |
| Unit tests (Vitest) | availability (incl. DST), pricing and VAT, cancellation tiers and Bedenkzeit, state machine, response deadlines, geo, ranking, content lint (health claims, contact data), redirect safety, client IP, messages | see §3.1 |
| Integration tests (Vitest + Postgres) | concurrency (parallel bookings → exactly one wins), DB trigger rejections, RLS (cross-customer reads, provider self-escalation, anon visibility, address visibility before confirmation), admin refusal incl. forged sessions, full lifecycle to review + rating aggregate + referral reward, cancellation fees, hold and request expiry, verification gate, VAT snapshot, GDPR anonymisation | see §3.1 |
| E2E (Playwright, mobile + desktop) | search → book (dev payment) → confirmation → cancel; approval mode; two-customer race; login redirects; open-redirect probes; role isolation; IDOR on booking pages and .ics; private media | see §3.1 |
| Manual/agent journeys | every customer, provider and admin workflow listed in `docs/qa/audit-*.md` | see the audit reports |
| Production build | `next build` (111 routes, 42 SEO pages prerendered) | passes |

### 3.1 Latest numbers
_Filled in at the end of the session — see §4._

**Not tested (no credentials or sandbox limits):** Stripe Connect (keys, webhook, Payment Element),
Supabase Auth and Storage adapters, Resend e-mail delivery, SMS and web push, real photography (the image
CDN is unreachable from the build sandbox; fallbacks were tested), iOS Safari/WebKit, screen readers.

## 4. Independent quality scores

Scores come from the independent QA agent (Agent 6). It does not implement features and scores only what it
observed. Reports: `docs/qa/audit-1.md`, `docs/qa/audit-2.md`.

| Dimension | Audit 1 | Audit 2 |
|---|---|---|
| Visual quality | 8 | _pending_ |
| UX & navigation | 7 | _pending_ |
| Mobile responsiveness | 8 | _pending_ |
| Accessibility | 8 | _pending_ |
| Functional completeness | 8 | _pending_ |
| Booking reliability | 9 | _pending_ |
| Security & permissions | 7 | _pending_ |
| Performance | 6 | _pending_ |
| Trust & conversion | 7 | _pending_ |

## 5. Production blockers

`npm run check:launch` encodes the hard gates and fails while any of them remain.

| # | Blocker | What is needed |
|---|---|---|
| 1 | **Legal texts** | Lawyer-approved Impressum, Datenschutzerklärung, AGB (customers), AGB für Profis, Widerrufsbelehrung and model form, cancellation terms. Open questions flagged in the code (⚖): withdrawal right vs. cancellation fees and early-start consent (§ 356 Abs. 4 BGB), agency model and VAT, P2B ranking transparency, DSA notice-and-action for reviews, HWG wording for massage, Handwerksrolle for mobile hairdressing, BFSG |
| 2 | **Supabase** | Project; run `supabase/migrations` (not `supabase/local`); `AUTH_PROVIDER=supabase`, `STORAGE_PROVIDER=supabase`; pooled `DATABASE_URL` (transaction mode, `DATABASE_PREPARE=false`); buckets `portfolio` (public) and `documents` (private); disable the Data API for `public` or keep the strict grants; verify the Supabase adapters (not covered by tests) |
| 3 | **Stripe Connect** | Platform account and Connect settings; `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`; register `/api/webhooks/stripe`; verify the Payment Element step and Express onboarding; implement SetupIntent + off-session charge for bookings more than 6 days ahead (authorisations expire after 7 days) |
| 4 | **E-mail / SMS / push** | Resend (or Postmark) key and verified domain, German templates for every notification; SMS provider for reminders and request alerts; Web Push (VAPID) |
| 5 | **Data and imagery** | Never run the demo seed in production; replace AI-generated portraits (illustrative only) with providers' own photos and commission or license editorial photography; run `npm run images:fetch` or self-host the final set; replace the postal-code centroid dataset with a source licensed for redistribution (see `supabase/seed-data/README.md`) |
| 6 | **Operations** | Scheduler for `/api/cron/booking-maintenance` (expiry, auto-complete, reminders); monitoring and error tracking; backups; secrets management; per-environment `APP_URL`; edge rate limiting and `TRUSTED_PROXY_HOPS` matching the hosting platform |
| 7 | **Verification operations** | A real document review process and staff; optional KYC vendor; insurance checks |

## 6. Known limitations and next steps
- Rescheduling (customers cancel and rebook today), in-app chat (masked relay), gift cards, corporate accounts.
- Server-side "instant booking unlock" rule (the UI enforces it).
- Address autocomplete and routing-based travel times; today travel is PLZ-centroid distance plus a fixed buffer.
- English UI for hotel guests (strings are German-only; the voice is kept per audience).
- Admin state override for stuck bookings.
- CSP uses `'unsafe-inline'` for scripts because SEO pages are statically rendered; move to nonces or hashes when feasible.

## 7. Assumptions
Commission levels, cancellation tiers, travel-fee defaults, price ranges and launch cities are product
assumptions from `docs/product-spec.md`. All of them are configurable in `/admin/provisionen` or as data. SOMA is a
working title; renaming is isolated (see `docs/design-guideline.md` §2).
