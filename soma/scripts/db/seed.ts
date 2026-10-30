/**
 * npm run db:seed — DEMO seed (development only; refuses unless DEMO_MODE=true).
 *
 * Creates fictional providers in the six launch cities, demo customers,
 * ~120 historical bookings with German reviews, cancellations, upcoming
 * confirmed bookings and open requests for profi@soma.test, payouts,
 * credits/referrals, disputes, search demand and waitlist sign-ups.
 * All timestamps are relative to now(). Re-running replaces the demo data.
 *
 * Demo logins (password "soma-demo-2026"): kundin@soma.test, profi@soma.test, admin@soma.test
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
import { CUSTOMERS, PROVIDER_REPLIES, PROVIDERS, REGULAR_VAT_PROVIDERS, REVIEWS, SEARCH_POSTAL_CODES, type DemoCustomer, type DemoProvider } from "./lib/demo-data";
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
  await tx`delete from public.audit_log where data ->> 'demo' = 'true'`;
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
}

async function insertBooking(ctx: Ctx, spec: BookingSpec): Promise<{ id: string; completedAt: Date | null; categorySlug: string; totalCents: number; providerId: string; customerId: string }> {
  const { tx } = ctx;
  const prov = ctx.providers.get(spec.providerKey);
  const cust = ctx.customers.get(spec.customerKey);
  if (!prov || !cust) throw new Error(`unknown ${spec.providerKey}/${spec.customerKey}`);
  const off = prov.offerings[spec.offeringIndex ?? int(0, prov.offerings.length - 1)];
  const svc = ctx.services.get(off.serviceSlug);
  if (!svc) throw new Error(`unknown service ${off.serviceSlug}`);
  const base = ctx.plz.get(prov.p.basePostalCode);
  const point = ctx.plz.get(cust.c.postalCode);
  if (!base || !point) throw new Error("missing PLZ");
  const distanceKm = roundKm(haversineKm(base, point));
  const travel = computeTravelFee(distanceKm, prov.p.travelFee);
  const pairKey = `${prov.id}:${cust.id}`;
  const repeat = (ctx.pairCompleted.get(pairKey) ?? 0) > 0;
  const rate = repeat ? 0.12 : 0.2;
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
      ${spec.status}, ${prov.p.bookingMode}, 'home', ${`${cust.c.street} ${cust.c.houseNumber}`}, ${cust.c.postalCode},
      ${cityName(cust.c.city)}, ${chance(0.4) ? pick(["2. OG links", "Hinterhaus, 3. OG", "Klingel „Büro“", "EG, bitte klingeln"]) : null},
      ${point.lat}, ${point.lng}, ${spec.notes ?? (chance(0.25) ? pick(["Parkplatz im Hof vorhanden.", "Wir haben eine Katze.", "Bitte zweimal klingeln.", "Aufzug vorhanden."]) : null)},
      ${distanceKm}, ${off.price}, ${travel}, 0, ${discount}, ${total}, ${rate}, ${repeat ? "repeat" : "base"},
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
  await tx`insert into public.provider_client_links (provider_id, customer_id, source, created_at) values (${prov.id}, ${cust.id}, 'platform', ${spec.createdAt}) on conflict do nothing`;
  if (spec.status === "completed") ctx.pairCompleted.set(pairKey, (ctx.pairCompleted.get(pairKey) ?? 0) + 1);
  ctx.bookingCount += 1;
  return { id: row.id, completedAt, categorySlug: svc.categorySlug, totalCents: total, providerId: prov.id, customerId: cust.id };
}

function cityName(slug: DemoProvider["city"]): string {
  return { berlin: "Berlin", muenchen: "München", hamburg: "Hamburg", koeln: "Köln", frankfurt: "Frankfurt am Main", duesseldorf: "Düsseldorf" }[slug];
}

const reviewCursor = new Map<string, number>();
const usedReviewTexts = new Set<string>();
const replyCursor = { next: 0 };
async function maybeReview(ctx: Ctx, b: { id: string; completedAt: Date | null; categorySlug: string }, p = 0.8, forced?: { rating: number; text: string }, minRating = 1): Promise<void> {
  if (!b.completedAt || (!forced && !chance(p))) return;
  // Each review sentence and reply is used at most once (audit-2 N14); when a category runs out,
  // the review is stars + tags only.
  const all = REVIEWS[b.categorySlug] ?? REVIEWS.massage;
  const fresh = all.filter((r) => r.rating >= minRating && (r.text === null || !usedReviewTexts.has(r.text)));
  const start = reviewCursor.get(b.categorySlug) ?? int(0, Math.max(0, all.length - 1));
  reviewCursor.set(b.categorySlug, start + 1);
  const picked = fresh.length ? fresh[start % fresh.length] : { rating: Math.max(minRating, 5), text: null, tags: ["Wieder buchen"] };
  const r = forced ? { rating: forced.rating, text: forced.text, tags: [] as string[] } : picked;
  if (r.text) usedReviewTexts.add(r.text);
  const createdAt = new Date(b.completedAt.getTime() + int(2, 60) * HOUR);
  const reply = !forced && chance(0.3) && replyCursor.next < PROVIDER_REPLIES.length ? PROVIDER_REPLIES[replyCursor.next++] : null;
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
    const hashCount = 1 + PROVIDERS.length + CUSTOMERS.length + 1;
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
        adminId: "", providers: new Map(), customers: new Map(), busy: new Map(), usedDays: new Map(), pairCompleted: new Map(), bookingCount: 0,
      };

      // --- admin -------------------------------------------------------------
      ctx.adminId = await createUser(tx, "admin@soma.test", nextHash(), { first_name: "Alex", last_name: "Admin", role: "customer" }, new Date(now.getTime() - 200 * DAY));
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
          await tx`
            insert into public.provider_documents (provider_id, kind, category_id, storage_path, file_name, mime_type, size_bytes, status, reviewed_by, reviewed_at, created_at)
            values (${id}, ${d.kind}, ${d.categorySlug ? ctx.categories.get(d.categorySlug) ?? null : null}, ${key}, ${d.name}, 'application/pdf', 512,
                    ${p.status ? "pending" : "approved"}, ${p.status ? null : ctx.adminId}, ${p.status ? null : new Date(createdAt.getTime() + 2 * DAY)}, ${createdAt})`;
        }
        // portfolio: one image per category, static demo paths
        let order = 0;
        for (const c of cats) {
          await tx`
            insert into public.provider_portfolio (provider_id, storage_path, caption, category_id, sort_order)
            values (${id}, ${`/images/categories/${c}.jpg`}, ${pick(["Ein Eindruck meiner Arbeit", "Aus einem aktuellen Termin", "So sieht es bei mir aus"])}, ${ctx.categories.get(c) ?? null}, ${order++})`;
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
      if (!julia) throw new Error("kundin missing");
      await tx`insert into public.addresses (user_id, label, kind, street, house_number, postal_code, city, details)
               values (${julia.id}, 'Büro', 'office', 'Rosenthaler Straße', '40', '10178', 'Berlin', 'Empfang 4. OG, bitte bei „Hartmann“ melden')`;
      // a friend Julia invited (still pending — no completed booking yet)
      const [{ referral_code: juliaCode }] = await tx<{ referral_code: string }[]>`select referral_code from public.profiles where id = ${julia.id}`;
      await createUser(tx, "paula@kunden.soma.test", nextHash(), { role: "customer", first_name: "Paula", last_name: "Richter", referral_code: juliaCode }, new Date(now.getTime() - 6 * DAY));
      log(`Customers: ${ctx.customers.size + 1}`);

      // --- kundin@soma.test history -----------------------------------------
      const dayAt = (daysAgo: number, providerKey: string, duration: number) => {
        const p = ctx.providers.get(providerKey)?.p as DemoProvider;
        for (let d = daysAgo; d < daysAgo + 14; d += 1) {
          const date = addDays(localDateOf(now), -d);
          const s = slotOn(p, date, duration);
          if (s) return s;
        }
        throw new Error("no slot");
      };
      const first = await insertBooking(ctx, { providerKey: "selin", customerKey: "julia", offeringIndex: 0, startsAt: dayAt(41, "selin", 60), status: "completed", createdAt: new Date(now.getTime() - 48 * DAY), useCredits: 1500 });
      await maybeReview(ctx, first, 1, { rating: 5, text: "Selin ist ein Schatz: ruhig, pünktlich und die Massage war wunderbar. Ich habe danach geschlafen wie ein Baby." });
      await tx`update public.referrals set status = 'rewarded', qualified_booking_id = ${first.id}, rewarded_at = ${first.completedAt} where referred_id = ${julia.id}`;
      await tx`insert into public.credit_ledger (user_id, amount_cents, reason, booking_id, note, created_at)
               values (${ctx.customers.get("sophie")?.id ?? ""}, 1500, 'referral_reward', ${first.id}, 'Empfehlungsprämie', ${first.completedAt})`;
      const linh = await insertBooking(ctx, { providerKey: "linh", customerKey: "julia", offeringIndex: 4, startsAt: dayAt(20, "linh", 105), status: "completed", createdAt: new Date(now.getTime() - 24 * DAY) });
      await maybeReview(ctx, linh, 1, { rating: 4, text: "Sehr gepflegtes Ergebnis und angenehme Gespräche. Hat etwas länger gedauert als geplant." });
      await insertBooking(ctx, { providerKey: "selin", customerKey: "julia", offeringIndex: 2, startsAt: dayAt(3, "selin", 60), status: "completed", createdAt: new Date(now.getTime() - 9 * DAY) });
      await tx`insert into public.credit_ledger (user_id, amount_cents, reason, note, created_by, created_at)
               values (${julia.id}, 1000, 'goodwill', 'Kulanzgutschrift wegen verspätetem Termin', ${ctx.adminId}, ${new Date(now.getTime() - 19 * DAY)})`;
      for (const fav of ["selin", "abena", "linh"]) {
        await tx`insert into public.favorites (customer_id, provider_id) values (${julia.id}, ${ctx.providers.get(fav)?.id ?? ""})`;
      }

      // --- historical bookings (~120) ---------------------------------------
      const approved = PROVIDERS.filter((p) => !p.status);
      for (const p of approved) {
        const count = (p.key === "selin" ? 7 : 3) + int(1, 3);
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
            const date = addDays(localDateOf(now), -int(4, 120));
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
          await maybeReview(ctx, b, 0.8, undefined, p.key === "selin" ? 4 : 1);
        }
      }

      // --- upcoming bookings --------------------------------------------------
      const upcoming = async (providerKey: string, customerKey: string, daysAhead: number, status: "confirmed" | "requested") => {
        const prov = ctx.providers.get(providerKey);
        if (!prov) return;
        for (let d = daysAhead; d < daysAhead + 10; d += 1) {
          const date = addDays(localDateOf(now), d);
          const offeringIndex = int(0, prov.offerings.length - 1);
          const dur = prov.offerings[offeringIndex].duration;
          for (let attempt = 0; attempt < 6; attempt += 1) {
            const startsAt = slotOn(prov.p, date, dur);
            if (!startsAt || startsAt.getTime() < now.getTime() + prov.p.leadTimeMinutes * 60_000) continue;
            const s = startsAt.getTime();
            const e = s + (dur + prov.p.bufferMinutes) * 60_000;
            const list = ctx.busy.get(providerKey) ?? [];
            if (overlaps(list, s - prov.p.bufferMinutes * 60_000, e)) continue;
            list.push([s, e]);
            ctx.busy.set(providerKey, list);
            // Open requests were made recently; respond_by follows the engine (business hours 08–21, ≤ start − 2 h).
            const createdAt = status === "requested" ? new Date(now.getTime() - int(10, 90) * 60_000) : new Date(now.getTime() - int(1, 30) * HOUR);
            await insertBooking(ctx, {
              providerKey, customerKey, offeringIndex, startsAt, status, createdAt,
              respondBy: status === "requested" ? computeRespondBy(createdAt, startsAt, Number(PLATFORM_SETTINGS.request_response_hours)) : null,
            });
            return;
          }
        }
      };
      // profi@soma.test (Selin): confirmed and open requests
      await upcoming("selin", "anna", 1, "confirmed");
      await upcoming("selin", "david", 2, "confirmed");
      await upcoming("selin", "clara", 4, "confirmed");
      await upcoming("selin", "julia", 3, "requested");
      await upcoming("selin", "fatma", 5, "requested");
      // kundin@soma.test: confirmed manicure in two days
      await upcoming("linh", "julia", 2, "confirmed");
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

      // --- payouts for older completed bookings ------------------------------
      for (const [, prov] of ctx.providers) {
        if (prov.p.status) continue;
        const rows = await tx<{ id: string; provider_payout_cents: number; done_at: Date }[]>`
          select id, provider_payout_cents, coalesce(completed_at, cancelled_at) as done_at from public.bookings
          where provider_id = ${prov.id} and payout_id is null and provider_payout_cents > 0
            and (status = 'completed' or (status in ('cancelled', 'no_show') and cancellation_fee_cents > 0))
            and coalesce(completed_at, cancelled_at) < ${new Date(now.getTime() - 10 * DAY)}`;
        if (rows.length === 0) continue;
        const amount = rows.reduce((a, r) => a + r.provider_payout_cents, 0);
        const times = rows.map((r) => r.done_at.getTime());
        const [po] = await tx<{ id: string }[]>`
          insert into public.payouts (provider_id, amount_cents, status, period_start, period_end, external_id, paid_at, created_by, created_at)
          values (${prov.id}, ${amount}, 'paid', ${new Date(Math.min(...times))}, ${new Date(Math.max(...times))}, ${`dev_po_${code(8)}`},
                  ${new Date(now.getTime() - 6 * DAY)}, ${ctx.adminId}, ${new Date(now.getTime() - 7 * DAY)}) returning id`;
        await tx`update public.bookings set payout_id = ${po.id} where id = any(${rows.map((r) => r.id)}::uuid[])`;
      }

      // --- notifications for the demo logins ----------------------------------
      const selin = ctx.providers.get("selin");
      const reqs = await tx<{ id: string; service_name: string }[]>`select id, service_name from public.bookings where provider_id = ${selin?.id ?? ""} and status = 'requested'`;
      for (const r of reqs) {
        await tx`insert into public.notifications (user_id, type, title, body, href, data)
                 values (${selin?.id ?? ""}, 'booking.requested', ${`Neue Anfrage: ${r.service_name}`}, 'Bitte antworte rechtzeitig – die Kundin wartet auf deine Zusage.', ${`/pro/termine/${r.id}`}, ${tx.json({ bookingId: r.id })})`;
      }
      const juliaNext = await tx<{ id: string; status: string; service_name: string }[]>`
        select id, status, service_name from public.bookings where customer_id = ${julia.id} and starts_at > now() order by starts_at`;
      for (const b of juliaNext) {
        await tx`insert into public.notifications (user_id, type, title, body, href, read_at)
                 values (${julia.id}, ${b.status === "confirmed" ? "booking.confirmed" : "booking.requested"},
                         ${b.status === "confirmed" ? "Ihr Termin ist bestätigt" : "Ihre Anfrage ist bei Selin A."}, ${b.service_name}, ${`/buchung/${b.id}`}, null)`;
      }
      await tx`insert into public.notifications (user_id, type, title, body, href, read_at, created_at)
               values (${julia.id}, 'referral.rewarded', 'Willkommen bei SOMA', 'Ihr Willkommensguthaben über 15 € wurde bei Ihrer ersten Buchung eingelöst.', '/konto/guthaben', ${new Date(now.getTime() - 40 * DAY)}, ${new Date(now.getTime() - 47 * DAY)})`;

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
    log("Demo data ready. Logins: kundin@soma.test · profi@soma.test · admin@soma.test (Passwort: soma-demo-2026)");
  } finally {
    await sql.end();
  }
}

main().catch((err: unknown) => {
  console.error("[db:seed] failed:", err);
  process.exit(1);
});
