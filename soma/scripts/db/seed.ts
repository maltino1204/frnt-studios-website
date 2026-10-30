/**
 * npm run db:seed — DEMO seed (development only; refuses unless DEMO_MODE=true).
 *
 * Creates fictional providers in the six launch cities, demo customers,
 * ~120 historical bookings with German reviews, cancellations, upcoming
 * confirmed bookings and open requests for profi@soma.test, payouts,
 * credits/referrals, disputes, search demand and waitlist sign-ups.
 * All timestamps are relative to now(). Re-running replaces the demo data.
 *
 * Demo logins (password "soma-demo-2026"): testkunde@soma.test (customer), testkunde-b2b@soma.test
 * (provider = SOMA's B2B customer), testadmin@soma.test
 */
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { hashPassword } from "../../src/server/auth/password";
import { haversineKm, roundKm } from "../../src/server/domain/geo";
import { computeRespondBy } from "../../src/server/domain/booking-state";
import { computeCancellation, computeNoShowFee, parsePolicy } from "../../src/server/domain/cancellation";
import { computeTravelFee, splitRetainedAmounts } from "../../src/server/domain/pricing";
import { addDays, isoWeekdayOf, localDateOf, parseTimeOfDay, wallTimeToInstant } from "../../src/server/domain/tz";
import { DEFAULT_CANCELLATION_POLICY, PLATFORM_SETTINGS } from "./lib/base-seed-data";
import {
  CUSTOMERS, PORTFOLIO_CAPTIONS, PROVIDER_REPLIES, PROVIDERS, REGULAR_VAT_PROVIDERS, REVIEWS, SEARCH_POSTAL_CODES, SELIN_REPLIES, SELIN_REVIEWS,
  type DemoCustomer, type DemoProvider,
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

interface Ctx {
  tx: postgres.TransactionSql;
  now: Date;
  plz: Map<string, { lat: number; lng: number }>;
  services: Map<string, { id: string; categoryId: string; categorySlug: string; name: string; defaultDuration: number }>;
  categories: Map<string, string>;
  adminId: string;
  providers: Map<string, { id: string; p: DemoProvider; offerings: Array<{ id: string; serviceSlug: string; duration: number; price: number }> }>;
  customers: Map<string, { id: string; c: DemoCustomer }>;
  /** busy intervals per provider (upcoming) to avoid overlaps */
  busy: Map<string, Array<[number, number]>>;
  usedDays: Map<string, Set<string>>;
  pairCompleted: Map<string, number>;
  /** "providerKey:customerKey" pairs linked through the provider's invite (own-client tier) */
  ownClients: Set<string>;
  bookingCount: number;
}

async function createUser(tx: postgres.TransactionSql, email: string, hash: string, meta: Record<string, unknown>, createdAt: Date): Promise<string> {
  const [row] = await tx<{ id: string }[]>`
    insert into auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    values (${email}, ${hash}, ${createdAt}, ${tx.json(meta as postgres.JSONValue)}, ${createdAt}, ${createdAt}) returning id`;
  await tx`update public.profiles set created_at = ${createdAt} where id = ${row.id}`;
  return row.id;
}

async function cleanup(tx: postgres.TransactionSql): Promise<void> {
  const demo = tx`(select id from auth.users where email like '%soma.test')`;
  await tx`delete from public.bookings where customer_id in ${demo} or provider_id in ${demo}`;
  await tx`delete from public.payouts where provider_id in ${demo}`;
  await tx`delete from public.audit_log where data ->> 'demo' = 'true' or entity_id in (select id::text from auth.users where email like '%soma.test')`;
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

interface BookingSpec {
  providerKey: string;
  customerKey: string;
  offeringIndex?: number;
  startsAt: Date;
  status: "completed" | "cancelled" | "confirmed" | "requested" | "no_show";
  createdAt: Date;
  cancelledBy?: "customer" | "provider";
  feePercent?: number;
  useCredits?: number;
  notes?: string | null;
  respondBy?: Date | null;
  /** booking address other than the customer's home (saved office / hotel address) */
  address?: { street: string; houseNumber: string; postalCode: string; city: string; details: string | null; kind: "home" | "office" | "hotel" };
}

async function insertBooking(ctx: Ctx, spec: BookingSpec): Promise<{ id: string; completedAt: Date | null; categorySlug: string; totalCents: number; providerId: string; customerId: string; providerKey: string }> {
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
  const confirmedAt = spec.status === "requested" ? null : new Date(spec.createdAt.getTime() + (prov.p.bookingMode === "request" ? int(1, 5) * HOUR : 2 * 60_000));
  const completedAt = spec.status === "completed" ? new Date(endsAt.getTime() + int(2, 20) * 60_000) : null;
  let fee = 0;
  let commissionFinal = commission;
  let cancelledAt: Date | null = null;
  if (spec.status === "cancelled" || spec.status === "no_show") {
    // Same rules as the booking engine (domain/cancellation.ts): fee basis = service price,
    // travel kept only < 2 h / no-show, commission only on the kept service share.
    const policy = parsePolicy(DEFAULT_CANCELLATION_POLICY);
    const b = {
      status: "confirmed" as const, startsAt: spec.startsAt, createdAt: spec.createdAt, servicePriceCents: off.price, travelFeeCents: travel,
      serviceFeeCents: 0, discountCents: discount, totalCents: total, cancellationPolicy: policy,
    };
    if (spec.status === "no_show") {
      cancelledAt = new Date(spec.startsAt.getTime() + 20 * 60_000);
    } else if ((spec.feePercent ?? 0) >= 50) {
      cancelledAt = new Date(spec.startsAt.getTime() - int(3, 20) * HOUR); // 2–24 h tier
    } else {
      cancelledAt = new Date(Math.max(spec.startsAt.getTime() - int(25, 60) * HOUR, spec.createdAt.getTime() + 5 * 60_000));
    }
    const outcome =
      spec.status === "no_show"
        ? computeNoShowFee(b)
        : spec.cancelledBy === "provider"
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
      ${spec.status}, ${prov.p.bookingMode}, ${spec.address?.kind ?? "home"}, ${spec.address ? `${spec.address.street} ${spec.address.houseNumber}` : `${cust.c.street} ${cust.c.houseNumber}`},
      ${spec.address?.postalCode ?? cust.c.postalCode}, ${spec.address?.city ?? cityName(cust.c.city)},
      ${spec.address ? spec.address.details : chance(0.4) ? pick(["2. OG links", "Hinterhaus, 3. OG", "Klingel „Büro“", "EG, bitte klingeln"]) : null},
      ${point.lat}, ${point.lng}, ${spec.notes ?? (chance(0.25) ? pick(["Parkplatz im Hof vorhanden.", "Wir haben eine Katze.", "Bitte zweimal klingeln.", "Aufzug vorhanden."]) : null)},
      ${distanceKm}, ${off.price}, ${travel}, 0, ${discount}, ${total}, ${rate}, ${tier},
      ${commissionFinal}, ${payout}, ${repeat}, ${ctx.tx.json(DEFAULT_CANCELLATION_POLICY as unknown as postgres.JSONValue)}, ${startCode()},
      ${spec.respondBy ?? null}, ${confirmedAt}, ${spec.status === "completed" ? spec.startsAt : null}, ${completedAt}, ${cancelledAt},
      ${spec.status === "cancelled" ? spec.cancelledBy ?? "customer" : spec.status === "no_show" ? null : null},
      ${spec.status === "cancelled" ? (spec.cancelledBy === "provider" ? "Krankheit" : pick(["Termin kollidiert mit der Arbeit", "Bin leider krank", "Reise verschoben"])) : null},
      ${fee}, ${spec.status === "cancelled" || spec.status === "no_show" ? total - fee : 0}, ${spec.createdAt}, ${completedAt ?? cancelledAt ?? spec.createdAt},
      ${REGULAR_VAT_PROVIDERS.has(prov.p.key) ? "regular" : "small_business"}
    ) returning id`;
  const payStatus =
    spec.status === "completed" ? "captured" : spec.status === "confirmed" || spec.status === "requested" ? "authorized" : fee > 0 ? "captured" : "cancelled";
  const captured = spec.status === "completed" ? total : fee;
  await tx`
    insert into public.payments (booking_id, provider, status, amount_cents, captured_cents, application_fee_cents, external_id, card_brand, card_last4, created_at)
    values (${row.id}, 'dev', ${payStatus}, ${total}, ${captured}, ${spec.status === "completed" ? Math.max(0, total - payout) : Math.min(fee, commissionFinal)}, ${`dev_pi_${randomUUID()}`},
            ${pick(["visa", "mastercard", "visa", "amex"])}, ${String(int(1000, 9999))}, ${spec.createdAt})`;
  if (discount > 0) {
    await tx`insert into public.credit_ledger (user_id, amount_cents, reason, booking_id, note, created_at)
             values (${cust.id}, ${-discount}, 'booking_redemption', ${row.id}, 'Eingelöst bei Buchung', ${spec.createdAt})`;
  }
  await tx`insert into public.provider_client_links (provider_id, customer_id, source, created_at) values (${prov.id}, ${cust.id}, ${ownClient ? "provider_invite" : "platform"}, ${spec.createdAt}) on conflict do nothing`;
  if (spec.status === "completed") ctx.pairCompleted.set(pairKey, (ctx.pairCompleted.get(pairKey) ?? 0) + 1);
  ctx.bookingCount += 1;
  return { id: row.id, completedAt, categorySlug: svc.categorySlug, totalCents: total, providerId: prov.id, customerId: cust.id, providerKey: spec.providerKey };
}

function cityName(slug: DemoProvider["city"]): string {
  return { berlin: "Berlin", muenchen: "München", hamburg: "Hamburg", koeln: "Köln", frankfurt: "Frankfurt am Main", duesseldorf: "Düsseldorf" }[slug];
}

const reviewCursor = new Map<string, number>();
const usedReviewTexts = new Set<string>();
const replyCursor = { next: 0 };
const selinReplyCursor = { next: 0 };

async function maybeReview(
  ctx: Ctx,
  b: { id: string; completedAt: Date | null; categorySlug: string; providerKey?: string },
  p = 0.8,
  forced?: { rating: number; text: string; tags?: string[]; reply?: string | null },
  minRating = 1,
): Promise<void> {
  if (!b.completedAt || (!forced && !chance(p))) return;
  if (!forced && b.providerKey === "selin") {
    // testkunde-b2b: own pool (25+ reviews, ≈ 4.8 ★), most of them answered.
    const next = SELIN_REVIEWS.find((r) => !usedReviewTexts.has(r.text));
    if (next) {
      usedReviewTexts.add(next.text);
      const reply = chance(0.65) && selinReplyCursor.next < SELIN_REPLIES.length ? SELIN_REPLIES[selinReplyCursor.next++] : null;
      return insertReview(ctx, b.id, b.completedAt, { rating: next.rating, text: next.text, tags: next.tags }, reply);
    }
  }
  // Each review sentence and reply is used at most once (audit-2 N14); when a category runs out,
  // the review is stars + tags only.
  const all = REVIEWS[b.categorySlug] ?? REVIEWS.massage;
  const fresh = all.filter((r) => r.rating >= minRating && (r.text === null || !usedReviewTexts.has(r.text)));
  const start = reviewCursor.get(b.categorySlug) ?? int(0, Math.max(0, all.length - 1));
  reviewCursor.set(b.categorySlug, start + 1);
  const picked = fresh.length ? fresh[start % fresh.length] : { rating: Math.max(minRating, 5), text: null, tags: ["Wieder buchen"] };
  const r = forced ? { rating: forced.rating, text: forced.text, tags: forced.tags ?? ([] as string[]) } : picked;
  if (r.text) usedReviewTexts.add(r.text);
  const reply = forced ? forced.reply ?? null : chance(0.3) && replyCursor.next < PROVIDER_REPLIES.length ? PROVIDER_REPLIES[replyCursor.next++] : null;
  return insertReview(ctx, b.id, b.completedAt, r, reply);
}

async function insertReview(ctx: Ctx, bookingId: string, completedAt: Date, r: { rating: number; text: string | null; tags: string[] }, reply: string | null): Promise<void> {
  const createdAt = new Date(completedAt.getTime() + int(2, 60) * HOUR);
  const b = { id: bookingId };
  await ctx.tx`
    insert into public.reviews (booking_id, customer_id, provider_id, rating, comment, tags, provider_reply, provider_replied_at, created_at, updated_at)
    select id, customer_id, provider_id, ${r.rating}, ${r.text}, ${r.tags}::text[], ${reply}, ${reply ? new Date(createdAt.getTime() + 6 * HOUR) : null}, ${createdAt}, ${createdAt}
    from public.bookings where id = ${b.id}`;
}

async function main(): Promise<void> {
  if (process.env.DEMO_MODE !== "true") {
    console.error("[db:seed] Abgebrochen: Die Demo-Daten werden nur mit DEMO_MODE=true geladen (niemals in Produktion).");
    process.exit(1);
  }
  const url = process.env.DATABASE_URL ?? "postgres://soma:soma@localhost:5432/soma";
  const sql = postgres(url, { max: 2, onnotice: () => undefined });
  const now = new Date();
  const log = (m: string) => console.log(`[db:seed] ${m}`);
  const placeholderDocs: string[] = [];

  try {
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from public.categories`;
    if (n === 0) throw new Error("Basisdaten fehlen – bitte zuerst `npm run db:setup` ausführen.");

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
        adminId: "", providers: new Map(), customers: new Map(), busy: new Map(), usedDays: new Map(), pairCompleted: new Map(), ownClients: new Set(), bookingCount: 0,
      };

      // --- admin -------------------------------------------------------------
      ctx.adminId = await createUser(tx, "testadmin@soma.test", nextHash(), { first_name: "Alex", last_name: "Admin", role: "customer" }, new Date(now.getTime() - 200 * DAY));
      await tx`update public.profiles set role = 'admin' where id = ${ctx.adminId}`;
      await tx`select set_config('soma.actor_id', ${ctx.adminId}, true), set_config('soma.actor_role', 'admin', true)`;

      // --- providers ---------------------------------------------------------
      let pi = 0;
      for (const p of PROVIDERS) {
        pi += 1;
        const email = p.email ?? `${p.key}@profis.soma.test`;
        const createdAt = new Date(now.getTime() - (p.status ? int(3, 10) : int(60, 400)) * DAY);
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
            terms_accepted_at = ${new Date(createdAt.getTime() + (p.status ? 1 : 2) * DAY)}
          where id = ${id}`;
        for (const w of p.hours) {
          await tx`insert into public.provider_weekly_hours (provider_id, weekday, start_time, end_time) values (${id}, ${w.weekday}, ${w.start}, ${w.end})`;
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
          await tx`
            insert into public.provider_documents (provider_id, kind, category_id, storage_path, file_name, mime_type, size_bytes, status, reviewed_by, reviewed_at, created_at, expires_at)
            values (${id}, ${d.kind}, ${d.categorySlug ? ctx.categories.get(d.categorySlug) ?? null : null}, ${key}, ${d.name}, 'application/pdf', 512,
                    ${p.status ? "pending" : "approved"}, ${p.status ? null : ctx.adminId}, ${p.status ? null : new Date(createdAt.getTime() + 2 * DAY)}, ${createdAt}, ${expiresAt})`;
        }
        // portfolio: 4 images from the pools of the offered categories (/images/portfolio/<slug>-<1..5>.jpg),
        // the starting image rotates per provider so neighbouring profiles differ.
        for (let k = 0; k < 4; k += 1) {
          const c = cats[k % cats.length];
          const n = (pi + Math.floor(k / cats.length) + k) % 5;
          const caption = PORTFOLIO_CAPTIONS[c]?.[n] ?? "Aus einem aktuellen Termin";
          await tx`
            insert into public.provider_portfolio (provider_id, storage_path, caption, category_id, sort_order, created_at)
            values (${id}, ${`/images/portfolio/${c}-${n + 1}.jpg`}, ${caption}, ${ctx.categories.get(c) ?? null}, ${k}, ${new Date(createdAt.getTime() + (k + 1) * DAY)})`;
        }
        await tx`update public.providers set status = ${p.status ?? "approved"} where id = ${id}`;
        if (!p.status) {
          await tx`update public.providers set approved_at = ${new Date(createdAt.getTime() + 3 * DAY)} where id = ${id}`;
          await tx`insert into public.audit_log (actor_id, action, entity, entity_id, data, created_at)
                   values (${ctx.adminId}, 'provider.approve', 'provider', ${id}, ${tx.json({ demo: "true" })}, ${new Date(createdAt.getTime() + 3 * DAY)})`;
        } else {
          await tx`update public.providers set submitted_at = ${new Date(now.getTime() - int(1, 3) * DAY)} where id = ${id}`;
        }
        ctx.providers.set(p.key, { id, p, offerings });
        ctx.busy.set(p.key, []);
        ctx.usedDays.set(p.key, new Set());
      }
      log(`Providers: ${pi} (${PROVIDERS.filter((p) => !p.status).length} approved)`);

      // --- customers ---------------------------------------------------------
      const order = ["sophie", ...CUSTOMERS.map((c) => c.key).filter((k) => k !== "sophie")];
      for (const key of order) {
        const c = CUSTOMERS.find((x) => x.key === key) as DemoCustomer;
        let referralCode: string | null = null;
        if (key === "julia") {
          [{ referral_code: referralCode }] = await tx<{ referral_code: string }[]>`select referral_code from public.profiles where id = ${ctx.customers.get("sophie")?.id ?? ""}`;
        }
        const id = await createUser(tx, c.email, nextHash(), { role: "customer", first_name: c.firstName, last_name: c.lastName, referral_code: referralCode, marketing_opt_in: chance(0.3) }, new Date(now.getTime() - int(130, 420) * DAY));
        await tx`update public.profiles set phone = ${c.phone} where id = ${id}`;
        await tx`insert into public.addresses (user_id, label, kind, street, house_number, postal_code, city, is_default)
                 values (${id}, 'Zuhause', 'home', ${c.street}, ${c.houseNumber}, ${c.postalCode}, ${cityName(c.city)}, true)`;
        ctx.customers.set(key, { id, c });
      }
      const julia = ctx.customers.get("julia");
      if (!julia) throw new Error("testkunde missing");
      const juliaSince = new Date(now.getTime() - 200 * DAY);
      await tx`update public.profiles set created_at = ${juliaSince}, marketing_opt_in = true where id = ${julia.id}`;
      await tx`update auth.users set created_at = ${juliaSince}, last_sign_in_at = ${new Date(now.getTime() - 2 * HOUR)} where id = ${julia.id}`;
      await tx`update public.credit_ledger set created_at = ${juliaSince} where user_id = ${julia.id} and reason = 'referral_welcome'`;
      await tx`update public.addresses set details = 'Vorderhaus, 3. OG rechts, Klingel „Hartmann“', created_at = ${juliaSince} where user_id = ${julia.id}`;
      const JULIA_OFFICE = { kind: "office" as const, street: "Friedrichstraße", houseNumber: "68", postalCode: "10117", city: "Berlin", details: "Empfang 4. OG, bitte bei „Hartmann“ melden" };
      const JULIA_HOTEL = { kind: "hotel" as const, street: "Braubachstraße", houseNumber: "24", postalCode: "60311", city: "Frankfurt am Main", details: "Hotel am Dom, Zimmer 412 – bitte an der Rezeption anmelden" };
      await tx`insert into public.addresses (user_id, label, kind, street, house_number, postal_code, city, details, created_at)
               values (${julia.id}, 'Büro', 'office', ${JULIA_OFFICE.street}, ${JULIA_OFFICE.houseNumber}, ${JULIA_OFFICE.postalCode}, ${JULIA_OFFICE.city}, ${JULIA_OFFICE.details}, ${new Date(now.getTime() - 150 * DAY)}),
                      (${julia.id}, 'Hotel Frankfurt', 'hotel', ${JULIA_HOTEL.street}, ${JULIA_HOTEL.houseNumber}, ${JULIA_HOTEL.postalCode}, ${JULIA_HOTEL.city}, ${JULIA_HOTEL.details}, ${new Date(now.getTime() - 80 * DAY)})`;
      await tx`update public.notification_preferences
               set email_bookings = true, email_reminders = true, email_marketing = true, sms_reminders = true, push_bookings = true
               where user_id = ${julia.id}`;
      // friends Julia invited: Mara (rewarded after her first booking) and Paula (pending)
      const [{ referral_code: juliaCode }] = await tx<{ referral_code: string }[]>`select referral_code from public.profiles where id = ${julia.id}`;
      const MARA: DemoCustomer = { key: "mara", email: "mara@kunden.soma.test", firstName: "Mara", lastName: "Köhler", city: "berlin", street: "Schönhauser Allee", houseNumber: "58", postalCode: "10437", phone: "+49 170 4561237" };
      const maraId = await createUser(tx, MARA.email, nextHash(), { role: "customer", first_name: MARA.firstName, last_name: MARA.lastName, referral_code: juliaCode }, new Date(now.getTime() - 75 * DAY));
      await tx`update public.profiles set phone = ${MARA.phone} where id = ${maraId}`;
      await tx`insert into public.addresses (user_id, label, kind, street, house_number, postal_code, city, is_default)
               values (${maraId}, 'Zuhause', 'home', ${MARA.street}, ${MARA.houseNumber}, ${MARA.postalCode}, 'Berlin', true)`;
      ctx.customers.set("mara", { id: maraId, c: MARA });
      await createUser(tx, "paula@kunden.soma.test", nextHash(), { role: "customer", first_name: "Paula", last_name: "Richter", referral_code: juliaCode }, new Date(now.getTime() - 6 * DAY));
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
      const past = async (providerKey: string, offeringIndex: number, daysAgo: number, extra: Partial<BookingSpec> = {}) => {
        const startsAt = dayAt(daysAgo, providerKey, dur(providerKey, offeringIndex));
        return insertBooking(ctx, { providerKey, customerKey: "julia", offeringIndex, startsAt, status: "completed", createdAt: new Date(startsAt.getTime() - int(2, 9) * DAY), ...extra });
      };
      const j1 = await past("selin", 0, 172, { useCredits: 1500, notes: "Bitte zweimal klingeln." });
      await maybeReview(ctx, j1, 1, {
        rating: 5, tags: ["Pünktlich", "Entspannend"],
        text: "Selin ist ein Schatz: ruhig, pünktlich und die Massage war wunderbar. Ich habe danach geschlafen wie ein Baby.",
        reply: "Danke dir, Julia. Es war ein schöner Abend bei dir – bis zum nächsten Mal.",
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
      await maybeReview(ctx, j6, 1, { rating: 4, tags: ["Pünktlich"], text: "Nach der Anreise direkt im Hotel – sehr praktisch. Kurz, aber gründlich, und um 7:30 Uhr pünktlich da." });
      // Mara, invited by Julia: first completed booking → Julia's 15 € referral reward
      const maraFirst = await insertBooking(ctx, { providerKey: "mai", customerKey: "mara", offeringIndex: 0, startsAt: dayAt(62, "mai", dur("mai", 0)), status: "completed", createdAt: new Date(now.getTime() - 70 * DAY) });
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
      await insertBooking(ctx, { providerKey: "abena", customerKey: "julia", offeringIndex: 0, startsAt: dayAt(40, "abena", dur("abena", 0)), status: "cancelled", feePercent: 50, cancelledBy: "customer", createdAt: new Date(now.getTime() - 47 * DAY) });
      const j8 = await past("linh", 1, 33);
      await maybeReview(ctx, j8, 1, { rating: 5, tags: ["Sauber gearbeitet", "Wieder buchen"], text: "Shellac hält jetzt seit drei Wochen ohne eine einzige Macke. Linh ist meine feste Adresse für Nägel." });
      await tx`insert into public.credit_ledger (user_id, amount_cents, reason, note, created_by, created_at)
               values (${julia.id}, 1000, 'goodwill', 'Kulanzgutschrift wegen verspätetem Termin', ${ctx.adminId}, ${new Date(now.getTime() - 30 * DAY)})`;
      await tx`insert into public.audit_log (actor_id, action, entity, entity_id, data, created_at)
               values (${ctx.adminId}, 'credits.adjust', 'profile', ${julia.id}, ${tx.json({ amountCents: 1000, reason: "goodwill", note: "Kulanzgutschrift wegen verspätetem Termin", demo: "true" })}, ${new Date(now.getTime() - 30 * DAY)})`;
      await past("jonas", 0, 22, { useCredits: 1000, address: JULIA_OFFICE }); // partially redeems the credit (25 € → 15 €)
      await past("selin", 3, 8); // reviewable (within 14 days)
      for (const fav of ["selin", "linh", "mai"]) {
        await tx`insert into public.favorites (customer_id, provider_id) values (${julia.id}, ${ctx.providers.get(fav)?.id ?? ""})`;
      }

      // --- testkunde-b2b@soma.test (Selin A.): own clients via the invite link --------
      const selinProv = ctx.providers.get("selin");
      if (!selinProv) throw new Error("testkunde-b2b missing");
      for (const k of ["lisa", "katharina"]) ctx.ownClients.add(`selin:${k}`);
      for (const [k, daysAgo, i] of [["lisa", 140, 0], ["katharina", 96, 2], ["lisa", 61, 4], ["katharina", 27, 0], ["lisa", 12, 1]] as const) {
        const b = await insertBooking(ctx, { providerKey: "selin", customerKey: k, offeringIndex: i, startsAt: dayAt(daysAgo, "selin", dur("selin", i)), status: "completed", createdAt: new Date(now.getTime() - (daysAgo + 3) * DAY) });
        await maybeReview(ctx, b, 0.9);
      }
      // completed yesterday → still in the 48-h payout hold ("ausstehend")
      const recentSelin = await insertBooking(ctx, { providerKey: "selin", customerKey: "clara", offeringIndex: 1, startsAt: dayAt(1, "selin", dur("selin", 1)), status: "completed", createdAt: new Date(now.getTime() - 6 * DAY) });
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
          return c.city === p.city && c.key !== "julia" && !!base && !!pt && haversineKm(base, pt) <= p.radiusKm;
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
          const createdAt = new Date(startsAt.getTime() - int(1, 12) * DAY);
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
            // Open requests were made recently; respond_by follows the engine (business hours 08–21, ≤ start − 2 h).
            const createdAt = status === "requested" ? new Date(now.getTime() - int(10, 90) * 60_000) : new Date(now.getTime() - int(1, 30) * HOUR);
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

      // testkunde-b2b (Selin): this week's agenda on several days (today too if it still fits) and two open requests
      let day = 0;
      for (const [k, i] of [["anna", 4], ["david", 0], ["clara", 3], ["lisa", 2], ["sophie", 1]] as const) {
        const used = await upcomingAt("selin", k, day, 7, "confirmed", { offeringIndex: i });
        if (used === null) break;
        day = used + 1;
        if (day > 7) break;
      }
      await upcomingAt("selin", "julia", 3, 12, "requested", { offeringIndex: 1, notes: "Gern mit dem Lavendelöl vom letzten Mal." });
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

      // --- disputes -----------------------------------------------------------
      const [recent] = await tx<{ id: string; customer_id: string }[]>`
        select b.id, b.customer_id from public.bookings b join public.providers p on p.id = b.provider_id
        where b.status = 'completed' and p.slug = 'merle-p-hamburg' order by b.completed_at desc limit 1`;
      if (recent) {
        await tx`update public.bookings set completed_at = ${new Date(now.getTime() - 30 * HOUR)}, payout_id = null where id = ${recent.id}`;
        await tx`insert into public.disputes (booking_id, opened_by, reason, description, status, created_at)
                 values (${recent.id}, ${recent.customer_id}, 'quality', 'Die Behandlung war deutlich kürzer als die gebuchten 60 Minuten, und die Maske wurde ausgelassen.', 'open', ${new Date(now.getTime() - 20 * HOUR)})`;
      }
      const [older] = await tx<{ id: string; customer_id: string }[]>`
        select b.id, b.customer_id from public.bookings b join public.providers p on p.id = b.provider_id
        where b.status = 'completed' and p.slug = 'emre-y-koeln' order by b.completed_at limit 1`;
      if (older) {
        await tx`insert into public.disputes (booking_id, opened_by, reason, description, status, resolution_note, resolved_by, resolved_at, created_at)
                 values (${older.id}, ${older.customer_id}, 'other', 'Der Profi kam 20 Minuten später als vereinbart, ohne Bescheid zu geben.', 'resolved_no_action',
                         'Verspätung bestätigt, Termin wurde vollständig durchgeführt. Hinweis an den Profi.', ${ctx.adminId}, ${new Date(now.getTime() - 40 * DAY)}, ${new Date(now.getTime() - 42 * DAY)})`;
      }

      // --- testkunde-b2b: top up to 25+ reviews (oldest unreviewed completed bookings first) --------
      {
        const missing = await tx<{ id: string; completed_at: Date }[]>`
          select b.id, b.completed_at from public.bookings b
          where b.provider_id = ${selinProv.id} and b.status = 'completed' and b.customer_id <> ${julia.id}
            and not exists (select 1 from public.reviews r where r.booking_id = b.id)
          order by b.completed_at`;
        const [{ n: have }] = await tx<{ n: number }[]>`select count(*)::int as n from public.reviews where provider_id = ${selinProv.id}`;
        for (const m of missing.slice(0, Math.max(0, 27 - have))) {
          await maybeReview(ctx, { id: m.id, completedAt: m.completed_at, categorySlug: "massage", providerKey: "selin" }, 1);
        }
      }

      // --- payouts for older completed bookings ------------------------------
      // Everything completed > 10 days ago is paid out; testkunde-b2b in three monthly batches.
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
          const paidAt = new Date(Math.min(now.getTime() - 6 * DAY, Math.max(...times) + 5 * DAY));
          const [po] = await tx<{ id: string }[]>`
            insert into public.payouts (provider_id, amount_cents, status, period_start, period_end, external_id, paid_at, created_by, created_at)
            values (${prov.id}, ${amount}, 'paid', ${new Date(Math.min(...times))}, ${new Date(Math.max(...times))}, ${`dev_po_${code(8)}`},
                    ${paidAt}, ${ctx.adminId}, ${new Date(paidAt.getTime() - DAY)}) returning id`;
          await tx`update public.bookings set payout_id = ${po.id} where id = any(${batch.map((r) => r.id)}::uuid[])`;
        }
      }
      await tx`insert into public.audit_log (actor_id, action, entity, entity_id, data, created_at)
               values (${ctx.adminId}, 'payout.batch', 'payout', null, ${tx.json({ demo: "true", note: "Wöchentlicher Auszahlungslauf" })}, ${new Date(now.getTime() - 7 * DAY)}),
                      (${ctx.adminId}, 'setting.update', 'platform_setting', 'request_response_hours', ${tx.json({ demo: "true", value: 4 })}, ${new Date(now.getTime() - 14 * DAY)}),
                      (${ctx.adminId}, 'content.upsert', 'content_block', 'announcement', ${tx.json({ demo: "true", active: false })}, ${new Date(now.getTime() - 21 * DAY)})`;
      for (const d of await tx<{ id: string; created_at: Date }[]>`select id, created_at from public.provider_documents where provider_id = ${selinProv.id}`) {
        await tx`insert into public.audit_log (actor_id, action, entity, entity_id, data, created_at)
                 values (${ctx.adminId}, 'document.approved', 'provider_document', ${d.id}, ${tx.json({ providerId: selinProv.id, demo: "true" })}, ${new Date(d.created_at.getTime() + 2 * DAY)})`;
      }

      // --- notifications for the demo logins ----------------------------------
      const reqs = await tx<{ id: string; service_name: string; respond_by: Date }[]>`
        select id, service_name, respond_by from public.bookings where provider_id = ${selinProv.id} and status = 'requested' order by respond_by`;
      for (const r of reqs) {
        await tx`insert into public.notifications (user_id, type, title, body, href, data)
                 values (${selinProv.id}, 'booking.requested', ${`Neue Anfrage: ${r.service_name}`}, 'Bitte antworte rechtzeitig – die Kundin wartet auf deine Zusage.', ${`/pro/termine/${r.id}`}, ${tx.json({ bookingId: r.id })})`;
      }
      const [lastPayout] = await tx<{ amount_cents: number; paid_at: Date }[]>`select amount_cents, paid_at from public.payouts where provider_id = ${selinProv.id} order by paid_at desc limit 1`;
      if (lastPayout) {
        await tx`insert into public.notifications (user_id, type, title, body, href, read_at, created_at)
                 values (${selinProv.id}, 'payout.paid', ${`Auszahlung unterwegs: ${(lastPayout.amount_cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}`},
                         'Das Geld ist in 1–3 Werktagen auf deinem Konto.', '/pro/einnahmen', ${lastPayout.paid_at}, ${lastPayout.paid_at})`;
      }
      const [lastReview] = await tx<{ rating: number; created_at: Date }[]>`select rating, created_at from public.reviews where provider_id = ${selinProv.id} order by created_at desc limit 1`;
      if (lastReview) {
        await tx`insert into public.notifications (user_id, type, title, body, href, read_at, created_at)
                 values (${selinProv.id}, 'review.received', ${`Neue Bewertung: ${lastReview.rating} von 5 Sternen`}, 'Schau sie dir an und antworte, wenn du magst.', '/pro/bewertungen', ${lastReview.created_at}, ${lastReview.created_at})`;
      }
      // testkunde: 6 notifications, 2 unread (the open request and the next confirmed appointment)
      const jb = await tx<{ id: string; status: string; service_name: string; starts_at: Date; respond_by: Date | null; provider: string; created_at: Date; cancellation_fee_cents: number }[]>`
        select b.id, b.status, b.service_name, b.starts_at, b.respond_by, p.display_name as provider, b.created_at, b.cancellation_fee_cents
        from public.bookings b join public.providers p on p.id = b.provider_id where b.customer_id = ${julia.id} order by b.starts_at`;
      const when = (d: Date) => new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(d) + " Uhr";
      const upcomingJ = jb.filter((b) => b.status === "confirmed");
      const requestJ = jb.find((b) => b.status === "requested");
      const cancelledJ = jb.find((b) => b.status === "cancelled");
      const lastDone = [...jb].reverse().find((b) => b.status === "completed");
      const notes: Array<{ type: string; title: string; body: string; href: string; read: boolean; at: Date }> = [];
      if (requestJ) notes.push({ type: "booking.requested", title: `Ihre Anfrage ist bei ${requestJ.provider}`, body: `${requestJ.service_name} am ${when(requestJ.starts_at)}. ${requestJ.provider} antwortet bis spätestens ${requestJ.respond_by ? when(requestJ.respond_by) : "kurz vor dem Termin"} – Ihre Zahlung ist bis dahin nur reserviert.`, href: `/buchung/${requestJ.id}`, read: false, at: requestJ.created_at });
      if (upcomingJ[0]) notes.push({ type: "booking.confirmed", title: "Ihr Termin ist bestätigt", body: `${upcomingJ[0].service_name} mit ${upcomingJ[0].provider} am ${when(upcomingJ[0].starts_at)}. Ihren Start-Code finden Sie in der Buchungsübersicht.`, href: `/buchung/${upcomingJ[0].id}`, read: false, at: upcomingJ[0].created_at });
      if (upcomingJ[1]) notes.push({ type: "booking.confirmed", title: "Ihr Termin ist bestätigt", body: `${upcomingJ[1].service_name} mit ${upcomingJ[1].provider} am ${when(upcomingJ[1].starts_at)}.`, href: `/buchung/${upcomingJ[1].id}`, read: true, at: upcomingJ[1].created_at });
      if (lastDone) notes.push({ type: "booking.completed", title: `Wie war Ihr Termin mit ${lastDone.provider}?`, body: "Wir freuen uns über Ihre Bewertung – sie hilft anderen bei der Wahl.", href: `/buchung/${lastDone.id}`, read: true, at: new Date(lastDone.starts_at.getTime() + 3 * HOUR) });
      if (cancelledJ) notes.push({ type: "booking.cancelled", title: "Ihr Termin wurde storniert", body: `${cancelledJ.service_name} am ${when(cancelledJ.starts_at)}. Es fällt eine Stornogebühr von ${(cancelledJ.cancellation_fee_cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })} an.`, href: `/buchung/${cancelledJ.id}`, read: true, at: new Date(cancelledJ.starts_at.getTime() - 6 * HOUR) });
      notes.push({ type: "referral.rewarded", title: "Ihre Empfehlung hat sich gelohnt", body: "Wir haben Ihnen 15,00 € SOMA-Guthaben gutgeschrieben.", href: "/konto/guthaben", read: true, at: maraFirst.completedAt ?? new Date(now.getTime() - 60 * DAY) });
      for (const n of notes) {
        await tx`insert into public.notifications (user_id, type, title, body, href, read_at, created_at)
                 values (${julia.id}, ${n.type}, ${n.title}, ${n.body}, ${n.href}, ${n.read ? new Date(n.at.getTime() + 2 * HOUR) : null}, ${n.at})`;
      }

      // --- demand analytics ---------------------------------------------------
      const weights: Array<[string, number]> = [["berlin", 30], ["muenchen", 20], ["hamburg", 20], ["koeln", 10], ["frankfurt", 9], ["duesseldorf", 7], ["none", 4]];
      const total = weights.reduce((a, [, w]) => a + w, 0);
      const catIds = [...ctx.categories.values()];
      const events: Array<{ postal_code: string; city_slug: string | null; category_id: string; requested_date: string | null; results_count: number; created_at: Date }> = [];
      for (let i = 0; i < 420; i += 1) {
        let r = rand() * total;
        let city = "berlin";
        for (const [c, w] of weights) { if ((r -= w) <= 0) { city = c; break; } }
        const createdAt = new Date(now.getTime() - rand() * 30 * DAY);
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
                 select ${`interessent${wi}@beispiel.de`}, ${plz}, ${cat ? ctx.categories.get(cat) ?? null : null}, pc.city_slug, ${new Date(now.getTime() - int(1, 25) * DAY)}
                 from public.postal_codes pc where pc.postal_code = ${plz}`;
      }
      log(`Bookings: ${ctx.bookingCount}, search events: ${events.length}, waitlist: ${waitlist.length}`);
    });

    if ((process.env.STORAGE_PROVIDER ?? "local") === "local") {
      const root = path.resolve(ROOT, process.env.UPLOAD_DIR ?? ".data/uploads");
      const pdf = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n% SOMA Demo-Dokument (Platzhalter)\n");
      for (const key of placeholderDocs) {
        const full = path.join(root, key);
        await mkdir(path.dirname(full), { recursive: true });
        await writeFile(full, pdf);
      }
      log(`Placeholder documents written to ${path.relative(ROOT, root)}`);
    }
    // Leyla's insurance expired yesterday: the real maintenance step rejects it and suspends her (audit-2 N4),
    // so the admin queue shows an automatic suspension. Runs on an app-style connection (camelCase rows).
    const app = postgres(url, { max: 1, onnotice: () => undefined, transform: { column: { from: postgres.toCamel, to: postgres.fromCamel }, undefined: null } });
    try {
      const r = await app.begin((tx) => expireDocumentsInTx(tx as unknown as Parameters<typeof expireDocumentsInTx>[0], new Date()));
      await app`update public.audit_log set data = data || '{"demo":"true"}'::jsonb where action = 'provider.auto_suspend' and data ->> 'demo' is null`;
      log(`Expired documents: ${r.expiredDocuments}, automatically suspended providers: ${r.suspendedProviders}`);
    } finally {
      await app.end();
    }
    log("Demo data ready. Logins: testkunde@soma.test · testkunde-b2b@soma.test · testadmin@soma.test (Passwort: soma-demo-2026)");
  } finally {
    await sql.end();
  }
}

main().catch((err: unknown) => {
  console.error("[db:seed] failed:", err);
  process.exit(1);
});
