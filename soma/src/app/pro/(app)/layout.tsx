import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProShell } from "@/components/pro/shell";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { getProProfile } from "@/server/services/pro";
import { countProBookingTabs } from "@/server/services/pro-ext";

export const metadata: Metadata = {
  title: { default: "Pro", template: "%s · SOMA Pro" },
  robots: { index: false, follow: false },
};

/** Provider app (voice: du). Unfinished onboarding goes back to the wizard. */
export default async function ProAppLayout({ children }: LayoutProps<"/pro">) {
  const session = await requireRole("provider", "/pro");
  const profile = await getProProfile(session);
  if (profile.status === "draft" || profile.status === "rejected") redirect(routes.pro.onboarding());
  const counts = await countProBookingTabs(session);
  return (
    <ProShell
      displayName={profile.displayName}
      avatarUrl={profile.avatarUrl}
      status={profile.status}
      publicHref={profile.status === "approved" ? routes.provider(profile.slug) : null}
      openRequests={counts.requests}
    >
      {children}
    </ProShell>
  );
}
