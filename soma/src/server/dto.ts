/**
 * SOMA service-layer DTOs — the contract between src/server and the UI.
 *
 * Types only (no runtime code, no "server-only"), so Client Components may use
 * `import type { … } from "@/server/dto"`. All values are JSON-serialisable:
 * instants are ISO-8601 UTC strings, money is integer cents (EUR), local dates
 * are 'YYYY-MM-DD' (Europe/Berlin).
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export type AppRole = "customer" | "provider" | "admin";
export type ProviderStatus = "draft" | "submitted" | "in_review" | "approved" | "rejected" | "suspended";
export type BookingStatus =
  | "pending_payment" | "requested" | "confirmed" | "in_progress" | "completed"
  | "cancelled" | "declined" | "expired" | "no_show";
export type BookingMode = "instant" | "request";
export type LocationKind = "home" | "hotel" | "office" | "other";
export type ActorRole = "customer" | "provider" | "admin" | "system";
export type CommissionTier = "base" | "repeat" | "own_client";
export type DocumentKind = "id_document" | "business_registration" | "qualification" | "insurance" | "other";
export type DocumentStatus = "pending" | "approved" | "rejected";
export type PaymentProviderId = "dev" | "stripe";
export type PaymentStatus =
  | "requires_payment_method" | "authorized" | "captured" | "partially_refunded" | "refunded" | "cancelled" | "failed";
export type PayoutStatus = "pending" | "in_transit" | "paid" | "failed";
export type CreditReason =
  | "referral_reward" | "referral_welcome" | "booking_redemption" | "booking_refund" | "admin_adjustment" | "goodwill";
export type DisputeReason = "quality" | "provider_no_show" | "customer_no_show" | "damage" | "payment" | "safety" | "other";
export type DisputeStatus = "open" | "investigating" | "resolved_refund" | "resolved_no_action" | "closed";
export type SearchSort = "recommended" | "earliest" | "price_asc" | "rating";
export type TimeOfDay = "morning" | "afternoon" | "evening";
/** "regular" = prices include 19 % USt; "small_business" = Kleinunternehmer (§ 19 UStG) */
export type VatMode = "regular" | "small_business";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------
export interface Session {
  userId: string;
  role: AppRole;
  email: string;
  firstName: string | null;
  providerStatus?: ProviderStatus;
  /** DEMO_MODE shared login (audit-3 F7): password, e-mail, deletion and admin blocking are disabled */
  isDemoAccount: boolean;
}

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------
export interface RequiredDocumentDTO {
  kind: DocumentKind;
  label: string;
}

export interface CategoryDTO {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  imagePath: string | null;
  sortOrder: number;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  requiredDocuments: RequiredDocumentDTO[];
}

export interface ServiceDTO {
  id: string;
  categoryId: string;
  categorySlug: string;
  slug: string;
  name: string;
  description: string | null;
  durations: number[];
  defaultDuration: number;
  priceHintFromCents: number | null;
  attributes: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
}

export interface CategoryWithServicesDTO extends CategoryDTO {
  services: ServiceDTO[];
}

export interface CityDTO {
  slug: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  isActive: boolean;
  sortOrder: number;
}

export interface PostalCodeDTO {
  postalCode: string;
  lat: number;
  lng: number;
  citySlug: string | null;
  cityName: string | null;
  isLaunchCity: boolean;
}

export interface CoverageDTO {
  citySlug: string;
  categorySlug: string;
  providerCount: number;
  /** false → render the SEO page with `robots: { index: false }` */
  indexable: boolean;
}

export interface ContentBlockDTO {
  key: string;
  value: unknown;
  updatedAt: string;
}

export interface CancellationTierDTO {
  minHoursBefore: number;
  /** percent of the service price (fee basis = service price only) */
  feePercent: number;
  /** true: the travel fee is kept in this tier (< 2 h); false: refunded */
  travelFeeRetained: boolean;
}

export interface CancellationPolicyDTO {
  tiers: CancellationTierDTO[];
  /** percent of the service price on no-show; the travel fee is always kept */
  noShowFeePercent: number;
  /** Bedenkzeit: free cancellation within this many minutes after booking (15) */
  graceMinutes: number;
  feeBasis: "service_price";
}

