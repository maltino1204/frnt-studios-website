import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { Photo } from "@/components/ui/photo";
import { images } from "@/lib/images";
import { routes } from "@/lib/routes";

/** Editorial split on desktop: form column left, a calm photograph right. Mobile: form only. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col lg:grid lg:grid-cols-2">
      <div className="flex flex-col">
        <header className="flex h-(--header-height) items-center px-(--space-gutter)">
          <Link href={routes.home()} aria-label="SOMA – zur Startseite" className="text-ink">
            <Wordmark />
          </Link>
        </header>
        <main id="inhalt" className="flex flex-1 flex-col justify-center px-(--space-gutter) pt-6 pb-16 lg:py-16">
          <div className="mx-auto w-full max-w-form">{children}</div>
        </main>
      </div>
      <div className="relative hidden lg:block">
        <div className="sticky top-0 h-dvh">
          <div className="absolute inset-0">
            <Photo src={images.editorial.arrival} alt="" tone="nacht" sizes="50vw" priority className="h-full" word="Schon da." wordSize="l" />
          </div>
          <p className="absolute bottom-0 left-0 bg-scrim px-7 py-5 font-display text-[1.375rem] leading-tight text-night-ink italic">
            Altbau, 3.&nbsp;OG · Berlin-Prenzlauer Berg · 19:30
          </p>
        </div>
      </div>
    </div>
  );
}
