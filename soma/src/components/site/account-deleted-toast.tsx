"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast";

/** After "Konto löschen" the server redirects to "/?konto=geloescht": confirm it once, then clean the URL. */
export function AccountDeletedToast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const shown = useRef(false);
  const deleted = params.get("konto") === "geloescht";
  useEffect(() => {
    if (!deleted || shown.current) return;
    shown.current = true;
    toast.show("Dein Konto ist gelöscht. Deine persönlichen Angaben sind entfernt.");
    router.replace(pathname, { scroll: false });
  }, [deleted, pathname, router, toast]);
  return null;
}
