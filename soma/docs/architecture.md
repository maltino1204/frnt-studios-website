# SOMA — Architecture

> Status: **contract document**. Every agent that touches code works against this file.
> Changes to shared interfaces go through the Lead Architect.

SOMA is a mobile-first marketplace where independent beauty & wellness professionals
("Profis") travel to customers ("Kund:innen") at home, in hotels or offices. One Next.js
application serves three experiences:

| Surface | Path | Audience |
|---|---|---|
| Customer app (marketing, discovery, booking, account) | `/`, `/behandlungen`, `/suche`, `/profis/*`, `/buchen`, `/buchung/*`, `/konto/*` | anonymous visitors, customers |
| Professional app (business tool) | `/pro/*` (+ acquisition page `/fuer-profis`) | providers |
| Admin platform | `/admin/*` | SOMA operations staff |

---

## 1. Stack and key decisions

| Concern | Decision | Why |
|---|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript `strict` | Server Components keep data access on the server; one codebase for all three surfaces; PWA now, React Native/Expo later can reuse `src/server` via route handlers |
| Rendering | `cacheComponents` **off** (dynamic-by-default model). Marketing/SEO pages opt into `export const revalidate = 3600` | Almost every view depends on session, availability or bookings |
| Styling | Tailwind CSS v4 with design tokens in `src/styles/tokens.css` | Tokens owned by Creative Director, see `docs/design-guideline.md` |
| Database | PostgreSQL 16. **Supabase Postgres in production**; any local Postgres ≥ 15 in development | Row-level security, exclusion constraints, `btree_gist` |
| DB access | `postgres` (postgres.js) from server code only. RLS enforced by switching role and JWT claims per transaction (exactly how Supabase evaluates RLS) | The same policies run locally and on Supabase; no client-side DB access |
| Auth | `AuthAdapter` interface. `local` adapter (dev, fully working): scrypt hashes in `auth.users`, opaque DB-backed session tokens. `supabase` adapter (production): Supabase Auth via `@supabase/ssr` | Works offline today; Supabase Auth in production without changing callers |
| Payments | `PaymentProvider` interface. `dev` simulator (clearly labelled "Testmodus") and `stripe` (Stripe Connect Express, destination charges, manual capture) | Never store card data; switch via env |
| Storage | `StorageAdapter`: `local` (files under `.data/uploads`, served via `/api/media/...` with access checks) and `supabase` (Supabase Storage buckets) | Portfolio images (public) and verification documents (private) |
| Email | `EmailAdapter`: `dev` (writes to `email_outbox` + console) and `resend` (production, not configured) | Notifications without credentials |
| Geo | Postal-code centroids (`postal_codes` table, 8,298 PLZ) + haversine distance | No external geocoder needed for radius matching; street address stored as text |
| Validation | `zod` schemas on every server entry point (actions, route handlers, service functions) | "Validate all important inputs on the server" |
| Tests | Vitest (unit + DB integration against `soma_test`), Playwright (E2E journeys) | Booking + authorization logic is covered by automated tests |

Environment selection (see `.env.example`):

```
DATABASE_URL=postgres://soma:soma@localhost:5432/soma
AUTH_PROVIDER=local            # local | supabase
PAYMENTS_PROVIDER=dev          # dev | stripe
STORAGE_PROVIDER=local         # local | supabase
EMAIL_PROVIDER=dev             # dev | resend
DEMO_MODE=true                 # shows the "Demo-Umgebung" ribbon, enables demo logins
```

---

## 2. Repository layout and ownership

```
soma/
  docs/                         architecture, design guideline, product spec, QA reports
  supabase/
    local/000_supabase_shim.sql roles anon/authenticated/service_role, auth schema, auth.uid() — LOCAL ONLY
    migrations/NNNN_*.sql       the real schema; Supabase-compatible; applied in order
    seed-data/                  postal_codes_de.csv (+ provenance README)
  scripts/db/                   setup.ts (apply shim+migrations), seed.ts (base + demo seed)
  src/
    app/
      (site)/                   customer-facing pages (marketing, discovery, profiles, legal)
      (auth)/                   anmelden, registrieren, passwort-vergessen
      buchen/ buchung/          checkout + confirmation/detail
      konto/                    customer account
      pro/                      provider app (+ pro/registrieren onboarding)
      admin/                    admin platform
      api/                      route handlers: media, webhooks (stripe), cron, health
    components/
      ui/                       design-system primitives (Button, Input, Sheet, …) — shared, change via Lead
      brand/                    Logo, Wordmark
      site/ pro/ admin/         surface-specific composites
    server/                     ALL server-only code ("server-only" import at top of each module)
      db/                       client.ts (sql, withUser, withAnon, withService), errors.ts
      auth/                     adapter.ts, local.ts, supabase.ts, session.ts, guards.ts
      domain/                   PURE logic, no I/O: availability.ts, pricing.ts, cancellation.ts,
                                booking-state.ts, geo.ts, ranking.ts, reference.ts
      services/                 use cases + queries, return DTOs (see §6)
      payments/ storage/ email/ adapters
      actions/                  "use server" Server Actions grouped by surface
    lib/                        isomorphic helpers: format.ts (de-DE, EUR, Europe/Berlin), cn.ts, routes.ts
    styles/tokens.css           design tokens (Creative Director)
  tests/
    unit/ integration/ e2e/
```