export interface PolicyScheduleEntryDTO {
  /** tier applies from this instant (null = any time before) */
  from: string | null;
  /** … until this instant (null = and afterwards) */
  until: string | null;
  feePercent: number;
  /** travel fee kept in this period */
  travelFeeRetained: boolean;
  label: string;
}

// ---------------------------------------------------------------------------
// Providers & search
// ---------------------------------------------------------------------------
export interface ProviderCardDTO {
  providerId: string;
  slug: string;
  displayName: string;
  headline: string | null;
  /** ready-to-use URL ('/images/…' or '/api/media/…'), null → show initials */
  avatarUrl: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  completedCount: number;
  bookingMode: BookingMode;
  languages: string[];
  citySlug: string | null;
  cityName: string | null;
}

export interface OfferingDTO {
  providerServiceId: string;
  serviceId: string;
  serviceSlug: string;
  serviceName: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  durationMinutes: number;
  priceCents: number;
}

export interface SlotsByDayDTO {
  /** local date 'YYYY-MM-DD' (Europe/Berlin) */
  date: string;
  /** ISO weekday 1 = Mo … 7 = So */
  weekday: number;
  /** slot start instants (ISO UTC), ascending */
  slots: string[];
}

export interface SearchInput {
  postalCode: string;
  categorySlug?: string;
  serviceId?: string;
  durationMinutes?: number;
  /** 'YYYY-MM-DD'; omitted → next 7 days */
  date?: string;
  timeOfDay?: TimeOfDay;
  sort?: SearchSort;
  page?: number;
  pageSize?: number;
  instantOnly?: boolean;
  minRating?: number;
  language?: string;
}

export interface SearchLocationDTO {
  postalCode: string;
  lat: number;
  lng: number;
  citySlug: string | null;
  cityName: string | null;
  isLaunchCity: boolean;
}

export interface ProviderSearchResult extends ProviderCardDTO {
  distanceKm: number;
  travelFeeCents: number;
  offering: OfferingDTO;
  /** Endpreis: service + travel fee (PAngV) */
  totalPriceCents: number;
  /** up to 6 next slot instants (ISO) */
  nextSlots: string[];
  firstSlot: string | null;
  isFavorite: boolean;
  score: number;
}

export interface SearchResultDTO {
  location: SearchLocationDTO;
  results: ProviderSearchResult[];
  total: number;
  page: number;
  pageSize: number;
  /** true when the search was written to search_events (demand analytics) */
  demandLogged: boolean;
  date: string | null;
}

export interface PortfolioItemDTO {
  id: string;
  url: string;
  caption: string | null;
  categoryId: string | null;
  sortOrder: number;
}

export interface ReviewDTO {
  id: string;
  rating: number;
  comment: string | null;
  tags: string[];
  /** "Anna M." or null */
  authorName: string | null;
  serviceName: string;
  createdAt: string;
  providerReply: string | null;
  providerRepliedAt: string | null;
}

export interface ReviewListDTO extends Paginated<ReviewDTO> {
  ratingAvg: number | null;
  ratingCount: number;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
}

export interface ProviderProfileDTO extends ProviderCardDTO {
  bio: string | null;
  yearsExperience: number | null;
  serviceRadiusKm: number;
  travelFee: { baseCents: number; includedKm: number; perKmCents: number };
  leadTimeMinutes: number;
  maxAdvanceDays: number;
  approvedAt: string | null;
  offerings: OfferingDTO[];
  portfolio: PortfolioItemDTO[];
  reviews: ReviewListDTO;
  isFavorite: boolean;
  cancellationPolicy: CancellationPolicyDTO;
  /** true when the request came with a valid `?einladung=` code */
  inviteValid?: boolean;
  /**
   * audit-3 F2: category qualifications actually verified (approved, valid documents) for the
   * categories the provider offers — use this for "Was wir geprüft haben".
   */
  verifiedQualifications: Array<{ categorySlug: string; categoryName: string; label: string }>;
}

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------
export interface QuoteInput {
  providerServiceId: string;
  /** slot start (ISO) */
  startsAt: string;
  /** either a postal code (anonymous / new address) … */
  postalCode?: string;
  /** … or a saved address of the customer */
  addressId?: string;
  useCredits?: boolean;
  /** provider invite code from `/profis/[slug]?einladung=` */
  inviteCode?: string;
}

export interface PriceBreakdownDTO {
  servicePriceCents: number;
  travelFeeCents: number;
  serviceFeeCents: number;
  discountCents: number;
  totalCents: number;
}

