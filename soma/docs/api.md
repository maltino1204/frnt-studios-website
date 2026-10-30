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
| `getSession` | `() => Promise<Session \| null>` | React `cache()` per request. `Session = { userId, role, email, firstName, providerStatus? }`. Blocked accounts get `null`. |
| `requireUser` | `(next?: string) => Promise<Session>` | Pages/layouts: redirects to `/anmelden?next=…`. |
| `requireRole` | `(role: AppRole, next?: string) => Promise<Session>` | Pages/layouts: wrong role → `homeForRole(role)` (`/konto`, `/pro`, `/admin`). |
| `authorize` | `(role?: AppRole \| AppRole[]) => Promise<Session>` | Actions/route handlers: throws `ServiceError` instead of redirecting. |
| `homeForRole` | `(role: AppRole) => string` | |

Module paths: `@/server/auth/guards` (re-exports `getSession`), `@/server/auth/session` (`getAuthAdapter`, `getRequestMeta`).
`AuthAdapter` (`@/server/auth/adapter`): `signUp`, `signIn`, `signOut`, `getUserId`, `requestPasswordReset`, `resetPassword`, `changePassword`.
**local**: scrypt (`N=32768,r=8,p=1`) in `auth.users.encrypted_password`; opaque 256-bit tokens, only `sha256(token)` stored in `app_private.local_sessions`; cookie `soma_session` (httpOnly, `secure` in production, `sameSite=lax`, 30 days, rotated on login, deleted on logout); login rate limit 5 failures per e-mail / 20 per IP in 15 minutes (`app_private.login_attempts`); password ≥ 10 characters. **supabase**: `@supabase/ssr` (`getUser()` server-side); *not covered by automated tests*.

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
| `getProviderProfile(slug: string, viewerId?: string \| null, opts?: { inviteCode?: string })` | `Promise<ProviderProfileDTO \| null>`: approved providers only. Includes offerings, portfolio, first review page, `cancellationPolicy`, `isFavorite` (when `viewerId`), `inviteValid` (when `inviteCode` is passed: forward the code to `createBookingAction({ inviteCode })` / `signUpAction` field `inviteCode`). |
| `listFeaturedProviders(citySlug?: string, limit = 8)` | `Promise<ProviderCardDTO[]>` |
| `getProviderAvailability(providerId: string, providerServiceId: string, from: string, days: number)` | `Promise<SlotsByDayDTO[]>` (`days` 1–31; past `from` is clamped to today) |
| `isValidInviteCode(providerId: string, code: string)` | `Promise<boolean>` |

### 4.4 `services/bookings.ts`

