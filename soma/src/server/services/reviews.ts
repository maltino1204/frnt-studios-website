import "server-only";

import { z } from "zod";
import { withAnon, withService, withUser, type Queryable } from "../db/client";
import { rethrowDb } from "../db/errors";
import type { ReviewDTO, ReviewListDTO, Session } from "../dto";
import { ServiceError } from "../errors";
import { assertNoContactDetails, loadSettings, numOrNull, paging, parse, requireRoleIn, zUuid } from "./_shared";
import { CONTACT_LINT_MESSAGES } from "../domain/content-lint";
import { notify } from "./notifications";

/**
 * Reviews: verified only (completed bookings of that customer, enforced by the
 * reviews_validate trigger), one per booking, aggregates maintained by trigger.
 */

export async function queryProviderReviews(tx: Queryable, providerId: string, page = 1, pageSize = 10): Promise<ReviewListDTO> {
  const pg = paging(page, pageSize, 10);
  const [items, agg, dist] = await Promise.all([
    tx<Array<{ id: string; rating: number; comment: string | null; tags: string[]; authorName: string | null; serviceName: string; createdAt: Date; providerReply: string | null; providerRepliedAt: Date | null }>>`
      select id, rating, comment, tags, author_name, service_name, created_at, provider_reply, provider_replied_at
      from public.public_reviews where provider_id = ${providerId}
      order by created_at desc limit ${pg.pageSize} offset ${pg.offset}`,
    tx<{ ratingAvg: string | null; ratingCount: number }[]>`
      select rating_avg, rating_count from public.providers where id = ${providerId}`,
    tx<{ rating: number; n: number }[]>`
      select rating, count(*)::int as n from public.public_reviews where provider_id = ${providerId} group by rating`,
  ]);
  const distribution: ReviewListDTO["distribution"] = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const d of dist) distribution[String(d.rating) as keyof typeof distribution] = d.n;
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  return {
    items: items.map<ReviewDTO>((r) => ({
      id: r.id, rating: r.rating, comment: r.comment, tags: [...r.tags], authorName: r.authorName, serviceName: r.serviceName,
      createdAt: r.createdAt.toISOString(), providerReply: r.providerReply, providerRepliedAt: r.providerRepliedAt?.toISOString() ?? null,
    })),
    total,
    page: pg.page,
    pageSize: pg.pageSize,
    ratingAvg: numOrNull(agg[0]?.ratingAvg),
    ratingCount: agg[0]?.ratingCount ?? 0,
    distribution,
  };
}

/** Public: published reviews of an approved provider. */
export async function listProviderReviews(providerId: string, page = 1, pageSize = 10): Promise<ReviewListDTO> {
  const id = parse(zUuid, providerId);
  return withAnon((tx) => queryProviderReviews(tx, id, page, pageSize));
}

const REVIEW_TAGS = ["Pünktlich", "Professionell", "Freundlich", "Entspannend", "Sauber gearbeitet", "Gute Beratung", "Wieder buchen"] as const;
export const REVIEW_TAG_OPTIONS: readonly string[] = REVIEW_TAGS;

const RATING_ERROR = "Bitte vergeben Sie 1 bis 5 Sterne.";

const CreateReviewSchema = z.object({
  bookingId: zUuid,
  rating: z.number({ error: RATING_ERROR }).int({ error: RATING_ERROR }).min(1, RATING_ERROR).max(5, RATING_ERROR),
  comment: z.string().trim().max(2000, "Höchstens 2000 Zeichen.").optional().transform((v) => (v ? v : null)),
  tags: z.array(z.enum(REVIEW_TAGS)).max(3, "Höchstens drei Schlagworte.").optional().default([]),
});

/** Customer reviews a completed booking (within review_window_days after completion). */
export async function createReview(session: Session, bookingId: string, rating: number, comment?: string | null, tags: string[] = []): Promise<{ reviewId: string }> {
  const s = requireRoleIn(session, "customer");
  const input = parse(CreateReviewSchema, { bookingId, rating, comment: comment ?? undefined, tags });
  assertNoContactDetails({ comment: input.comment }, CONTACT_LINT_MESSAGES.customerReview);
  const result = await withUser(s.userId, async (tx) => {
    const settings = await loadSettings(tx);
    // RLS: the customer can only see their own bookings.
    const [b] = await tx<{ id: string; status: string; completedAt: Date | null; providerId: string }[]>`
      select id, status, completed_at, provider_id from public.bookings where id = ${input.bookingId}`;
    if (!b) throw new ServiceError("not_found", "Buchung nicht gefunden.");
    if (b.status !== "completed" || !b.completedAt) throw new ServiceError("invalid_state", "Bewertungen sind nur für abgeschlossene Termine möglich.");
    if (Date.now() - b.completedAt.getTime() > settings.reviewWindowDays * 86_400_000) {
      throw new ServiceError("invalid_state", `Bewertungen sind bis ${settings.reviewWindowDays} Tage nach dem Termin möglich.`);
    }
    const [existing] = await tx<{ id: string }[]>`select id from public.reviews where booking_id = ${input.bookingId}`;
    if (existing) throw new ServiceError("conflict", "Sie haben diesen Termin bereits bewertet.");
    const [row] = await tx<{ id: string }[]>`
      insert into public.reviews (booking_id, rating, comment, tags)
      values (${input.bookingId}, ${input.rating}, ${input.comment}, ${input.tags}::text[])
      returning id`;
    return { reviewId: row.id, providerId: b.providerId };
  }).catch(rethrowDb);
  // withService: the in-app notification is written for the provider (another user).
  await withService((tx) => notify(tx, "review.received", { providerId: result.providerId, rating: input.rating }));
  return { reviewId: result.reviewId };
}

const ReplySchema = z.object({ reviewId: zUuid, reply: z.string().trim().min(2, "Bitte schreib eine Antwort.").max(1000, "Höchstens 1000 Zeichen.") });

/** Provider posts the single public reply to a review of theirs. */
export async function replyToReview(session: Session, reviewId: string, reply: string): Promise<void> {
  const s = requireRoleIn(session, "provider");
  const input = parse(ReplySchema, { reviewId, reply });
  assertNoContactDetails({ reply: input.reply }, CONTACT_LINT_MESSAGES.providerReply);
  await withUser(s.userId, async (tx) => {
    const rows = await tx`update public.reviews set provider_reply = ${input.reply} where id = ${input.reviewId} and provider_id = ${s.userId} returning id`;
    if (rows.length === 0) throw new ServiceError("not_found", "Bewertung nicht gefunden.");
  }).catch(rethrowDb);
}
