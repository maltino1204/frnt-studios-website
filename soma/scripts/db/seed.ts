/**
 * npm run db:seed — DEMO seed (development only; refuses unless DEMO_MODE=true).
 * npm run demo:refresh — the same seed plus one maintenance run; run it right before a demo.
 *
 * Creates fictional providers in the six launch cities, demo customers,
 * ~120 historical bookings with German reviews, cancellations, upcoming
 * confirmed bookings and open requests for testkunde-b2b, payouts,
 * credits/referrals, disputes, search demand and waitlist sign-ups.
 * All timestamps are relative to the seed time, and every seeded event or
 * notification stamp lies between 08:00 and 21:00 Europe/Berlin (audit-3 F5).
 * Re-running replaces the demo data.
 *
 * Demo logins (password "soma-demo-2026"): testkunde@soma.test (customer), testkunde-b2b@soma.test
 * (provider = SOMA's B2B customer), testadmin@soma.test
 */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { hashPassword } from "../../src/server/auth/password";
import { haversineKm, roundKm } from "../../src/server/domain/geo";
import { computeRespondBy } from "../../src/server/domain/booking-state";
import { computeCancellation, computeNoShowFee, parsePolicy } from "../../src/server/domain/cancellation";
import { computeTravelFee, splitRetainedAmounts } from "../../src/server/domain/pricing";
import { normalizeDatabaseUrl, usePreparedStatements } from "../../src/server/db/url";
import { DEMO_PLACEHOLDER_PDF } from "../../src/server/storage/demo-placeholder";
import { addDays, isoWeekdayOf, localDateOf, parseTimeOfDay, toWallClock, wallTimeToInstant } from "../../src/server/domain/tz";
import { DEFAULT_CANCELLATION_POLICY, PLATFORM_SETTINGS } from "./lib/base-seed-data";
import {
  CUSTOMERS, PROVIDERS, REGULAR_VAT_PROVIDERS, REVIEWS, reviewFits, SEARCH_POSTAL_CODES, SELIN_REVIEWS,
  type DemoCustomer, type DemoProvider, type ReviewTemplate,
} from "./lib/demo-data";
import { expireDocumentsInTx } from "../../src/server/services/verification";
import { ROOT } from "./lib/migrate";

const DEMO_PASSWORD = "soma-demo-2026";
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const REF_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

// Deterministic PRNG so the demo looks the same on every machine.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261030);
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];
const chance = (p: number) => rand() < p;
const code = (n: number) => Array.from({ length: n }, () => REF_ALPHABET[Math.floor(rand() * REF_ALPHABET.length)]).join("");
const startCode = () => String(int(0, 9999)).padStart(4, "0");

// --- daytime stamps (audit-3 F5) -------------------------------------------
// Generated stamps lie in 08:00–20:50 Berlin, so derived ones (+1/+2 min) stay before 21:00.
const DAY_FROM = 8 * 60;
const DAY_TO = 20 * 60 + 50;
const LATEST = 20 * 60 + 59;
const isDaytime = (d: Date) => {
  const m = toWallClock(d).minutes;
  return m >= DAY_FROM && m <= DAY_TO;
};
/** Moves a night stamp back to the previous evening (20:30–20:50) or forward to the next morning (08:02–08:40). */
function daytime(d: Date, dir: "back" | "forward" = "back"): Date {
  if (isDaytime(d)) return d;
  const w = toWallClock(d);
  if (dir === "forward") return wallTimeToInstant(w.minutes > DAY_TO ? addDays(w.date, 1) : w.date, DAY_FROM + int(2, 40)).instant;
  return wallTimeToInstant(w.minutes < DAY_FROM ? addDays(w.date, -1) : w.date, DAY_TO - int(0, 20)).instant;
}
/** First (forward) or last (back) daytime instant at/after or at/before `d`. */
function dayEdge(d: Date, dir: "back" | "forward"): Date {
  if (isDaytime(d)) return d;
  const w = toWallClock(d);
  if (dir === "forward") return wallTimeToInstant(w.minutes > DAY_TO ? addDays(w.date, 1) : w.date, DAY_FROM).instant;
  return wallTimeToInstant(w.minutes < DAY_FROM ? addDays(w.date, -1) : w.date, DAY_TO).instant;
}
let seedNow = new Date();
/**
 * A daytime stamp in [lo, hi]. When the interval lies entirely at night: the next morning, or — if
 * that is still ahead of the seed time — the last daytime minute before `hi`.
 */
function stampBetween(lo: Date, hi: Date): Date {
  const a = lo.getTime();
  const b = Math.max(a, hi.getTime());
  for (let i = 0; i < 24; i += 1) {
    const t = new Date(a + Math.floor(rand() * (b - a)));
    if (isDaytime(t)) return t;
  }
  const f = dayEdge(lo, "forward");
  if (f.getTime() <= b) return f;
  const k = dayEdge(hi, "back");
  if (k.getTime() >= a) return k;
  return f.getTime() <= seedNow.getTime() ? f : k;
}
/** 20:59 Berlin on the local day of `d` (cap for completion stamps of the last slot of the day). */
const dayEnd = (d: Date) => wallTimeToInstant(toWallClock(d).date, LATEST).instant;
const later = (d: Date, ms: number) => new Date(d.getTime() + ms);
const minDate = (...ds: Date[]) => new Date(Math.min(...ds.map((d) => d.getTime())));
const maxDate = (...ds: Date[]) => new Date(Math.max(...ds.map((d) => d.getTime())));

interface Ctx {
  tx: postgres.TransactionSql;
  now: Date;
  plz: Map<string, { lat: number; lng: number }>;
  services: Map<string, { id: string; categoryId: string; categorySlug: string; name: string; defaultDuration: number }>;
  categories: Map<string, string>;
  adminId: string;
  providers: Map<string, { id: string; p: DemoProvider; offerings: Array<{ id: string; serviceSlug: string; duration: number; price: number }>; approvedAt: Date | null }>;
  customers: Map<string, { id: string; c: DemoCustomer }>;
  /** busy intervals per provider (upcoming) to avoid overlaps */
  busy: Map<string, Array<[number, number]>>;
  pairCompleted: Map<string, number>;
  /** "providerKey:customerKey" pairs linked through the provider's invite (own-client tier) */
  ownClients: Set<string>;
  bookingCount: number;
}

async function createUser(tx: postgres.TransactionSql, email: string, hash: string, meta: Record<string, unknown>, createdAt: Date): Promise<string> {
  const [row] = await tx<{ id: string }[]>`
    insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    values (gen_random_uuid(), 'authenticated', 'authenticated', ${email}, ${hash}, ${createdAt}, ${tx.json(meta as postgres.JSONValue)}, ${createdAt}, ${createdAt}) returning id`;
  await tx`update public.profiles set created_at = ${createdAt} where id = ${row.id}`;
  return row.id;
}

async function cleanup(tx: postgres.TransactionSql): Promise<void> {
  const demo = tx`(select id from auth.users where email like '%soma.test')`;
  await tx`delete from public.bookings where customer_id in ${demo} or provider_id in ${demo}`;
  await tx`delete from public.payouts where provider_id in ${demo}`;
  // Seed rows carry no marker any more (audit-3 F8): they are recognised by a demo actor or a demo entity.
  // "demo" = 'true' still removes rows of older seeds.
  await tx`delete from public.audit_log where data ->> 'demo' = 'true' or actor_id in ${demo} or entity_id in (select id::text from auth.users where email like '%soma.test')`;
  await tx`delete from auth.users where email like '%soma.test'`;
  await tx`delete from public.search_events`;
  await tx`delete from public.waitlist_signups where email::text like '%@beispiel.de'`;
}

/** A start instant on `date` inside one of the provider's windows (step 30 min), or null. */
function slotOn(p: DemoProvider, date: string, duration: number): Date | null {
  const wd = isoWeekdayOf(date);
  const windows = p.hours.filter((h) => h.weekday === wd);
  if (windows.length === 0) return null;
  const w = pick(windows);
  const s = parseTimeOfDay(w.start);
  const e = parseTimeOfDay(w.end);
  const options: number[] = [];
  for (let m = Math.ceil(s / 30) * 30; m + duration <= e; m += 30) options.push(m);
  if (options.length === 0) return null;
  return wallTimeToInstant(date, pick(options)).instant;
}

function overlaps(list: Array<[number, number]>, s: number, e: number): boolean {
  return list.some(([a, b]) => s < b && a < e);
}

