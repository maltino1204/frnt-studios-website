import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

/** Same public chrome as the (site) group: marketing header and night footer. */
export default function ForProsLayout({ children }: LayoutProps<"/fuer-profis">) {
  return (
    <>
      <a
        href="#inhalt"
        className="sr-only z-(--z-toast) rounded-xs bg-ink px-4 py-3 type-label text-ink-inverse focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Zum Inhalt springen
      </a>
      <SiteHeader />
      <main id="inhalt" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