| Function | Role | Returns / notes |
|---|---|---|
| `quoteBooking(input: QuoteInput, session?: Session \| null)` | public (credits / saved addresses need a customer session) | `Promise<QuoteDTO>`: price breakdown, `slotAvailable`, `withinServiceArea`, `distanceKm`, policy + concrete `schedule` + `freeUntil`, `holdMinutes`, `paymentProvider`, `vatMode`, **`vatNote`** (see §8, VAT notes). Show it **before** confirmation (PAngV). |
| `createBooking(session, input: CreateBookingInput)` | customer | `Promise<CreateBookingResult>` `{ bookingId, reference, status: "pending_payment", holdExpiresAt, totalCents, paymentProvider, paymentClientSecret }`. Holds the slot for `hold_minutes` (10). Checks service area, slot validity (same function as the slot list), commission tier, credits. Concurrent attempts: exactly one wins, the other gets `slot_taken` ("Dieser Termin wurde gerade vergeben. Bitte wählen Sie eine andere Uhrzeit."). |
| `confirmDevPayment(session, bookingId: string)` | customer, `PAYMENTS_PROVIDER=dev` | `Promise<{ status }>`: `requested` (request mode, sets `respondBy`) or `confirmed` (instant). Expired hold → `invalid_state`. |
| `providerRespond(session, bookingId: string, decision: "accept" \| "decline", note?: string)` | provider | `Promise<{ status }>`. Decline needs a reason (≥ 3 chars); releases the authorization. |
| `startBooking(session, bookingId: string, code: string)` | provider | `Promise<{ status: "in_progress" }>`. Needs the customer's 4-digit **Start-Code**; from `startsAt − 30 min`; at most 5 wrong attempts, then `rate_limited`. |
| `completeBooking(session, bookingId: string)` | provider | `Promise<{ status: "completed" }>`: from `startsAt`; captures the payment, triggers the review request and the referral reward. |
| `markNoShow(session, bookingId: string)` | provider | `Promise<{ status: "no_show"; feeCents }>`: from `startsAt + 15 min`, 100 % fee. |
| `cancelBooking(session, bookingId: string, reason?: string)` | customer (own) / provider (own, reason required, `confirmed` only) | `Promise<{ status: "cancelled"; feeCents; refundCents }>`. Fee per snapshotted policy (≥ 24 h free, ≥ 2 h 50 %, < 2 h 100 % of `total − serviceFee`); `requested`/holds are free; provider cancellations are a full refund. Redeemed credits come back proportionally. |
| `getBookingForCustomer(session, bookingId: string)` | customer (own) | `Promise<CustomerBookingDTO \| null>`: includes `startCode` (only while `confirmed`/`in_progress`), `vatMode` + `vatNote` from the booking's snapshot, `cancellation.ifCancelledNow`, `payment`, `events`, flags `canPay`, `canCancel`, `canReview`, `canDispute`, `canRebook`. |
| `listCustomerBookings(session, scope: "upcoming" \| "past", page = 1, pageSize = 20)` | customer | `Promise<Paginated<BookingListItemDTO>>` |
| `getBookingForProvider(session, bookingId: string)` | provider (own) | `Promise<ProviderBookingDTO \| null>`: **never** contains the Start-Code or any e-mail; last name, street address and phone are `null` until the booking is confirmed (address hidden again 24 h after completion). `actions.*` flags tell the UI which buttons to show. |
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
| `createAddress(session, input: AddressInput)` | customer | `Promise<AddressDTO>`: first address becomes default; max. 20 |
| `updateAddress(session, addressId, input: AddressInput)` | customer | `Promise<AddressDTO>` |
| `deleteAddress(session, addressId)` / `setDefaultAddress(session, addressId)` | customer | `Promise<void>` |
| `toggleFavorite(session, providerId)` | customer | `Promise<{ favorite: boolean }>` |
| `listFavorites(session)` | customer | `Promise<FavoriteDTO[]>` |
| `getNotificationPreferences(session)` / `updateNotificationPreferences(session, prefs)` | any | `Promise<NotificationPreferencesDTO>` |
| `getCreditSummary(session)` | customer | `Promise<CreditSummaryDTO>` `{ balanceCents, entries[] }` (with German `reasonLabel`) |
| `getReferralInfo(session)` | customer | `Promise<ReferralInfoDTO>` (`shareUrl` = `/registrieren?empfehlung=<code>`) |
| `openDispute(session, bookingId, reason: DisputeReason, description: string)` | customer, provider (participant) | `Promise<{ disputeId }>`: within 48 h (`dispute_window_hours`); holds the booking's payout |
| `listMyDisputes(session)` | customer, provider | `Promise<DisputeDTO[]>` |

`AddressInput = { label?, kind?: "home" | "hotel" | "office" | "other", street, houseNumber, postalCode, city, details?, isDefault? }`. Coordinates are always derived from the PLZ centroid.

### 4.7 `services/reviews.ts`

