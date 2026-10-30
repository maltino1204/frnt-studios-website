import type { MetadataRoute } from "next";
import { DEMO_MODE, SITE_URL } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { listCategories, listCities } from "@/server/services/catalog";
import { getCoverageMatrix, listPublicProviderSlugs } from "@/server/services/site-ext";

export const revalidate = 3600;

const url = (path: string) => new URL(path, SITE_URL).toString();

/**
 * Public, indexable URLs only. City × category pages are listed only when they
 * are indexable (enough providers); thin pages stay out (they also carry noindex).
 * In DEMO_MODE nothing is indexable, so the sitemap is empty.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (DEMO_MODE) return [];
  const [categories, cities, coverage, providers] = await Promise.all([
    listCategories(),
    listCities(),
    getCoverageMatrix(),
    listPublicProviderSlugs(),
  ]);
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly" | "yearly" = "weekly") => ({
    url: url(path),
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    page(routes.home(), 1, "daily"),
    page(routes.categories(), 0.9),
    ...categories.map((c) => page(routes.category(c.slug), 0.9)),
    page("/staedte", 0.7),
    ...cities.map((c) => page(routes.city(c.slug), 0.8)),
    ...coverage.filter((c) => c.indexable).map((c) => page(routes.categoryCity(c.categorySlug, c.citySlug), 0.8, "daily")),
    ...providers.map((p) => ({
      url: url(routes.provider(p.slug)),
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    page(routes.forPros(), 0.6, "monthly"),
    page(routes.help(), 0.5, "monthly"),
    page("/stornierung", 0.4, "monthly"),
    page("/widerruf", 0.2, "yearly"),
    page("/ranking", 0.2, "yearly"),
    page(routes.imprint(), 0.1, "yearly"),
    page(routes.privacy(), 0.1, "yearly"),
    page(routes.terms(), 0.1, "yearly"),
  ];
}
