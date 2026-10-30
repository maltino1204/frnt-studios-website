# SOMA: Server API (services, Server Actions, route handlers)

> Owner: Agent 4 (Backend). This is the contract that UI code builds against.
> Source of truth for types: `src/server/dto.ts` (types only, safe for `import type` in Client Components)
> and `src/server/actions/types.ts` (`ActionResult`). Architecture: `docs/architecture.md`.

## 1. Conventions

| Topic | Rule |
|---|---|
| Where to call what | **Server Components** call *service functions* (`@/server/services/*`) directly. **Client Components** call *Server Actions* (`@/server/actions/*`). UI code never writes SQL. |
| Session | `getSession()` / `requireRole()` from `@/server/auth/guards`. Services that need a user take `session: Session` as their **first** argument and enforce the role themselves. |
| Roles | `customer`, `provider`, `admin` (one role per account). "public" below means no session needed (anon RLS). |
| Errors | Services throw `ServiceError { code, message, fieldErrors? }` (`@/server/errors`). `message` is **German, user-facing**; customer messages use *Sie*, provider messages *du*, admin messages are neutral. Actions never throw: they return `{ ok: false, error, fieldErrors }`. |
| `ServiceError.code` | `unauthenticated` · `forbidden` · `not_found` · `validation` · `conflict` · `slot_taken` · `invalid_state` · `rate_limited` · `payment` · `unavailable` · `internal` |
| Money | integer **cents** (EUR), e.g. `8900` = 89,00 €. Prices shown to customers are Endpreise; `totalPriceCents` in search already includes the travel fee. |
| Time | instants are ISO-8601 **UTC** strings (`"2026-11-02T08:00:00.000Z"`); local dates are `"YYYY-MM-DD"` in **Europe/Berlin**. Format with `Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin' })`. |
| Images | DTO `*Url` fields are ready to use: either a static path (`/images/pros/pro-01.jpg`) or `/api/media/<key>`. `null` → show initials / category fallback. |
| Pagination | `Paginated<T> = { items, total, page, pageSize }`, `page` starts at 1. |
| Validation | Every service validates its input with zod (German messages; `fieldErrors` keys = input field names, nested with dots, e.g. `address.postalCode`). Actions validate again. |

```ts
// src/server/actions/types.ts
export type ActionResult<T = void> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
export const initialActionState = null;
```

## 2. How to use

### 2.1 Server Component (read)

```tsx
// src/app/(site)/profis/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getSession } from "@/server/auth/guards";
import { getProviderProfile, getProviderAvailability, todayBerlin } from "@/server/services/providers";

export default async function ProfilPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ einladung?: string }>;
}) {
  const [{ slug }, { einladung }, session] = await Promise.all([params, searchParams, getSession()]);
  const profile = await getProviderProfile(slug, session?.userId, { inviteCode: einladung });
  if (!profile) notFound();
  const first = profile.offerings[0];
  const days = first ? await getProviderAvailability(profile.providerId, first.providerServiceId, todayBerlin(), 7) : [];
  return <ProfileView profile={profile} days={days} inviteCode={profile.inviteValid ? einladung : undefined} />;
}
```

Protected layouts:

```tsx
// src/app/konto/layout.tsx
import { requireRole } from "@/server/auth/guards";
export default async function KontoLayout({ children }: { children: React.ReactNode }) {
  await requireRole("customer", "/konto"); // signed out → /anmelden?next=/konto, other role → its home
  return <>{children}</>;
}
```

### 2.2 Form with `useActionState`

```tsx
"use client";
import { useActionState } from "react";
import { signInAction } from "@/server/actions/auth";
import { initialActionState } from "@/server/actions/types";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInAction, initialActionState);
  return (
    <form action={action} noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <input name="email" type="email" autoComplete="email" aria-invalid={!!(state && !state.ok && state.fieldErrors?.email)} />
      {state && !state.ok && state.fieldErrors?.email && <p role="alert">{state.fieldErrors.email}</p>}
      <input name="password" type="password" autoComplete="current-password" />
      {state && !state.ok && <p role="alert">{state.error}</p>}
      <button disabled={pending}>Anmelden</button>
    </form>
  );
}
```

On success `signInAction` redirects (never returns `ok: true`). Checkboxes are sent as `"on"` and read as `true`; repeated field names (e.g. `tags`) become arrays.

### 2.3 Calling a typed action from an event handler

```tsx
"use client";
import { useTransition } from "react";
import { createBookingAction, confirmDevPaymentAction } from "@/server/actions/booking";

const [pending, start] = useTransition();
start(async () => {
  const res = await createBookingAction({ providerServiceId, startsAt, address: { addressId }, useCredits: true, inviteCode });
  if (!res.ok) return setError(res.error);                // e.g. "Dieser Termin wurde gerade vergeben. …"
  if (res.data.paymentProvider === "dev") {
    const paid = await confirmDevPaymentAction(res.data.bookingId); // "Testmodus" step
    if (paid.ok) router.push(`/buchung/${res.data.bookingId}`);
  } else {
    // Stripe: mount the Payment Element with res.data.paymentClientSecret; the webhook moves the booking on.
  }
});
```

### 2.4 Slot picker (client)

`loadAvailabilityAction({ providerId, providerServiceId, from: "2026-11-02", days: 7 })` → `ActionResult<SlotsByDayDTO[]>`. Show only these slots; never compute slots in the UI.

## 3. Auth & session

| Function | Signature | Notes |
|---|---|---|
| `getSession` | `() => Promise<Session \| null>` | React `cache()` per request. `Session = { userId, role, email, firstName, providerStatus?, isDemoAccount }`. Blocked accounts get `null`. |
| `requireUser` | `(next?: string) => Promise<Session>` | Pages/layouts: redirects to `/anmelden?next=…`. |
| `requireRole` | `(role: AppRole, next?: string) => Promise<Session>` | Pages/layouts: wrong role → `homeForRole(role)` (`/konto`, `/pro`, `/admin`). |
| `authorize` | `(role?: AppRole \| AppRole[]) => Promise<Session>` | Actions/route handlers: throws `ServiceError` instead of redirecting. |
| `homeForRole` | `(role: AppRole) => string` | |

Module paths: `@/server/auth/guards` (re-exports `getSession`), `@/server/auth/session` (`getAuthAdapter`, `getRequestMeta`).
`AuthAdapter` (`@/server/auth/adapter`): `signUp`, `signIn`, `signOut`, `getUserId`, `requestPasswordReset`, `resetPassword`, `changePassword`, **`verifyPassword(userId, password): Promise<boolean>`** (re-confirmation for account deletion; records no login).
**local**: scrypt (`N=32768,r=8,p=1`) in `auth.users.encrypted_password`; opaque 256-bit tokens, only `sha256(token)` stored in `app_private.local_sessions`; cookie `soma_session` (httpOnly, `secure` in production, `sameSite=lax`, 30 days, rotated on login, deleted on logout); login rate limit (`app_private.login_attempts`, 15-minute window): **per e-mail exponential back-off** from the 2nd failure (`loginBackoffSeconds`: 2, 4, 8 … 60 s; "Bitte warten Sie 4 Sekunden, bevor Sie es erneut versuchen."), hard lock after 5 failures per e-mail or 20 per IP; password ≥ 10 characters.

**Client IP (audit-1 R6, audit-2 N2)** — `clientIpFrom(get, { header, hops })` in `@/server/auth/client-ip` (used by `getRequestMeta()` and `currentRequestIp()`): trusted only when configured. `TRUSTED_IP_HEADER` (e.g. `x-vercel-forwarded-for`, `cf-connecting-ip`, `x-real-ip` behind nginx) → first entry of that header (ports/brackets stripped); otherwise `TRUSTED_PROXY_HOPS=N` → N-th `X-Forwarded-For` entry from the right; with neither, **no client-supplied header is used** and the IP is `"unknown"`, which is never an IP bucket. `ipTrustConfigured()`; `npm run check:launch` blocks when neither is set.

**Global failure budget (N2)** — more than `GLOBAL_FAILURE_BUDGET` (200) failed logins across all accounts in 15 min delay **every** login attempt by `globalLoginDelayMs(n)` = 1 s (201–300), 2 s (301–400), 3 s (> 400); messages stay neutral ("E-Mail-Adresse oder Passwort ist falsch."). `assertLoginAllowed` returns `{ delayMs }`; per-e-mail back-off/lock and the per-IP lock are unchanged.

