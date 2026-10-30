/**
 * Base seed (production-safe, idempotent): launch cities, postal codes with the
 * launch-city mapping, categories + services, platform settings, the global
 * commission rule and CMS content blocks. Existing rows are left untouched so
 * admin edits survive a re-run.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import type postgres from "postgres";
import { CATEGORIES, CITIES, CONTENT_BLOCKS, GLOBAL_COMMISSION, PLATFORM_SETTINGS } from "./base-seed-data";
import { ROOT } from "./migrate";

const PLZ_CSV = path.join(ROOT, "supabase", "seed-data", "postal_codes_de.csv");

async function seedPostalCodes(sql: postgres.Sql): Promise<number> {
  const csv = await readFile(PLZ_CSV, "utf8");
  const rows = csv
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [postal_code, lat, lng] = line.split(",");
      return { postal_code, lat: Number(lat), lng: Number(lng) };
    })
    .filter((r) => /^\d{5}$/.test(r.postal_code) && Number.isFinite(r.lat) && Number.isFinite(r.lng));

  for (let i = 0; i < rows.length; i += 1000) {
    const chunk = rows.slice(i, i + 1000);
    await sql`
      insert into public.postal_codes ${sql(chunk, "postal_code", "lat", "lng")}
      on conflict (postal_code) do update set lat = excluded.lat, lng = excluded.lng`;
  }

  for (const city of CITIES) {
    for (const [from, to] of city.plzRanges) {
      await sql`
        update public.postal_codes set city_slug = ${city.slug}
        where postal_code::int between ${from} and ${to}`;
    }
  }
  return rows.length;
}

export async function applyBaseSeed(sql: postgres.Sql, log: (m: string) => void = () => undefined): Promise<void> {
  for (const c of CITIES) {
    await sql`
      insert into public.cities (slug, name, state, lat, lng, is_active, sort_order)
      values (${c.slug}, ${c.name}, ${c.state}, ${c.lat}, ${c.lng}, true, ${c.sortOrder})
      on conflict (slug) do nothing`;
  }
  const plz = await seedPostalCodes(sql);
  log(`Postal codes: ${plz}`);

  let catOrder = 0;
  for (const cat of CATEGORIES) {
    catOrder += 1;
    const [row] = await sql<{ id: string }[]>`
      insert into public.categories (slug, name, tagline, description, image_path, sort_order, is_active,
                                     seo_title, seo_description, required_documents)
      values (${cat.slug}, ${cat.name}, ${cat.tagline}, ${cat.description}, ${`/images/categories/${cat.slug}.jpg`},
              ${catOrder}, true, ${cat.seoTitle}, ${cat.seoDescription}, ${sql.json(cat.requiredDocuments)})
      on conflict (slug) do update set slug = excluded.slug
      returning id`;
    let svcOrder = 0;
    for (const s of cat.services) {
      svcOrder += 1;
      await sql`
        insert into public.services (category_id, slug, name, description, durations, default_duration,
                                     price_hint_from_cents, attributes, sort_order, is_active)
        values (${row.id}, ${s.slug}, ${s.name}, ${s.description}, ${sql.array(s.durations)}::int[], ${s.defaultDuration},
                ${s.priceHintFromCents}, ${sql.json((s.attributes ?? {}) as postgres.JSONValue)}, ${svcOrder}, true)
        on conflict (category_id, slug) do nothing`;
    }
  }
  log(`Categories: ${CATEGORIES.length}, services: ${CATEGORIES.reduce((n, c) => n + c.services.length, 0)}`);

  for (const [key, value] of Object.entries(PLATFORM_SETTINGS)) {
    await sql`
      insert into public.platform_settings (key, value) values (${key}, ${sql.json(value as postgres.JSONValue)})
      on conflict (key) do nothing`;
  }

  await sql`
    insert into public.commission_rules (scope, rate, repeat_client_rate, own_client_rate, is_active)
    select 'global', ${GLOBAL_COMMISSION.rate}, ${GLOBAL_COMMISSION.repeatClientRate}, ${GLOBAL_COMMISSION.ownClientRate}, true
    where not exists (select 1 from public.commission_rules where scope = 'global' and is_active)`;

  for (const [key, value] of Object.entries(CONTENT_BLOCKS)) {
    await sql`
      insert into public.content_blocks (key, value) values (${key}, ${sql.json(value as postgres.JSONValue)})
      on conflict (key) do nothing`;
  }
  log("Base seed applied.");
}
