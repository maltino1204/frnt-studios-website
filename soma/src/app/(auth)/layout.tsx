import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { AiLabel } from "@/components/ui/ai-label";
import { Photo } from "@/components/ui/photo";
import { PLACE_LINES } from "@/components/site/discovery-copy";
import { BRAND_SIGNATURE } from "@/lib/brand";
import { images } from "@/lib/images";
import { routes } from "@/lib/routes";

/**
 * Auth split (brand § 5.1, § 5.3): the form column on the left; on desktop a Linen panel on the right with one
 * editorial photograph in the SOMA arch, a short caption in the serif italic and the Ortszeile under it.
 * Mobile: the form alone on Bone. No floating cards, no gradients, no text on the photo.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex flex-1 flex-col lg:grid lg:grid-cols-2">
      <a
        href="#inhalt"
        className="sr-only z-(--z-toast) rounded-full bg-ink px-4 py-3 type-label text-ink-inverse focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Zum Inhalt springen
      </a>
      <div className="flex flex-col">
        <header className="flex h-(--header-height) items-center px-(--space-gutter) lg:px-12">
          <Link href={routes.home()} aria-label="SOMA – zur Startseite" className="-mx-2 inline-flex min-h-touch items-center rounded-control px-2 text-ink focus-ring">
            <Wordmark title={null} />
          </Link>
        </header>
        <main id="inhalt" tabIndex={-1} className="flex flex-1 flex-col justify-center px-(--space-gutter) pt-6 pb-16 focus:outline-none lg:px-12 lg:py-16">
          <div className="mx-auto w-full max-w-form">{children}</div>
        </main>
      </div>
      {/* Decorative panel: hidden from assistive tech. */}
      <div aria-hidden className="relative hidden bg-surface-sunken lg:block">
        <figure className="sticky top-0 mx-auto flex h-dvh max-h-[64rem] min-h-[40rem] w-full max-w-[30rem] flex-col justify-center gap-6 px-12 py-16">
          <Photo src={images.editorial.arrival} alt="" tone="brows-lashes" seed="anmelden" sizes="(min-width: 1024px) 384px, 1px" shape="arch" ratio="4/5" className="w-full" />
          {/* The form's heading is the view's one serif statement (guidelines § 4.4), so the signature here is sans. */}
          <figcaption className="flex flex-col gap-2">
            <p className="type-heading-m text-ink">{BRAND_SIGNATURE}</p>
            <p className="type-place text-ink-muted">{PLACE_LINES.arrival}</p>
            <AiLabel src={images.editorial.arrival} kind="image" />
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