| Function | Role | Returns / notes |
|---|---|---|
| `listProviderReviews(providerId: string, page = 1, pageSize = 10)` | public | `Promise<ReviewListDTO>` (published only; `authorName` = "Vorname N."; `distribution` by stars) |
| `createReview(session, bookingId: string, rating: number, comment?: string \| null, tags?: string[])` | customer | `Promise<{ reviewId }>`: only for own **completed** bookings, once, within 14 days. Tags from `REVIEW_TAG_OPTIONS` (max. 3): "Pünktlich", "Professionell", "Freundlich", "Entspannend", "Sauber gearbeitet", "Gute Beratung", "Wieder buchen". Provider rating aggregates update via trigger. |
| `replyToReview(session, reviewId: string, reply: string)` | provider | `Promise<void>`: one public reply per review |

### 4.8 `services/pro.ts` (provider; messages use *du*)

| Function | Returns / notes |
|---|---|
| `getProDashboard(session)` | `Promise<ProDashboardDTO>`: today, open requests (with `respondBy`), upcoming count, week earnings, rating, onboarding state, unread notifications |
| `getOnboardingState(session)` | `Promise<ProOnboardingDTO>`: `steps[]` (`profile`, `services`, `area`, `hours`, `documents`, `payout`), `missingDocuments[]` per offered category (e.g. Haare & Styling: "Meisterbrief oder Eintragung in die Handwerksrolle") plus platform-wide ones, `canSubmit`, `lastDecisionNote`, `termsAcceptedAt` |
| `submitForReview(session, { termsAccepted: true, vatMode?: VatMode })` | `Promise<ProOnboardingDTO>`: `draft`/`rejected` → `submitted` (all steps except payout done). `termsAccepted` must be `true` (AGB für Profis + Verhaltenskodex), otherwise `validation` with `fieldErrors.termsAccepted` = "Bitte bestätige die AGB für Profis und den SOMA-Verhaltenskodex.". Sets `terms_accepted_at`; stores `vatMode` when given. |
| `getProProfile(session)` / `updateProProfile(session, { displayName, headline?, bio? (≤ 400), yearsExperience?, languages: string[] })` | `Promise<ProProfileDTO>`. Healing or medical claims (HWG) are rejected with a hint. |
| `updateServiceArea(session, { basePostalCode, serviceRadiusKm (3–30), travelFeeBaseCents (0–3000), travelFeeIncludedKm, travelFeePerKmCents })` | `Promise<ProProfileDTO>` |
| `listProServices(session)` | `Promise<ProServiceDTO[]>` (incl. inactive) |
| `upsertProService(session, { serviceId, durationMinutes, priceCents (500–100000), isActive? })` | `Promise<ProServiceDTO>`: the duration is one of the service's durations or within ±30 % of the default (5-min steps) |
| `deleteProService(session, providerServiceId)` | `Promise<{ deleted; deactivated }>`: offerings with bookings are deactivated |
| `getWeeklyHours(session)` / `setWeeklyHours(session, windows: { weekday (1=Mo…7=So), start "HH:MM", end "HH:MM" \| "24:00" }[])` | `Promise<WeeklyHoursDTO[]>`: replace-all; several windows per day, no overlaps |
| `listTimeOff(session)` / `addTimeOff(session, { start, end, reason? })` / `deleteTimeOff(session, id)` | `TimeOffDTO[]` / `{ id, conflictingBookings }` / `void` |
| `listDocuments(session)` | `Promise<DocumentDTO[]>` (`url` → authorised `/api/media/documents/…`) |
| `uploadDocument(session, kind: DocumentKind, file: UploadInput, categoryId?: string \| null)` | `Promise<DocumentDTO>` (pdf/jpeg/png ≤ 10 MB; pass `categoryId` for category qualifications) |
| `deleteDocument(session, documentId)` | `Promise<void>` (pending documents only) |
| `uploadPortfolioImage(session, file, { caption?, categoryId? })` / `updatePortfolioItem(session, itemId, { caption?, sortOrder?, categoryId? })` / `deletePortfolioItem(session, itemId)` | max. 24 images |
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
| `adjustCredits(session, userId, amountCents, note, reason = "admin_adjustment" \| "goodwill")` | `Promise<void>` |
| `listProvidersAdmin(session, { status?: ProviderStatus \| ProviderStatus[], q?, page?, pageSize? })` | `Promise<Paginated<AdminProviderListItemDTO>>` (`missingDocuments` counts required documents that are missing **or not yet approved**) |
| `listVerificationQueue(session)` | `Promise<AdminProviderListItemDTO[]>` (submitted + in_review) |
| `getProviderForAdmin(session, providerId)` | `Promise<AdminProviderDetailDTO \| null>` |
| `decideProvider(session, providerId, decision: "approve" \| "reject" \| "start_review" \| "suspend" \| "reinstate", note?)` | `Promise<ProviderDecisionResult>` `{ status, warnings[] }`: approval with missing/unapproved required documents is allowed but returns warnings ("Fehlendes oder ungeprüftes Dokument: …"). Reject/suspend need a note. |
| `reviewDocument(session, documentId, "approved" \| "rejected", note?)` | `Promise<void>` |
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
| `moderateReview(session, reviewId, isPublished, note?)` | |
| `listAuditLog(session, { entity?, page?, pageSize? })` | `Paginated<AuditLogEntryDTO>` |
| `listWaitlist(session, { citySlug? })` | waitlist sign-ups (admin only; e-mails are never exposed elsewhere) |

