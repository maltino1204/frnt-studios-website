import "server-only";

import { z } from "zod";
import { withAnon, type Queryable } from "../db/client";
import type {
  CategoryDTO,
  CategoryWithServicesDTO,
  CityDTO,
  ContentBlockDTO,
  CoverageDTO,
  PostalCodeDTO,
  RequiredDocumentDTO,
  ServiceDTO,
} from "../dto";
import { loadSettings, parse, zPostalCode } from "./_shared";

/**
 * Public catalogue (anon-readable): categories, services, cities, PLZ lookup,
 * content blocks, SEO coverage. All queries run as `anon` under RLS.
 */

interface CategoryRow {
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

interface ServiceRow {
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

const toCategory = (r: CategoryRow): CategoryDTO => ({ ...r, requiredDocuments: Array.isArray(r.requiredDocuments) ? r.requiredDocuments : [] });
const toService = (r: ServiceRow): ServiceDTO => ({ ...r, durations: [...r.durations] });

export async function queryCategories(tx: Queryable): Promise<CategoryDTO[]> {
  const rows = await tx<CategoryRow[]>`
    select id, slug, name, tagline, description, image_path, sort_order, is_active, seo_title, seo_description, required_documents
    from public.categories where is_active order by sort_order, name`;
  return rows.map(toCategory);
}

export async function queryServices(tx: Queryable, categorySlug?: string): Promise<ServiceDTO[]> {
  const rows = await tx<ServiceRow[]>`
    select s.id, s.category_id, c.slug as category_slug, s.slug, s.name, s.description, s.durations, s.default_duration,
           s.price_hint_from_cents, s.attributes, s.sort_order, s.is_active
    from public.services s join public.categories c on c.id = s.category_id
    where s.is_active and c.is_active ${categorySlug ? tx`and c.slug = ${categorySlug}` : tx``}
    order by c.sort_order, s.sort_order, s.name`;
  return rows.map(toService);
}

export async function listCategories(): Promise<CategoryDTO[]> {
  return withAnon((tx) => queryCategories(tx));
}

/** Categories with their services (one round trip for navigation / booking bar). */
export async function listCatalog(): Promise<CategoryWithServicesDTO[]> {
  return withAnon(async (tx) => {
    const [cats, services] = await Promise.all([queryCategories(tx), queryServices(tx)]);
    return cats.map((c) => ({ ...c, services: services.filter((s) => s.categoryId === c.id) }));
  });
}

export async function getCategory(slug: string): Promise<CategoryDTO | null> {
  const s = parse(z.string().trim().min(1).max(60), slug);
  return withAnon(async (tx) => {
    const rows = await tx<CategoryRow[]>`
      select id, slug, name, tagline, description, image_path, sort_order, is_active, seo_title, seo_description, required_documents
      from public.categories where slug = ${s} and is_active`;
    return rows[0] ? toCategory(rows[0]) : null;
  });
}

export async function listServices(categorySlug: string): Promise<ServiceDTO[]> {
  const s = parse(z.string().trim().min(1).max(60), categorySlug);
  return withAnon((tx) => queryServices(tx, s));
}

export async function getService(id: string): Promise<ServiceDTO | null> {
  const sid = parse(z.guid(), id);
  return withAnon(async (tx) => {
    const rows = await tx<ServiceRow[]>`
      select s.id, s.category_id, c.slug as category_slug, s.slug, s.name, s.description, s.durations, s.default_duration,
             s.price_hint_from_cents, s.attributes, s.sort_order, s.is_active
      from public.services s join public.categories c on c.id = s.category_id
      where s.id = ${sid} and s.is_active`;
    return rows[0] ? toService(rows[0]) : null;
  });
}

export async function listCities(): Promise<CityDTO[]> {
  return withAnon((tx) =>
    tx<CityDTO[]>`select slug, name, state, lat, lng, is_active, sort_order from public.cities where is_active order by sort_order, name`,
  );
}

export async function getCity(slug: string): Promise<CityDTO | null> {
  const s = parse(z.string().trim().min(1).max(40), slug);
  return withAnon(async (tx) => {
    const rows = await tx<CityDTO[]>`select slug, name, state, lat, lng, is_active, sort_order from public.cities where slug = ${s}`;
    return rows[0] ?? null;
  });
}

export async function queryPostalCode(tx: Queryable, plz: string): Promise<PostalCodeDTO | null> {
  const rows = await tx<{ postalCode: string; lat: number; lng: number; citySlug: string | null; cityName: string | null; cityActive: boolean | null }[]>`
    select pc.postal_code, pc.lat, pc.lng, pc.city_slug, c.name as city_name, c.is_active as city_active
    from public.postal_codes pc left join public.cities c on c.slug = pc.city_slug
    where pc.postal_code = ${plz}`;
  const r = rows[0];
  if (!r) return null;
  return { postalCode: r.postalCode, lat: r.lat, lng: r.lng, citySlug: r.citySlug, cityName: r.cityName, isLaunchCity: Boolean(r.citySlug && r.cityActive) };
}

/** PLZ → centroid + launch city. null when the PLZ is unknown. */
export async function lookupPostalCode(plz: string): Promise<PostalCodeDTO | null> {
  const p = parse(zPostalCode, plz);
  return withAnon((tx) => queryPostalCode(tx, p));
}

export async function getContentBlock(key: string): Promise<ContentBlockDTO | null> {
  const k = parse(z.string().trim().min(2).max(80), key);
  return withAnon(async (tx) => {
    const rows = await tx<{ key: string; value: unknown; updatedAt: Date }[]>`select key, value, updated_at from public.content_blocks where key = ${k}`;
    return rows[0] ? { key: rows[0].key, value: rows[0].value, updatedAt: rows[0].updatedAt.toISOString() } : null;
  });
}

export async function getContentBlocks(prefix: string): Promise<ContentBlockDTO[]> {
  const p = parse(z.string().trim().min(1).max(80), prefix);
  return withAnon(async (tx) => {
    const rows = await tx<{ key: string; value: unknown; updatedAt: Date }[]>`
      select key, value, updated_at from public.content_blocks where key like ${`${p}%`} order by key`;
    return rows.map((r) => ({ key: r.key, value: r.value, updatedAt: r.updatedAt.toISOString() }));
  });
}

/**
 * SEO coverage for /behandlungen/[kategorie]/[stadt]: approved providers with an
 * active offering in the category whose service radius covers the city centre
 * or whose base PLZ lies in the city. `indexable` = providerCount >= 2
 * (platform setting coverage_min_providers).
 */
export async function getCityCategoryCoverage(citySlug: string, categorySlug: string): Promise<CoverageDTO> {
  const city = parse(z.string().trim().min(1).max(40), citySlug);
  const cat = parse(z.string().trim().min(1).max(60), categorySlug);
  return withAnon(async (tx) => {
    const settings = await loadSettings(tx);
    const [row] = await tx<{ n: number }[]>`
      select count(distinct p.id)::int as n
      from public.providers p
      join public.provider_services ps on ps.provider_id = p.id and ps.is_active
      join public.services s on s.id = ps.service_id and s.is_active
      join public.categories c on c.id = s.category_id and c.slug = ${cat}
      join public.cities ci on ci.slug = ${city}
      left join public.postal_codes bpc on bpc.postal_code = p.base_postal_code
      where p.status = 'approved' and p.base_lat is not null
        and (bpc.city_slug = ci.slug
             or public.haversine_km(p.base_lat, p.base_lng, ci.lat, ci.lng) <= p.service_radius_km)`;
    const providerCount = row?.n ?? 0;
    return { citySlug: city, categorySlug: cat, providerCount, indexable: providerCount >= settings.coverageMinProviders };
  });
}