/** Categories of a provider, most offerings first (ties: order of the offerings). */
function categoriesOf(ctx: Ctx, p: DemoProvider): string[] {
  const counts = new Map<string, number>();
  for (const o of p.offerings) {
    const c = ctx.services.get(o.service)?.categorySlug;
    if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
}

interface BookingSpec {
  providerKey: string;
  customerKey: string;
  offeringIndex?: number;
  startsAt: Date;
  status: "completed" | "cancelled" | "confirmed" | "requested" | "no_show";
  /** must be a daytime stamp (08:00–20:50) */
  createdAt: Date;
  cancelledBy?: "customer" | "provider";
  feePercent?: number;
  useCredits?: number;
  notes?: string | null;
  respondBy?: Date | null;
  /** booking address other than the customer's home (saved office / hotel address) */
  address?: { street: string; houseNumber: string; postalCode: string; city: string; details: string | null; kind: "home" | "office" | "hotel" };
}

interface InsertedBooking {
  id: string;
  completedAt: Date | null;
  categorySlug: string;
  serviceSlug: string;
  duration: number;
  totalCents: number;
  providerId: string;
  customerId: string;
  providerKey: string;
}

type EventRow = { booking_id: string; from_status: string | null; to_status: string; actor_id: string | null; actor_role: string; note: string | null; created_at: Date };

async function insertBooking(ctx: Ctx, spec: BookingSpec): Promise<InsertedBooking> {
  const { tx } = ctx;
  const prov = ctx.providers.get(spec.providerKey);
  const cust = ctx.customers.get(spec.customerKey);
  if (!prov || !cust) throw new Error(`unknown ${spec.providerKey}/${spec.customerKey}`);
  const off = prov.offerings[spec.offeringIndex ?? int(0, prov.offerings.length - 1)];
  const svc = ctx.services.get(off.serviceSlug);
  if (!svc) throw new Error(`unknown service ${off.serviceSlug}`);
  const base = ctx.plz.get(prov.p.basePostalCode);
  const point = ctx.plz.get(spec.address?.postalCode ?? cust.c.postalCode);
  if (!base || !point) throw new Error("missing PLZ");
  const distanceKm = roundKm(haversineKm(base, point));
  const travel = computeTravelFee(distanceKm, prov.p.travelFee);
  const pairKey = `${prov.id}:${cust.id}`;
  const repeat = (ctx.pairCompleted.get(pairKey) ?? 0) > 0;
  // Same tier order as the engine: own client (provider invite) → repeat → base.
  const ownClient = ctx.ownClients.has(`${spec.providerKey}:${spec.customerKey}`);
  const rate = ownClient ? 0.05 : repeat ? 0.12 : 0.2;
  const tier = ownClient ? "own_client" : repeat ? "repeat" : "base";
  const discount = Math.min(spec.useCredits ?? 0, off.price);
  const total = off.price + travel - discount;
  const commission = Math.round(off.price * rate);
  let payout = off.price - commission + travel;
  const endsAt = new Date(spec.startsAt.getTime() + off.duration * 60_000);
  const created = spec.createdAt;
  const mode = prov.p.bookingMode;
  // Stamps follow the booking's life (all within 08–21 h): confirmed after payment (instant) or after the
  // provider's answer (request), started at the start, completed shortly after the end.
  let confirmedAt: Date | null = null;
  if (spec.status !== "requested") {
    const latest = minDate(later(spec.startsAt, -30 * 60_000), later(ctx.now, -2 * 60_000));
    const natural = daytime(later(created, mode === "request" ? int(1, 5) * HOUR : 2 * 60_000), "forward");
    confirmedAt = natural <= latest ? natural : stampBetween(later(created, 60_000), latest);
  }
  const completedAt = spec.status === "completed" ? minDate(later(endsAt, int(2, 20) * 60_000), dayEnd(endsAt)) : null;
  let fee = 0;
  let commissionFinal = commission;
  let cancelledAt: Date | null = null;
  const cancelledBy = spec.cancelledBy ?? "customer";
  const reason = spec.status === "cancelled" ? (cancelledBy === "provider" ? "Krankheit" : pick(["Termin kollidiert mit der Arbeit", "Bin leider krank", "Reise verschoben"])) : null;
  if (spec.status === "cancelled" || spec.status === "no_show") {
    // Same rules as the booking engine (domain/cancellation.ts): fee basis = service price,
    // travel kept only < 2 h / no-show, commission only on the kept service share. The fee follows
    // from the actual (daytime) cancellation stamp.
    const policy = parsePolicy(DEFAULT_CANCELLATION_POLICY);
    const b = {
      status: "confirmed" as const, startsAt: spec.startsAt, createdAt: created, servicePriceCents: off.price, travelFeeCents: travel,
      serviceFeeCents: 0, discountCents: discount, totalCents: total, cancellationPolicy: policy,
    };
    if (spec.status === "no_show") {
      cancelledAt = later(spec.startsAt, 20 * 60_000);
    } else {
      const target = (spec.feePercent ?? 0) >= 50 ? later(spec.startsAt, -int(3, 20) * HOUR) : later(spec.startsAt, -int(25, 60) * HOUR);
      const afterConfirm = later(confirmedAt ?? created, 10 * 60_000);
      let t = daytime(target);
      if (t < afterConfirm) t = daytime(later(afterConfirm, int(0, 90) * 60_000), "forward");
      if (t >= spec.startsAt) t = afterConfirm;
      cancelledAt = t;
    }
    const outcome =
      spec.status === "no_show"
        ? computeNoShowFee(b)
        : cancelledBy === "provider"
          ? computeCancellation(b, cancelledAt, "provider")
          : computeCancellation(b, cancelledAt, "customer");
    fee = outcome.feeCents;
    const split = splitRetainedAmounts(outcome.retainedServiceCents, outcome.retainedTravelCents, rate);
    commissionFinal = fee > 0 ? split.commissionCents : 0;
    payout = fee > 0 ? split.providerPayoutCents : 0;
  }
  const [row] = await tx<{ id: string }[]>`
    insert into public.bookings (
      reference, customer_id, provider_id, provider_service_id, service_id, category_id, service_name, duration_minutes,
      starts_at, ends_at, blocked_range, status, booking_mode, location_kind, address_line, postal_code, city, address_details,
      lat, lng, customer_notes, distance_km, service_price_cents, travel_fee_cents, service_fee_cents, discount_cents, total_cents,
      commission_rate, commission_tier, commission_cents, provider_payout_cents, is_repeat_client, cancellation_policy, start_code,
      respond_by, confirmed_at, started_at, completed_at, cancelled_at, cancelled_by, cancellation_reason,
      cancellation_fee_cents, refund_cents, created_at, updated_at, vat_mode
    ) values (
      ${`SM-${code(6)}`}, ${cust.id}, ${prov.id}, ${off.id}, ${svc.id}, ${svc.categoryId}, ${svc.name}, ${off.duration},
      ${spec.startsAt}, ${endsAt}, tstzrange(${spec.startsAt}, ${new Date(endsAt.getTime() + prov.p.bufferMinutes * 60_000)}),
      ${spec.status}, ${mode}, ${spec.address?.kind ?? "home"}, ${spec.address ? `${spec.address.street} ${spec.address.houseNumber}` : `${cust.c.street} ${cust.c.houseNumber}`},
      ${spec.address?.postalCode ?? cust.c.postalCode}, ${spec.address?.city ?? cityName(cust.c.city)},
      ${spec.address ? spec.address.details : chance(0.4) ? pick(["2. OG links", "Hinterhaus, 3. OG", "Klingel „Büro“", "EG, bitte klingeln"]) : null},
      ${point.lat}, ${point.lng}, ${spec.notes ?? (chance(0.25) ? pick(["Parkplatz im Hof vorhanden.", "Wir haben eine Katze.", "Bitte zweimal klingeln.", "Aufzug vorhanden."]) : null)},
      ${distanceKm}, ${off.price}, ${travel}, 0, ${discount}, ${total}, ${rate}, ${tier},
      ${commissionFinal}, ${payout}, ${repeat}, ${ctx.tx.json(DEFAULT_CANCELLATION_POLICY as unknown as postgres.JSONValue)}, ${startCode()},
      ${spec.respondBy ?? null}, ${confirmedAt}, ${spec.status === "completed" ? spec.startsAt : null}, ${completedAt}, ${cancelledAt},
      ${spec.status === "cancelled" ? cancelledBy : null}, ${reason},
      ${fee}, ${spec.status === "cancelled" || spec.status === "no_show" ? total - fee : 0}, ${created}, ${completedAt ?? cancelledAt ?? confirmedAt ?? created},
      ${REGULAR_VAT_PROVIDERS.has(prov.p.key) ? "regular" : "small_business"}
    ) returning id`;
  // Status history like a real booking (the insert trigger only logs the final status).
  const events: EventRow[] = [];
  const push = (to: string, role: string, actor: string | null, at: Date, note: string | null = null) =>
    events.push({ booking_id: row.id, from_status: events.at(-1)?.to_status ?? null, to_status: to, actor_id: actor, actor_role: role, note, created_at: at });
  push("pending_payment", "customer", cust.id, created);
  if (mode === "request") push("requested", "customer", cust.id, later(created, 60_000));
  if (confirmedAt) push("confirmed", mode === "request" ? "provider" : "system", mode === "request" ? prov.id : null, confirmedAt);
  if (spec.status === "completed" && completedAt) {
    push("in_progress", "provider", prov.id, spec.startsAt);
    push("completed", "provider", prov.id, completedAt);
  }
  if (spec.status === "cancelled" && cancelledAt) push("cancelled", cancelledBy, cancelledBy === "provider" ? prov.id : cust.id, cancelledAt, reason);
  if (spec.status === "no_show" && cancelledAt) push("no_show", "provider", prov.id, cancelledAt);
  await tx`delete from public.booking_events where booking_id = ${row.id}`;
  await tx`insert into public.booking_events ${tx(events, "booking_id", "from_status", "to_status", "actor_id", "actor_role", "note", "created_at")}`;

  const payStatus =
    spec.status === "completed" ? "captured" : spec.status === "confirmed" || spec.status === "requested" ? "authorized" : fee > 0 ? "captured" : "cancelled";
  const captured = spec.status === "completed" ? total : fee;
  await tx`
    insert into public.payments (booking_id, provider, status, amount_cents, captured_cents, application_fee_cents, external_id, card_brand, card_last4, created_at)
    values (${row.id}, 'dev', ${payStatus}, ${total}, ${captured}, ${spec.status === "completed" ? Math.max(0, total - payout) : Math.min(fee, commissionFinal)}, ${`dev_pi_${randomUUID()}`},
            ${pick(["visa", "mastercard", "visa", "amex"])}, ${String(int(1000, 9999))}, ${created})`;
  if (discount > 0) {
    await tx`insert into public.credit_ledger (user_id, amount_cents, reason, booking_id, note, created_at)
             values (${cust.id}, ${-discount}, 'booking_redemption', ${row.id}, 'Eingelöst bei Buchung', ${created})`;
  }
  await tx`insert into public.provider_client_links (provider_id, customer_id, source, created_at) values (${prov.id}, ${cust.id}, ${ownClient ? "provider_invite" : "platform"}, ${created}) on conflict do nothing`;
  if (spec.status === "completed") ctx.pairCompleted.set(pairKey, (ctx.pairCompleted.get(pairKey) ?? 0) + 1);
  ctx.bookingCount += 1;
  return {
    id: row.id, completedAt, categorySlug: svc.categorySlug, serviceSlug: off.serviceSlug, duration: off.duration,
    totalCents: total, providerId: prov.id, customerId: cust.id, providerKey: spec.providerKey,
  };
}

function cityName(slug: DemoProvider["city"]): string {
  return { berlin: "Berlin", muenchen: "München", hamburg: "Hamburg", koeln: "Köln", frankfurt: "Frankfurt am Main", duesseldorf: "Düsseldorf" }[slug];
}

// --- reviews (audit-3 F3) ----------------------------------------------------
// Every text fits the booked service (ReviewTemplate.services), is used at most once, and a reply is
// only ever the one written for that review.
const reviewCursor = new Map<string, number>();
const usedReviewTexts = new Set<string>();

function pickTemplate(pool: readonly ReviewTemplate[], key: string, serviceSlug: string, duration: number, minRating: number): ReviewTemplate | null {
  const fresh = pool.filter((t) => t.rating >= minRating && reviewFits(t, serviceSlug, duration) && (t.text === null || !usedReviewTexts.has(t.text)));
  if (fresh.length === 0) return null;
  const start = reviewCursor.get(key) ?? int(0, fresh.length - 1);
  reviewCursor.set(key, start + 1);
  return fresh[start % fresh.length];
}

type ReviewableBooking = Pick<InsertedBooking, "id" | "completedAt" | "categorySlug" | "serviceSlug" | "duration"> & { providerKey?: string };

async function maybeReview(
  ctx: Ctx,
  b: ReviewableBooking,
  p = 0.8,
  forced?: { rating: number; text: string; tags?: string[]; reply?: string | null },
  minRating = 1,
): Promise<void> {
  if (!b.completedAt || (!forced && !chance(p))) return;
  if (forced) {
    usedReviewTexts.add(forced.text);
    return insertReview(ctx, b.id, b.completedAt, { rating: forced.rating, text: forced.text, tags: forced.tags ?? [] }, forced.reply ?? null);
  }
  const selin = b.providerKey === "selin";
  // testkunde-b2b: own pool (25+ reviews, ≈ 4.8 ★), many of them answered.
  const t =
    (selin ? pickTemplate(SELIN_REVIEWS, "selin", b.serviceSlug, b.duration, minRating) : null) ??
    pickTemplate(REVIEWS[b.categorySlug] ?? [], b.categorySlug, b.serviceSlug, b.duration, minRating);
  // When a pool runs out the review is stars + tags only.
  const r = t ?? { rating: 5, text: null, tags: ["Wieder buchen"] };
  if (r.text) usedReviewTexts.add(r.text);
  const replyChance = r.rating <= 3 ? 0.9 : selin ? 0.8 : 0.45;
  const reply = t?.reply && chance(replyChance) ? t.reply : null;
  return insertReview(ctx, b.id, b.completedAt, r, reply);
}

async function insertReview(ctx: Ctx, bookingId: string, completedAt: Date, r: { rating: number; text: string | null; tags: string[] }, reply: string | null): Promise<void> {
  const createdAt = stampBetween(later(completedAt, 2 * HOUR), minDate(later(completedAt, 60 * HOUR), later(ctx.now, -30 * 60_000)));
  const repliedAt = reply ? stampBetween(later(createdAt, HOUR), minDate(later(createdAt, 30 * HOUR), later(ctx.now, -10 * 60_000))) : null;
  await ctx.tx`
    insert into public.reviews (booking_id, customer_id, provider_id, rating, comment, tags, provider_reply, provider_replied_at, created_at, updated_at)
    select id, customer_id, provider_id, ${r.rating}, ${r.text}, ${r.tags}::text[], ${reply}, ${repliedAt}, ${createdAt}, ${repliedAt ?? createdAt}
    from public.bookings where id = ${bookingId}`;
}

// --- portfolio (audit-3 F4) --------------------------------------------------
interface PortfolioImage { path: string; caption: string; category: string; n: number }

/** Portfolio pool per category from scripts/images/sources.json (paths /images/portfolio/<category>-<n>.jpg). */
async function loadPortfolioPool(): Promise<Map<string, PortfolioImage[]>> {
  const entries = JSON.parse(await readFile(path.join(ROOT, "scripts/images/sources.json"), "utf8")) as Array<{ path?: string; caption?: string }>;
  const pool = new Map<string, PortfolioImage[]>();
  for (const e of entries) {
    const m = /^\/images\/portfolio\/([a-z-]+)-(\d+)\.jpg$/.exec(e.path ?? "");
    if (!m) continue;
    const caption = e.caption?.trim();
    if (!caption) throw new Error(`sources.json: ${e.path} hat keine caption.`);
    pool.set(m[1], [...(pool.get(m[1]) ?? []), { path: e.path as string, caption, category: m[1], n: Number(m[2]) }]);
  }
  for (const list of pool.values()) list.sort((a, b) => a.n - b.n);
  return pool;
}

/** Captions that show one particular service go to providers who offer it (soft preference). */
const CAPTION_SERVICES: Array<[RegExp, string[]]> = [
  [/Sportmassage/, ["sportmassage"]],
  [/im Büro|Massagestuhl/, ["ruecken-nacken-massage"]],
  [/Herrenmaniküre/, ["herrenmanikuere"]],
  [/Gel\b/, ["gelnaegel-neumodellage", "gelnaegel-auffuellen", "shellac-manikuere"]],
  [/Fade|Bart|Seitenscheitel/, ["herrenhaarschnitt"]],
  [/Brautdutt|Hochzeit|Pferdeschwanz|Box Braids/, ["hochsteckfrisur"]],
  [/Föhn|Wellen|Volumen/, ["foehnen-styling"]],
  [/Pixie|Bob\b|Lockenschnitt|Spitzen schneiden|Kurzhaarschnitt/, ["damenhaarschnitt", "herrenhaarschnitt"]],
  [/Braut-Make-up/, ["braut-make-up", "braut-make-up-probe"]],
  [/Abend|Smokey|Editorial|Fotoshooting/, ["event-make-up", "braut-make-up"]],
  [/Tages-Make-up/, ["tages-make-up"]],
  [/Lash Lift|Wimpern färben/, ["wimpernlifting"]],
  [/Wimpernverlängerung/, ["wimpernverlaengerung-neuset", "wimpernverlaengerung-auffuellen"]],
  [/Brow Lamination/, ["brow-lamination"]],
  [/Brauen (färben|mit dem Faden)|Brow Mapping/, ["brauen-zupfen-faerben", "brow-lamination"]],
];
/** 2 = shows a service the provider offers, 1 = neutral caption, 0 = shows a service they don't offer. */
function captionFit(img: PortfolioImage, services: Set<string>): 0 | 1 | 2 {
  const rule = CAPTION_SERVICES.find(([re]) => re.test(img.caption));
  if (!rule) return 1;
  return rule[1].some((s) => services.has(s)) ? 2 : 0;
}

interface PortfolioDemand { key: string; services: Set<string>; need: Map<string, number> }

/**
 * Hands out portfolio images without reuse. Categories with the scarcest pools go first; inside a
 * category, captions naming a service go to providers who offer it, then neutral captions, then the rest.
 * Throws when a pool is too small. Returns the picks per provider and what is left per category.
 */
function allocatePortfolio(pool: Map<string, PortfolioImage[]>, demands: PortfolioDemand[]): { picks: Map<string, PortfolioImage[]>; free: Map<string, PortfolioImage[]> } {
  const picks = new Map<string, PortfolioImage[]>();
  const free = new Map([...pool].map(([c, list]) => [c, [...list]]));
  const cats = [...new Set(demands.flatMap((d) => [...d.need.keys()]))].sort((a, b) => (pool.get(a)?.length ?? 0) - (pool.get(b)?.length ?? 0) || a.localeCompare(b));
  for (const c of cats) {
    const left = free.get(c) ?? [];
    const wanting = demands.filter((d) => (d.need.get(c) ?? 0) > 0);
    const needed = wanting.reduce((a, d) => a + (d.need.get(c) ?? 0), 0);
    if (needed > left.length) throw new Error(`Portfolio-Pool „${c}“ reicht nicht: ${needed} Bilder benötigt, ${left.length} in sources.json.`);
    const open = new Map(wanting.map((d) => [d.key, d.need.get(c) ?? 0]));
    const take = (d: PortfolioDemand, img: PortfolioImage) => {
      picks.set(d.key, [...(picks.get(d.key) ?? []), img]);
      left.splice(left.indexOf(img), 1);
      open.set(d.key, (open.get(d.key) ?? 0) - 1);
    };
    for (const img of [...left]) {
      if (!CAPTION_SERVICES.some(([re]) => re.test(img.caption))) continue;
      const to = wanting.filter((d) => (open.get(d.key) ?? 0) > 0 && captionFit(img, d.services) === 2).sort((a, b) => (open.get(b.key) ?? 0) - (open.get(a.key) ?? 0))[0];
      if (to) take(to, img);
    }
    for (const d of wanting) {
      while ((open.get(d.key) ?? 0) > 0) {
        const img = left.find((i) => captionFit(i, d.services) === 1) ?? left[0];
        take(d, img);
      }
    }
    free.set(c, left);
  }
  return { picks, free };
}

/** Returns the start of the testkunde ↔ testkunde-b2b demo appointment. */
export async function runDemoSeed(): Promise<{ demoAppointmentAt: Date | null }> {
  let demoAppointmentAt: Date | null = null;
  if (process.env.DEMO_MODE !== "true") {
    throw new Error("Abgebrochen: Die Demo-Daten werden nur mit DEMO_MODE=true geladen (niemals in Produktion).");
  }
  const url = process.env.DATABASE_URL ?? "postgres://soma:soma@localhost:5432/soma";
  const sql = postgres(normalizeDatabaseUrl(url), { max: 2, prepare: usePreparedStatements(), onnotice: () => undefined });
  const now = new Date();
  seedNow = now;
  const log = (m: string) => console.log(`[db:seed] ${m}`);
  const placeholderDocs: string[] = [];
  /** `days` (fractional) before the seed, as a daytime stamp. */
  const ago = (days: number) => daytime(new Date(now.getTime() - days * DAY - int(0, 240) * 60_000));
  let leylaExpiresAt: Date | null = null;

  try {
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from public.categories`;
    if (n === 0) throw new Error("Basisdaten fehlen – bitte zuerst `npm run db:setup` ausführen.");
    const portfolioPool = await loadPortfolioPool();

    log("Hashing demo passwords …");
    const hashCount = 1 + PROVIDERS.length + CUSTOMERS.length + 2; // + Mara and Paula (Julia's referrals)
    const hashes = await Promise.all(Array.from({ length: hashCount }, () => hashPassword(DEMO_PASSWORD)));
    let h = 0;
    const nextHash = () => hashes[h++];

    await sql.begin(async (tx) => {
      await tx`select set_config('soma.seed_mode', 'on', true)`;
      await cleanup(tx);

      const plzRows = await tx<{ postal_code: string; lat: number; lng: number }[]>`select postal_code, lat, lng from public.postal_codes`;
      const svcRows = await tx<{ id: string; slug: string; category_id: string; category_slug: string; name: string; default_duration: number }[]>`
        select s.id, s.slug, s.category_id, c.slug as category_slug, s.name, s.default_duration from public.services s join public.categories c on c.id = s.category_id`;
      const catRows = await tx<{ id: string; slug: string }[]>`select id, slug from public.categories`;
      const ctx: Ctx = {
        tx, now,
        plz: new Map(plzRows.map((r) => [r.postal_code, { lat: r.lat, lng: r.lng }])),
        services: new Map(svcRows.map((r) => [r.slug, { id: r.id, categoryId: r.category_id, categorySlug: r.category_slug, name: r.name, defaultDuration: r.default_duration }])),
        categories: new Map(catRows.map((r) => [r.slug, r.id])),
        adminId: "", providers: new Map(), customers: new Map(), busy: new Map(), pairCompleted: new Map(), ownClients: new Set(), bookingCount: 0,
      };

      // --- admin -------------------------------------------------------------
      ctx.adminId = await createUser(tx, "testadmin@soma.test", nextHash(), { first_name: "Alex", last_name: "Admin", role: "customer" }, ago(200));
      await tx`update public.profiles set role = 'admin' where id = ${ctx.adminId}`;
      await tx`select set_config('soma.actor_id', ${ctx.adminId}, true), set_config('soma.actor_role', 'admin', true)`;

      // --- providers ---------------------------------------------------------
      // Timeline per provider (audit-3 F8): sign-up → terms → submitted → in review → documents checked → approved,
      // spread over the provider's first days instead of the seed time.
      let pi = 0;
      for (const p of PROVIDERS) {
        pi += 1;
        const email = p.email ?? `${p.key}@profis.soma.test`;
        const createdAt = ago(p.status ? int(3, 10) : int(60, 400));
        const termsAt = daytime(later(createdAt, DAY), "forward");
        const submittedAt = p.status
          ? stampBetween(maxDate(later(termsAt, HOUR), later(now, -3 * DAY)), later(now, -20 * HOUR))
          : stampBetween(later(termsAt, HOUR), later(termsAt, 6 * HOUR));
        const reviewStartAt = p.status === "in_review" ? stampBetween(later(submittedAt, 2 * HOUR), later(now, -2 * HOUR)) : p.status ? null : daytime(later(createdAt, 2 * DAY), "forward");
        const docsReviewedAt = p.status || !reviewStartAt ? null : stampBetween(later(reviewStartAt, 30 * 60_000), later(reviewStartAt, 5 * HOUR));
        const approvedAt = p.status ? null : daytime(later(createdAt, 3 * DAY), "forward");

        const id = await createUser(tx, email, nextHash(), { role: "provider", first_name: p.firstName, last_name: p.lastName }, createdAt);
        await tx`update public.profiles set phone = ${p.phone}, avatar_path = ${p.avatar} where id = ${id}`;
        await tx`
          update public.providers set slug = ${p.slug}, display_name = ${p.displayName}, headline = ${p.headline}, bio = ${p.bio},
            avatar_path = ${p.avatar}, years_experience = ${p.yearsExperience}, languages = ${p.languages}::text[],
            booking_mode = ${p.bookingMode}, lead_time_minutes = ${p.leadTimeMinutes}, travel_buffer_minutes = ${p.bufferMinutes},
            base_postal_code = ${p.basePostalCode}, service_radius_km = ${p.radiusKm}, travel_fee_base_cents = ${p.travelFee.baseCents},
            travel_fee_included_km = ${p.travelFee.includedKm}, travel_fee_per_km_cents = ${p.travelFee.perKmCents},
            payouts_enabled = ${!p.status}, created_at = ${createdAt},
            vat_mode = ${REGULAR_VAT_PROVIDERS.has(p.key) ? "regular" : "small_business"},
            terms_accepted_at = ${termsAt}
          where id = ${id}`;
        for (const w of p.hours) {
          await tx`insert into public.provider_weekly_hours (provider_id, weekday, start_time, end_time, created_at) values (${id}, ${w.weekday}, ${w.start}, ${w.end}, ${createdAt})`;
        }
        const offerings: Array<{ id: string; serviceSlug: string; duration: number; price: number }> = [];
        for (const o of p.offerings) {
          const svc = ctx.services.get(o.service);
          if (!svc) throw new Error(`Unbekannte Leistung ${o.service}`);
          const duration = o.duration ?? svc.defaultDuration;
          const [row] = await tx<{ id: string }[]>`
            insert into public.provider_services (provider_id, service_id, duration_minutes, price_cents, created_at)
            values (${id}, ${svc.id}, ${duration}, ${o.price}, ${createdAt}) returning id`;
          offerings.push({ id: row.id, serviceSlug: o.service, duration, price: o.price });
        }
        // documents (placeholder PDFs) — approved for live providers, pending for the queue
        const cats = [...new Set(p.offerings.map((o) => ctx.services.get(o.service)?.categorySlug ?? ""))];
        const docs: Array<{ kind: string; name: string; categorySlug?: string }> = [
          { kind: "id_document", name: "Personalausweis.pdf" },
          { kind: "business_registration", name: "Gewerbeanmeldung.pdf" },
          { kind: "insurance", name: "Haftpflicht-Police.pdf" },
          ...cats.filter((c) => c !== "make-up").filter((c) => !(p.key === "paul" && c === "haare-styling")).map((c) => ({
            kind: "qualification", categorySlug: c, name: c === "haare-styling" ? "Meisterbrief.pdf" : "Zertifikat.pdf",
          })),
        ];
        for (const d of docs) {
          const key = `documents/${id}/${randomUUID()}.pdf`;
          placeholderDocs.push(key);
          // Insurance has a validity end (audit-2 N4): Selin ≈ 11 months, Charlotte expires soon (admin alert),
          // Leyla's has just expired (maintenance suspends her below), everyone else 3–14 months.
          const expiresAt =
            d.kind !== "insurance" || p.status ? null
            : p.key === "selin" ? new Date(now.getTime() + 335 * DAY)
            : p.key === "charlotte" ? new Date(now.getTime() + 9 * DAY)
            : p.key === "leyla" ? new Date(now.getTime() - 1 * DAY)
            : new Date(now.getTime() + int(90, 420) * DAY);
          if (p.key === "leyla" && expiresAt) leylaExpiresAt = expiresAt;
          await tx`
            insert into public.provider_documents (provider_id, kind, category_id, storage_path, file_name, mime_type, size_bytes, status, reviewed_by, reviewed_at, created_at, expires_at)
            values (${id}, ${d.kind}, ${d.categorySlug ? ctx.categories.get(d.categorySlug) ?? null : null}, ${key}, ${d.name}, 'application/pdf', 512,
                    ${p.status ? "pending" : "approved"}, ${p.status ? null : ctx.adminId}, ${docsReviewedAt}, ${createdAt}, ${expiresAt})`;
        }
        await tx`update public.providers set status = ${p.status ?? "approved"} where id = ${id}`;
        // the status timestamp trigger stamps now(); the seed's own timeline wins
        await tx`update public.providers set submitted_at = ${submittedAt}, approved_at = ${approvedAt} where id = ${id}`;
        const chain: Array<{ provider_id: string; from_status: string; to_status: string; actor_id: string; created_at: Date }> = [
          { provider_id: id, from_status: "draft", to_status: "submitted", actor_id: id, created_at: submittedAt },
        ];
        if (reviewStartAt) chain.push({ provider_id: id, from_status: "submitted", to_status: "in_review", actor_id: ctx.adminId, created_at: reviewStartAt });
        if (approvedAt) chain.push({ provider_id: id, from_status: "in_review", to_status: "approved", actor_id: ctx.adminId, created_at: approvedAt });
        await tx`delete from public.provider_status_events where provider_id = ${id}`;
        await tx`insert into public.provider_status_events ${tx(chain, "provider_id", "from_status", "to_status", "actor_id", "created_at")}`;
        if (approvedAt) {
          await tx`insert into public.audit_log (actor_id, action, entity, entity_id, data, created_at)
                   values (${ctx.adminId}, 'provider.approve', 'provider', ${id}, '{}'::jsonb, ${approvedAt})`;
        }
        ctx.providers.set(p.key, { id, p, offerings, approvedAt });
        ctx.busy.set(p.key, []);
      }
      log(`Providers: ${pi} (${PROVIDERS.filter((p) => !p.status).length} approved)`);

      // --- portfolio (audit-3 F4) ---------------------------------------------
      // Every public provider (Leyla included) gets exactly 3 images from sources.json, none used twice:
      // single-category providers 3 from their category, two or more categories 2 from the primary
      // (most offerings) and 1 from the secondary.
      {
        const servicesOf = (p: DemoProvider) => new Set(p.offerings.map((o) => o.service));
        const demands: PortfolioDemand[] = PROVIDERS.filter((p) => !p.status).map((p) => {
          const [primary, secondary] = categoriesOf(ctx, p);
          return { key: p.key, services: servicesOf(p), need: new Map(secondary ? [[primary, 2], [secondary, 1]] : [[primary, 3]]) };
        });
        const { picks, free } = allocatePortfolio(portfolioPool, demands);
        // not yet public (verification queue): leftovers of their categories, if any
        for (const p of PROVIDERS.filter((x) => x.status)) {
          const extra: PortfolioImage[] = [];
          for (const c of categoriesOf(ctx, p)) {
            const left = free.get(c) ?? [];
            while (extra.length < 3 && left.length > 0) extra.push(left.shift() as PortfolioImage);
          }
          if (extra.length) picks.set(p.key, extra);
        }
        for (const [key, images] of picks) {
          const prov = ctx.providers.get(key);
          if (!prov) continue;
          const since = prov.approvedAt ?? ago(1);
          for (const [k, img] of images.entries()) {
            await tx`
              insert into public.provider_portfolio (provider_id, storage_path, caption, category_id, sort_order, created_at)
              values (${prov.id}, ${img.path}, ${img.caption}, ${ctx.categories.get(img.category) ?? null}, ${k},
                      ${stampBetween(later(since, (k + 1) * DAY), minDate(later(since, (k + 20) * DAY), later(now, -DAY)))})`;
          }
        }
        // Seed-time assertion: every path is in sources.json, none is used twice, every public provider has 3.
        const known = new Set([...portfolioPool.values()].flat().map((i) => i.path));
        const ids = [...ctx.providers.values()].map((x) => x.id);
        const rows = await tx<{ storage_path: string; n: number }[]>`
          select storage_path, count(*)::int as n from public.provider_portfolio where provider_id = any(${ids}::uuid[]) group by storage_path`;
        const missing = rows.filter((r) => !known.has(r.storage_path)).map((r) => r.storage_path);
        const twice = rows.filter((r) => r.n > 1).map((r) => r.storage_path);
        const perProvider = await tx<{ provider_id: string; n: number }[]>`
          select pr.id as provider_id, count(pp.id)::int as n from public.providers pr left join public.provider_portfolio pp on pp.provider_id = pr.id
          where pr.id = any(${ids}::uuid[]) and pr.status = 'approved' group by pr.id`;
        const notThree = perProvider.filter((r) => r.n !== 3);
        if (missing.length || twice.length || notThree.length) {
          throw new Error(`Portfolio-Prüfung fehlgeschlagen – nicht in sources.json: ${missing.join(", ") || "–"}; doppelt: ${twice.join(", ") || "–"}; ohne genau 3 Bilder: ${notThree.length}`);
        }
        log(`Portfolio: ${rows.length} images, ${[...free.values()].reduce((a, l) => a + l.length, 0)} unused`);
      }

      // --- customers ---------------------------------------------------------
      const order = ["sophie", ...CUSTOMERS.map((c) => c.key).filter((k) => k !== "sophie")];
      for (const key of order) {
        const c = CUSTOMERS.find((x) => x.key === key) as DemoCustomer;
        let referralCode: string | null = null;
        if (key === "julia") {
          [{ referral_code: referralCode }] = await tx<{ referral_code: string }[]>`select referral_code from public.profiles where id = ${ctx.customers.get("sophie")?.id ?? ""}`;
        }
        const id = await createUser(tx, c.email, nextHash(), { role: "customer", first_name: c.firstName, last_name: c.lastName, referral_code: referralCode, marketing_opt_in: chance(0.3) }, ago(int(130, 420)));
        await tx`update public.profiles set phone = ${c.phone} where id = ${id}`;
        await tx`insert into public.addresses (user_id, label, kind, street, house_number, postal_code, city, is_default)
                 values (${id}, 'Zuhause', 'home', ${c.street}, ${c.houseNumber}, ${c.postalCode}, ${cityName(c.city)}, true)`;
        ctx.customers.set(key, { id, c });
      }
      const julia = ctx.customers.get("julia");
      if (!julia) throw new Error("testkunde missing");
      const juliaSince = ago(200);
      await tx`update public.profiles set created_at = ${juliaSince}, marketing_opt_in = true where id = ${julia.id}`;
      await tx`update auth.users set created_at = ${juliaSince}, last_sign_in_at = ${daytime(later(now, -2 * HOUR))} where id = ${julia.id}`;
      await tx`update public.addresses set details = 'Vorderhaus, 3. OG rechts, Klingel „Hartmann“' where user_id = ${julia.id}`;
      const JULIA_OFFICE = { kind: "office" as const, street: "Friedrichstraße", houseNumber: "68", postalCode: "10117", city: "Berlin", details: "Empfang 4. OG, bitte bei „Hartmann“ melden" };
      const JULIA_HOTEL = { kind: "hotel" as const, street: "Braubachstraße", houseNumber: "24", postalCode: "60311", city: "Frankfurt am Main", details: "Hotel am Dom, Zimmer 412 – bitte an der Rezeption anmelden" };
      await tx`insert into public.addresses (user_id, label, kind, street, house_number, postal_code, city, details, created_at)
               values (${julia.id}, 'Büro', 'office', ${JULIA_OFFICE.street}, ${JULIA_OFFICE.houseNumber}, ${JULIA_OFFICE.postalCode}, ${JULIA_OFFICE.city}, ${JULIA_OFFICE.details}, ${ago(150)}),
                      (${julia.id}, 'Hotel Frankfurt', 'hotel', ${JULIA_HOTEL.street}, ${JULIA_HOTEL.houseNumber}, ${JULIA_HOTEL.postalCode}, ${JULIA_HOTEL.city}, ${JULIA_HOTEL.details}, ${ago(80)})`;
      await tx`update public.notification_preferences
               set email_bookings = true, email_reminders = true, email_marketing = true, sms_reminders = true, push_bookings = true
               where user_id = ${julia.id}`;
      // friends Julia invited: Mara (rewarded after her first booking) and Paula (pending)
      const [{ referral_code: juliaCode }] = await tx<{ referral_code: string }[]>`select referral_code from public.profiles where id = ${julia.id}`;
      const MARA: DemoCustomer = { key: "mara", email: "mara@kunden.soma.test", firstName: "Mara", lastName: "Köhler", city: "berlin", street: "Schönhauser Allee", houseNumber: "58", postalCode: "10437", phone: "+49 170 4561237" };
      const maraId = await createUser(tx, MARA.email, nextHash(), { role: "customer", first_name: MARA.firstName, last_name: MARA.lastName, referral_code: juliaCode }, ago(75));
      await tx`update public.profiles set phone = ${MARA.phone} where id = ${maraId}`;
      await tx`insert into public.addresses (user_id, label, kind, street, house_number, postal_code, city, is_default)
               values (${maraId}, 'Zuhause', 'home', ${MARA.street}, ${MARA.houseNumber}, ${MARA.postalCode}, 'Berlin', true)`;
      ctx.customers.set("mara", { id: maraId, c: MARA });
      await createUser(tx, "paula@kunden.soma.test", nextHash(), { role: "customer", first_name: "Paula", last_name: "Richter", referral_code: juliaCode }, ago(6));
      // sign-up side effects (addresses, referral, welcome credit) carry the sign-up date, not the seed time
      const seeded = tx`(select id from auth.users where email like '%soma.test')`;
      await tx`update public.addresses a set created_at = pr.created_at from public.profiles pr where pr.id = a.user_id and a.user_id in ${seeded} and a.label = 'Zuhause'`;
      await tx`update public.referrals r set created_at = pr.created_at from public.profiles pr where pr.id = r.referred_id and r.referred_id in ${seeded}`;
      await tx`update public.credit_ledger cl set created_at = pr.created_at from public.profiles pr where pr.id = cl.user_id and cl.reason = 'referral_welcome' and cl.user_id in ${seeded}`;
      log(`Customers: ${ctx.customers.size + 1}`);

      // --- testkunde@soma.test (Julia H.) history -------------------------------
      const dayAt = (daysAgo: number, providerKey: string, duration: number) => {
        const p = ctx.providers.get(providerKey)?.p as DemoProvider;
        for (let d = daysAgo; d < daysAgo + 14; d += 1) {
          const date = addDays(localDateOf(now), -d);
          const s = slotOn(p, date, duration);
          if (s) return s;
        }
        throw new Error("no slot");
      };
      const dur = (providerKey: string, i: number) => ctx.providers.get(providerKey)?.offerings[i].duration ?? 60;
      /** created `minDays`–`maxDays` before the start (daytime) */
      const leadBefore = (startsAt: Date, minDays: number, maxDays: number) => daytime(later(startsAt, -int(minDays, maxDays) * DAY - int(0, 240) * 60_000));
      const past = async (providerKey: string, offeringIndex: number, daysAgo: number, extra: Partial<BookingSpec> = {}) => {
        const startsAt = dayAt(daysAgo, providerKey, dur(providerKey, offeringIndex));
        return insertBooking(ctx, { providerKey, customerKey: "julia", offeringIndex, startsAt, status: "completed", createdAt: leadBefore(startsAt, 2, 9), ...extra });
      };
      const j1 = await past("selin", 0, 172, { useCredits: 1500, notes: "Bitte zweimal klingeln." });
      await maybeReview(ctx, j1, 1, {
        rating: 5, tags: ["Pünktlich", "Entspannend"],
        text: "Selin ist ein Schatz: ruhig, pünktlich und die Massage war wunderbar. Ich habe danach geschlafen wie ein Baby.",
        reply: "Danke dir, Julia. Schön, dass du danach so gut schlafen konntest – bis zum nächsten Mal.",
      });
      await tx`update public.referrals set status = 'rewarded', qualified_booking_id = ${j1.id}, rewarded_at = ${j1.completedAt} where referred_id = ${julia.id}`;
      await tx`insert into public.credit_ledger (user_id, amount_cents, reason, booking_id, note, created_at)
               values (${ctx.customers.get("sophie")?.id ?? ""}, 1500, 'referral_reward', ${j1.id}, 'Empfehlungsprämie', ${j1.completedAt})`;
      const j2 = await past("linh", 4, 150);
      await maybeReview(ctx, j2, 1, { rating: 4, tags: ["Sauber gearbeitet"], text: "Sehr gepflegtes Ergebnis und angenehme Gespräche. Die Pediküre hat etwas länger gedauert als geplant." });
      const j3 = await past("jonas", 0, 128);
      await maybeReview(ctx, j3, 1, {
        rating: 5, tags: ["Gute Beratung", "Professionell"],
        text: "Endlich ein Schnitt, der auch nach Wochen noch gut fällt. Jonas hört genau zu und erklärt, was er macht.",
        reply: "Danke für das Vertrauen – dann bis in sechs Wochen.",
      });
      await past("selin", 2, 105);
      const j5 = await past("friederike", 1, 88);
      await maybeReview(ctx, j5, 1, { rating: 5, tags: ["Gute Beratung", "Entspannend"], text: "Meine Haut war nach der Behandlung ruhig und frisch. Friederike hat mir zwei Produkte empfohlen, die wirklich passen." });
      const j6 = await past("katrin", 0, 70, { address: JULIA_HOTEL });
      await maybeReview(ctx, j6, 1, { rating: 4, tags: ["Pünktlich"], text: "Nach der Anreise direkt im Hotel – sehr praktisch. Kurz, aber gründlich, und auf die Minute pünktlich." });
      // Mara, invited by Julia: first completed booking → Julia's 15 € referral reward
      const maraStart = dayAt(62, "mai", dur("mai", 0));
      const maraFirst = await insertBooking(ctx, { providerKey: "mai", customerKey: "mara", offeringIndex: 0, startsAt: maraStart, status: "completed", createdAt: leadBefore(maraStart, 3, 8) });
      await tx`update public.referrals set status = 'rewarded', qualified_booking_id = ${maraFirst.id}, rewarded_at = ${maraFirst.completedAt} where referred_id = ${maraId}`;
      await tx`insert into public.credit_ledger (user_id, amount_cents, reason, booking_id, note, created_at)
               values (${julia.id}, 1500, 'referral_reward', ${maraFirst.id}, 'Empfehlungsprämie', ${maraFirst.completedAt})`;
      const j7 = await past("mai", 0, 52);
      await maybeReview(ctx, j7, 1, {
        rating: 5, tags: ["Professionell"],
        text: "Das Wimpernlifting sieht nach vier Wochen immer noch natürlich aus. Mai arbeitet ruhig und sehr genau.",
        reply: "Wie schön – danke für die liebe Bewertung, Julia.",
      });
      // cancelled 2–24 h before the start → 50 % of the treatment, travel refunded (policy §5.5)
      const abenaStart = dayAt(40, "abena", dur("abena", 0));
      await insertBooking(ctx, { providerKey: "abena", customerKey: "julia", offeringIndex: 0, startsAt: abenaStart, status: "cancelled", feePercent: 50, cancelledBy: "customer", createdAt: leadBefore(abenaStart, 5, 8) });
      const j8 = await past("linh", 1, 33);
      await maybeReview(ctx, j8, 1, { rating: 5, tags: ["Sauber gearbeitet", "Wieder buchen"], text: "Shellac hält jetzt seit drei Wochen ohne eine einzige Macke. Linh ist meine feste Adresse für Nägel." });
      const goodwillAt = ago(30);
      await tx`insert into public.credit_ledger (user_id, amount_cents, reason, note, created_by, created_at)
               values (${julia.id}, 1000, 'goodwill', 'Kulanzgutschrift wegen verspätetem Termin', ${ctx.adminId}, ${goodwillAt})`;
      await tx`insert into public.audit_log (actor_id, action, entity, entity_id, data, created_at)
               values (${ctx.adminId}, 'credits.adjust', 'profile', ${julia.id}, ${tx.json({ amountCents: 1000, reason: "goodwill", note: "Kulanzgutschrift wegen verspätetem Termin" })}, ${goodwillAt})`;
      await past("jonas", 0, 22, { useCredits: 1000, address: JULIA_OFFICE }); // partially redeems the credit (25 € → 15 €)
      await past("selin", 3, 8); // reviewable (within 14 days)
      for (const [k, fav] of ["selin", "linh", "mai"].entries()) {
        await tx`insert into public.favorites (customer_id, provider_id, created_at) values (${julia.id}, ${ctx.providers.get(fav)?.id ?? ""}, ${ago(160 - k * 50)})`;
      }

      // --- testkunde-b2b@soma.test (Selin A.): own clients via the invite link --------
      const selinProv = ctx.providers.get("selin");
      if (!selinProv) throw new Error("testkunde-b2b missing");
      for (const k of ["lisa", "katharina"]) ctx.ownClients.add(`selin:${k}`);
      for (const [k, daysAgo, i] of [["lisa", 61, 4], ["katharina", 27, 0]] as const) {
        const s = dayAt(daysAgo, "selin", dur("selin", i));
        const b = await insertBooking(ctx, { providerKey: "selin", customerKey: k, offeringIndex: i, startsAt: s, status: "completed", createdAt: leadBefore(s, 2, 5) });
        await maybeReview(ctx, b, 0.9);
      }
      // completed yesterday → still in the 48-h payout hold ("ausstehend")
      const recentStart = dayAt(1, "selin", dur("selin", 1));
      const recentSelin = await insertBooking(ctx, { providerKey: "selin", customerKey: "clara", offeringIndex: 1, startsAt: recentStart, status: "completed", createdAt: leadBefore(recentStart, 3, 6) });
      await maybeReview(ctx, recentSelin, 1);

      // --- historical bookings (~120) ---------------------------------------
      const approved = PROVIDERS.filter((p) => !p.status);
      for (const p of approved) {
        // testkunde-b2b gets six months of history (25+ reviews), the others about four months.
        const count = (p.key === "selin" ? 28 : 3) + int(1, 3);
        const maxDaysAgo = p.key === "selin" ? 180 : 120;
        const base = ctx.plz.get(p.basePostalCode);
        const cityCustomers = CUSTOMERS.filter((c) => {
          const pt = ctx.plz.get(c.postalCode);
          // Julia's history is curated; Selin's own clients (invite link) only have their two curated bookings.
          return c.city === p.city && c.key !== "julia" && !(p.key === "selin" && (c.key === "lisa" || c.key === "katharina")) && !!base && !!pt && haversineKm(base, pt) <= p.radiusKm;
        }).map((c) => c.key);
        if (cityCustomers.length === 0) continue;
        const dates: string[] = [];
        for (let i = 0; i < count; i += 1) {
          let tries = 0;
          for (;;) {
            const date = addDays(localDateOf(now), -int(4, maxDaysAgo));
            tries += 1;
            if (!dates.includes(date) && p.hours.some((w) => w.weekday === isoWeekdayOf(date))) { dates.push(date); break; }
            if (tries > 50) break;
          }
        }
        dates.sort();
        let lastCustomer: string | null = null;
        for (const date of dates) {
          const prov = ctx.providers.get(p.key);
          if (!prov) continue;
          const offeringIndex = int(0, prov.offerings.length - 1);
          const startsAt = slotOn(p, date, prov.offerings[offeringIndex].duration);
          if (!startsAt) continue;
          const customerKey: string = lastCustomer && chance(0.3) ? lastCustomer : pick(cityCustomers);
          lastCustomer = customerKey;
          const createdAt = leadBefore(startsAt, 1, 12);
          const roll = rand();
          const status: BookingSpec["status"] = roll < 0.885 ? "completed" : roll < 0.985 ? "cancelled" : "no_show";
          const feePercent = status === "no_show" ? 100 : status === "cancelled" ? pick([0, 0, 50]) : 0;
          const cancelledBy = status === "cancelled" && chance(0.15) ? "provider" : "customer";
          const b = await insertBooking(ctx, { providerKey: p.key, customerKey, offeringIndex, startsAt, status, createdAt, feePercent: cancelledBy === "provider" ? 0 : feePercent, cancelledBy });
          await maybeReview(ctx, b, p.key === "selin" ? 0.9 : 0.8, undefined, p.key === "selin" ? 4 : 1);
        }
      }

      // --- upcoming bookings --------------------------------------------------
      type Addr = NonNullable<BookingSpec["address"]>;
      const reserve = (providerKey: string, startsAt: Date, duration: number): boolean => {
        const prov = ctx.providers.get(providerKey);
        if (!prov) return false;
        const s = startsAt.getTime();
        const e = s + (duration + prov.p.bufferMinutes) * 60_000;
        const list = ctx.busy.get(providerKey) ?? [];
        if (overlaps(list, s - prov.p.bufferMinutes * 60_000, e)) return false;
        list.push([s, e]);
        ctx.busy.set(providerKey, list);
        return true;
      };
      /**
       * created_at spread over the lead time (audit-3 F8): 1–14 days before the start, never later than
       * 1 h before the seed, so the admin chart shows no spike.
       */
      const upcomingCreatedAt = (startsAt: Date): Date => {
        const minLead = Math.max(1, Math.ceil((startsAt.getTime() - now.getTime()) / DAY));
        const c = leadBefore(startsAt, minLead, Math.max(minLead, 14));
        return c.getTime() <= now.getTime() - HOUR ? c : daytime(later(now, -int(1, 6) * HOUR));
      };
      /** Open requests were made in the last half hour (at night: the previous evening), so respond_by is ≥ 3 h ahead. */
      const requestCreatedAt = (): Date => {
        const t = later(now, -int(5, 25) * 60_000);
        if (isDaytime(t)) return t;
        const w = toWallClock(t);
        return wallTimeToInstant(w.minutes < DAY_FROM ? addDays(w.date, -1) : w.date, DAY_TO - int(0, 6)).instant;
      };
      /** First free slot from `fromDay` to `toDay` days ahead (0 = today, only after now + 1 h). Returns the day used or null. */
      const upcomingAt = async (
        providerKey: string, customerKey: string, fromDay: number, toDay: number, status: "confirmed" | "requested",
        opts: { offeringIndex?: number; address?: Addr; notes?: string } = {},
      ): Promise<number | null> => {
        const prov = ctx.providers.get(providerKey);
        if (!prov) return null;
        for (let d = fromDay; d <= toDay; d += 1) {
          const date = addDays(localDateOf(now), d);
          const offeringIndex = opts.offeringIndex ?? int(0, prov.offerings.length - 1);
          const duration = prov.offerings[offeringIndex].duration;
          for (let attempt = 0; attempt < 8; attempt += 1) {
            const startsAt = slotOn(prov.p, date, duration);
            if (!startsAt || startsAt.getTime() < now.getTime() + (d === 0 ? 60 : prov.p.leadTimeMinutes) * 60_000) continue;
            if (!reserve(providerKey, startsAt, duration)) continue;
            // respond_by follows the engine (business hours 08–21, ≤ start − 2 h)
            const createdAt = status === "requested" ? requestCreatedAt() : upcomingCreatedAt(startsAt);
            await insertBooking(ctx, {
              providerKey, customerKey, offeringIndex, startsAt, status, createdAt, address: opts.address, notes: opts.notes,
              respondBy: status === "requested" ? computeRespondBy(createdAt, startsAt, Number(PLATFORM_SETTINGS.request_response_hours)) : null,
            });
            return d;
          }
        }
        return null;
      };
      const upcoming = (providerKey: string, customerKey: string, daysAhead: number, status: "confirmed" | "requested") =>
        upcomingAt(providerKey, customerKey, daysAhead, daysAhead + 9, status);

      // testkunde ↔ testkunde-b2b: confirmed appointment starting ≈ 35 min after the seed (audit-3 F5), so
      // "Termin starten" is available a few minutes after `npm run demo:refresh`. Selin's weekly hours stay as
      // they are (audit-4 A4-7): outside them the appointment moves to the start of her next working window.
      {
        const off = selinProv.offerings[0];
        const soon = new Date(Math.ceil((now.getTime() + 35 * 60_000) / (5 * 60_000)) * 5 * 60_000);
        const hours = await tx<{ weekday: number; start_time: string; end_time: string }[]>`
          select weekday, start_time::text, end_time::text from public.provider_weekly_hours where provider_id = ${selinProv.id} order by weekday, start_time`;
        const fits = (date: string, startMin: number) =>
          hours.some((x) => x.weekday === isoWeekdayOf(date) && parseTimeOfDay(x.start_time) <= startMin && parseTimeOfDay(x.end_time) >= startMin + off.duration);
        let startsAt = soon;
        const w = toWallClock(soon);
        if (!fits(w.date, w.minutes)) {
          let next: Date | null = null;
          for (let d = 0; d <= 7 && !next; d++) {
            const date = addDays(w.date, d);
            for (const x of hours.filter((h) => h.weekday === isoWeekdayOf(date))) {
              const from = Math.ceil(Math.max(parseTimeOfDay(x.start_time), d === 0 ? w.minutes : 0) / 5) * 5;
              if (from + off.duration <= parseTimeOfDay(x.end_time)) {
                next = wallTimeToInstant(date, from).instant;
                break;
              }
            }
          }
          if (next) startsAt = next;
        }
        demoAppointmentAt = startsAt;
        reserve("selin", startsAt, off.duration);
        await insertBooking(ctx, { providerKey: "selin", customerKey: "julia", offeringIndex: 0, startsAt, status: "confirmed", createdAt: upcomingCreatedAt(startsAt), notes: "Bitte kurz anrufen, wenn du unten bist – die Klingel ist leise." });
      }

      // testkunde-b2b (Selin): this week's agenda on several days (today too if it still fits) and two open requests
      let day = 0;
      for (const [k, i] of [["anna", 4], ["david", 0], ["clara", 3], ["sophie", 2], ["olga", 1]] as const) {
        const used = await upcomingAt("selin", k, day, 7, "confirmed", { offeringIndex: i });
        if (used === null) break;
        day = used + 1;
        if (day > 7) break;
      }
      await upcomingAt("selin", "julia", 4, 12, "requested", { offeringIndex: 2, notes: "Gern wieder mit dem Lavendelöl." });
      await upcomingAt("selin", "fatma", 4, 13, "requested", { offeringIndex: 0 });
      // testkunde (Julia): confirmed manicure in 2–3 days at home, cosmetics next week at the office
      if ((await upcomingAt("linh", "julia", 2, 3, "confirmed", { offeringIndex: 1 })) === null) {
        if ((await upcomingAt("mai", "julia", 2, 3, "confirmed", { offeringIndex: 3 })) === null) await upcomingAt("linh", "julia", 2, 7, "confirmed", { offeringIndex: 1 });
      }
      await upcomingAt("friederike", "julia", 7, 12, "confirmed", { offeringIndex: 0, address: JULIA_OFFICE, notes: "Termin im Besprechungsraum, Wasser ist da." });
      // general load across the cities
      for (const p of approved) {
        if (p.key === "selin") continue;
        const n = int(0, 2);
        const pBase = ctx.plz.get(p.basePostalCode);
        const cityCustomers = CUSTOMERS.filter((c) => {
          const pt = ctx.plz.get(c.postalCode);
          return c.city === p.city && c.key !== "julia" && !!pBase && !!pt && haversineKm(pBase, pt) <= p.radiusKm;
        }).map((c) => c.key);
        if (cityCustomers.length === 0) continue;
        for (let i = 0; i < n; i += 1) {
          await upcoming(p.key, pick(cityCustomers), int(1, 12), p.bookingMode === "request" && chance(0.4) ? "requested" : "confirmed");
        }
      }
      // Open requests must stay open through the demo (audit-3 F5).
      const shortRequests = await tx<{ reference: string }[]>`
        select reference from public.bookings where status = 'requested' and provider_id in ${seeded} and respond_by < ${later(now, 3 * HOUR)}`;
      if (shortRequests.length) throw new Error(`Offene Anfragen mit weniger als 3 h Antwortzeit: ${shortRequests.map((r) => r.reference).join(", ")}`);
      // 24-h reminders count as already sent (daytime stamp), so maintenance adds no night-time notifications.
      for (const b of await tx<{ id: string; starts_at: Date; created_at: Date }[]>`
        select id, starts_at, created_at from public.bookings where status = 'confirmed' and provider_id in ${seeded} and starts_at > ${now} and starts_at <= ${later(now, DAY)}`) {
        await tx`update public.bookings set reminder_24h_sent_at = ${stampBetween(maxDate(b.created_at, later(b.starts_at, -DAY)), later(now, -60_000))} where id = ${b.id}`;
      }

      // --- disputes -----------------------------------------------------------
      // open: a facial completed in the last days (still in the payout hold)
      {
        const merle = ctx.providers.get("merle");
        if (merle) {
          const s = dayAt(1, "merle", dur("merle", 0));
          const b = await insertBooking(ctx, { providerKey: "merle", customerKey: "greta", offeringIndex: 0, startsAt: s, status: "completed", createdAt: leadBefore(s, 2, 6) });
          const openedAt = stampBetween(later(b.completedAt ?? s, 2 * HOUR), minDate(later(b.completedAt ?? s, 30 * HOUR), later(now, -HOUR)));
          await tx`insert into public.disputes (booking_id, opened_by, reason, description, status, created_at)
                   values (${b.id}, ${b.customerId}, 'quality', ${`Die Behandlung war deutlich kürzer als die gebuchten ${b.duration} Minuten, und die Maske wurde ausgelassen.`}, 'open', ${openedAt})`;
        }
      }
      const [older] = await tx<{ id: string; customer_id: string; completed_at: Date }[]>`
        select b.id, b.customer_id, b.completed_at from public.bookings b join public.providers p on p.id = b.provider_id
        where b.status = 'completed' and p.slug = 'emre-y-koeln' order by b.completed_at limit 1`;
      if (older) {
        const openedAt = stampBetween(later(older.completed_at, 2 * HOUR), later(older.completed_at, 26 * HOUR));
        const resolvedAt = stampBetween(later(openedAt, DAY), later(openedAt, 3 * DAY));
        await tx`insert into public.disputes (booking_id, opened_by, reason, description, status, resolution_note, resolved_by, resolved_at, created_at)
                 values (${older.id}, ${older.customer_id}, 'other', 'Der Profi kam 20 Minuten später als vereinbart, ohne Bescheid zu geben.', 'resolved_no_action',
                         'Verspätung bestätigt, Termin wurde vollständig durchgeführt. Hinweis an den Profi.', ${ctx.adminId}, ${resolvedAt}, ${openedAt})`;
      }

      // --- testkunde-b2b: top up to 25+ reviews (oldest unreviewed completed bookings first) --------
      {
        const missing = await tx<{ id: string; completed_at: Date; service_slug: string; duration_minutes: number }[]>`
          select b.id, b.completed_at, s.slug as service_slug, b.duration_minutes from public.bookings b join public.services s on s.id = b.service_id
          where b.provider_id = ${selinProv.id} and b.status = 'completed' and b.customer_id <> ${julia.id}
            and not exists (select 1 from public.reviews r where r.booking_id = b.id)
          order by b.completed_at`;
        const [{ n: have }] = await tx<{ n: number }[]>`select count(*)::int as n from public.reviews where provider_id = ${selinProv.id}`;
        for (const m of missing.slice(0, Math.max(0, 27 - have))) {
          await maybeReview(ctx, { id: m.id, completedAt: m.completed_at, categorySlug: "massage", serviceSlug: m.service_slug, duration: m.duration_minutes, providerKey: "selin" }, 1, undefined, 4);
        }
      }

      // --- payouts for older completed bookings ------------------------------
      // Everything completed > 10 days ago is paid out; testkunde-b2b in three monthly batches.
      let lastBatchAt: Date | null = null;
      for (const [, prov] of ctx.providers) {
        if (prov.p.status) continue;
        const rows = await tx<{ id: string; provider_payout_cents: number; done_at: Date }[]>`
          select id, provider_payout_cents, coalesce(completed_at, cancelled_at) as done_at from public.bookings
          where provider_id = ${prov.id} and payout_id is null and provider_payout_cents > 0
            and (status = 'completed' or (status in ('cancelled', 'no_show') and cancellation_fee_cents > 0))
            and coalesce(completed_at, cancelled_at) < ${new Date(now.getTime() - 10 * DAY)}`;
        if (rows.length === 0) continue;
        const age = (r: { done_at: Date }) => (now.getTime() - r.done_at.getTime()) / DAY;
        const batches = prov.p.key === "selin"
          ? [rows.filter((r) => age(r) >= 75), rows.filter((r) => age(r) >= 40 && age(r) < 75), rows.filter((r) => age(r) < 40)]
          : [rows];
        for (const batch of batches) {
          if (batch.length === 0) continue;
          const amount = batch.reduce((a, r) => a + r.provider_payout_cents, 0);
          const times = batch.map((r) => r.done_at.getTime());
          const paidAt = daytime(new Date(Math.min(now.getTime() - 6 * DAY, Math.max(...times) + 5 * DAY)));
          const createdAt = daytime(later(paidAt, -DAY));
          if (!lastBatchAt || createdAt > lastBatchAt) lastBatchAt = createdAt;
          const [po] = await tx<{ id: string }[]>`
            insert into public.payouts (provider_id, amount_cents, status, period_start, period_end, external_id, paid_at, created_by, created_at)
            values (${prov.id}, ${amount}, 'paid', ${new Date(Math.min(...times))}, ${new Date(Math.max(...times))}, ${`dev_po_${code(8)}`},
                    ${paidAt}, ${ctx.adminId}, ${createdAt}) returning id`;
          await tx`update public.bookings set payout_id = ${po.id} where id = any(${batch.map((r) => r.id)}::uuid[])`;
        }
      }
      await tx`insert into public.audit_log (actor_id, action, entity, entity_id, data, created_at)
               values (${ctx.adminId}, 'payout.batch', 'payout', null, ${tx.json({ note: "Wöchentlicher Auszahlungslauf" })}, ${lastBatchAt ?? ago(7)}),
                      (${ctx.adminId}, 'setting.update', 'platform_setting', 'request_response_hours', ${tx.json({ value: 4 })}, ${ago(14)}),
                      (${ctx.adminId}, 'content.upsert', 'content_block', 'announcement', ${tx.json({ active: false })}, ${ago(21)})`;
      for (const d of await tx<{ id: string; reviewed_at: Date }[]>`select id, reviewed_at from public.provider_documents where provider_id = ${selinProv.id} and reviewed_at is not null`) {
        await tx`insert into public.audit_log (actor_id, action, entity, entity_id, data, created_at)
                 values (${ctx.adminId}, 'document.approved', 'provider_document', ${d.id}, ${tx.json({ providerId: selinProv.id })}, ${d.reviewed_at})`;
      }

      // --- notifications for the demo logins ----------------------------------
      const readAfter = (at: Date) => minDate(stampBetween(later(at, 20 * 60_000), minDate(later(at, 8 * HOUR), later(now, -5 * 60_000))), later(now, -60_000));
      const reqs = await tx<{ id: string; service_name: string; respond_by: Date; created_at: Date }[]>`
        select id, service_name, respond_by, created_at from public.bookings where provider_id = ${selinProv.id} and status = 'requested' order by respond_by`;
      for (const r of reqs) {
        await tx`insert into public.notifications (user_id, type, title, body, href, data, created_at)
                 values (${selinProv.id}, 'booking.requested', ${`Neue Anfrage: ${r.service_name}`}, 'Bitte antworte rechtzeitig – die Kundschaft wartet auf deine Zusage.', ${`/pro/termine/${r.id}`}, ${tx.json({ bookingId: r.id })}, ${later(r.created_at, 60_000)})`;
      }
      const [lastPayout] = await tx<{ amount_cents: number; paid_at: Date }[]>`select amount_cents, paid_at from public.payouts where provider_id = ${selinProv.id} order by paid_at desc limit 1`;
      if (lastPayout) {
        await tx`insert into public.notifications (user_id, type, title, body, href, read_at, created_at)
                 values (${selinProv.id}, 'payout.paid', ${`Auszahlung unterwegs: ${(lastPayout.amount_cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}`},
                         'Das Geld ist in der Regel in 1–3 Werktagen auf deinem Konto.', '/pro/einnahmen', ${readAfter(lastPayout.paid_at)}, ${lastPayout.paid_at})`;
      }
      const [lastReview] = await tx<{ rating: number; created_at: Date }[]>`select rating, created_at from public.reviews where provider_id = ${selinProv.id} order by created_at desc limit 1`;
      if (lastReview) {
        await tx`insert into public.notifications (user_id, type, title, body, href, read_at, created_at)
                 values (${selinProv.id}, 'review.received', ${`Neue Bewertung: ${lastReview.rating} von 5 Sternen`}, 'Schau sie dir an und antworte, wenn du magst.', '/pro/bewertungen', ${readAfter(lastReview.created_at)}, ${lastReview.created_at})`;
      }
      // testkunde: 6 notifications, 2 unread (the open request and the next confirmed appointment)
      const jb = await tx<{ id: string; status: string; service_name: string; starts_at: Date; respond_by: Date | null; provider: string; created_at: Date; confirmed_at: Date | null; completed_at: Date | null; cancelled_at: Date | null; cancellation_fee_cents: number }[]>`
        select b.id, b.status, b.service_name, b.starts_at, b.respond_by, p.display_name as provider, b.created_at, b.confirmed_at, b.completed_at, b.cancelled_at, b.cancellation_fee_cents
        from public.bookings b join public.providers p on p.id = b.provider_id where b.customer_id = ${julia.id} order by b.starts_at`;
      // Same format as the live notifications (src/server/services/format.ts formatWhen): "Do., 12. Nov., 18:30 Uhr".
      const when = (d: Date) =>
        new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
          .format(d)
          .replace(/\s/g, "\u00a0")
          .replace(/,\u00a0(\d{2}:\d{2})$/, ", $1") + "\u00a0Uhr";
      const upcomingJ = jb.filter((b) => b.status === "confirmed");
      const requestJ = jb.find((b) => b.status === "requested");
      const cancelledJ = jb.find((b) => b.status === "cancelled");
      const lastDone = [...jb].reverse().find((b) => b.status === "completed");
      const notes: Array<{ type: string; title: string; body: string; href: string; read: boolean; at: Date }> = [];
      if (requestJ) notes.push({ type: "booking.requested", title: `Deine Anfrage ist bei ${requestJ.provider}`, body: `${requestJ.service_name} am ${when(requestJ.starts_at)}. ${requestJ.provider} antwortet bis spätestens ${requestJ.respond_by ? when(requestJ.respond_by) : "kurz vor dem Termin"}. Bis dahin wird nichts belastet.`, href: `/buchung/${requestJ.id}`, read: false, at: later(requestJ.created_at, 60_000) });
      if (upcomingJ[0]) notes.push({ type: "booking.confirmed", title: "Dein Termin ist bestätigt", body: `${upcomingJ[0].service_name} mit ${upcomingJ[0].provider}, ${when(upcomingJ[0].starts_at)}. Dein Start-Code steht in der Buchung.`, href: `/buchung/${upcomingJ[0].id}`, read: false, at: upcomingJ[0].confirmed_at ?? upcomingJ[0].created_at });
      if (upcomingJ[1]) notes.push({ type: "booking.confirmed", title: "Dein Termin ist bestätigt", body: `${upcomingJ[1].service_name} mit ${upcomingJ[1].provider}, ${when(upcomingJ[1].starts_at)}. Dein Start-Code steht in der Buchung.`, href: `/buchung/${upcomingJ[1].id}`, read: true, at: upcomingJ[1].confirmed_at ?? upcomingJ[1].created_at });
      if (lastDone?.completed_at) notes.push({ type: "booking.completed", title: `Wie war dein Termin mit ${lastDone.provider}?`, body: "Deine Bewertung hilft anderen bei der Wahl.", href: `/buchung/${lastDone.id}`, read: true, at: later(lastDone.completed_at, 60_000) });
      if (cancelledJ?.cancelled_at) notes.push({ type: "booking.cancelled", title: "Dein Termin ist storniert", body: `${cancelledJ.service_name} am ${when(cancelledJ.starts_at)}. Es fällt eine Stornogebühr von ${(cancelledJ.cancellation_fee_cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })} an.`, href: `/buchung/${cancelledJ.id}`, read: true, at: later(cancelledJ.cancelled_at, 60_000) });
      notes.push({ type: "referral.rewarded", title: "Deine Empfehlung hat sich gelohnt", body: "15,00\u00a0€ SOMA-Guthaben sind gutgeschrieben.", href: "/konto/guthaben", read: true, at: maraFirst.completedAt ?? ago(60) });
      for (const n of notes) {
        await tx`insert into public.notifications (user_id, type, title, body, href, read_at, created_at)
                 values (${julia.id}, ${n.type}, ${n.title}, ${n.body}, ${n.href}, ${n.read ? readAfter(n.at) : null}, ${n.at})`;
      }

      // --- demand analytics ---------------------------------------------------
      // Daytime stamps inside the last 30 × 24 h, so KPI, chart and regions count the same searches (audit-3 F8).
      const weights: Array<[string, number]> = [["berlin", 30], ["muenchen", 20], ["hamburg", 20], ["koeln", 10], ["frankfurt", 9], ["duesseldorf", 7], ["none", 4]];
      const total = weights.reduce((a, [, w]) => a + w, 0);
      const catIds = [...ctx.categories.values()];
      const searchStamp = (): Date => {
        for (;;) {
          const t = wallTimeToInstant(addDays(localDateOf(now), -int(0, 29)), int(DAY_FROM, DAY_TO)).instant;
          if (t.getTime() < now.getTime() - 60_000 && t.getTime() > now.getTime() - 30 * DAY + HOUR) return t;
        }
      };
      const events: Array<{ postal_code: string; city_slug: string | null; category_id: string; requested_date: string | null; results_count: number; created_at: Date }> = [];
      for (let i = 0; i < 420; i += 1) {
        let r = rand() * total;
        let city = "berlin";
        for (const [c, w] of weights) { if ((r -= w) <= 0) { city = c; break; } }
        const createdAt = searchStamp();
        events.push({
          postal_code: pick(SEARCH_POSTAL_CODES[city]),
          city_slug: city === "none" ? null : city,
          category_id: pick(catIds),
          requested_date: chance(0.4) ? addDays(localDateOf(createdAt), int(0, 6)) : null,
          results_count: city === "none" ? 0 : chance(0.07) ? 0 : int(1, city === "berlin" || city === "muenchen" || city === "hamburg" ? 6 : 3),
          created_at: createdAt,
        });
      }
      await tx`insert into public.search_events ${tx(events, "postal_code", "city_slug", "category_id", "requested_date", "results_count", "created_at")}`;
      const waitlist = [
        ["70173", null], ["70173", "massage"], ["01067", "manikuere"], ["04109", "make-up"], ["04109", null], ["90402", "kosmetik"],
        ["30159", "massage"], ["30159", "brows-lashes"], ["01067", "massage"], ["70173", "haare-styling"], ["60316", "brows-lashes"], ["40219", "massage"],
      ] as const;
      let wi = 0;
      for (const [plz, cat] of waitlist) {
        wi += 1;
        await tx`insert into public.waitlist_signups (email, postal_code, category_id, city_slug, created_at)
                 select ${`interessent${wi}@beispiel.de`}, ${plz}, ${cat ? ctx.categories.get(cat) ?? null : null}, pc.city_slug, ${ago(int(1, 25))}
                 from public.postal_codes pc where pc.postal_code = ${plz}`;
      }
      log(`Bookings: ${ctx.bookingCount}, search events: ${events.length}, waitlist: ${waitlist.length}`);
    });

    if ((process.env.STORAGE_PROVIDER ?? "local") === "local") {
      const root = path.resolve(ROOT, process.env.UPLOAD_DIR ?? ".data/uploads");
      const pdf = DEMO_PLACEHOLDER_PDF;
      for (const key of placeholderDocs) {
        const full = path.join(root, key);
        await mkdir(path.dirname(full), { recursive: true });
        await writeFile(full, pdf);
      }
      log(`Placeholder documents written to ${path.relative(ROOT, root)}`);
    }
    // Leyla's insurance expired yesterday: the real maintenance step rejects it and suspends her (audit-2 N4),
    // so the admin queue shows an automatic suspension. Runs on an app-style connection (camelCase rows),
    // stamped at a daytime moment after the expiry instead of the seed time.
    const app = postgres(normalizeDatabaseUrl(url), { max: 1, prepare: usePreparedStatements(), onnotice: () => undefined, transform: { column: { from: postgres.toCamel, to: postgres.fromCamel }, undefined: null } });
    try {
      const expiredAt = leylaExpiresAt ?? new Date(now.getTime() - DAY);
      const suspendAt = stampBetween(later(expiredAt, 5 * 60_000), minDate(later(expiredAt, 8 * HOUR), later(now, -HOUR)));
      const r = await app.begin(async (tx) => {
        const res = await expireDocumentsInTx(tx as unknown as Parameters<typeof expireDocumentsInTx>[0], suspendAt);
        const [leyla] = await tx<{ id: string }[]>`select id from public.providers where slug = 'leyla-a-hamburg'`;
        if (leyla) {
          await tx`update public.provider_status_events set created_at = ${suspendAt} where provider_id = ${leyla.id} and to_status = 'suspended'`;
          await tx`update public.audit_log set created_at = ${suspendAt} where action = 'provider.auto_suspend' and entity_id = ${leyla.id}`;
          await tx`update public.notifications set created_at = ${suspendAt} where user_id = ${leyla.id} and created_at > ${later(now, -HOUR)}`;
        }
        return res;
      });
      log(`Expired documents: ${r.expiredDocuments}, automatically suspended providers: ${r.suspendedProviders}`);
    } finally {
      await app.end();
    }
    log("Demo data ready. Logins: testkunde@soma.test · testkunde-b2b@soma.test · testadmin@soma.test (Passwort: soma-demo-2026)");
  } finally {
    await sql.end();
  }
  return { demoAppointmentAt };
}

// CLI entry (npm run db:seed); demo:refresh imports runDemoSeed instead.
if (/seed\.ts$/.test(process.argv[1] ?? "")) {
  runDemoSeed().catch((err: unknown) => {
    console.error("[db:seed]", err instanceof Error && err.message.startsWith("Abgebrochen") ? err.message : err);
    process.exit(1);
  });
}
