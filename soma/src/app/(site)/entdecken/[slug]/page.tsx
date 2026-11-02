import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExploreAccountBar } from "@/components/site/explore-account-bar";
import { CollectionView } from "@/components/site/explore-collection-view";
import { collectionLabel } from "@/components/site/explore-copy";
import { BRAND_NAME, OG_IMAGE } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { getExploreCollection, listExploreCollectionSlugs } from "@/server/services/explore";

/** Static (ISR) per live collection; new or changed ones render on demand and admin writes revalidate them. */
export const revalidate = 900;

export async function generateStaticParams() {
  return (await listExploreCollectionSlugs()).map((slug) => ({ slug }));
}

const isSlug = (s: string) => /^[a-z0-9-]{2,60}$/.test(s);

async function load(slug: string) {
  return isSlug(slug) ? getExploreCollection(slug) : null;
}

export async function generateMetadata({ params }: PageProps<"/entdecken/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = await load(slug);
  if (!c) notFound();
  const label = collectionLabel(c);
  const description = [label.kind === "sponsored" ? `${label.text}. ${label.info}` : null, c.subline].filter(Boolean).join(" ") || `${c.title} auf ${BRAND_NAME}.`;
  return {
    title: label.kind === "sponsored" ? `${c.title} (Anzeige)` : c.title,
    description,
    alternates: { canonical: routes.exploreCollection(c.slug) },
    openGraph: { title: `${c.title} · ${BRAND_NAME}`, description, images: [OG_IMAGE] },
  };
}

export default async function SammlungPage({ params }: PageProps<"/entdecken/[slug]">) {
  const { slug } = await params;
  const c = await load(slug);
  if (!c) notFound();
  return (
    <>
      <CollectionView collection={c} />
      <ExploreAccountBar />
    </>
  );
}
