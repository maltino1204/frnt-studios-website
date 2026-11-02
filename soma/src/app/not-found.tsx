import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/discovery-not-found";
import { SiteFooter } from "@/components/site/site-footer";
import { StaticSiteHeader } from "@/components/site/static-site-header";

export const metadata: Metadata = { title: "Seite nicht gefunden" };

/**
 * Root 404 for unmatched URLs (rendered outside the (site) layout, so it brings its own chrome). Server markup only:
 * this tree is part of every route's payload, so a client component here would load on every page (`/` included).
 */
export default function NotFound() {
  return (
    <>
      <StaticSiteHeader />
      <main id="inhalt" className="flex-1">
        <NotFoundContent />
      </main>
      <SiteFooter />
    </>
  );
}