export interface QuoteDTO {
  providerServiceId: string;
  providerId: string;
  providerName: string;
  providerSlug: string;
  serviceName: string;
  durationMinutes: number;
  startsAt: string;
  endsAt: string;
  slotAvailable: boolean;
  withinServiceArea: boolean;
  distanceKm: number;
  bookingMode: BookingMode;
  price: PriceBreakdownDTO;
  creditsAvailableCents: number;
  cancellation: { policy: CancellationPolicyDTO; schedule: PolicyScheduleEntryDTO[]; freeUntil: string | null };
  holdMinutes: number;
  /** business hours (08:00–21:00 Europe/Berlin) the provider has to answer a request */
  requestResponseHours: number;
  /** request mode only: ISO deadline the provider would get if the request were sent now (≤ start − 2 h); null for instant */
  respondByPreview: string | null;
  paymentProvider: PaymentProviderId;
  /** provider's current VAT mode */
  vatMode: VatMode;
  /** PAngV note for the total: "inkl. 19 % MwSt. (enthalten: 12,64 €)" or "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet." */
  vatNote: string;
}

export interface NewAddressInput {
  kind: LocationKind;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  details?: string;
  label?: string;
  /** also store it in the customer's address book */
  save?: boolean;
}

export interface CreateBookingInput {
  providerServiceId: string;
  startsAt: string;
  address: { addressId: string } | NewAddressInput;
  notes?: string;
  useCredits?: boolean;
  inviteCode?: string;
  rebookedFromId?: string;
}

export interface CreateBookingResult {
  bookingId: string;
  reference: string;
  status: BookingStatus;
  holdExpiresAt: string | null;
  totalCents: number;
  paymentProvider: PaymentProviderId;
  /** Stripe Payment Element client secret (null for the dev provider) */
  paymentClientSecret: string | null;
}

export interface PaymentSummaryDTO {
  provider: PaymentProviderId;
  status: PaymentStatus;
  amountCents: number;
  capturedCents: number;
  refundedCents: number;
  cardBrand: string | null;
  cardLast4: string | null;
}

export interface BookingEventDTO {
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  actorRole: ActorRole;
  note: string | null;
  createdAt: string;
}

export interface CustomerBookingDTO {
  id: string;
  reference: string;
  status: BookingStatus;
  statusLabel: string;
  bookingMode: BookingMode;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  serviceId: string;
  serviceName: string;
  categorySlug: string;
  providerServiceId: string;
  provider: { id: string; slug: string; displayName: string; avatarUrl: string | null; ratingAvg: number | null; ratingCount: number };
  location: { kind: LocationKind; addressLine: string; postalCode: string; city: string; details: string | null };
  notes: string | null;
  price: PriceBreakdownDTO;
  /** VAT mode snapshotted at booking time */
  vatMode: VatMode;
  /** price note from the snapshot (same wording as QuoteDTO.vatNote) */
  vatNote: string;
  cancellation: {
    policy: CancellationPolicyDTO;
    schedule: PolicyScheduleEntryDTO[];
    freeUntil: string | null;
    /** what a cancellation right now would cost (null when not cancellable) */
    ifCancelledNow: { feeCents: number; refundCents: number; tierLabel: string } | null;
  };
  /** 4-digit Start-Code for the provider; only while confirmed / in progress */
  startCode: string | null;
  holdExpiresAt: string | null;
  respondBy: string | null;
  confirmedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: ActorRole | null;
  cancellationReason: string | null;
  cancellationFeeCents: number;
  refundCents: number;
  payment: PaymentSummaryDTO | null;
  review: { id: string; rating: number; comment: string | null } | null;
  canPay: boolean;
  canCancel: boolean;
  canReview: boolean;
  canDispute: boolean;
  canRebook: boolean;
  events: BookingEventDTO[];
}

export interface BookingListItemDTO {
  id: string;
  reference: string;
  status: BookingStatus;
  statusLabel: string;
  startsAt: string;
  endsAt: string;
  serviceName: string;
  providerName: string;
  providerSlug: string;
  providerAvatarUrl: string | null;
  totalCents: number;
  city: string;
  canReview: boolean;
}

