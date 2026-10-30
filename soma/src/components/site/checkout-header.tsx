"use client";

import Link from "next/link";
import { ChevronLeft, Lock } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Wordmark } from "@/components/brand/logo";
import { Icon } from "@/components/ui/icon";
import { routes } from "@/lib/routes";

/** Minimal checkout chrome: wordmark, "Zurück" and the secure-booking note. */
export function CheckoutHeader({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const onDetail = pathname.startsWith("/buchung/");
  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push(routes.search());
  };
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto grid h-(--header-height) w-full max-w-content grid-cols-[1fr_auto_1fr] items-center gap-4 px-(--space-gutter)">
        <div className="-ml-3 justify-self-start">
          {onDetail ? (
            <Link href={signedIn ? routes.account.bookings() : routes.home()} className="inline-flex h-touch items-center gap-1 rounded-xs px-3 type-label text-ink hover:bg-surface-sunken">
              <Icon icon={ChevronLeft} />
              {signedIn ? "Termine" : "Startseite"}
            </Link>
          ) : (
            <button type="button" onClick={back} className="inline-flex h-touch items-center gap-1 rounded-xs px-3 type-label text-ink hover:bg-surface-sunken">
              <Icon icon={ChevronLeft} />
              Zurück
            </button>
          )}
        </div>
        <Link href={routes.home()} aria-label="SOMA – zur Startseite" className="inline-flex min-h-touch items-center justify-self-center px-2 text-ink">
          <Wordmark />
        </Link>
        <p className="inline-flex items-center gap-1.5 justify-self-end type-caption text-ink-muted">
          <Icon icon={Lock} size={16} />
          <span className="hidden sm:inline">Sichere Buchung</span>
          <span className="sm:hidden">Sicher</span>
        </p>
      </div>
    </header>
  );
}
