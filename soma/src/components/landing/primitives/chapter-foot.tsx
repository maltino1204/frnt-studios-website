import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

export type FootCta = {
  label: string;
  href: string;
  /** "button": the chapter's one filled button (primary); "link": a quiet underlined link */
  kind: "button" | "link";
  /** booking CTAs (`href="#termin"`): routed to openBooking({ source }) after hydration, a plain anchor without JS */
  booking?: string;
};

/** Underlined link style (spec § 6.1): ink, 1 px line-strong underline at 0.2 em, Oxblood on hover, 44 px target. */
export const lpLinkClass =
  "group inline-flex min-h-touch items-center gap-2 rounded-full type-label text-link transition-colors duration-fast focus-ring hover:text-link-hover";
export const lpLinkText = "underline decoration-line-strong decoration-1 underline-offset-[0.2em] group-hover:decoration-current";

function CtaLink({ cta }: { cta: FootCta }) {
  const internalHash = cta.href.startsWith("#");
  const common = { "data-booking-open": cta.booking } as Record<string, string | undefined>;
  if (cta.kind === "button") {
    const cls = buttonClasses({ variant: "primary", size: "l", className: "max-md:w-full" });
    return internalHash ? (
      <a href={cta.href} className={cls} {...common}>
        {cta.label}
      </a>
    ) : (
      <Link href={cta.href} className={cls} {...common}>
        {cta.label}
      </Link>
    );
  }
  const inner = (
    <>
      <span className={lpLinkText}>{cta.label}</span>
      <Icon icon={internalHash ? ArrowDown : cta.href.startsWith("/") ? ArrowRight : ArrowUpRight} size={16} />
    </>
  );
  return internalHash ? (
    <a href={cta.href} className={lpLinkClass} {...common}>
      {inner}
    </a>
  ) : (
    <Link href={cta.href} className={lpLinkClass} {...common}>
      {inner}
    </Link>
  );
}

/**
 * Chapter foot (spec § 5.7): a 1 px rule, the chapter's contextual CTA on the left and „Weiter: {Kapitel}“ on the
 * right (→ #next). Stacked at 390, the "Weiter" link full width.
 */
export function ChapterFoot({ cta, next, className }: { cta?: FootCta | null; next?: { id: string; name: string } | null; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 border-t border-line pt-5 md:flex-row md:items-center md:justify-between md:gap-6", className)}>
      {cta ? <CtaLink cta={cta} /> : <span aria-hidden className="hidden md:block" />}
      {next ? (
        <a href={`#${next.id}`} className={cn(lpLinkClass, "max-md:w-full md:ml-auto")}>
          <span className={lpLinkText}>Weiter: {next.name}</span>
          <Icon icon={ArrowDown} size={16} />
        </a>
      ) : null}
    </div>
  );
}