export interface ProviderBookingDTO {
  id: string;
  reference: string;
  status: BookingStatus;
  statusLabel: string;
  bookingMode: BookingMode;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  serviceName: string;
  customer: {
    firstName: string | null;
    /** only after confirmation */
    lastName: string | null;
    /** only while confirmed / in progress */
    phone: string | null;
    completedBookings: number;
  };
  location: {
    kind: LocationKind;
    postalCode: string;
    city: string;
    /** only after confirmation (hidden again 24 h after completion) */
    addressLine: string | null;
    details: string | null;
    distanceKm: number;
  };
  notes: string | null;
  isRepeatClient: boolean;
  earnings: {
    servicePriceCents: number;
    travelFeeCents: number;
    commissionRate: number;
    commissionTier: CommissionTier;
    commissionCents: number;
    payoutCents: number;
    cancellationFeeCents: number;
  };
  respondBy: string | null;
  confirmedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: ActorRole | null;
  cancellationReason: string | null;
  actions: {
    canAccept: boolean;
    canDecline: boolean;
    canStart: boolean;
    canComplete: boolean;
    canMarkNoShow: boolean;
    canCancel: boolean;
  };
  /** time-based (audit-1 R18): true from startsAt − 30 min while confirmed */
  canStart: boolean;
  /** true from startsAt while confirmed / in progress */
  canComplete: boolean;
  /** true from startsAt + 15 min while confirmed */
  canNoShow: boolean;
  /** ISO instant from which "Termin starten" works (startsAt − 30 min); null unless confirmed */
  startAvailableAt: string | null;
  /** ISO instant from which "Nicht angetroffen" works (startsAt + 15 min); null unless confirmed */
  noShowAvailableAt: string | null;
}

export type ProviderBookingFilter = "requests" | "upcoming" | "past" | "today" | "all";

