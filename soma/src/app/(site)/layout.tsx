import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { RouteTransition } from "@/components/ui/motion";

/**
 * Public layout: marketing header, content, light footer.
 * Never reads cookies or headers, so discovery and SEO pages can be static (ISR);
 * session-dependent bits (account link, rebook row) hydrate on the client.
 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#inhalt"
        className="sr-only z-(--z-toast) rounded-full bg-ink px-4 py-3 type-label text-ink-inverse focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Zum Inhalt springen
      </a>
      <SiteHeader />
      <RouteTransition as="main" id="inhalt" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </RouteTransition>
      <SiteFooter />
    </>
  );
}
