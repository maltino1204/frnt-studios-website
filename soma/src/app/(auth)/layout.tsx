import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { AuraBackground } from "@/components/ui/aura";
import { FloatingCard } from "@/components/ui/floating";
import { Icon } from "@/components/ui/icon";
import { Photo } from "@/components/ui/photo";
import { SuccessCheck } from "@/components/ui/success";
import { images } from "@/lib/images";
import { routes } from "@/lib/routes";

/**
 * v2 auth split: the form column on the left; on desktop a framed aura panel
 * on the right (the photo is a layer over the generative art when it loads)
 * with a few calm product cards. Mobile: the form alone on a whisper of aura.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex flex-1 flex-col overflow-clip lg:grid lg:grid-cols-2">
      <a
        href="#inhalt"
        className="sr-only z-(--z-toast) rounded-full bg-ink px-4 py-3 type-label text-ink-inverse focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Zum Inhalt springen
      </a>
      <AuraBackground variant="subtle" placement="top" fade="bottom" animate={false} className="h-80 lg:hidden" />
      <div className="flex flex-col">
        <header className="flex h-(--header-height) items-center px-(--space-gutter) lg:px-12">
          <Link href={routes.home()} aria-label="SOMA – zur Startseite" className="-mx-2 inline-flex min-h-touch items-center rounded-control px-2 text-ink focus-ring">
            <Wordmark />
          </Link>
        </header>
        <main id="inhalt" tabIndex={-1} className="flex flex-1 flex-col justify-center px-(--space-gutter) pt-6 pb-16 focus:outline-none lg:px-12 lg:py-16">
          <div className="mx-auto w-full max-w-form">{children}</div>
        </main>
      </div>
      {/* Decorative panel: hidden from assistive tech. */}
      <div aria-hidden className="relative hidden p-4 lg:block">
        <div className="sticky top-4 h-[min(calc(100dvh-4.5rem),60rem)] min-h-[34rem] overflow-hidden rounded-panel shadow-float">
          <div className="absolute inset-0">
            <Photo src={images.editorial.arrival} alt="" tone="brows-lashes" seed="anmelden" sizes="50vw" className="h-full" />
          </div>
          <div className="absolute inset-0 z-[4]" inert>
            <FloatingCard className="top-[14%] left-[10%] w-[17rem]" depth={10} tilt={-1.5} enter={0} glass cardClassName="flex items-center gap-3 p-3.5">
              <SuccessCheck size={36} glow={false} />
              <div>
                <p className="type-heading-s">Bestätigt.</p>
                <p className="type-caption text-ink">Ihr Termin steht.</p>
              </div>
            </FloatingCard>
            <FloatingCard className="top-[36%] right-[10%] w-[15rem]" depth={20} float enter={1} cardClassName="p-4">
              <p className="type-overline text-ink-muted">Start-Code</p>
              <p className="mt-2 flex gap-1.5 stagger-rise">
                {["4", "8", "2", "7"].map((d, i) => (
                  <span key={i} className="inline-flex h-11 w-9 items-center justify-center rounded-tile bg-surface-sunken type-heading-l num">
                    {d}
                  </span>
                ))}
              </p>
            </FloatingCard>
            <FloatingCard className="top-[62%] left-[16%] w-auto" depth={14} enter={2} radius="tile" elevation={1} cardClassName="flex items-center gap-2 px-3.5 py-2.5">
              <Icon icon={BadgeCheck} size={18} className="text-accent" />
              <span className="type-label-s">Verifizierte Profis</span>
            </FloatingCard>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-[5] flex flex-col gap-1 bg-[linear-gradient(to_top,rgb(255_255_255/0.82),rgb(255_255_255/0.4)_60%,transparent)] p-8 pt-24">
            <p className="type-accent text-[clamp(2.25rem,1.5rem+2vw,3.25rem)] leading-none text-ink">Schon da.</p>
            <p className="type-caption text-ink">Altbau, 3.&nbsp;OG · Berlin-Prenzlauer Berg · 19:30</p>
          </div>
        </div>
      </div>
    </div>
  );
}
