import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminShell } from "@/components/admin/shell";
import { fullName } from "@/components/admin/format";
import { DEMO_MODE } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { listDisputes, listVerificationQueue } from "@/server/services/admin";
import { getProfile } from "@/server/services/account";
import { DisplayFontScope } from "@/components/brand/display-font";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

/** Admin console shell. Every admin route is behind requireRole("admin"). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("admin", routes.admin.root());
  const [queue, open, investigating, profile, jar] = await Promise.all([
    listVerificationQueue(session).catch(() => []),
    listDisputes(session, { status: "open" }).catch(() => []),
    listDisputes(session, { status: "investigating" }).catch(() => []),
    getProfile(session).catch(() => null),
    cookies(),
  ]);
  const name = profile ? fullName(profile.firstName, profile.lastName) : session.firstName ?? "Admin";
  return (
    <DisplayFontScope>
      <AdminShell
        user={{ name: name === "—" ? "Admin" : name, email: session.email }}
        demo={DEMO_MODE}
        counts={{ verification: queue.length, disputes: open.length + investigating.length }}
        initialCollapsed={jar.get("soma_admin_rail")?.value === "1"}
      >
        {children}
      </AdminShell>
    </DisplayFontScope>
  );
}