### 4.12 `services/analytics.ts` (admin only)

| Function | Returns |
|---|---|
| `getMarketplaceKpis(session, { from?, to? })` (ISO, default last 30 days) | `MarketplaceKpisDTO`: GMV, net revenue (commission + service fee − credits), bookings by status, searches, zero-result searches, conversion search → booking, repeat rate (non-base commission tier), average rating, provider utilisation, active providers, new customers, waitlist sign-ups |
| `getSupplyDemandByCity(session, { days? })` | `SupplyDemandRowDTO[]`: per launch city: searches, zero-result searches, waitlist, approved providers, bookings, open slot-hours in the next 7 days, and `byCategory[]` (providers / searches / waitlist) |
| `getTimeSeries(session, { days? })` | `TimeSeriesPointDTO[]`: daily bookings, completions, GMV, searches |

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

`decideProviderAction({ providerId, decision, note? })` → `ProviderDecisionResult` · `reviewDocumentAction({ documentId, status, note? })` · `setProviderCommissionOverrideAction({ providerId, rate })` · `upsertCategoryAction(CategoryInput & { id? })` → `CategoryDTO` · `upsertServiceAction(ServiceInput & { id? })` → `ServiceDTO` · `adminCancelBookingAction({ bookingId, reason, feeCents? })` · `refundPaymentAction({ bookingId, amountCents, reason })` → `{ refundId }` · `updateDisputeStatusAction({ disputeId, status, note? })` · `resolveDisputeAction({ disputeId, outcome, note, refundCents? })` · `createCommissionRuleAction({ scope, categoryId?, providerId?, rate, repeatClientRate, ownClientRate })` → `{ id }` · `deactivateCommissionRuleAction(ruleId)` · `createPayoutBatchAction()` · `markPayoutPaidAction(payoutId)` · `upsertContentBlockAction({ key, value })` · `updatePlatformSettingAction({ key, value })` · `setUserBlockedAction({ userId, blocked, reason })` · `adjustCreditsAction({ userId, amountCents, note, reason? })` · `moderateReviewAction({ reviewId, isPublished, note? })` · `runMaintenanceAction()` → `MaintenanceResult`.

Admin reads (lists, KPIs) are plain service calls from Server Components under `requireRole("admin")`.

## 6. Route handlers

