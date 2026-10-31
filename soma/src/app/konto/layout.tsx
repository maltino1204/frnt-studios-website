import type { Metadata } from "next";
import { requireRole } from "@/server/auth/guards";
import { countUnreadNotifications } from "@/server/services/notifications";
import { AccountBottomNav, AccountHeader, AccountRail } from "@/components/site/account-nav";
import { RouteTransition } from "@/components/ui/motion";

export const metadata: Metadata = { title: { default: "Ihr Konto", template: "%s · Konto · SOMA" }, robots: { index: false, follow: false } };

/** Customer account shell: compact header, bottom nav on mobile, side rail on desktop. */
export default async function KontoLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("customer", "/konto");
  const unread = await countUnreadNotifications(session).catch(() => 0);
  return (
    <>
      <a href="#inhalt" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-(--z-toast) focus:bg-surface-raised focus:px-4 focus:py-2 focus:type-label">
        Zum Inhalt springen
      </a>
      <AccountHeader unread={unread} />
      <div className="mx-auto w-full max-w-content flex-1 px-(--space-gutter) pt-6 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+3rem)] lg:grid lg:grid-cols-12 lg:gap-6 lg:pt-12 lg:pb-24">
        <div className="hidden lg:col-span-3 lg:block">
          <AccountRail />
        </div>
        <RouteTransition as="main" id="inhalt" className="min-w-0 lg:col-span-9">
          {children}
        </RouteTransition>
      </div>
      <AccountBottomNav />
    </>
  );
}
