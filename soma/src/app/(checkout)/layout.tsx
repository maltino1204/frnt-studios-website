import Link from "next/link";
import { getSession } from "@/server/auth/guards";
import { CheckoutHeader } from "@/components/site/checkout-header";
import { RouteTransition } from "@/components/ui/motion";
import { BRAND_NAME } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { DisplayFontScope } from "@/components/brand/display-font";

/** Checkout + booking detail: no marketing chrome, only what supports the decision. */
export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <DisplayFontScope>
      <a href="#inhalt" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-(--z-toast) focus:bg-surface-raised focus:px-4 focus:py-2 focus:type-label">
        Zum Inhalt springen
      </a>
      <CheckoutHeader signedIn={session?.role === "customer"} />
      <RouteTransition className="flex flex-1 flex-col">{children}</RouteTransition>
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-content flex-wrap items-center justify-between gap-x-6 gap-y-2 px-(--space-gutter) py-6 type-caption text-ink-muted">
          <p>{`© ${new Date().getFullYear()} ${BRAND_NAME} · vermittelt Termine bei selbstständigen Profis`}</p>
          <nav aria-label="Rechtliches" className="flex flex-wrap gap-x-4">
            <Link href={routes.imprint()} className="inline-flex h-touch items-center rounded-control transition-colors hover:text-ink focus-ring">Impressum</Link>
            <Link href={routes.privacy()} className="inline-flex h-touch items-center rounded-control transition-colors hover:text-ink focus-ring">Datenschutz</Link>
            <Link href={routes.terms()} className="inline-flex h-touch items-center rounded-control transition-colors hover:text-ink focus-ring">AGB</Link>
            <Link href="/widerruf" className="inline-flex h-touch items-center rounded-control transition-colors hover:text-ink focus-ring">Widerruf</Link>
            <Link href={routes.help()} className="inline-flex h-touch items-center rounded-control transition-colors hover:text-ink focus-ring">Hilfe</Link>
          </nav>
        </div>
      </footer>
    </DisplayFontScope>
  );
}
