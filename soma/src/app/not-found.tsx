import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/discovery-not-found";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = { title: "Seite nicht gefunden" };

/** Root 404 for unmatched URLs (rendered outside the (site) layout, so it brings its own chrome). */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="inhalt" className="flex-1">
        <NotFoundContent />
      </main>
      <SiteFooter />
    </>
  );
}
