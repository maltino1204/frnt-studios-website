import "server-only";

/**
 * Pricing (docs/architecture.md §5.4) — pure, integer cents.
 *
 *   travel_fee      = distance <= included_km ? base : base + ceil(distance - included_km) * per_km   (rounded to 50 ct)
 *   discount        = min(credits applied, service_price)
 *   total           = service_price + travel_fee + service_fee - discount
 *   commission_rate = own_client (provider invite link) → repeat (prior completed booking) → base,
 *                     each resolved provider rule → category rule → global rule
 *   commission      = round(service_price * commission_rate)      (travel fee is commission-free)
 *   provider_payout = service_price - commission + travel_fee
 */

export interface TravelFeeConfig {
  baseCents: number;
  includedKm: number;
  perKmCents: number;
}

export function roundToFiftyCents(cents: number): number {
  return Math.round(cents / 50) * 50;
}

export function computeTravelFee(distanceKm: number, cfg: TravelFeeConfig): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) throw new Error("Ungültige Entfernung");
  const extraKm = distanceKm <= cfg.includedKm ? 0 : Math.ceil(distanceKm - cfg.includedKm - 1e-9);
  return roundToFiftyCents(cfg.baseCents + extraKm * cfg.perKmCents);
}

export type CommissionTier = "base" | "repeat" | "own_client";

export interface CommissionRule {
  scope: "global" | "category" | "provider";
  categoryId: string | null;
  providerId: string | null;
  rate: number;
  repeatClientRate: number;
  ownClientRate: number;
  isActive: boolean;
}

export interface CommissionContext {
  providerId: string;
  categoryId: string;
  /** provider_override from providers.commission_rate_override (base tier only) */
  providerRateOverride?: number | null;
  /** customer came via the provider's personal invite link */
  isOwnClient: boolean;
  /** customer has a prior completed booking with this provider */
  isRepeatClient: boolean;
}

export interface ResolvedCommission {
  rate: number;
  tier: CommissionTier;
  ruleScope: CommissionRule["scope"] | "override";
}

export function resolveCommission(rules: CommissionRule[], ctx: CommissionContext): ResolvedCommission {
  const active = rules.filter((r) => r.isActive);
  const rule =
    active.find((r) => r.scope === "provider" && r.providerId === ctx.providerId) ??
    active.find((r) => r.scope === "category" && r.categoryId === ctx.categoryId) ??
    active.find((r) => r.scope === "global");
  if (!rule) throw new Error("Keine aktive Provisionsregel gefunden");

  if (ctx.isOwnClient) return { rate: rule.ownClientRate, tier: "own_client", ruleScope: rule.scope };
  if (ctx.isRepeatClient) return { rate: rule.repeatClientRate, tier: "repeat", ruleScope: rule.scope };
  if (ctx.providerRateOverride != null && rule.scope !== "provider") {
    return { rate: ctx.providerRateOverride, tier: "base", ruleScope: "override" };
  }
  return { rate: rule.rate, tier: "base", ruleScope: rule.scope };
}

export interface QuoteInput {
  servicePriceCents: number;
  travelFeeCents: number;
  serviceFeeCents: number;
  /** credit balance the customer could apply */
  availableCreditsCents: number;
  useCredits: boolean;
  commissionRate: number;
}

export interface PriceBreakdown {
  servicePriceCents: number;
  travelFeeCents: number;
  serviceFeeCents: number;
  discountCents: number;
  totalCents: number;
  commissionRate: number;
  commissionCents: number;
  providerPayoutCents: number;
}

export function computePrice(input: QuoteInput): PriceBreakdown {
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === "number" && (!Number.isFinite(v) || v < 0)) throw new Error(`Ungültiger Betrag: ${k}`);
  }
  if (input.commissionRate > 1) throw new Error("Ungültige Provision");
  const discount = input.useCredits ? Math.min(Math.floor(input.availableCreditsCents), input.servicePriceCents) : 0;
  const total = input.servicePriceCents + input.travelFeeCents + input.serviceFeeCents - discount;
  const commission = Math.round(input.servicePriceCents * input.commissionRate);
  return {
    servicePriceCents: input.servicePriceCents,
    travelFeeCents: input.travelFeeCents,
    serviceFeeCents: input.serviceFeeCents,
    discountCents: discount,
    totalCents: total,
    commissionRate: input.commissionRate,
    commissionCents: commission,
    providerPayoutCents: input.servicePriceCents - commission + input.travelFeeCents,
  };
}

/**
 * Split of a retained cancellation / no-show fee: the provider receives the
 * kept amount minus the booking's commission rate (travel portion included).
 */
export function splitRetainedFee(feeCents: number, commissionRate: number): { commissionCents: number; providerPayoutCents: number } {
  const commission = Math.round(feeCents * commissionRate);
  return { commissionCents: commission, providerPayoutCents: feeCents - commission };
}

// ---------------------------------------------------------------------------
// VAT notes (PAngV Endpreis / § 19 UStG)
// ---------------------------------------------------------------------------
export type VatMode = "regular" | "small_business";

export const VAT_RATE = 0.19;
const NBSP = " ";

/** VAT contained in a gross amount: round(total − total / 1.19), in cents. */
export function includedVatCents(totalCents: number, rate: number = VAT_RATE): number {
  if (!Number.isFinite(totalCents) || totalCents <= 0) return 0;
  return Math.round(totalCents - totalCents / (1 + rate));
}

/** "1.234,56 €" (de-DE, non-breaking space before €), deterministic without Intl. */
export function formatEuroCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const euros = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${euros},${String(abs % 100).padStart(2, "0")}${NBSP}€`;
}

/**
 * Customer-facing price note for the total (incl. travel fee):
 *   regular        → "inkl. 19 % MwSt. (enthalten: 12,64 €)"
 *   small_business → "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
 * Uses non-breaking spaces in "19 %", "12,64 €" and "§ 19".
 */
export function vatNote(mode: VatMode, totalCents: number): string {
  if (mode === "regular") {
    return `inkl. 19${NBSP}% MwSt. (enthalten: ${formatEuroCents(includedVatCents(totalCents))})`;
  }
  return `Gemäß §${NBSP}19 UStG wird keine Umsatzsteuer berechnet.`;
}