Ownership during parallel implementation (an agent edits only its own paths; anything else is a request to the Lead):

| Agent | Owns |
|---|---|
| Lead | `docs/architecture.md`, `src/app/layout.tsx`, `src/app/globals.css`, `src/components/ui/**`, `src/components/brand/**`, `src/lib/**`, config files |
| Agent 4 Backend | `supabase/**`, `scripts/db/**`, `src/server/**`, `src/app/api/**`, `tests/unit/**`, `tests/integration/**` |
| Agent 3 Frontend | `src/app/(site)/**` (except SEO city pages), `src/app/(auth)/**`, `src/app/buchen/**`, `src/app/buchung/**`, `src/app/konto/**`, `src/components/site/**` |
| Agent 5 Marketplace & Growth | `src/app/pro/**`, `src/app/fuer-profis/**`, `src/app/admin/**`, SEO city routes, `src/components/pro/**`, `src/components/admin/**` |
| Agent 6 QA | `docs/qa/**`, `tests/e2e/**` (read-only everywhere else) |

---

## 3. Data access and security model

### 3.1 Connections and roles

The server connects with one pooled connection (`DATABASE_URL`, the database owner; on Supabase use
the pooler connection string in **transaction mode** for serverless). Every request-scoped query
runs inside a transaction that **drops privileges**:

```ts
// src/server/db/client.ts
withUser(userId, async (tx) => { ... })  // SET LOCAL ROLE authenticated; request.jwt.claims = {"sub": userId, "role": "authenticated"}
withAnon(async (tx) => { ... })          // SET LOCAL ROLE anon
withService(async (tx) => { ... })       // owner privileges, bypasses RLS — ONLY for system use cases (below)
```

`auth.uid()` reads `request.jwt.claims ->> 'sub'`, identical to Supabase, so **the same RLS
policies protect local development and production**.

`withService` is allowed only in: the booking engine write path (after explicit authorization
checks in TypeScript), payment webhooks, maintenance jobs (expiry/auto-complete), seeding, admin
use cases (after `requireAdmin()`), and aggregate reads that never return other users' personal data
(e.g. busy time ranges for availability). Every `withService` call site carries a one-line comment
explaining why.

### 3.2 RLS principles

- RLS is **enabled on every table** in `public`. Default deny.
- Public catalogue data (`categories`, `services`, `cities`, `postal_codes`, approved `providers`,
  their active `provider_services`, `provider_portfolio`, published `reviews`, `content_blocks`) is
  readable by `anon` and `authenticated`.
- Customers read/write only their own `profiles`, `addresses`, `favorites`, `notification_preferences`,
  and read their own `bookings`, `payments`, `notifications`, `credit_ledger`, `referrals`.
- Providers read/write their own provider profile (column-level `GRANT UPDATE (...)` excludes
  `status`, rating aggregates, commission override, Stripe fields), `provider_services`,
  `provider_weekly_hours`, `provider_time_off`, `provider_portfolio`, `provider_documents`, and read
  bookings assigned to them, but only the customer fields needed to serve the appointment
  (first name, address *after* confirmation, notes).
- Admins: `public.is_admin()` (SECURITY DEFINER, reads `profiles.role`) grants read on everything;
  admin writes go through admin services (`withService` after `requireAdmin()`) and are written to
  `audit_log`.
- **No direct INSERT/UPDATE grants** for `authenticated` on `bookings`, `payments`, `refunds`,
  `payouts`, `reviews` aggregates, `credit_ledger`. Those change only through server use cases, so a
  leaked Supabase anon key + user JWT against PostgREST cannot forge prices or states.
- Production note: SOMA does not use the Supabase Data API from the browser. Either disable the
  Data API for `public` or rely on the strict grants above (both documented in `docs/STATUS.md`).

### 3.3 Application-level guards

`src/server/auth/guards.ts`:

```ts
getSession(): Promise<Session | null>                 // React cache() per request
requireUser(next?: string): Promise<Session>          // redirect('/anmelden?next=…')
requireRole(role: 'customer'|'provider'|'admin'): Promise<Session>
```

