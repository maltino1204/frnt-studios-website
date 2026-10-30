"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { formatDayShort, formatTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import { getRebookSuggestionAction } from "@/server/actions/site-ext";
import type { RebookSuggestionDTO } from "@/server/services/site-ext";

/**
 * "Erneut buchen" row above the booking entry for returning customers
 * (design-guideline §8 "Returning users"). Fetched after hydration so the
 * page itself stays static; renders nothing for guests or without history.
 */
export function RebookRow() {
  const [s, setS] = useState<RebookSuggestionDTO | null>(null);
  useEffect(() => {
    let alive = true;
    getRebookSuggestionAction()
      .then((res) => {
        if (alive && res.ok) setS(res.data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  if (!s) return null;

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
      </span>
      <Icon icon={ArrowRight} className="shrink-0 text-ink transition-transform duration-fast group-hover:translate-x-0.5" />
    </Link>
  );
}