export interface RebookOptionsDTO {
  bookingId: string;
  providerServiceId: string;
  provider: ProviderCardDTO;
  serviceName: string;
  durationMinutes: number;
  priceCents: number;
  /** saved address id when the original address is still in the address book */
  addressId: string | null;
  postalCode: string;
  slots: SlotsByDayDTO[];
  /** filled when the provider has no slot within 7 days */
  alternatives: ProviderSearchResult[];
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------
export interface ProfileDTO {
  userId: string;
  email: string;
  role: AppRole;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  referralCode: string;
  marketingOptIn: boolean;
  createdAt: string;
}

export interface AddressDTO {
  id: string;
  label: string | null;
  kind: LocationKind;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  details: string | null;
  isDefault: boolean;
}

export interface NotificationPreferencesDTO {
  emailBookings: boolean;
  emailReminders: boolean;
  emailMarketing: boolean;
  smsReminders: boolean;
  pushBookings: boolean;
}

export interface CreditLedgerEntryDTO {
  id: string;
  amountCents: number;
  reason: CreditReason;
  reasonLabel: string;
  bookingId: string | null;
  note: string | null;
  createdAt: string;
}

export interface CreditSummaryDTO {
  balanceCents: number;
  entries: CreditLedgerEntryDTO[];
}

export interface ReferralInfoDTO {
  code: string;
  shareUrl: string;
  invitedCount: number;
  rewardedCount: number;
  earnedCents: number;
  rewardCents: number;
  welcomeCents: number;
}

export interface NotificationDTO {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface FavoriteDTO extends ProviderCardDTO {
  favoritedAt: string;
}

export interface DisputeDTO {
  id: string;
  bookingId: string;
  bookingReference: string;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  refundCents: number;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

// ---------------------------------------------------------------------------
// Provider app
// ---------------------------------------------------------------------------
export interface MissingDocumentDTO {
  /** null for platform-wide requirements */
  categorySlug: string | null;
  categoryName: string | null;
  kind: DocumentKind;
  label: string;
}

export interface OnboardingStepDTO {
  key: "profile" | "services" | "area" | "hours" | "documents" | "payout";
  label: string;
  done: boolean;
}

export interface ProOnboardingDTO {
  status: ProviderStatus;
  steps: OnboardingStepDTO[];
  /** required documents not uploaded yet (pending or approved uploads count as present) */
  missingDocuments: MissingDocumentDTO[];
  canSubmit: boolean;
  submittedAt: string | null;
  lastDecisionNote: string | null;
  /** when the provider accepted the AGB für Profis + Verhaltenskodex (set on submit) */
  termsAcceptedAt: string | null;
}

export interface ProProfileDTO {
  providerId: string;
  slug: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  yearsExperience: number | null;
  languages: string[];
  status: ProviderStatus;
  basePostalCode: string | null;
  serviceRadiusKm: number;
  travelFeeBaseCents: number;
  travelFeeIncludedKm: number;
  travelFeePerKmCents: number;
}

export interface ProServiceDTO extends OfferingDTO {
  isActive: boolean;
  /** audit-3 F2: inactive until the category's required documents are approved ("wartet auf Nachweis") */
  awaitingDocuments: boolean;
  /** labels of the missing / unreviewed category documents while awaitingDocuments */
  missingDocuments: string[];
  serviceDurations: number[];
  priceHintFromCents: number | null;
}

export interface WeeklyHoursDTO {
  id: string;
  weekday: number;
  /** 'HH:MM' */
  start: string;
  end: string;
}

export interface TimeOffDTO {
  id: string;
  start: string;
  end: string;
  reason: string | null;
}

export interface DocumentDTO {
  id: string;
  kind: DocumentKind;
  fileName: string;
  mimeType: string;
  status: DocumentStatus;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  /** authorised download URL (/api/media/documents/…) */
  url: string;
  /** validity end (ISO) or null; insurance mainly (audit-2 N4) */
  expiresAt: string | null;
  /** expiresAt reached: the document no longer counts */
  expired: boolean;
}

export interface ProSettingsDTO {
  bookingMode: BookingMode;
  leadTimeMinutes: number;
  travelBufferMinutes: number;
  maxAdvanceDays: number;
  inviteCode: string;
  inviteUrl: string;
  payoutsEnabled: boolean;
  vatMode: VatMode;
  notificationPreferences: NotificationPreferencesDTO;
}

export type PayoutState = "pending" | "available" | "paid_out";

export interface EarningsItemDTO {
  bookingId: string;
  reference: string;
  serviceName: string;
  status: BookingStatus;
  startsAt: string;
  completedAt: string | null;
  servicePriceCents: number;
  travelFeeCents: number;
  commissionTier: CommissionTier;
  commissionCents: number;
  payoutCents: number;
  payoutState: PayoutState;
  /** when it becomes payable (completed_at + 48 h); null if already paid / disputed */
  availableAt: string | null;
  disputed: boolean;
}

export interface PayoutDTO {
  id: string;
  providerId: string;
  providerName?: string;
  amountCents: number;
  status: PayoutStatus;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
  createdAt: string;
  bookingCount: number;
}

export interface EarningsDTO {
  totals: { pendingCents: number; availableCents: number; paidOutCents: number; monthCents: number; yearCents: number };
  items: EarningsItemDTO[];
  payouts: PayoutDTO[];
}

export interface ProDashboardDTO {
  status: ProviderStatus;
  displayName: string;
  today: ProviderBookingDTO[];
  openRequests: ProviderBookingDTO[];
  upcomingCount: number;
  weekEarningsCents: number;
  ratingAvg: number | null;
  ratingCount: number;
  completedCount: number;
  onboarding: ProOnboardingDTO;
  unreadNotifications: number;
}

export interface ProCalendarDTO {
  from: string;
  days: number;
  weeklyHours: WeeklyHoursDTO[];
  timeOff: TimeOffDTO[];
  bookings: ProviderBookingDTO[];
}

// ---------------------------------------------------------------------------
// Admin & analytics
// ---------------------------------------------------------------------------
export interface AdminUserDTO {
  id: string;
  email: string;
  role: AppRole;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
  blockedAt: string | null;
  bookingsCount: number;
  providerStatus: ProviderStatus | null;
}

export interface AdminProviderListItemDTO {
  providerId: string;
  slug: string;
  displayName: string;
  status: ProviderStatus;
  citySlug: string | null;
  categories: string[];
  submittedAt: string | null;
  documentsPending: number;
  missingDocuments: number;
  ratingAvg: number | null;
  completedCount: number;
}

export interface AdminDocumentDTO extends DocumentDTO {
  providerId: string;
}

export interface ProviderStatusEventDTO {
  fromStatus: ProviderStatus | null;
  toStatus: ProviderStatus;
  note: string | null;
  createdAt: string;
}

export interface AdminProviderDetailDTO {
  profile: ProProfileDTO;
  email: string;
  phone: string | null;
  bookingMode: BookingMode;
  commissionRateOverride: number | null;
  payoutsEnabled: boolean;
  vatMode: VatMode;
  termsAcceptedAt: string | null;
  services: ProServiceDTO[];
  weeklyHours: WeeklyHoursDTO[];
  documents: AdminDocumentDTO[];
  missingDocuments: MissingDocumentDTO[];
  statusEvents: ProviderStatusEventDTO[];
  ratingAvg: number | null;
  ratingCount: number;
  completedCount: number;
}

export type ProviderDecision = "approve" | "reject" | "start_review" | "suspend" | "reinstate";

export interface ProviderDecisionResult {
  status: ProviderStatus;
  /** e.g. missing required documents at approval time */
  warnings: string[];
}

export interface AdminBookingListItemDTO {
  id: string;
  reference: string;
  status: BookingStatus;
  startsAt: string;
  serviceName: string;
  customerName: string;
  providerName: string;
  city: string;
  totalCents: number;
  commissionCents: number;
  createdAt: string;
  hasOpenDispute: boolean;
}

export interface AdminBookingDetailDTO extends AdminBookingListItemDTO {
  customerId: string;
  customerEmail: string;
  providerId: string;
  bookingMode: BookingMode;
  endsAt: string;
  addressLine: string;
  postalCode: string;
  addressDetails: string | null;
  notes: string | null;
  price: PriceBreakdownDTO;
  commissionRate: number;
  commissionTier: CommissionTier;
  providerPayoutCents: number;
  cancellationFeeCents: number;
  refundCents: number;
  cancelledBy: ActorRole | null;
  cancellationReason: string | null;
  payment: (PaymentSummaryDTO & { externalId: string | null; applicationFeeCents: number }) | null;
  refunds: Array<{ id: string; amountCents: number; reason: string; status: string; createdAt: string }>;
  events: BookingEventDTO[];
  disputes: DisputeDTO[];
}

export interface AdminDisputeDTO extends DisputeDTO {
  customerName: string;
  providerName: string;
  bookingTotalCents: number;
  openedByRole: AppRole;
}

export interface CommissionRuleDTO {
  id: string;
  scope: "global" | "category" | "provider";
  categoryId: string | null;
  categoryName: string | null;
  providerId: string | null;
  providerName: string | null;
  rate: number;
  repeatClientRate: number;
  ownClientRate: number;
  isActive: boolean;
  updatedAt: string;
}

export interface AdminPaymentDTO {
  id: string;
  bookingId: string;
  bookingReference: string;
  provider: PaymentProviderId;
  status: PaymentStatus;
  amountCents: number;
  capturedCents: number;
  refundedCents: number;
  applicationFeeCents: number;
  createdAt: string;
}

export interface AuditLogEntryDTO {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  data: unknown;
  createdAt: string;
}

export interface MarketplaceKpisDTO {
  from: string;
  to: string;
  gmvCents: number;
  netRevenueCents: number;
  bookingsByStatus: Partial<Record<BookingStatus, number>>;
  bookingsCreated: number;
  completedBookings: number;
  searches: number;
  zeroResultSearches: number;
  conversionRate: number;
  repeatRate: number;
  avgRating: number | null;
  providerUtilisation: number;
  activeProviders: number;
  newCustomers: number;
  waitlistSignups: number;
}

export interface SupplyDemandRowDTO {
  citySlug: string;
  cityName: string;
  searches: number;
  zeroResultSearches: number;
  waitlistSignups: number;
  approvedProviders: number;
  bookings: number;
  /** open bookable hours in the next 7 days, summed over providers based in the city */
  openSlotHours7d: number;
  byCategory: Array<{ categorySlug: string; categoryName: string; providers: number; searches: number; waitlist: number }>;
}

export interface TimeSeriesPointDTO {
  date: string;
  bookings: number;
  completed: number;
  gmvCents: number;
  searches: number;
}

// ---------------------------------------------------------------------------
// Moderation & privacy (audit-1 R20)
// ---------------------------------------------------------------------------
export interface AdminReviewDTO {
  id: string;
  bookingId: string;
  bookingReference: string;
  rating: number;
  comment: string | null;
  tags: string[];
  serviceName: string;
  providerId: string;
  providerName: string;
  providerSlug: string;
  customerId: string;
  /** "Vorname N." or null after anonymisation */
  customerName: string | null;
  providerReply: string | null;
  providerRepliedAt: string | null;
  isPublished: boolean;
  createdAt: string;
  /** contact details found in comment / reply (moderation hint) */
  contactFlags: string[];
}

export type AdminReviewVisibility = "published" | "hidden";

export interface AdminReviewFilter {
  visibility?: AdminReviewVisibility;
  /** 1–5 = exact; "critical" = 1–2 stars */
  rating?: number | "critical";
  /** search in comment, reply, provider name, booking reference */
  q?: string;
  providerId?: string;
  flagged?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AdminUserBookingDTO {
  id: string;
  reference: string;
  status: BookingStatus;
  statusLabel: string;
  startsAt: string;
  serviceName: string;
  /** provider name for customers, customer name for providers */
  counterpartName: string | null;
  totalCents: number;
  asRole: "customer" | "provider";
}

export interface AdminCreditEntryDTO extends CreditLedgerEntryDTO {
  bookingReference: string | null;
  createdByName: string | null;
}

export interface AdminUserDetailDTO {
  user: AdminUserDTO;
  avatarUrl: string | null;
  marketingOptIn: boolean;
  referralCode: string;
  lastSignInAt: string | null;
  anonymizedAt: string | null;
  providerSlug: string | null;
  addressesCount: number;
  reviewsCount: number;
  credits: { balanceCents: number; entries: AdminCreditEntryDTO[] };
  /** latest 20 bookings as customer or provider */
  bookings: AdminUserBookingDTO[];
  activeBookings: number;
  openDisputes: number;
  /** German reasons why "Konto anonymisieren" is not possible right now (empty = possible) */
  anonymizeBlockers: string[];
}

/** DSGVO Art. 15/20 export: everything SOMA stores about the account (never other users' contact data). */
export interface UserDataExportDTO {
  exportedAt: string;
  format: "soma-user-export/v1";
  profile: {
    userId: string;
    email: string;
    role: AppRole;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    referralCode: string;
    marketingOptIn: boolean;
    createdAt: string;
    blockedAt: string | null;
    anonymizedAt: string | null;
  };
  notificationPreferences: NotificationPreferencesDTO | null;
  addresses: AddressDTO[];
  bookings: Array<{
    reference: string;
    status: BookingStatus;
    serviceName: string;
    providerName: string;
    startsAt: string;
    endsAt: string;
    address: { line: string; postalCode: string; city: string; details: string | null };
    notes: string | null;
    servicePriceCents: number;
    travelFeeCents: number;
    serviceFeeCents: number;
    discountCents: number;
    totalCents: number;
    cancellationFeeCents: number;
    refundCents: number;
    cancelledBy: ActorRole | null;
    cancellationReason: string | null;
    createdAt: string;
    payment: { status: PaymentStatus; amountCents: number; capturedCents: number; refundedCents: number; cardBrand: string | null; cardLast4: string | null } | null;
  }>;
  reviews: Array<{ bookingReference: string; providerName: string; rating: number; comment: string | null; tags: string[]; providerReply: string | null; isPublished: boolean; createdAt: string }>;
  credits: { balanceCents: number; entries: Array<{ amountCents: number; reason: CreditReason; reasonLabel: string; note: string | null; createdAt: string }> };
  referrals: Array<{ role: "referrer" | "referred"; status: string; createdAt: string }>;
  favorites: Array<{ providerName: string; createdAt: string }>;
  disputes: Array<{ bookingReference: string; reason: DisputeReason; status: DisputeStatus; description: string; createdAt: string }>;
  notifications: Array<{ type: string; title: string; body: string | null; readAt: string | null; createdAt: string }>;
  /** provider accounts only: the public profile and documents metadata */
  provider: {
    slug: string;
    displayName: string;
    headline: string | null;
    bio: string | null;
    status: ProviderStatus;
    basePostalCode: string | null;
    documents: Array<{ kind: DocumentKind; status: DocumentStatus; fileName: string | null; createdAt: string }>;
    payouts: Array<{ amountCents: number; status: string; createdAt: string }>;
  } | null;
}

export interface AnonymizeResultDTO {
  userId: string;
  anonymizedAt: string;
  /** bookings kept for accounting with scrubbed personal snapshots */
  bookingsScrubbed: number;
  addressesDeleted: number;
}