`Session = { userId: string; role: AppRole; email: string; firstName: string | null; providerStatus?: ProviderStatus; isDemoAccount: boolean }`

`src/proxy.ts` (Next 16's renamed middleware) only performs an optimistic cookie check for
`/konto`, `/pro`, `/admin` and redirects to `/anmelden`. Real authorization happens in layouts,
actions and services.

Other rules: Server Actions rely on Next's built-in origin check; route handlers that mutate check
`Origin`. Login is rate-limited (per email + trusted IP + global failure budget, DB-backed counters); password-reset and account-claim e-mails are throttled (3/h per address, 20/h per trusted IP). Passwords need at least 10 characters.
Session cookie `soma_session`: httpOnly, `secure` in production, `sameSite=lax`, 30 days, rotated on
login, revoked on logout. Customer contact data (phone, email) is never sent to provider views before
a booking is `confirmed`, and email addresses are never exposed (anti-disintermediation + DSGVO data minimisation).

**Phone exchange, deliberate v1 decision (audit-2 N12):** the provider sees the customer's mobile
number only while the booking is `confirmed` / `in_progress` (view `provider_bookings`), for arrival
coordination. Customers never see the provider's number (in-app status and support only). E-mail
addresses are never shown to the other party. Free-text channels are contact-linted
(`domain/content-lint.ts`). Planned for v1.1: a phone relay with masked numbers.

**Account existence at checkout, accepted trade-off (audit-3 F16):** `checkoutSignUpAction` answers
`{ kind: "exists" }` when the e-mail is already registered, so the checkout can offer the login inline
instead of losing the booking. This reveals that an address has an account (the same is true of every
sign-up form). We accept it because the answer carries no session and sends no e-mail; login, password
reset and claim e-mails stay neutral. Like the sign-up form, this check has no separate throttle in v1
(option for v1.1: a per-IP sign-up limit or CAPTCHA). Account deletion
re-checks the password at most 5 times per account in 15 minutes (`app_private.reauth_attempts`), so the
re-check cannot be used to guess a password from a hijacked session.

**Protected demo accounts (audit-3 F7):** with `DEMO_MODE=true`, the shared demo logins
(`testkunde@`, `testkunde-b2b@`, `testadmin@soma.test`, `anna@kunden.soma.test`, `hanna@profis.soma.test`)
cannot change or reset their password, delete themselves, or be blocked, anonymised, suspended or have
documents rejected by an admin; the services answer "Im Demo-Zugang ist diese Aktion deaktiviert, damit
alle mit denselben Zugangsdaten testen können." (`auth/demo-accounts.ts`). `Session.isDemoAccount` lets the
UI show that notice up front. The app has no e-mail or role change.

**Client IP for rate limits (audit-2 N2):** only from an explicitly trusted source —
`TRUSTED_IP_HEADER` (a header the platform overwrites, e.g. `x-vercel-forwarded-for`,
`cf-connecting-ip`) or `TRUSTED_PROXY_HOPS` (N-th `X-Forwarded-For` entry from the right). With
neither, no client header is used and only the per-e-mail limits plus a global failure budget
(> 200 failures / 15 min → 1–3 s delay on every login) apply; `npm run check:launch` blocks that
configuration.

---

## 4. Domain model

### 4.1 Roles

`app_role = 'customer' | 'provider' | 'admin'`: one role per account (v1). Providers who also want to
book treatments use a separate customer account.

### 4.2 Tables (public schema)

Money is always **integer cents** (`*_cents`), currency EUR. Times are `timestamptz`; wall-clock
rules (weekly hours) are interpreted in **Europe/Berlin**.

| Table | Purpose / key columns |
|---|---|
| `profiles` | 1:1 `auth.users`. `role`, `first_name`, `last_name`, `phone`, `avatar_path`, `referral_code` (unique), `referred_by`, `marketing_opt_in`, timestamps |
| `addresses` | customer addresses: `label`, `kind` (`home`/`hotel`/`office`/`other`), `street`, `house_number`, `postal_code`, `city`, `details` (Etage, Klingel, Zimmernummer), `lat`, `lng` (from PLZ centroid), `is_default` |
| `postal_codes` | `postal_code` PK, `lat`, `lng`, `city_slug` (nullable, launch-city mapping) |
| `cities` | `slug` PK, `name`, `state`, `lat`, `lng`, `is_active`, `sort_order` |
| `categories` | `slug` unique, `name`, `tagline`, `description`, `image_path`, `sort_order`, `is_active`, `seo_title`, `seo_description` |
| `services` | `category_id`, `slug` (unique per category), `name`, `description`, `durations int[]`, `default_duration`, `price_hint_from_cents`, `attributes jsonb`, `sort_order`, `is_active` |
| `providers` | PK = profile id. `slug` unique, `display_name`, `headline`, `bio`, `years_experience`, `languages text[]`, `status` (`draft`,`submitted`,`in_review`,`approved`,`rejected`,`suspended`), `booking_mode` (`instant`,`request`), `lead_time_minutes` (default 180), `max_advance_days` (60), `travel_buffer_minutes` (30), `base_postal_code`, `base_lat`, `base_lng`, `service_radius_km`, `travel_fee_base_cents`, `travel_fee_included_km`, `travel_fee_per_km_cents`, `rating_avg`, `rating_count`, `completed_count`, `commission_rate_override`, `stripe_account_id`, `payouts_enabled`, `approved_at` |
| `provider_services` | `provider_id`, `service_id`, `duration_minutes`, `price_cents`, `is_active`; unique (`provider_id`,`service_id`,`duration_minutes`) |
| `provider_weekly_hours` | `provider_id`, `weekday` (ISO 1=Mo … 7=So), `start_time`, `end_time` (local time), multiple windows per day allowed |
| `provider_time_off` | `provider_id`, `period tstzrange`, `reason` |
| `provider_documents` | `kind` (`id_document`,`business_registration`,`qualification`,`insurance`,`other`), `storage_path` (private), `file_name`, `status` (`pending`,`approved`,`rejected`), `review_note`, `reviewed_by`, `reviewed_at` |
| `provider_portfolio` | `storage_path` (public), `caption`, `category_id`, `sort_order` |
| `provider_status_events` | verification audit trail: `from_status`, `to_status`, `actor_id`, `note` |
| `bookings` | see §5 |
| `booking_events` | state history: `from_status`, `to_status`, `actor_id`, `actor_role`, `note`, `created_at` |
| `payments` | `booking_id`, `provider` (`dev`/`stripe`), `status` (`requires_payment_method`,`authorized`,`captured`,`partially_refunded`,`refunded`,`cancelled`,`failed`), `amount_cents`, `captured_cents`, `refunded_cents`, `application_fee_cents`, `external_id`, `card_brand`, `card_last4` (display only; never PAN/CVC) |
| `refunds` | `payment_id`, `amount_cents`, `reason`, `status`, `external_id`, `created_by` |
| `payouts` | `provider_id`, `amount_cents`, `status` (`pending`,`in_transit`,`paid`,`failed`), `period_start`, `period_end`, `external_id`; `bookings.payout_id` links included bookings |
| `reviews` | `booking_id` unique, `customer_id`, `provider_id`, `rating` 1–5, `comment`, `provider_reply`, `provider_replied_at`, `is_published`; only for `completed` bookings of that customer; trigger maintains provider aggregates |
| `favorites` | (`customer_id`,`provider_id`) PK |
| `notifications` | in-app inbox: `user_id`, `type`, `title`, `body`, `href`, `read_at`, `data jsonb` |
| `notification_preferences` | `user_id` PK, booleans per channel × topic (`email_bookings`, `email_reminders`, `email_marketing`, `sms_reminders`, `push_bookings`) |
| `email_outbox` | `to_user_id`, `template`, `subject`, `payload`, `status` (`queued`,`sent`,`failed`), `sent_at` |
| `credit_ledger` | `user_id`, `amount_cents` (+/−), `reason` (`referral_reward`,`referral_welcome`,`booking_redemption`,`booking_refund`,`admin_adjustment`,`goodwill`), `booking_id`; balance = sum |
| `referrals` | `referrer_id`, `referred_id` unique, `status` (`pending`,`qualified`,`rewarded`), `rewarded_at` |
| `commission_rules` | `scope` (`global`,`category`,`provider`), `category_id`, `provider_id`, `rate` (e.g. 0.2000), `repeat_client_rate` (e.g. 0.1000), `is_active`. Resolution order: provider → category → global |
| `platform_settings` | `key` PK, `value jsonb`: `cancellation_policy`, `hold_minutes` (10), `request_response_hours` (4 business hours, 08:00–21:00 Europe/Berlin), `slot_step_minutes` (30), `referral_reward_cents` (1500), `referral_welcome_cents` (1500), `customer_service_fee_cents` (0) |
| `disputes` | `booking_id`, `opened_by`, `reason` (`quality`,`provider_no_show`,`customer_no_show`,`damage`,`payment`,`safety`,`other`), `description`, `status` (`open`,`investigating`,`resolved_refund`,`resolved_no_action`,`closed`), `refund_cents`, `resolution_note`, `resolved_by`, `resolved_at` |
| `search_events` | demand analytics without PII: `postal_code`, `city_slug`, `category_id`, `service_id`, `requested_date`, `results_count`, `created_at` |
| `content_blocks` | CMS: `key` PK (`home.hero`, `home.faq`, `city.berlin.intro`, `announcement`), `value jsonb`, `updated_by` |
| `audit_log` | admin/system actions: `actor_id`, `action`, `entity`, `entity_id`, `data jsonb` |

Local-only (in `supabase/local`, never on Supabase): `auth.users` shim (`id`, `email`, `encrypted_password`,
`email_confirmed_at`, `raw_user_meta_data`, timestamps), `auth.uid()`, `auth.role()`, `auth.jwt()`,
roles `anon`/`authenticated`/`service_role`, `app_private.local_sessions`, `app_private.login_attempts`.
A trigger on `auth.users` insert creates the `profiles` row (standard Supabase `handle_new_user` pattern;
role comes from `raw_user_meta_data.role`, restricted to `customer`/`provider`).

The taxonomy is fully data-driven: a new category is new rows in `categories` and `services`, with no
code or schema change. The UI must never hard-code the category list (except seed data and
static image mapping fallbacks keyed by slug).

---

## 5. Booking engine

### 5.1 Booking record (`bookings`)

```
id uuid, reference text unique            -- human code "SM-7KX4Q2"
customer_id, provider_id, provider_service_id, service_id, category_id
service_name, duration_minutes            -- snapshot
starts_at, ends_at timestamptz
blocked_range tstzrange                   -- [starts_at, ends_at + travel_buffer) — see 5.3
status booking_status, booking_mode       -- snapshot of provider mode at booking time
location_kind, address_line, postal_code, city, address_details, lat, lng   -- snapshot
customer_notes text                       -- e.g. Parken, Haustiere, Etage
distance_km numeric(6,2)
service_price_cents, travel_fee_cents, service_fee_cents, discount_cents, total_cents
commission_rate numeric(5,4), commission_cents, provider_payout_cents, is_repeat_client
cancellation_policy jsonb                 -- snapshot of tiers at booking time
hold_expires_at, respond_by               -- pending_payment hold / provider approval deadline
confirmed_at, started_at, completed_at, cancelled_at
cancelled_by ('customer'|'provider'|'admin'|'system'), cancellation_reason
cancellation_fee_cents, refund_cents
rebooked_from_id, payout_id, created_at, updated_at
```

### 5.2 States and transitions

```
                     ┌──────────── expired (hold timeout)
                     │
pending_payment ─────┼──► requested ──► confirmed ──► in_progress ──► completed
   (slot hold)       │       │  │           │  │
                     │       │  └► declined │  └► no_show
                     │       └► expired     └► cancelled
                     └──► confirmed (instant mode)
           any active ──► cancelled (customer | provider | admin | system)
```

| From → To | Actor | Guard / side effects |
|---|---|---|
| `pending_payment → requested` | system | payment authorized and provider in `request` mode; set `respond_by = computeRespondBy(now, starts_at, request_response_hours)`: the earlier of now + 4 h counted only within 08:00–21:00 Europe/Berlin (DST-safe) and `starts_at − 2 h`. Request slots that would leave < 30 business minutes are neither offered nor accepted |
| `pending_payment → confirmed` | system | payment authorized, `instant` mode |
| `pending_payment → expired` | system | `hold_expires_at < now()`; release payment |
| `pending_payment → cancelled` | customer | abandons checkout |
| `requested → confirmed` | provider | provider accepts; notify customer |
| `requested → declined` | provider | release authorization; notify; suggest alternatives |
| `requested → expired` | system | `respond_by < now()`; release; notify |
| `requested → cancelled` | customer | always free |
| `confirmed → in_progress` | provider | from `starts_at − 30 min` |
| `confirmed → completed`, `in_progress → completed` | provider; system auto-completes 24 h after `ends_at` | capture payment, credit provider earnings, trigger review request, referral qualification |
| `confirmed → no_show` | provider | from `starts_at + 15 min`; fee = 100 % (policy) |
| `confirmed → cancelled` | customer / provider / admin | customer: fee per policy tier; provider: full refund + reliability event; admin: any refund amount |

Transitions are enforced **twice**: in TypeScript (`src/server/domain/booking-state.ts`, pure function
`assertTransition(from, to, actor)` with unit tests) and in Postgres (trigger `enforce_booking_transition`
rejecting any other change of `status`). Every change writes `booking_events`.

Expiry and auto-completion run in `src/server/services/booking-maintenance.ts`. It is called lazily
at the start of booking-engine operations and dashboard loads, and by `POST /api/cron/booking-maintenance`
(header `Authorization: Bearer ${CRON_SECRET}`) for a production scheduler (Vercel Cron / Supabase pg_cron).

### 5.3 Availability

Pure function in `src/server/domain/availability.ts`:

```
slots = weekly_hours(date, Europe/Berlin)
        − time_off
        − busy ranges (blocked_range of bookings in pending_payment|requested|confirmed|in_progress)
        filtered by: lead_time (now + lead_time_minutes), max_advance_days,
        step = slot_step_minutes (30)
A slot start S is valid iff [S, S + duration) lies inside one working window
                         and [S, S + duration + travel_buffer) overlaps no busy range or time off.
```

With `blocked_range = [start, end + buffer)` for every booking, any two bookings of a provider are at
least `travel_buffer_minutes` apart, in both directions.

Hard guarantees in Postgres:

1. `EXCLUDE USING gist (provider_id WITH =, blocked_range WITH &&) WHERE (status IN ('pending_payment','requested','confirmed','in_progress'))`
   makes double booking impossible, even under concurrent requests (the losing insert gets a
   `23P01` error and returns "Dieser Termin wurde gerade vergeben").
2. Trigger `validate_booking_slot` on insert: provider `approved`, offering active and owned by the
   provider, `[starts_at, ends_at)` inside a weekly-hours window (Europe/Berlin), no overlap with
   `provider_time_off`, `starts_at >= now() + lead_time`, `ends_at > starts_at`.
3. The service area check (distance ≤ radius) and the price computation happen in the TS use case,
   inside the same transaction as the insert.

The UI never shows a slot that was not produced by this function from real data. Search results show
a provider only if they have at least one valid slot for the requested day, or, when the customer did
not pick a day, within the next 7 days.

### 5.4 Pricing (`src/server/domain/pricing.ts`, pure)

```
service_price   = provider_services.price_cents
travel_fee      = distance_km <= included_km ? base : base + ceil(distance_km - included_km) * per_km   (rounded to 50 ct)
service_fee     = platform_settings.customer_service_fee_cents (0 at launch, shown if > 0)
discount        = min(credits applied, service_price)        (credits are SOMA Guthaben)
total           = service_price + travel_fee + service_fee - discount
commission_rate = resolve(provider → category → global); repeat_client_rate if the customer has a prior
                  completed booking with this provider through SOMA (anti-disintermediation incentive)
commission      = round(service_price * commission_rate)     (travel fee goes 100 % to the provider)
provider_payout = service_price - commission + travel_fee
```

Prices shown to customers are **final prices (Endpreise)** including VAT where applicable (PAngV). The
checkout shows the full breakdown and the cancellation tiers **before** confirmation.

### 5.5 Cancellation policy (default, snapshotted per booking)

```json
{ "tiers": [
  { "min_hours_before": 24, "fee_percent": 0,   "travel_fee_retained": false },
  { "min_hours_before": 2,  "fee_percent": 50,  "travel_fee_retained": false },
  { "min_hours_before": 0,  "fee_percent": 100, "travel_fee_retained": true }
], "no_show_fee_percent": 100, "provider_cancellation": "full_refund",
   "grace_minutes": 15, "fee_basis": "service_price" }
```

Rules (`src/server/domain/cancellation.ts`, pure; unit-tested on every boundary):

| Situation | Kept from the customer | Refunded |
|---|---|---|
| Within `grace_minutes` (15) after the booking was made ("Bedenkzeit", inclusive, never past the start) | 0 | everything |
| ≥ 24 h before the start (inclusive) | 0 | everything |
| ≥ 2 h and < 24 h before | 50 % of the service price | rest of the service price + the full travel fee |
| < 2 h before, or after the start | 100 % of the service price + the travel fee | service fee only |
| No-show (provider marks it ≥ 15 min after the start) | `no_show_fee_percent` (100 %) of the service price + the travel fee | service fee only |
| `pending_payment` / `requested`, provider or system cancels | 0 | everything |

- **Fee basis = service price only** (`service_price_cents`). The customer service fee is never kept.
  With redeemed credits the cash fee is the percentage of `service_price_cents − discount_cents`;
  the same share of the credits is kept, the rest is booked back (`booking_refund`).
- **Split:** commission is charged only on the kept service share
  (`commission = round(retainedService × commission_rate)`); a kept travel fee goes 100 % to the
  provider (`pricing.splitRetainedAmounts`). The captured amount's application fee = that commission.
- Admin cancellations take an explicit fee (`feeOverrideCents`), interpreted as service share first,
  then travel fee.
- Snapshots written before migration 0006 lack `grace_minutes` / `travel_fee_retained`; they are read
  as "no Bedenkzeit, travel fee kept only in 100 % tiers".
- `computeCancellation(booking, now, actor)` returns `{ feeCents, refundCents, feePercent,
  travelFeeRetained, retainedServiceCents, retainedTravelCents, inGracePeriod, tierLabel }`.
  `policySchedule(policy, startsAt, createdAt?)` and `freeCancellationUntil(...)` include the
  Bedenkzeit when it ends after the 24-h deadline (quotes pass "now" as `createdAt`).

### 5.6 Payment lifecycle (`PaymentProvider`)

```ts
interface PaymentProvider {
  readonly id: 'dev' | 'stripe'
  createAuthorization(input): Promise<{ externalId; status; clientSecret? }>  // at checkout
  capture(externalId, amountCents): Promise<void>                             // completion / late-cancel fee
  release(externalId): Promise<void>                                          // decline, expiry, free cancel
  refund(externalId, amountCents): Promise<{ externalId }>                    // admin / disputes
  createConnectedAccountLink(providerId): Promise<{ url }>                    // provider payout onboarding
}
```

- **dev**: authorizes immediately; the checkout shows a clearly labelled *"Testmodus – es wird keine
  echte Zahlung ausgeführt"* step. No card fields are rendered.
- **stripe** (production, requires keys): Stripe Connect Express. PaymentIntent with
  `capture_method=manual`, `transfer_data.destination = provider.stripe_account_id`, and
  `application_fee_amount = commission_cents` (+ service fee). Card entry via Stripe Elements / Payment Element.
  Webhook `/api/webhooks/stripe` (signature verified) moves `pending_payment` forward. Bookings more than
  6 days ahead: SetupIntent at checkout, off-session PaymentIntent 48 h before the appointment
  (authorization windows are 7 days).
- Capture happens on completion. Late-cancellation and no-show fees are partial captures. Free
  cancellation, decline and expiry release the authorization.

### 5.7 Notifications

`notify(event, context)` in `src/server/services/notifications.ts` writes `notifications` (in-app) and
`email_outbox` (respecting `notification_preferences`) for each booking event:
`booking.requested`, `booking.confirmed`, `booking.declined`, `booking.expired`, `booking.cancelled`,
`booking.reminder_24h`, `booking.completed` (+ review request), `review.received`, `provider.approved`,
`provider.rejected`, `payout.paid`, `dispute.opened`, `dispute.resolved`.

---

## 6. Service layer contract (what the UI calls)

UI code never writes SQL. Server Components call **query functions**. Client interactions call
**Server Actions** in `src/server/actions/*`. All return serialisable DTOs.

```ts
// src/server/actions/types.ts
export type ActionResult<T = void> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }   // German, user-facing
```

Actions are compatible with `useActionState` (signature `(prev, formData) => Promise<ActionResult<T>>`)
or are called directly with typed objects. They validate with zod, check the session and role, call a
service, then `revalidatePath` / `redirect` where appropriate.

Module map (Agent 4 implements, then documents exact signatures in `docs/api.md`):

| Module | Main functions |
|---|---|
| `services/catalog.ts` | `listCategories()`, `getCategory(slug)`, `listServices(categorySlug)`, `getService(id)`, `listCities()`, `getCity(slug)`, `lookupPostalCode(plz)` |
| `services/search.ts` | `searchProviders({ postalCode, categorySlug?, serviceId?, durationMinutes?, date?, timeOfDay?, sort?, page? })` → `{ location, results: ProviderSearchResult[] (with nextSlots, price, travelFee, distanceKm), total, demandLogged }` |
| `services/providers.ts` | `getProviderProfile(slug, viewerId?)`, `listFeaturedProviders(citySlug?)`, `getProviderAvailability(providerId, providerServiceId, from, days)` → `SlotsByDay[]` |
| `services/bookings.ts` | `quoteBooking(input)` → price breakdown + policy; `createBooking(session, input)` → `{ bookingId, status, paymentClientSecret? }`; `confirmDevPayment(session, bookingId)`; `cancelBooking(session, bookingId, reason)`; `providerRespond(session, bookingId, 'accept'|'decline', note?)`; `startBooking`, `completeBooking`, `markNoShow`; `getBookingForCustomer`, `getBookingForProvider`, `listCustomerBookings(session, 'upcoming'|'past')`, `listProviderBookings(session, filter)`; `rebookOptions(session, bookingId)` |
| `services/account.ts` | profile get/update, addresses CRUD, favourites toggle/list, notification preferences, credit balance + ledger, referral code + stats |
| `services/reviews.ts` | `createReview(session, bookingId, rating, comment)`, `replyToReview(session, reviewId, reply)`, `listProviderReviews(providerId, page)` |
| `services/pro.ts` | onboarding steps (profile, services, area, hours, documents, submit), `getProDashboard(session)`, services/pricing CRUD, weekly hours + time off CRUD, portfolio upload/delete, earnings + payouts summary, settings (booking mode, lead time, buffer, notifications), payout onboarding link |
| `services/admin.ts` | users list/search, provider verification queue + decide, category/service CRUD, bookings list/detail + admin cancel/refund, disputes manage, commission rules CRUD, payments/payouts lists + create payout batch, content blocks CRUD, audit log |
| `services/analytics.ts` | marketplace KPIs (GMV, net revenue, bookings by status, conversion search→booking, repeat rate, avg rating, provider utilisation), supply vs demand per city/PLZ-region, time series |
| `services/notifications.ts` | `notify(...)`, `listNotifications(session)`, `markRead` |
| `services/booking-maintenance.ts` | `runBookingMaintenance(now?)` |
| `services/media.ts` | upload (validate MIME + size: images ≤ 8 MB jpeg/png/webp; documents ≤ 10 MB pdf/jpeg/png), signed/private access checks |

---

## 7. Routing map

Customer (German slugs): `/`, `/behandlungen`, `/behandlungen/[kategorie]`, `/behandlungen/[kategorie]/[stadt]`
(SEO: e.g. "Massage zu Hause in Berlin"), `/staedte/[stadt]`, `/suche`, `/profis/[slug]`, `/buchen`
(query: `angebot`, `start`, `adresse`), `/buchung/[id]`, `/konto` (+ `termine`, `favoriten`, `adressen`,
`profil`, `guthaben`, `benachrichtigungen`), `/anmelden`, `/registrieren`, `/fuer-profis`, `/hilfe`,
`/impressum`, `/datenschutz`, `/agb`.

Provider: `/pro` (dashboard), `/pro/registrieren` (onboarding wizard), `/pro/termine`, `/pro/termine/[id]`,
`/pro/kalender`, `/pro/leistungen`, `/pro/einsatzgebiet`, `/pro/profil`, `/pro/verifizierung`,
`/pro/einnahmen`, `/pro/bewertungen`, `/pro/einstellungen`.

Admin: `/admin`, `/admin/nutzer`, `/admin/profis`, `/admin/profis/[id]`, `/admin/kategorien`,
`/admin/buchungen`, `/admin/buchungen/[id]`, `/admin/streitfaelle`, `/admin/zahlungen`, `/admin/provisionen`,
`/admin/regionen`, `/admin/inhalte`, `/admin/protokoll`.

API: `/api/media/[...path]`, `/api/webhooks/stripe`, `/api/cron/booking-maintenance`, `/api/health`.

SEO: `app/sitemap.ts` (categories × active cities, provider profiles), `app/robots.ts`, JSON-LD
(`Service`, `LocalBusiness`/`Person`, `AggregateRating` only from real reviews, `BreadcrumbList`, `FAQPage`).

PWA: `app/manifest.ts`, icons from `public/brand`, `public/sw.js` (offline fallback page + static asset
cache; never caches authenticated HTML or API responses).

---

## 8. Seeds and demo mode

- `npm run db:setup`: applies `supabase/local` (local only) and all migrations, then the **base seed**
  (cities, categories, services, platform settings, commission rules, postal codes, content blocks).
- `npm run db:seed`: **demo seed**, for development only (`DEMO_MODE=true`). It creates fictional providers in
  the six launch cities, demo customers, historical completed bookings with reviews, upcoming
  bookings and requests. Demo logins:
  `testkunde@soma.test` (customer), `testkunde-b2b@soma.test` (provider), `testadmin@soma.test` (admin), all with
  password `soma-demo-2026`.
- `npm run demo:refresh`: **run right before a demo** — the demo seed plus one maintenance run. All demo
  times are relative to the seed (an appointment testkunde ↔ testkunde-b2b starts ≈ 35 minutes later, open
  requests stay open ≥ 3 h, event stamps lie within 08:00–21:00 Europe/Berlin).
- With `DEMO_MODE=true` the UI shows a discreet "Demo-Umgebung · Beispieldaten" ribbon. Demo content
  must never be loaded into production.

---

## 9. Integration boundaries (production blockers are tracked in docs/STATUS.md)

| Integration | Dev implementation | Production requirement |
|---|---|---|
| Supabase | local Postgres + shim | project URL, anon key, service role key, pooled `DATABASE_URL`; run migrations; disable Data API on `public` or keep grants |
| Stripe Connect | `dev` simulator | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, Connect platform profile, Payment Element UI |
| Email | outbox table + console | Resend/Postmark key, verified domain, German templates |
| SMS / push | preferences stored, not sent | provider (e.g. MessageBird), Web Push VAPID keys |
| Geocoding | PLZ centroids | optional address autocomplete (licensed), routing-based travel times |
| Storage | `.data/uploads` | Supabase buckets `portfolio` (public) and `documents` (private) |
| Identity verification | manual document review in admin | optional KYC vendor; Stripe Connect handles payout KYC |