**Auth e-mail throttle (N8)** — `allowAuthEmail(tx, { email, ip, kind })` (`@/server/auth/email-throttle`, table `app_private.auth_email_requests`, migration 0007): password-reset and checkout claim e-mails share a budget of **3 sent per address and 20 per trusted IP per hour**; every request is recorded (`sent=false` when suppressed). `AuthAdapter.requestPasswordReset(email, { ip?, kind?: "password_reset" | "account_claim" })` applies it in both adapters (`ip` defaults to the current request's trusted IP); suppressed requests still resolve, so `requestPasswordResetAction` keeps its neutral message. `checkoutSignUpAction` still answers `{ kind: "exists" }` for registered addresses (documented trade-off: the frontend shows the login inline; no e-mail, no session).

**Protected demo accounts (audit-3 F7)** — `Session.isDemoAccount: boolean` (`src/server/dto.ts`, set in `loadSession`, `src/server/auth/session-store.ts`) is `true` only with `DEMO_MODE=true` for `testkunde@soma.test`, `testkunde-b2b@soma.test`, `testadmin@soma.test`, `anna@kunden.soma.test`, `hanna@profis.soma.test` (`DEMO_ACCOUNT_EMAILS`, `@/server/auth/demo-accounts`). For these accounts the services refuse with `forbidden` and `DEMO_ACTION_DISABLED` = "Im Demo-Zugang ist diese Aktion deaktiviert, damit alle mit denselben Zugangsdaten testen können.": password change (`changeLocalPassword`, Supabase `changePassword`), password reset (`resetLocalPassword`; `requestLocalPasswordReset` silently sends nothing), self-deletion (`requestAccountDeletionAction` / `anonymizeOwnAccount`), admin block (`setUserBlocked(…, true)`), `anonymizeUser`, `decideProvider` suspend/reject and `reviewDocument(…, "rejected")`. There is no e-mail or role change in the app. Use `isDemoAccount` to show the notice instead of the form.

**Password re-check limit (audit-3 F16)** — `verifyPasswordWithLimit(userId, password, verify)` (`@/server/auth/reauth`, table `app_private.reauth_attempts`, migration 0008): at most **5 failed re-checks per account in 15 minutes**, then `rate_limited` "Zu viele Versuche. Bitte warten Sie 15 Minuten und versuchen Sie es erneut." (also for the right password). Used by `requestAccountDeletionAction`.

**Redirect targets (audit-1 R2)** — `safeNext()` (actions) and `loginUrl()` (guards) use `safeRelativePath(next, APP_URL)` from `@/server/auth/redirect`: exactly one leading `/` (not `//`, not `/\`), no control characters or backslashes, raw or percent-encoded (`%09 %0A %0D %5C` …), max. 2048 characters, and `new URL(next, APP_URL).origin === APP_URL` origin; returns the normalised path + query + hash or `null`.

**APP_URL (audit-1 R23)** — `resolveAppUrl()` (`@/server/config`) for every absolute link (password reset, referral `shareUrl`, provider `inviteUrl`, e-mail outbox URLs, dev payout return): an explicit `APP_URL` env var always wins; only when it is unset **and** `NODE_ENV !== "production"` the request's `x-forwarded-host`/`host` (+ `x-forwarded-proto`) is used; otherwise the config default. **supabase**: `@supabase/ssr` (`getUser()` server-side); *not covered by automated tests*.

`src/proxy.ts` only checks that a session cookie exists for `/konto/*`, `/pro/*`, `/admin/*` (except `/pro/registrieren`) and redirects to `/anmelden?next=…`. Server Action POSTs are excluded from the matcher.

## 4. Services (server-only)

Role column: who may call it. Services enforce the role with the `session` argument; admin services also re-check `profiles.role` in the database (a forged in-memory `Session` is refused).

### 4.1 `services/catalog.ts` (public)

| Function | Returns |
|---|---|
| `listCategories()` | `Promise<CategoryDTO[]>`: active, sorted; includes `requiredDocuments` |
| `listCatalog()` | `Promise<CategoryWithServicesDTO[]>`: categories with their services (one round trip) |
| `getCategory(slug: string)` | `Promise<CategoryDTO \| null>` |
| `listServices(categorySlug: string)` | `Promise<ServiceDTO[]>` |
| `getService(id: string)` | `Promise<ServiceDTO \| null>` |
| `listCities()` | `Promise<CityDTO[]>`: the six launch cities |
| `getCity(slug: string)` | `Promise<CityDTO \| null>` |
| `lookupPostalCode(plz: string)` | `Promise<PostalCodeDTO \| null>`: centroid, `citySlug`, `isLaunchCity`; `null` = unknown PLZ |
| `getContentBlock(key: string)` | `Promise<ContentBlockDTO \| null>`: keys `home.hero`, `home.how_it_works`, `home.faq`, `announcement`, `city.<slug>.intro` |
| `getContentBlocks(prefix: string)` | `Promise<ContentBlockDTO[]>` |
| `getCityCategoryCoverage(citySlug: string, categorySlug: string)` | `Promise<CoverageDTO>` = `{ citySlug, categorySlug, providerCount, indexable }`. `indexable = providerCount >= 2` (setting `coverage_min_providers`). SEO pages with `indexable === false` should set `robots: { index: false }`. |

The taxonomy is data-driven: never hard-code the category list in the UI (except static image fallbacks by slug).

### 4.2 `services/search.ts`

| Function | Role | Returns / notes |
|---|---|---|
| `searchProviders(input: SearchInput, session?: Session \| null, opts?: { logDemand?: boolean; now?: Date })` | public | `Promise<SearchResultDTO>`. Only approved providers whose radius covers the PLZ centroid, who offer the service (or any service of the category), with ≥ 1 real slot on `date`, or within the next 7 days when `date` is omitted. Every call is logged to `search_events` (no PII) unless `logDemand: false`. Unknown PLZ → `ServiceError("validation")`. Empty result + `location.isLaunchCity === false` → show the "Noch nicht in Ihrer Gegend" state + waitlist. |
| `joinWaitlist(input: { email: string; postalCode: string; categorySlug?: string })` | public | `Promise<{ joined: true }>`, idempotent per (e-mail, PLZ, category). |

```ts
interface SearchInput {
  postalCode: string; categorySlug?: string; serviceId?: string; durationMinutes?: number;
  date?: string /* YYYY-MM-DD */; timeOfDay?: "morning" | "afternoon" | "evening";
  sort?: "recommended" | "earliest" | "price_asc" | "rating"; page?: number; pageSize?: number /* ≤ 50 */;
  instantOnly?: boolean; minRating?: number; language?: string /* "de", "en", … */;
}
```

`ProviderSearchResult` = `ProviderCardDTO` + `{ distanceKm, travelFeeCents, offering: OfferingDTO, totalPriceCents, nextSlots: string[] (≤ 6), firstSlot, isFavorite, score }`. For category searches the offering is the provider's cheapest one in the category. Ranking "Empfohlen": time fit 25 %, Bayesian rating (m = 4.6, C = 5) 25 %, reliability 20 %, instant 10 %, proximity 10 %, new-pro boost 5 %, profile completeness 5 % (`src/server/domain/ranking.ts`).

### 4.3 `services/providers.ts` (public)

| Function | Returns / notes |
|---|---|
| `getProviderProfile(slug: string, viewerId?: string \| null, opts?: { inviteCode?: string })` | `Promise<ProviderProfileDTO \| null>`: approved providers only. Includes offerings, portfolio, first review page, `cancellationPolicy`, `isFavorite` (when `viewerId`), `inviteValid` (when `inviteCode` is passed: forward the code to `createBookingAction({ inviteCode })` / `signUpAction` field `inviteCode`), **`verifiedQualifications: Array<{ categorySlug, categoryName, label }>`** (audit-3 F2: only categories of active offerings whose required qualification is approved and valid — use it for *Was wir geprüft haben*). |
| `listFeaturedProviders(citySlug?: string, limit = 8)` | `Promise<ProviderCardDTO[]>` |
| `getProviderAvailability(providerId: string, providerServiceId: string, from: string, days: number)` | `Promise<SlotsByDayDTO[]>` (`days` 1–31; past `from` is clamped to today) |
| `isValidInviteCode(providerId: string, code: string)` | `Promise<boolean>` |

### 4.4 `services/bookings.ts`

| Function | Role | Returns / notes |
|---|---|---|
| `quoteBooking(input: QuoteInput, session?: Session \| null)` | public (credits / saved addresses need a customer session) | `Promise<QuoteDTO>`: price breakdown, `slotAvailable`, `withinServiceArea`, `distanceKm`, policy + concrete `schedule` + `freeUntil`, `holdMinutes`, `requestResponseHours` (4), **`respondByPreview`** (request mode: ISO deadline the provider would get if the request were sent now, `computeRespondBy(now, startsAt, hours)`; `null` for instant), `paymentProvider`, `vatMode`, **`vatNote`** (see §8, VAT notes). Show it **before** confirmation (PAngV). |
| `createBooking(session, input: CreateBookingInput)` | customer | `Promise<CreateBookingResult>` `{ bookingId, reference, status: "pending_payment", holdExpiresAt, totalCents, paymentProvider, paymentClientSecret }`. Holds the slot for `hold_minutes` (10). Checks service area, slot validity (same function as the slot list), commission tier, credits. `notes` with contact details → `validation` with `CONTACT_LINT_MESSAGES.customerNotes` (field `notes`). Request mode: a start that leaves the provider < 30 business minutes to answer → `unavailable` "Für diesen Termin bliebe zu wenig Zeit für die Antwort des Profis. Bitte wählen Sie einen späteren Termin." (such slots are not offered by availability, search or quote either). Concurrent attempts: exactly one wins, the other gets `slot_taken` ("Dieser Termin wurde gerade vergeben. Bitte wählen Sie eine andere Uhrzeit."). |
| `confirmDevPayment(session, bookingId: string)` | customer, `PAYMENTS_PROVIDER=dev` | `Promise<{ status }>`: `requested` (request mode, sets `respondBy`) or `confirmed` (instant). Expired hold → `invalid_state`. `respondBy = computeRespondBy(now, startsAt, request_response_hours)` = the earlier of (now + **4 h** (default, admin setting) counted only within 08:00–21:00 Europe/Berlin, DST-safe) and (`startsAt − 2 h`); a request at 20:00 is due at 11:00 the next day. |
| `providerRespond(session, bookingId: string, decision: "accept" \| "decline", note?: string)` | provider | `Promise<{ status }>`. Decline needs a reason (≥ 3 chars); releases the authorization. `note` is contact-linted (`CONTACT_LINT_MESSAGES.providerMessage`, field `note`). |
| `startBooking(session, bookingId: string, code: string)` | provider | `Promise<{ status: "in_progress" }>`. Needs the customer's 4-digit **Start-Code**; from `startsAt − 30 min`; at most 5 wrong attempts, then `rate_limited`. |
| `completeBooking(session, bookingId: string)` | provider | `Promise<{ status: "completed" }>`: from `startsAt`; captures the payment, triggers the review request and the referral reward. |
| `markNoShow(session, bookingId: string)` | provider | `Promise<{ status: "no_show"; feeCents }>`: from `startsAt + 15 min`; 100 % of the service price **plus** the travel fee. |
| `cancelBooking(session, bookingId: string, reason?: string)` | customer (own) / provider (own, reason required, `confirmed` only) | `Promise<{ status: "cancelled"; feeCents; refundCents }>`. Fee per snapshotted policy (§8 *Cancellation policy*): free within 15 min after booking (Bedenkzeit) and ≥ 24 h before; ≥ 2 h: 50 % of the **service price**, travel refunded; < 2 h: 100 % of the service price + travel. `requested`/holds are free; provider cancellations are a full refund. Redeemed credits come back proportionally. `reason` is contact-linted (customer: `customerMessage`, provider: `providerMessage`; field `reason`). |
| `getBookingForCustomer(session, bookingId: string)` | customer (own) | `Promise<CustomerBookingDTO \| null>`: includes `startCode` (only while `confirmed`/`in_progress`), `vatMode` + `vatNote` from the booking's snapshot, `cancellation.ifCancelledNow`, `payment`, `events`, flags `canPay`, `canCancel`, `canReview`, `canDispute`, `canRebook`. |
| `listCustomerBookings(session, scope: "upcoming" \| "past", page = 1, pageSize = 20)` | customer | `Promise<Paginated<BookingListItemDTO>>` |
| **`listRebookSuggestions(session, limit = 3)`** | customer | `Promise<BookingListItemDTO[]>` (audit-3 F11): the **last completed booking per provider** (approved providers only), newest first, independent of later cancelled or upcoming bookings — the rebook list on `/konto`. Pass the item's `id` to `rebookOptions`. |
| `getBookingForProvider(session, bookingId: string)` | provider (own) | `Promise<ProviderBookingDTO \| null>`: **never** contains the Start-Code or any e-mail; last name, street address and phone are `null` until the booking is confirmed (address hidden again 24 h after completion). `actions.*` flags tell the UI which buttons to show. Time-based flags (audit-1 R18): **`canStart`** (confirmed and now ≥ `startsAt − 30 min`), **`canComplete`** (confirmed/in progress and now ≥ `startsAt`), **`canNoShow`** (confirmed and now ≥ `startsAt + 15 min`), **`startAvailableAt`** / **`noShowAvailableAt`** (ISO; `null` unless confirmed) for "Start ab 08:30 Uhr möglich". |
| `listProviderBookings(session, filter: "requests" \| "upcoming" \| "past" \| "today" \| "all" = "upcoming", page = 1, pageSize = 30)` | provider | `Promise<Paginated<ProviderBookingDTO>>` |
| `rebookOptions(session, bookingId: string)` | customer (own) | `Promise<RebookOptionsDTO>`: same provider/offering, next 7 days of slots, saved `addressId` if found, up to 3 `alternatives` when there is no slot. |
| `markPaymentAuthorizedByExternalId(externalId, card)` / `markPaymentFailedByExternalId(externalId)` | system (Stripe webhook) | internal |

Booking states: `pending_payment → requested | confirmed | expired | cancelled`, `requested → confirmed | declined | expired | cancelled`, `confirmed → in_progress | completed | no_show | cancelled`, `in_progress → completed | cancelled (admin)`. German labels: `statusLabel` in every booking DTO (`STATUS_LABELS_DE` in `domain/booking-state.ts`).

### 4.5 `services/booking-maintenance.ts` (system)

`runBookingMaintenance(now?: Date): Promise<MaintenanceResult>` with `MaintenanceResult = { expiredHolds, expiredRequests, autoCompleted, reminders, emailsSent }`. Expires holds and unanswered requests (releases the authorization, returns credits, notifies), auto-completes 24 h after `endsAt`, sends 24-h reminders, delivers queued e-mails. `runBookingMaintenanceLazily()` (throttled to 30 s) runs at the start of `createBooking`, booking lists and dashboards; production schedules `POST /api/cron/booking-maintenance`.

### 4.6 `services/account.ts`

| Function | Role | Returns |
|---|---|---|
| `getProfile(session)` | any | `Promise<ProfileDTO>` |
| `updateProfile(session, { firstName, lastName, phone?, marketingOptIn? })` | any | `Promise<ProfileDTO>` |
| `uploadAvatar(session, file: UploadInput)` | customer, provider | `Promise<{ avatarUrl }>` (jpeg/png/webp ≤ 8 MB; providers: also the public profile photo) |
| `listAddresses(session)` | customer | `Promise<AddressDTO[]>` (default first) |
| `createAddress(session, input: AddressInput)` | customer | `Promise<AddressDTO>`: first address becomes default; max. 20; unknown PLZ → `fieldErrors.postalCode = "Diese Postleitzahl kennen wir nicht."` (also `updateAddress`) |
| `updateAddress(session, addressId, input: AddressInput)` | customer | `Promise<AddressDTO>` |
| `deleteAddress(session, addressId)` / `setDefaultAddress(session, addressId)` | customer | `Promise<void>` |
| `toggleFavorite(session, providerId)` | customer | `Promise<{ favorite: boolean }>` |
| `listFavorites(session)` | customer | `Promise<FavoriteDTO[]>` |
| `getNotificationPreferences(session)` / `updateNotificationPreferences(session, prefs)` | any | `Promise<NotificationPreferencesDTO>` |
| `getCreditSummary(session)` | customer | `Promise<CreditSummaryDTO>` `{ balanceCents, entries[] }` (with German `reasonLabel`) |
| `getReferralInfo(session)` | customer | `Promise<ReferralInfoDTO>` (`shareUrl` = `/registrieren?empfehlung=<code>`) |
| `openDispute(session, bookingId, reason: DisputeReason, description: string)` | customer, provider (participant) | `Promise<{ disputeId }>`: within 48 h (`dispute_window_hours`); holds the booking's payout. `description` is contact-linted (`customerDispute` / `providerDispute`). |
| `listMyDisputes(session)` | customer, provider | `Promise<DisputeDTO[]>` |

`AddressInput = { label?, kind?: "home" | "hotel" | "office" | "other", street, houseNumber, postalCode, city, details?, isDefault? }`. Coordinates are always derived from the PLZ centroid.

### 4.7 `services/reviews.ts`

| Function | Role | Returns / notes |
|---|---|---|
| `listProviderReviews(providerId: string, page = 1, pageSize = 10)` | public | `Promise<ReviewListDTO>` (published only; `authorName` = "Vorname N."; `distribution` by stars) |
| `createReview(session, bookingId: string, rating: number, comment?: string \| null, tags?: string[])` | customer | `Promise<{ reviewId }>`: only for own **completed** bookings, once, within 14 days; contact details in `comment` → `CONTACT_LINT_MESSAGES.customerReview`. Tags from `REVIEW_TAG_OPTIONS` (max. 3): "Pünktlich", "Professionell", "Freundlich", "Entspannend", "Sauber gearbeitet", "Gute Beratung", "Wieder buchen". Provider rating aggregates update via trigger. |
| `replyToReview(session, reviewId: string, reply: string)` | provider | `Promise<void>`: one public reply per review; contact details → `CONTACT_LINT_MESSAGES.providerReply` |

**Contact lint (audit-1 R7, audit-2 N3)** — `findContactDetails(text)` / `hasContactDetails(text)` in `domain/content-lint.ts` first normalise (`normalizeForLint`: NFKC — full-width digits and ＠ —, strip `\p{Cf}` / zero-width characters, a standalone letter O inside a digit run reads as 0), then detect phone numbers (+49 / 0049 / 0170 …, with spaces, dashes, slashes, dots, parentheses; 7–16 digits; without the leading 0 as 15x/16x/17x mobile prefixes or ≥ 9 digits in one run; 7+ spelled digit words "null eins sieben …"), e-mail addresses (also "at/(at)/ät … dot/(punkt)"), `@handles`, URLs and bare domains, and messenger names (WhatsApp, Insta/Instagram/Instagramm, `IG`, Telegram, Signal in a contact context, Facebook, TikTok, Snapchat, Threema, wa.me). Dates (`dd.mm.yyyy`, `dd.mm.yy`, ISO), clock times and prices are removed before phone matching, PLZ lists are ignored. Applied by `assertNoContactDetails` (`services/_shared.ts`) to provider `displayName`/`headline`/`bio` ("Kontaktdaten wie Telefonnummern, E-Mail-Adressen oder Profile sind im Profil nicht erlaubt – Buchung und Kontakt laufen über SOMA."), review comments, replies, booking notes, decline/acceptance notes, both cancellation reasons and dispute descriptions; the error carries the message both as `error` and in `fieldErrors[field]`. The customer's phone still reaches the provider only after confirmation.

### 4.8 `services/pro.ts` (provider; messages use *du*)

| Function | Returns / notes |
|---|---|
| `getProDashboard(session)` | `Promise<ProDashboardDTO>`: today, open requests (with `respondBy`), upcoming count, week earnings, rating, onboarding state, unread notifications |
| `getOnboardingState(session)` | `Promise<ProOnboardingDTO>`: `steps[]` (`profile`, `services`, `area`, `hours`, `documents`, `payout`), `missingDocuments[]` per offered category (e.g. Haare & Styling: "Meisterbrief oder Eintragung in die Handwerksrolle") plus platform-wide ones, `canSubmit`, `lastDecisionNote`, `termsAcceptedAt` |
| `submitForReview(session, { termsAccepted: true, vatMode?: VatMode })` | `Promise<ProOnboardingDTO>`: `draft`/`rejected` → `submitted` (all steps except payout done). `termsAccepted` must be `true` (AGB für Profis + Verhaltenskodex), otherwise `validation` with `fieldErrors.termsAccepted` = "Bitte bestätige die AGB für Profis und den SOMA-Verhaltenskodex.". Sets `terms_accepted_at`; stores `vatMode` when given. |
| `getProProfile(session)` / `updateProProfile(session, { displayName, headline?, bio? (≤ 400), yearsExperience?, languages: string[] })` | `Promise<ProProfileDTO>`. Healing or medical claims (HWG) are rejected with a hint. |
| `updateServiceArea(session, { basePostalCode, serviceRadiusKm (3–30), travelFeeBaseCents (0–3000), travelFeeIncludedKm, travelFeePerKmCents })` | `Promise<ProProfileDTO>` |
| `listProServices(session)` | `Promise<ProServiceDTO[]>` (incl. inactive). **`awaitingDocuments: boolean`** + **`missingDocuments: string[]`** (labels) mark offerings stored as *Wartet auf Nachweis* (audit-3 F2). |
| `upsertProService(session, { serviceId, durationMinutes, priceCents (500–100000), isActive? })` | `Promise<ProServiceDTO>`: the duration is one of the service's durations or within ±30 % of the default (5-min steps). **Approved provider, category qualification missing or not yet approved** → stored inactive with `awaitingDocuments = true` (not bookable, not in search; DB trigger `provider_services_10_require_documents`, also for the Data API); `upsertProServiceAction` then returns the message "Leistung gespeichert. Sie wird freigeschaltet, sobald dein Nachweis geprüft ist: {labels}. Lade ihn unter „Verifizierung“ hoch." It is switched on automatically when the document is approved (`activateAwaitingOfferings`, `services/verification.ts`, called by `reviewDocument` and `decideProvider` approve/reinstate). Switching it off (`isActive: false`) clears the waiting state. |
| `deleteProService(session, providerServiceId)` | `Promise<{ deleted; deactivated }>`: offerings with bookings are deactivated |
| `getWeeklyHours(session)` / `setWeeklyHours(session, windows: { weekday (1=Mo…7=So), start "HH:MM", end "HH:MM" \| "24:00" }[])` | `Promise<WeeklyHoursDTO[]>`: replace-all; several windows per day, no overlaps |
| `listTimeOff(session)` / `addTimeOff(session, { start, end, reason? })` / `deleteTimeOff(session, id)` | `TimeOffDTO[]` / `{ id, conflictingBookings }` / `void` |
| `listDocuments(session)` | `Promise<DocumentDTO[]>` (`url` → authorised `/api/media/documents/…`) |
| `uploadDocument(session, kind: DocumentKind, file: UploadInput, categoryId?: string \| null)` | `Promise<DocumentDTO>` (pdf/jpeg/png ≤ 10 MB; pass `categoryId` for category qualifications) |
| `deleteDocument(session, documentId)` | `Promise<void>` (pending documents only) |
| `uploadPortfolioImage(session, file, { caption?, categoryId? })` / `updatePortfolioItem(session, itemId, { caption?, sortOrder?, categoryId? })` / `deletePortfolioItem(session, itemId)` | max. 24 images; captions are contact-linted (`CONTACT_LINT_MESSAGES.providerProfile`, field `caption`, audit-3 F13) |
| `getProSettings(session)` | `Promise<ProSettingsDTO>`: booking mode, lead time, buffer, max advance, **`inviteCode` + `inviteUrl`** (`/profis/<slug>?einladung=<code>`), `payoutsEnabled`, `vatMode`, notification preferences |
| `updateProSettings(session, { bookingMode, leadTimeMinutes (60–2880), travelBufferMinutes (15–60), maxAdvanceDays (7–180), vatMode?: "regular" \| "small_business", notificationPreferences? })` | `Promise<ProSettingsDTO>` (`vatMode` omitted → unchanged; existing bookings keep their snapshot) |
| `getPayoutOnboardingLink(session)` | `Promise<{ url }>`: Stripe Connect Express link; dev: enables payouts immediately and returns `/pro/einnahmen?testmodus=auszahlung` |
| `getEarnings(session, { limit? })` | `Promise<EarningsDTO>`: per booking `payoutState`: `pending` (completed < 48 h ago **or** open dispute), `available`, `paid_out` (in a payout batch); totals `pendingCents`, `availableCents`, `paidOutCents`, `monthCents`, `yearCents`; `payouts[]` |
| `getProCalendar(session, from: string, days = 7)` | `Promise<ProCalendarDTO>`: weekly hours, time off, bookings |
| `listMyReviews(session, page = 1)` | `Promise<ReviewListDTO>` |

### 4.9 `services/notifications.ts`

| Function | Role | Returns |
|---|---|---|
| `listNotifications(session, { unreadOnly?, limit? })` | any | `Promise<NotificationDTO[]>` (`href` deep-links to the booking) |
| `countUnreadNotifications(session)` | any | `Promise<number>` |
| `markNotificationsRead(session, ids: string[] \| "all")` | any | `Promise<number>` |
| `notify(tx, event, ctx)` | system | internal: in-app + `email_outbox` (respects preferences). Events: `booking.requested\|confirmed\|declined\|expired\|cancelled\|reminder_24h\|completed\|no_show`, `review.received`, `provider.approved\|rejected`, `payout.paid`, `dispute.opened\|resolved`, `referral.rewarded`. |

### 4.10 `services/media.ts`

`validateUpload(file, "image" | "document")`, `storeUpload(bucket, ownerId, file)`, `readMedia(session | null, key)`. `UploadInput = { fileName: string; contentType: string; bytes: Uint8Array }`. The file signature (magic bytes) decides the type, not the declared MIME type. Keys: `portfolio/<providerId>/<uuid>.<ext>` and `avatars/<userId>/<uuid>.<ext>` (public), `documents/<providerId>/<uuid>.<ext>` (provider and admins only).

### 4.11 `services/admin.ts` (admin only; every write goes to `audit_log`)

| Function | Returns / notes |
|---|---|
| `listUsers(session, { q?, role?, page?, pageSize? })` | `Promise<Paginated<AdminUserDTO>>` |
| `setUserBlocked(session, userId, blocked: boolean, reason: string)` | `Promise<void>` (revokes local sessions) |
| `adjustCredits(session, userId, amountCents, note, reason = "admin_adjustment" \| "goodwill")` | `Promise<void>` (± up to 500 €, never below a zero balance; audited `credits.adjust`) |
| `listProvidersAdmin(session, { status?: ProviderStatus \| ProviderStatus[], q?, page?, pageSize? })` | `Promise<Paginated<AdminProviderListItemDTO>>` (`missingDocuments` counts required documents that are missing **or not yet approved**) |
| `listVerificationQueue(session)` | `Promise<AdminProviderListItemDTO[]>` (submitted + in_review) |
| `getProviderForAdmin(session, providerId)` | `Promise<AdminProviderDetailDTO \| null>` |
| `decideProvider(session, providerId, decision: "approve" \| "reject" \| "start_review" \| "suspend" \| "reinstate", note?)` | `Promise<ProviderDecisionResult>` `{ status, warnings[] }`. **Approve and reinstate are refused** (`invalid_state`, no override) unless every required document (base + per offered category) is `approved`: "Freigabe nicht möglich. Folgende Pflichtdokumente fehlen oder sind noch nicht geprüft: Gewerbeanmeldung, Meisterbrief oder Eintragung in die Handwerksrolle (Haare & Styling)." Remaining `warnings`: no service area, no weekly hours. Reject/suspend need a note. |
| `reviewDocument(session, documentId, "approved" \| "rejected", note?, validUntil?: "YYYY-MM-DD")` | `Promise<{ providerSuspended; offeringsActivated }>` (`offeringsActivated`: offerings switched on because this approval completed their category documents, audit-3 F2). `validUntil` (inclusive) sets `expires_at` on approval. **Rejecting a required document of an approved provider suspends them automatically** (audit-2 N4, `services/verification.ts`: status event "Automatisch pausiert: …", audit `provider.auto_suspend`, notification `provider.suspended_documents` in du-voice). Reinstating goes through `decideProvider("reinstate")`, gated by all documents. Booking maintenance turns approved documents past `expires_at` into `rejected` ("Abgelaufen am …") and suspends the same way (`MaintenanceResult.expiredDocuments`, `suspendedProviders`). Expired documents never count in `missingDocuments`. |
| `setProviderCommissionOverride(session, providerId, rate: number \| null)` | `Promise<void>` |
| `listCategoriesAdmin(session)` | incl. inactive categories/services |
| `upsertCategory(session, CategoryInput & { id? })` / `upsertService(session, ServiceInput & { id? })` | `Promise<CategoryDTO>` / `Promise<ServiceDTO>` |
| `listAdminBookings(session, { status?, q?, page?, pageSize? })` / `getAdminBooking(session, bookingId)` | `Paginated<AdminBookingListItemDTO>` / `AdminBookingDetailDTO \| null` |
| `adminCancelBooking(session, bookingId, reason, feeCents = 0)` | `Promise<{ status; feeCents }>` |
| `refundPayment(session, bookingId, amountCents, reason)` | `Promise<{ refundId }>` (≤ captured − refunded; commission and provider share reduced proportionally) |
| `listDisputes(session, { status? })` / `updateDisputeStatus(session, id, "investigating" \| "closed", note?)` / `resolveDispute(session, id, "refund" \| "no_action", note, refundCents = 0)` | |
| `listCommissionRules(session, { includeInactive? })` / `createCommissionRule(session, { scope, categoryId?, providerId?, rate, repeatClientRate, ownClientRate })` / `deactivateCommissionRule(session, ruleId)` | versioned: a new rule deactivates the previous rule for the same target; bookings keep their snapshot |
| `listPayments(session, { page?, pageSize? })` / `listPayouts(session, { status? })` | |
| `createPayoutBatch(session)` | `Promise<{ payouts: PayoutDTO[]; totalCents; bookingCount }>`: only bookings completed (or with a retained fee) **≥ 48 h** ago, not yet paid out, **without an open dispute** |
| `markPayoutPaid(session, payoutId)` | `Promise<void>` (notifies the provider) |
| `listContentBlocks(session)` / `upsertContentBlock(session, key, value: JSON)` | |
| `listPlatformSettings(session)` / `updatePlatformSetting(session, key, value)` | validated per key (see `SETTING_SCHEMAS`) |
| `moderateReview(session, reviewId, isPublished, note?)` | hide/unhide (audited `review.unpublish` / `review.publish`); rating aggregates follow via trigger |
| `listAuditLog(session, { entity?, page?, pageSize? })` | `Paginated<AuditLogEntryDTO>` |
| `listWaitlist(session, { citySlug? })` | waitlist sign-ups (admin only; e-mails are never exposed elsewhere) |

`services/admin-ext.ts` (admin read models) adds, for audit-1 R20:

| Function | Returns / notes |
|---|---|
| `listReviewsAdmin(session, filter: AdminReviewFilter)` | `Promise<Paginated<AdminReviewDTO>>`. Filter `{ visibility?: "published" \| "hidden", rating?: 1–5 \| "critical" (1–2 ★), q?, providerId?, flagged?: boolean (contact details in text or reply), page?, pageSize? }`. `AdminReviewDTO = { id, bookingId, bookingReference, rating, comment, tags, serviceName, providerId, providerName, providerSlug, customerId, customerName ("Vorname N." \| null), providerReply, providerRepliedAt, isPublished, createdAt, contactFlags[] }`. |
| `getUserForAdmin(session, userId)` | `Promise<AdminUserDetailDTO \| null>` = `{ user: AdminUserDTO, avatarUrl, marketingOptIn, referralCode, lastSignInAt, anonymizedAt, providerSlug, addressesCount, reviewsCount, credits: { balanceCents, entries: AdminCreditEntryDTO[] (+ bookingReference, createdByName) }, bookings: AdminUserBookingDTO[] (latest 20, `asRole`, `counterpartName`), activeBookings, openDisputes, anonymizeBlockers: string[] }` |

`getOpsQueues` additionally returns **`documentAlerts: DocumentAlertDTO[]`** / `documentAlertsTotal` (auto-suspended providers, offerings *Wartet auf Nachweis* (`status: "awaiting"`, detail "Wartet auf Nachweis: {services}", audit-3 F2) and approved documents expiring within 14 days), shown as *Dokumente & Sperren* on `/admin`. `DocumentDTO` gains **`expiresAt`** and **`expired`**; `uploadDocument(session, kind, file, categoryId?, validUntil?)` / `uploadDocumentAction` field **`validUntil`** (YYYY-MM-DD) let providers enter the insurance end.

### 4.13 `services/privacy.ts` (DSGVO, audit-1 R20)

| Function | Role | Returns / notes |
|---|---|---|
| `exportMyData(session)` | customer, provider (own) | `Promise<UserDataExportDTO>` (`format: "soma-user-export/v1"`): profile (incl. e-mail), notification preferences, addresses, own bookings (address snapshot, notes, prices, payment status and card brand/last 4), reviews, credit ledger, referrals, favourites, disputes, last 500 notifications; providers additionally `provider` (profile texts, document metadata, payouts). Never other users' contact data, password hashes or tokens. Audited `user.export` (`by: "self"`). |
| `exportUserData(session, userId)` | admin | same DTO, audited (`by: "admin"`) |
| `anonymizeUser(session, userId, reason)` | admin | `Promise<AnonymizeResultDTO>` `{ userId, anonymizedAt, bookingsScrubbed, addressesDeleted }`. Refused (`invalid_state`, "Anonymisierung nicht möglich. …") for admins, the own account, providers (manual process: payouts and retention duties), already anonymised accounts, open bookings (`pending_payment`/`requested`/`confirmed`/`in_progress`) or open disputes. |
| `anonymizeOwnAccount(session)` | customer (own) | same result; customer-voice refusals ("Sie haben noch offene Termine …"). Called by `requestAccountDeletionAction` after password re-confirmation. |
| `queryAnonymizeBlockers(tx, userId, { isSelf? })` | internal | German reasons (empty = possible) |

Anonymisation (one owner transaction): `profiles` first/last name, phone, avatar → `null`, `marketing_opt_in = false`, new `ANON…` referral code, `blocked_at`, **`anonymized_at`** (migration 0006); `auth.users` e-mail → `deleted+<id>@anonymized.soma.invalid`, password hash and metadata removed, `banned_until = infinity` (+ `auth.identities` when present); all sessions and reset tokens (`app_private.local_sessions`, `password_resets`, `login_attempts`, Supabase `auth.sessions`/`refresh_tokens` when present); addresses, favourites, notifications, e-mail outbox and waitlist sign-ups deleted. **Bookings, payments, reviews and the credit ledger stay** (accounting) with the booking's personal snapshot scrubbed (`address_line = "Anonymisiert"`, details, notes, coordinates `null`); postal code/city remain. The avatar file is deleted after commit. Audited `user.anonymize` without the old e-mail.

### 4.12 `services/analytics.ts` (admin only)

| Function | Returns |
|---|---|
| `getMarketplaceKpis(session, { from?, to? })` (ISO, default last 30 days) | `MarketplaceKpisDTO`: GMV, net revenue (commission + service fee − credits), bookings by status, searches, zero-result searches, conversion search → booking, repeat rate (non-base commission tier), average rating, provider utilisation, active providers, new customers, waitlist sign-ups |
| `getSupplyDemandByCity(session, { days? })` | `SupplyDemandRowDTO[]`: per launch city: searches, zero-result searches, waitlist, approved providers, bookings, open slot-hours in the next 7 days, and `byCategory[]` (providers / searches / waitlist) |
| `getTimeSeries(session, { days? })` | `TimeSeriesPointDTO[]`: daily bookings, completions, GMV, searches |

One counting rule (audit-3 F8): KPIs, the daily series, `getSupplyDemandByCity` and `getDemandByPostalRegion` all count the last `days` × 24 h. The series therefore has `days + 1` local dates (first and last bucket partial) and its sums equal the KPI tiles. `/admin/regionen` shows the total over all valid PLZ (= KPI) and names the searches outside the launch cities, which the city table does not contain.

## 5. Server Actions

All actions are in `"use server"` files and return `ActionResult<T>`. **Form** = `(prev, formData: FormData)` for `useActionState`; **call** = typed argument.

### `actions/auth.ts`

| Action | Kind | Role | Fields / input → data |
|---|---|---|---|
| `signInAction` | form | public | `email`, `password`, `next?` → redirects to `next` or the role's home |
| `signUpAction` | form | public | `email`, `password` (≥ 10), `firstName`, `lastName`, `role` (`customer` \| `provider`), `referralCode?`, `inviteCode?` (provider invite → own-client link), `marketingOptIn?`, `acceptTerms` (required), `next?` → redirects (`/konto` or `/pro/registrieren`) |
| `signOutAction()` | call | any | redirects to `/` |
| `requestPasswordResetAction` | form | public | `email` → always the same German message |
| `resetPasswordAction` | form | public | `token`, `password`, `passwordConfirm` → redirects to `/anmelden?passwort=neu` (local reset link: `/passwort-vergessen?token=…`) |
| `changePasswordAction` | form | any | `currentPassword`, `newPassword`, `newPasswordConfirm` |
| `getSessionAction()` | call | public | `{ userId, role, firstName } \| null` |

### `actions/booking.ts` (customer)

| Action | Kind | Role | Input → data |
|---|---|---|---|
| `loadAvailabilityAction({ providerId, providerServiceId, from, days? })` | call | public | `SlotsByDayDTO[]` |
| `quoteBookingAction(input: QuoteInput)` | call | public | `QuoteDTO` |
| `createBookingAction(input: CreateBookingInput)` | call | customer | `CreateBookingResult` |
| `confirmDevPaymentAction(bookingId)` | call | customer | `{ status }` |
| `cancelBookingAction({ bookingId, reason? })` | call | customer | `{ status, feeCents, refundCents }` |
| `rebookOptionsAction(bookingId)` | call | customer | `RebookOptionsDTO` |
| `createReviewAction` | form | customer | `bookingId`, `rating` (1–5), `comment?`, `tags` (repeatable) → `{ reviewId }` |
| `openDisputeAction` | form | customer, provider | `bookingId`, `reason`, `description` → `{ disputeId }` |
| `joinWaitlistAction` | form | public | `email`, `postalCode`, `categorySlug?` → `{ joined: true }` |

`CreateBookingInput = { providerServiceId, startsAt, address: { addressId } | { kind, street, houseNumber, postalCode, city, details?, label?, save? }, notes?, useCredits?, inviteCode?, rebookedFromId? }`.

### `actions/account.ts`

| Action | Kind | Role | Input → data |
|---|---|---|---|
| `updateProfileAction` | form | any | `firstName`, `lastName`, `phone?`, `marketingOptIn?` → `ProfileDTO` |
| `saveAddressAction` | form | customer | `id?` (update) + address fields + `isDefault?` → `AddressDTO` |
| `deleteAddressAction(addressId)` / `setDefaultAddressAction(addressId)` | call | customer | — |
| `toggleFavoriteAction(providerId)` | call | customer | `{ favorite }` |
| `updateNotificationPreferencesAction(prefs)` | call | any | `NotificationPreferencesDTO` |
| `markNotificationsReadAction(ids \| "all")` | call | any | `{ count }` |
| `uploadAvatarAction` | form | customer, provider | `file` → `{ avatarUrl }` |
| **`requestDataExportAction()`** | call | customer, provider | → `{ fileName, json }` (pretty-printed `UserDataExportDTO`; offer it as a download, e.g. `new Blob([json], { type: "application/json" })`) |
| **`requestAccountDeletionAction`** | form | customer (providers get the "SOMA-Team" refusal) | `password` → re-confirms with `AuthAdapter.verifyPassword` ("Das Passwort ist nicht korrekt." in `fieldErrors.password`), anonymises (`anonymizeOwnAccount`), signs out and **redirects to `/?konto=geloescht`**. Refusals (open bookings / disputes) come back as `{ ok: false, error }`. |

### `actions/pro.ts` (provider)

| Action | Kind | Input → data |
|---|---|---|
| `updateProProfileAction(input)` | call | → `ProProfileDTO` |
| `updateServiceAreaAction(input)` | call | → `ProProfileDTO` |
| `upsertProServiceAction({ serviceId, durationMinutes, priceCents, isActive? })` | call | → `ProServiceDTO` |
| `deleteProServiceAction(providerServiceId)` | call | → `{ deleted, deactivated }` |
| `setWeeklyHoursAction(windows)` | call | → `WeeklyHoursDTO[]` |
| `addTimeOffAction({ start, end, reason? })` / `deleteTimeOffAction(id)` | call | → `{ id, conflictingBookings }` / — |
| `uploadDocumentAction` | form | `file`, `kind`, `categoryId?` → `DocumentDTO` |
| `deleteDocumentAction(documentId)` | call | — |
| `uploadPortfolioImageAction` | form | `file`, `caption?`, `categoryId?` → `{ id, url }` |
| `updatePortfolioItemAction({ itemId, caption?, sortOrder?, categoryId? })` / `deletePortfolioItemAction(itemId)` | call | — |
| `submitForReviewAction({ termsAccepted: true, vatMode? })` | call | → `ProOnboardingDTO` (pass the "Prüfen" checkbox as `termsAccepted`) |
| `updateProSettingsAction({ bookingMode, leadTimeMinutes, travelBufferMinutes, maxAdvanceDays, vatMode?, notificationPreferences? })` | call | → `ProSettingsDTO` |
| `startPayoutOnboardingAction()` | call | redirects to Stripe (dev: back to `/pro/einnahmen`) |
| `respondToRequestAction({ bookingId, decision: "accept" \| "decline", note? })` | call | → `{ status }` |
| `startBookingAction({ bookingId, code })` | call | → `{ status }` |
| `completeBookingAction(bookingId)` / `markNoShowAction(bookingId)` | call | → `{ status }` / `{ status, feeCents }` |
| `cancelBookingAsProviderAction({ bookingId, reason })` | call | → `{ status, feeCents, refundCents }` |
| `replyToReviewAction({ reviewId, reply })` | call | — |

### `actions/admin.ts` (admin)

`decideProviderAction({ providerId, decision, note? })` → `ProviderDecisionResult` · `reviewDocumentAction({ documentId, status, note?, validUntil? })` → `{ providerSuspended }` · `setProviderCommissionOverrideAction({ providerId, rate })` · `upsertCategoryAction(CategoryInput & { id? })` → `CategoryDTO` · `upsertServiceAction(ServiceInput & { id? })` → `ServiceDTO` · `adminCancelBookingAction({ bookingId, reason, feeCents? })` · `refundPaymentAction({ bookingId, amountCents, reason })` → `{ refundId }` · `updateDisputeStatusAction({ disputeId, status, note? })` · `resolveDisputeAction({ disputeId, outcome, note, refundCents? })` · `createCommissionRuleAction({ scope, categoryId?, providerId?, rate, repeatClientRate, ownClientRate })` → `{ id }` · `deactivateCommissionRuleAction(ruleId)` · `createPayoutBatchAction()` · `markPayoutPaidAction(payoutId)` · `upsertContentBlockAction({ key, value })` · `updatePlatformSettingAction({ key, value })` · `setUserBlockedAction({ userId, blocked, reason })` · `adjustCreditsAction({ userId, amountCents, note, reason? })` · `moderateReviewAction({ reviewId, isPublished, note? })` · **`exportUserDataAction({ userId })`** → `{ fileName, json }` · **`anonymizeUserAction({ userId, reason })`** → `AnonymizeResultDTO` · `runMaintenanceAction()` → `MaintenanceResult`.

Admin UI (audit-1 R20): `/admin/bewertungen` (list, filters Status / Sterne / *Mit Kontaktdaten*, search, hide/unhide with reason) and `/admin/nutzer/[id]` (account facts, bookings, credit ledger + adjustment form, *Daten exportieren*, *Konto anonymisieren* with blockers, block/unblock); names in `/admin/nutzer` link to the detail page.

Admin reads (lists, KPIs) are plain service calls from Server Components under `requireRole("admin")`.

## 6. Route handlers

| Route | Method | Auth | Behaviour |
|---|---|---|---|
| `/api/media/[...path]` | GET | public buckets: none; `documents/*`: owner or admin | Streams the file, `nosniff`, private files `no-store` + sandbox CSP. 401/403/404 as JSON. |
| `/api/webhooks/stripe` | POST | Stripe signature (`STRIPE_WEBHOOK_SECRET`) | `payment_intent.amount_capturable_updated` → booking out of `pending_payment`; `payment_intent.payment_failed`; `account.updated` → `payouts_enabled`. 404 unless `PAYMENTS_PROVIDER=stripe`. *Not covered by automated tests.* |
| `/api/cron/booking-maintenance` | POST (and GET for Vercel Cron) | `Authorization: Bearer ${CRON_SECRET}` (≥ 16 chars, timing-safe) | Runs `runBookingMaintenance()`, returns counts. |
| `/api/health` | GET | none | `{ status, db, latencyMs, providers, demoMode, time }`; 503 when the DB is down. |

## 7. Database notes for reviewers

* Migrations: `supabase/migrations/0001_core.sql` (tables, constraints), `0002_booking_engine.sql` (triggers), `0003_auth_and_helpers.sql` (`handle_new_user`, `is_admin()`, `provider_busy_ranges()`), `0004_rls.sql` (RLS, grants, views), `0005_vat_and_terms.sql` (`providers.vat_mode`, `providers.terms_accepted_at`, `bookings.vat_mode` snapshot trigger, grants, `provider_bookings.vat_mode`), `0006_policy_grace_and_privacy.sql` (cancellation policy v2 keys in `platform_settings`, `profiles.anonymized_at`), `0007_documents_expiry_and_auth_throttle.sql` (`provider_documents.expires_at` + provider insert grant, `app_private.auth_email_requests`, `request_response_hours` 12 → 4 when untouched), `0008_reauth_and_category_documents.sql` (audit-3 F2/F16, see §11), `0009_category_documents_strict.sql` (audit-4 A4-3: a category requirement counts only documents filed for that category; A4-1: `seed_mode()` also checks the session role, so API sessions can never opt in). Local-only shim: `supabase/local/000_supabase_shim.sql` (also replicates Supabase's default `GRANT ALL` to API roles, which `0004` revokes).
* Final guards in Postgres: exclusion constraint `bookings_no_overlap` on `blocked_range = [start, end + travel_buffer)`; `validate_booking_slot` (approved provider, active owned offering, Europe/Berlin weekly hours, time off incl. buffer, lead time, max advance, booking-mode snapshot); `enforce_booking_transition` (state graph, timing for start/no-show/complete, immutable price/time snapshot incl. Start-Code); `log_booking_event`; review validation and rating aggregates; non-negative credit balance; coordinates derived from the PLZ.
* Trigger errors are raised as `SOMA_*` codes and mapped to German messages in `src/server/db/errors.ts`.
* Providers read bookings only through the view `public.provider_bookings` (first name always; last name, address, coordinates after confirmation and up to 24 h after completion; phone only while confirmed/in progress; never e-mail or Start-Code). Public reviews come from `public.public_reviews` (no customer ids).
* Column grants: providers cannot update `status`, rating aggregates, `completed_count`, `commission_rate_override`, Stripe fields, `slug`, `invite_code` or coordinates; API roles cannot read `commission_rate_override`, `stripe_account_id`, `invite_code`, or booking commission internals. No API write grants on bookings, payments, refunds, payouts, credit_ledger, disputes, search_events, waitlist_signups.
* `withService` call sites each carry a comment saying why they bypass RLS (booking-engine writes after explicit checks, webhooks, maintenance, admin use cases after `assertAdmin`, auth schema access, analytics logging, invite-code checks).

## 8. Business rules implemented beyond the architecture text (Lead scope additions)

| Rule | Implementation |
|---|---|
| Commission tiers | `commission_rules.rate` (20 %), `repeat_client_rate` (12 %), `own_client_rate` (5 %). Tier order: **own_client** (link source `provider_invite`) → **repeat** (prior completed booking with this provider) → **base**; rule order provider → category → global. Snapshot in `bookings.commission_rate` + `bookings.commission_tier`. Travel fee is commission-free. `provider_client_links(provider_id, customer_id, source)` is created on registration with `inviteCode` (via `handle_new_user`) or on the first booking (`inviteCode` passed to `createBooking`, otherwise `platform`). First touch wins. |
| Start-Code | 4 digits per booking (`bookings.start_code`), visible to the customer while confirmed / in progress, required by `startBooking`, max. 5 wrong attempts (`start_code_attempts`). Never in provider views or DTOs. |
| Payout eligibility | payable 48 h (`payout_hold_hours`) after `completed_at` (or the cancellation time for retained fees) unless a dispute is open/investigating. |
| Category documents | `categories.required_documents jsonb` (`[{ kind, label }]`) + platform setting `base_required_documents`. `provider_documents.category_id` ties a qualification to a category. |
| Waitlist | `waitlist_signups` (citext e-mail, PLZ, category, city), insert only through `joinWaitlist`; counted in analytics. |
| SEO coverage | `getCityCategoryCoverage` → `indexable = providerCount >= 2`. |
| VAT notes (PAngV / § 19 UStG) | `providers.vat_mode`: `regular` (prices include 19 % USt) or `small_business` (Kleinunternehmer, default). Provider-editable (settings, onboarding submit). `bookings.vat_mode` is set **by a trigger** from the provider at insert and is immutable. `vatNote(mode, totalCents)` (`domain/pricing.ts`) on the total incl. travel fee: regular → `inkl. 19 % MwSt. (enthalten: 12,64 €)` with VAT = `round(total − total / 1.19)`; small_business → `Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.` (non-breaking spaces in `19 %`, `12,64 €`, `§ 19`). Shown in `QuoteDTO.vatNote` (checkout) and `CustomerBookingDTO.vatNote` (booking detail, from the snapshot). |
| Provider terms | `providers.terms_accepted_at`, set only by `submitForReview` (no provider UPDATE grant); exposed as `ProOnboardingDTO.termsAcceptedAt` and `AdminProviderDetailDTO.termsAcceptedAt` (admin also sees `vatMode`). |
| Cancellation policy v2 (audit-1 R10/R21) | Snapshot JSON `{ tiers: [{ min_hours_before, fee_percent, travel_fee_retained }], no_show_fee_percent, provider_cancellation, grace_minutes: 15, fee_basis: "service_price" }` (`docs/architecture.md` §5.5). Bedenkzeit: free while `now ≤ createdAt + 15 min` (never past the start). Tiers ≥ 24 h 0 %, ≥ 2 h 50 %, < 2 h 100 % of the **service price**; travel refunded ≥ 2 h, kept < 2 h and on no-show. Commission only on the kept service share (`splitRetainedAmounts(retainedService, retainedTravel, rate)`); kept travel 100 % to the provider. `CancellationPolicyDTO` gains **`graceMinutes`** and **`feeBasis`**, `CancellationTierDTO` and `PolicyScheduleEntryDTO` gain **`travelFeeRetained`**; `schedule`/`freeUntil` include the Bedenkzeit when it ends after the 24-h deadline (quotes use "now" as booking time). Legacy snapshots: no Bedenkzeit, travel kept in 100 % tiers. Admin: `/admin/provisionen` edits travel flags and the Bedenkzeit. |
| Phone exchange (audit-2 N12) | Deliberate v1 decision: providers see the customer's mobile only while confirmed / in progress (arrival coordination); customers never see the provider's number; e-mails are never exchanged. v1.1: phone relay. Documented in product-spec §11, architecture §3.3 and AGB-Profis. |
| Request response window (audit-1 R9, audit-2 N6) | Default **4 business hours** (08:00–21:00 Europe/Berlin), always capped at start − 2 h; `QuoteDTO.respondByPreview` shows the concrete deadline; the demo seed computes `respond_by` with `computeRespondBy` (no night deadlines). `computeRespondBy` (see `confirmDevPayment`); request-mode slots need ≥ 30 business minutes to answer (`earliestRequestStart(now, hours)` = now + 30 business minutes + 2 h) — enforced in `domain/availability` (slots, search, quote) and in `createBooking`. |
| German validation messages (audit-1 R17) | `z.config({ customError: germanIssueMessage })` in `services/_shared.ts`: "Bitte höchstens 500 Zeichen.", "Bitte mindestens 10 Zeichen.", "Bitte ausfüllen.", "Bitte höchstens 0,5 angeben.", "Bitte eine gültige E-Mail-Adresse angeben." … (neutral voice; schema-level messages still win). `endSentence(name)` avoids "Hanna B..". |

## 9. Setup, seed, tests

```bash
# dev database (local Postgres; AUTH_PROVIDER=local applies the Supabase shim)
DATABASE_URL=postgres://soma:soma@localhost:5432/soma npm run db:setup -- --reset   # shim + migrations + base seed
DATABASE_URL=postgres://soma:soma@localhost:5432/soma DEMO_MODE=true npm run db:seed  # demo data (refuses without DEMO_MODE=true)
npm run demo:refresh          # run right before a demo: reseed + one maintenance run (reads .env.local)

npm run typecheck
npm test                      # unit + integration (integration resets TEST_DATABASE_URL, default soma_test)
npm run test:unit
npm run test:integration
```

Demo logins (password `soma-demo-2026`):

* **`testkunde@soma.test`** (Julia H., customer): phone, 3 saved addresses (Zuhause 10435 Prenzlauer Berg, Büro 10117 Mitte, Hotel 60311 Frankfurt); 10 completed bookings over six months with 6 providers in 6 categories (rebooks with Selin, Linh, Jonas), 7 reviews (4–5 ★, 3 with replies), one recent booking still reviewable; 3 upcoming confirmed bookings (with Selin ≈ 35 minutes after the seed, in 2–3 days at home, next week at the office); 1 open request with Selin (deadline from `computeRespondBy`); 1 cancellation with the policy fee (50 % of the treatment, travel refunded); 3 favourites; credits 15 € referral reward + 10 € goodwill, 10 € redeemed (balance 15 €); referrals 1 rewarded / 1 pending; 6 notifications (2 unread); notification preferences set.
* **`testkunde-b2b@soma.test`** (Selin A., provider — SOMA's B2B customer): portrait, bio, 5 services, service area, Mon–Sat hours; all documents approved (insurance valid ~11 months); VAT `regular`, request mode; a confirmed appointment with testkunde ≈ 35 minutes after the seed plus confirmed appointments on several of the next 7 days; 2 open requests (deadlines in business hours); six months of history with base / repeat / own-client tiers (2 own clients via `provider_client_links`), earnings pending / available / paid out, 3 paid payouts; 28+ reviews (≈ 4.8 ★, about a third answered, replies written per review); invite code.
* **`testadmin@soma.test`**: verification queue (Nora K., Paul A.), 1 open dispute, Leyla A. automatically suspended by an expired insurance (and Charlotte J.'s expiring in 9 days) in *Dokumente & Sperren*, eligible payouts, waitlist sign-ups and zero-result searches, audit history.

The demo also contains 28 approved providers (Berlin 7, München 6, Hamburg 6, Köln 3, Frankfurt 3, Düsseldorf 3; all with portraits) plus 2 in the verification queue, 44 customers, ~200 bookings with ~130 unique German reviews, cancellations, no-shows, paid payouts, two disputes, 420 search events and 12 waitlist sign-ups. All timestamps are relative to the seed time; re-running replaces the demo data. E2E also uses `anna@kunden.soma.test` and `hanna@profis.soma.test`.

**`npm run demo:refresh` — run right before a demo** (audit-3 F5; `scripts/db/demo-refresh.ts`): the seed plus `runBookingMaintenance()`. Relative to the seed time it creates a **confirmed testkunde ↔ testkunde-b2b appointment starting ≈ 35 minutes later** (*Termin starten* is possible after ≈ 5 minutes; Selin's weekly window for that weekday is widened when needed) and Selin's **2 open requests with `respond_by` ≥ 3 h ahead** (evening runs: answer due the next morning; the seed fails otherwise). Every seeded event and notification stamp lies within 08:00–21:00 Europe/Berlin; booking `created_at` is spread over a 1–14-day lead time with a full status history (`booking_events`), provider status events follow sign-up → submitted → in review → approved, seeded audit rows carry no `demo` marker (cleanup finds them by demo actor/entity), and 24-h reminders count as sent. Apply pending migrations first (`npm run db:setup`).

**Seed content rules (audit-3 F3/F4):** review templates are tagged per service (`ReviewTemplate.services`, `reviewFits()` in `scripts/db/lib/demo-data.ts`), each text is used once and a reply is only ever the one written for that review (critical reviews get an apologetic one). Portfolio images and captions come from `scripts/images/sources.json`: every public provider (also the suspended Leyla A.) gets exactly 3 — one category: 3 from it; two or more: 2 from the primary (most offerings) and 1 from the secondary; scarcest pools first; captions naming a service go to providers who offer it. The seed fails if a path is missing from `sources.json`, used twice or a public provider does not have 3.

## 10. Deviations from `docs/architecture.md`

| Deviation | Why |
|---|---|
| `providers.avatar_path` added (in addition to `profiles.avatar_path`) | Public profile photos must be readable by `anon`; `profiles` is private by RLS. |
| Extra columns: `providers.invite_code`, `providers.submitted_at`, `profiles.blocked_at`, `bookings.commission_tier`, `bookings.start_code`, `bookings.start_code_attempts`, `bookings.reminder_24h_sent_at`, `provider_documents.category_id/mime_type/size_bytes`, `payments` CHECKs, `reviews.tags`, `disputes.updated_at`; extra tables `provider_client_links`, `waitlist_signups` | Lead scope additions (commission tiers, Start-Code, waitlist, category documents), admin user blocking, idempotent reminders, review tags from the product spec. |
| Providers read bookings through the view `provider_bookings`, not the table | Column-level grants cannot depend on the booking status; the view implements "address only after confirmation". |
| `schema_migrations` lives in schema `soma_meta` | It survives `public` being rebuilt and is not exposed via the Data API. |
| Booking time guards in the DB use `now()`: start ≥ `startsAt − 30 min`, no-show ≥ `startsAt + 15 min`, complete ≥ `startsAt` | "DB is the final guard". Expiry has no DB time guard so maintenance can run with an injected clock in tests. |
| Capture happens on completion (architecture §5.6), not on acceptance (product spec §7) | Architecture is binding. Stripe authorizations are valid for 7 days (see open items). |
| Analytics demand logging and waitlist inserts use `withService` | Granting INSERT to `anon` would allow spamming via the Data API. |
| `GET /api/cron/booking-maintenance` is accepted besides POST | Vercel Cron sends GET with the bearer token. |
| `AuthAdapter.signUp` signs the user in immediately (local); Supabase may require e-mail confirmation | Local dev has no mailbox. |
| Status `in_progress → cancelled` allowed for admins | Needed to settle disputes during an appointment. |

## 11. Open items / not covered by automated tests

* **Migration 0008 must be applied before the next build/restart** (`npm run db:setup`, applied on the dev DB on 30.10.): `provider_services.awaiting_documents`, trigger `provider_services_10_require_documents`, function `category_documents_complete(provider, category)` (used by `getProviderProfile` and the admin alerts), table `app_private.reauth_attempts`.
* **Migration 0007 must be applied before the next build/restart** (`npm run db:setup`): documents read `expires_at`, the reset throttle writes `app_private.auth_email_requests`.
* **Migration 0006 must be applied before the next build/restart** (`npm run db:setup`, no `--reset`): the admin user detail and anonymisation read `profiles.anonymized_at`; the policy keys are added to the platform setting (existing booking snapshots keep their policy).
* **Migration 0005 must be applied before the next build/restart** against an existing database: `npm run db:setup` (without `--reset`) applies pending migrations only. The code reads `providers.vat_mode` / `bookings.vat_mode`; without 0005 quotes and bookings fail. Existing rows default to `small_business` and `terms_accepted_at = null`; re-running the demo seed (`DEMO_MODE=true npm run db:seed`) gives the ~40 % regular mix.

* **Stripe** provider + webhook and **Supabase** auth/storage adapters are implemented against the SDKs but cannot be tested here (no keys). Missing for Stripe: SetupIntent + off-session PaymentIntent for bookings more than 6 days ahead (authorizations expire after 7 days); Payment Element UI. With destination charges the provider receives funds at capture; the `payouts` table then mirrors Stripe payouts (dev: batches created in admin).
* **Lead config request:** uploads go through Server Actions, so `next.config.ts` needs `experimental: { serverActions: { bodySizeLimit: "11mb" } }` (documents ≤ 10 MB). Until then, uploads above 1 MB are rejected by Next.
* `resend` e-mail adapter is a thin HTTP client (untested). SMS / push channels are stored as preferences only.
* Not implemented: rescheduling (cancel + rebook covers it), chat, cadence reminders, instant-mode unlock rule (product spec §9 step 5), provider no-show compensation credit (product spec §7), DAC7 export.
