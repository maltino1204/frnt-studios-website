"use client";

import Link from "next/link";
import { ChevronLeft, Lock } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Wordmark } from "@/components/brand/logo";
import { Icon } from "@/components/ui/icon";
import { routes } from "@/lib/routes";

/** Minimal checkout chrome (glass, sticky): "Zurück", wordmark and the secure-booking note. */
export function CheckoutHeader({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const onDetail = pathname.startsWith("/buchung/");
  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push(routes.search());
  };
  return (
    <header className="sticky top-0 z-(--z-header) glass-strong shadow-[0_1px_0_var(--glass-hairline)]">
      <div className="mx-auto grid h-(--header-height) w-full max-w-content grid-cols-[1fr_auto_1fr] items-center gap-2 px-(--space-gutter) min-[360px]:gap-4">
        <div className="-ml-3 justify-self-start">
          {onDetail ? (
            <Link href={signedIn ? routes.account.bookings() : routes.home()} className="inline-flex h-touch items-center gap-1 rounded-full pr-3 pl-2.5 type-label text-ink pressable focus-ring hover:bg-ink/5 min-[360px]:pr-4">
              <Icon icon={ChevronLeft} />
              {signedIn ? "Termine" : "Startseite"}
            </Link>
          ) : (
            <button type="button" onClick={back} className="inline-flex h-touch items-center gap-1 rounded-full pr-3 pl-2.5 type-label text-ink pressable focus-ring hover:bg-ink/5 min-[360px]:pr-4">
              <Icon icon={ChevronLeft} />
              Zurück
            </button>
          )}
        </div>
        <Link href={routes.home()} aria-label="SOMA – zur Startseite" className="inline-flex min-h-touch items-center justify-self-center rounded-control px-2 text-ink focus-ring">
          <Wordmark />
        </Link>
        <p className="inline-flex h-7 items-center gap-1.5 justify-self-end rounded-full bg-success-soft pr-3 pl-2 type-caption font-[560] text-success">
          <Icon icon={Lock} size={14} strokeWidth={1.75} />
          <span className="hidden sm:inline">Sichere Buchung</span>
          <span className="sm:hidden">Sicher</span>
        </p>
      </div>
    </header>
  );
}
