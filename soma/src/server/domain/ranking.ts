import "server-only";

/**
 * Search ranking (product spec §5) — pure.
 *
 * "Empfohlen" = weighted sum of normalised factors:
 *   time fit 25 % · quality 25 % (Bayesian rating) · reliability 20 % · instant 10 %
 *   · proximity 10 % · new-pro boost 5 % · profile completeness 5 %
 */

export const RATING_PRIOR_MEAN = 4.6;
export const RATING_PRIOR_WEIGHT = 5;

export function bayesianRating(avg: number | null, count: number, m = RATING_PRIOR_MEAN, c = RATING_PRIOR_WEIGHT): number {
  const n = Math.max(0, count);
  const sum = avg == null || n === 0 ? 0 : avg * n;
  return (c * m + sum) / (c + n);
}

export interface RankingInput {
  ratingAvg: number | null;
  ratingCount: number;
  distanceKm: number;
  radiusKm: number;
  /** earliest bookable slot */
  firstSlot: Date | null;
  /** customer's preferred time, if any */
  requestedAt?: Date | null;
  now: Date;
  instant: boolean;
  completedCount: number;
  approvedAt: Date | null;
  /** 0..1 */
  profileCompleteness: number;
  /** 0..1, defaults to a neutral 0.8 until enough history exists */
  reliability?: number;
}

export const WEIGHTS = {
  timeFit: 0.25,
  quality: 0.25,
  reliability: 0.2,
  instant: 0.1,
  proximity: 0.1,
  newPro: 0.05,
  completeness: 0.05,
} as const;

const clamp01 = (x: number) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0);
const HOUR = 3_600_000;

export function timeFitScore(firstSlot: Date | null, now: Date, requestedAt?: Date | null): number {
  if (!firstSlot) return 0;
  if (requestedAt) return clamp01(1 - Math.abs(firstSlot.getTime() - requestedAt.getTime()) / (6 * HOUR));
  return clamp01(1 - (firstSlot.getTime() - now.getTime()) / (7 * 24 * HOUR));
}

export function qualityScore(avg: number | null, count: number): number {
  // Map the Bayesian rating 3.0 … 5.0 onto 0 … 1.
  return clamp01((bayesianRating(avg, count) - 3) / 2);
}

export function proximityScore(distanceKm: number, radiusKm: number): number {
  if (radiusKm <= 0) return 0;
  return clamp01(1 - distanceKm / radiusKm);
}

export function newProBoost(completedCount: number, approvedAt: Date | null, now: Date): number {
  if (!approvedAt || completedCount >= 5) return 0;
  const days = (now.getTime() - approvedAt.getTime()) / (24 * HOUR);
  if (days >= 30) return 0;
  return clamp01(1 - Math.max(completedCount / 5, days / 30));
}

export function rankScore(i: RankingInput): number {
  return (
    WEIGHTS.timeFit * timeFitScore(i.firstSlot, i.now, i.requestedAt) +
    WEIGHTS.quality * qualityScore(i.ratingAvg, i.ratingCount) +
    WEIGHTS.reliability * clamp01(i.reliability ?? 0.8) +
    WEIGHTS.instant * (i.instant ? 1 : 0) +
    WEIGHTS.proximity * proximityScore(i.distanceKm, i.radiusKm) +
    WEIGHTS.newPro * newProBoost(i.completedCount, i.approvedAt, i.now) +
    WEIGHTS.completeness * clamp01(i.profileCompleteness)
  );
}

export type SearchSort = "recommended" | "earliest" | "price_asc" | "rating";

export interface Rankable {
  id: string;
  score: number;
  firstSlot: string | null;
  totalPriceCents: number;
  ratingAvg: number | null;
  ratingCount: number;
}

const slotTime = (s: string | null) => (s ? Date.parse(s) : Number.POSITIVE_INFINITY);

export function sortRanked<T extends Rankable>(items: T[], sort: SearchSort): T[] {
  const copy = [...items];
  const tie = (a: T, b: T) => a.id.localeCompare(b.id);
  switch (sort) {
    case "earliest":
      return copy.sort((a, b) => slotTime(a.firstSlot) - slotTime(b.firstSlot) || b.score - a.score || tie(a, b));
    case "price_asc":
      return copy.sort((a, b) => a.totalPriceCents - b.totalPriceCents || b.score - a.score || tie(a, b));
    case "rating":
      return copy.sort(
        (a, b) => bayesianRating(b.ratingAvg, b.ratingCount) - bayesianRating(a.ratingAvg, a.ratingCount) || b.score - a.score || tie(a, b),
      );
    case "recommended":
    default:
      return copy.sort((a, b) => b.score - a.score || slotTime(a.firstSlot) - slotTime(b.firstSlot) || tie(a, b));
  }
}

/** 0..1: avatar, bio (>= 80 chars), >= 3 portfolio images, languages set. */
export function profileCompleteness(p: { hasAvatar: boolean; bioLength: number; portfolioCount: number; languageCount: number }): number {
  let score = 0;
  if (p.hasAvatar) score += 0.3;
  if (p.bioLength >= 80) score += 0.3;
  if (p.portfolioCount >= 3) score += 0.25;
  else score += (p.portfolioCount / 3) * 0.25;
  if (p.languageCount > 0) score += 0.15;
  return clamp01(score);
}
