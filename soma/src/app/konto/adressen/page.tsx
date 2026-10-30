import type { Metadata } from "next";
import { requireRole } from "@/server/auth/guards";
import { listAddresses } from "@/server/services/account";
import { PageHeader } from "@/components/ui/layout";
import { AddressManager } from "@/components/site/account-addresses";

export const metadata: Metadata = { title: "Adressen" };

export default async function AdressenPage() {
  const session = await requireRole("customer", "/konto/adressen");
  const addresses = await listAddresses(session);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Adressen" description="Zuhause, Hotel oder Büro – gespeicherte Orte für schnellere Buchungen." className="pb-0" />
      <AddressManager addresses={addresses} />
    </div>
  );
}