| Route | Method | Auth | Behaviour |
|---|---|---|---|
| `/api/media/[...path]` | GET | public buckets: none; `documents/*`: owner or admin | Streams the file, `nosniff`, private files `no-store` + sandbox CSP. 401/403/404 as JSON. |
| `/api/webhooks/stripe` | POST | Stripe signature (`STRIPE_WEBHOOK_SECRET`) | `payment_intent.amount_capturable_updated` → booking out of `pending_payment`; `payment_intent.payment_failed`; `account.updated` → `payouts_enabled`. 404 unless `PAYMENTS_PROVIDER=stripe`. *Not covered by automated tests.* |
| `/api/cron/booking-maintenance` | POST (and GET for Vercel Cron) | `Authorization: Bearer ${CRON_SECRET}` (≥ 16 chars, timing-safe) | Runs `runBookingMaintenance()`, returns counts. |
| `/api/health` | GET | none | `{ status, db, latencyMs, providers, demoMode, time }`; 503 when the DB is down. |

## 7. Database notes for reviewers

* Migrations: `supabase/migrations/0001_core.sql` (tables, constraints), `0002_booking_engine.sql` (triggers), `0003_auth_and_helpers.sql` (`handle_new_user`, `is_admin()`, `provider_busy_ranges()`), `0004_rls.sql` (RLS, grants, views), `0005_vat_and_terms.sql` (`providers.vat_mode`, `providers.terms_accepted_at`, `bookings.vat_mode` snapshot trigger, grants, `provider_bookings.vat_mode`). Local-only shim: `supabase/local/000_supabase_shim.sql` (also replicates Supabase's default `GRANT ALL` to API roles, which `0004` revokes).
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

## 9. Setup, seed, tests

```bash
# dev database (local Postgres; AUTH_PROVIDER=local applies the Supabase shim)
DATABASE_URL=postgres://soma:soma@localhost:5432/soma npm run db:setup -- --reset   # shim + migrations + base seed
DATABASE_URL=postgres://soma:soma@localhost:5432/soma DEMO_MODE=true npm run db:seed  # demo data (refuses without DEMO_MODE=true)

npm run typecheck
npm test                      # unit + integration (integration resets TEST_DATABASE_URL, default soma_test)
npm run test:unit
npm run test:integration
```

Demo logins (password `soma-demo-2026`): `kundin@soma.test` (Julia H., Berlin: past bookings, one reviewable; an open request with Selin; a confirmed manicure; 10 € credit; referral), `profi@soma.test` (Selin A., Berlin massage, request mode: 3 confirmed upcoming, 2 open requests), `admin@soma.test`. The demo also contains 28 approved providers (Berlin 7, München 6, Hamburg 6, Köln 3, Frankfurt 3, Düsseldorf 3) plus 2 in the verification queue, 42 customers, ~125 completed historical bookings with ~105 German reviews, cancellations, no-shows, paid payouts, two disputes, 420 search events and 12 waitlist sign-ups. All timestamps are relative to the seed time; re-running replaces the demo data.

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

* **Migration 0005 must be applied before the next build/restart** against an existing database: `npm run db:setup` (without `--reset`) applies pending migrations only. The code reads `providers.vat_mode` / `bookings.vat_mode`; without 0005 quotes and bookings fail. Existing rows default to `small_business` and `terms_accepted_at = null`; re-running the demo seed (`DEMO_MODE=true npm run db:seed`) gives the ~40 % regular mix.

* **Stripe** provider + webhook and **Supabase** auth/storage adapters are implemented against the SDKs but cannot be tested here (no keys). Missing for Stripe: SetupIntent + off-session PaymentIntent for bookings more than 6 days ahead (authorizations expire after 7 days); Payment Element UI. With destination charges the provider receives funds at capture; the `payouts` table then mirrors Stripe payouts (dev: batches created in admin).
* **Lead config request:** uploads go through Server Actions, so `next.config.ts` needs `experimental: { serverActions: { bodySizeLimit: "11mb" } }` (documents ≤ 10 MB). Until then, uploads above 1 MB are rejected by Next.
* `resend` e-mail adapter is a thin HTTP client (untested). SMS / push channels are stored as preferences only.
* Not implemented: rescheduling (cancel + rebook covers it), chat, cadence reminders, instant-mode unlock rule (product spec §9 step 5), provider no-show compensation credit (product spec §7), DAC7 export.
