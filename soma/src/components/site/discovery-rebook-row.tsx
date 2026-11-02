"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AiLabel } from "@/components/ui/ai-label";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { formatDayShort, formatTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { RebookSuggestionDTO } from "@/server/services/site-ext";

/** The "Erneut buchen" row itself (discovery-rebook.tsx loads it only once there is a suggestion to show). */
export function RebookSuggestionRow({ s }: { s: RebookSuggestionDTO }) {
  const href = s.nextSlot
    ? routes.checkout({ angebot: s.providerServiceId, start: s.nextSlot, adresse: s.addressId ?? undefined, plz: s.addressId ? undefined : s.postalCode })
    : routes.provider(s.providerSlug);
  const when = s.nextSlot ? `${formatDayShort(s.nextSlot)} · ${formatTime(s.nextSlot)}` : null;

  return (
    <Link
      href={href}
      className="group flex animate-fade-in items-center gap-3 border-y border-line py-3 transition-colors duration-fast hover:border-ink lg:max-w-[34rem]"
    >
      <Avatar src={s.providerAvatarUrl} name={s.providerName} size={40} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="type-body-s text-ink">
          <span className="font-semibold">Erneut buchen:</span> {s.serviceName} bei {s.providerName}
        </span>
        <span className="type-caption text-ink-muted num">
          {when ? `Nächster freier Termin ${when}` : "Freie Termine im Profil ansehen"}
        </span>
        <AiLabel src={s.providerAvatarUrl} />
      </span>
      <Icon icon={ArrowRight} className="shrink-0 text-ink transition-transform duration-fast group-hover:translate-x-0.5" />
    </Link>
  );
}
