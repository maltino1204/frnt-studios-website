"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { toggleFavoriteAction } from "@/server/actions/account";
import { useToast } from "@/components/ui/toast";

/**
 * Favourite toggle (Heart, 44px ghost). Logged-in customers toggle via the account
 * action; guests are sent to the login and come back to the same page.
 */
export function FavoriteButton({
  providerId,
  providerName,
  initial,
  canToggle,
  className,
  withLabel,
}: {
  providerId: string;
  providerName: string;
  initial: boolean;
  /** true for a signed-in customer */
  canToggle: boolean;
  className?: string;
  withLabel?: boolean;
}) {
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const toast = useToast();

  const onClick = () => {
    if (!canToggle) {
      const qs = search.toString();
      router.push(routes.login(`${pathname}${qs ? `?${qs}` : ""}`));
      return;
    }
    const next = !fav;
    setFav(next);
    start(async () => {
      const res = await toggleFavoriteAction(providerId);
      if (!res.ok) {
        setFav(!next);
        toast.show(res.error, { kind: "error" });
        return;
      }
      setFav(res.data.favorite);
      toast.show(res.data.favorite ? `${providerName} ist jetzt in Ihren Favoriten.` : `${providerName} wurde aus Ihren Favoriten entfernt.`);
    });
  };

  const label = fav ? `${providerName} aus Favoriten entfernen` : `${providerName} als Favorit speichern`;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={canToggle ? fav : undefined}
      aria-label={withLabel ? undefined : label}
      title={label}
      disabled={pending}
      className={cn(
        "inline-flex h-touch shrink-0 items-center justify-center gap-2 rounded-full text-ink pressable focus-ring hover:bg-surface-sunken disabled:opacity-100",
        withLabel ? "px-3.5 type-label-s" : "w-touch",
        className,
      )}
    >
      {/* Re-keyed on change so the heart springs (pop) each time it is filled. */}
      <Heart
        key={fav ? "on" : "off"}
        size={20}
        strokeWidth={1.5}
        absoluteStrokeWidth
        aria-hidden
        className={cn("transition-colors duration-fast", fav ? "animate-pop fill-ink text-ink" : "text-ink")}
      />
      {withLabel ? <span>{fav ? "Gemerkt" : "Merken"}</span> : null}
    </button>
  );
}
