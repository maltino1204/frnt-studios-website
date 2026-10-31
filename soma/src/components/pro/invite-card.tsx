"use client";

import { useState } from "react";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import { AuraBackground } from "@/components/ui/aura";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

/** Personal invite link on the aura: own clients book via SOMA for the own-client commission. */
export function InviteCard({
  inviteUrl,
  ownClientRateLabel,
  className,
  compact = false,
  inactiveNote,
}: {
  inviteUrl: string;
  ownClientRateLabel: string;
  className?: string;
  compact?: boolean;
  /** shown instead of the share buttons while the public profile is not live yet */
  inactiveNote?: string;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.show("Link kopiert.");
      setTimeout(() => setCopied(false), 2400);
    } catch {
      toast.show("Kopieren nicht möglich. Bitte markiere den Link und kopiere ihn manuell.", { kind: "error" });
    }
  };
  const share = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "Bei mir auf SOMA buchen", text: "Hier kannst du direkt bei mir buchen:", url: inviteUrl });
        return;
      } catch {
        /* cancelled */
      }
    }
    copy();
  };
  return (
    <section
      className={cn("relative isolate flex flex-col gap-5 overflow-clip rounded-card bg-surface-raised p-5 shadow-raised lg:p-6", !compact && "lg:rounded-panel lg:p-8", className)}
      aria-labelledby="invite-title"
    >
      {compact ? <AuraBackground variant="section" placement="full" fade="none" animate={false} /> : <AuraBackground variant="section" placement="full" fade="none" />}
      <div className="flex flex-col gap-3">
        <span className="inline-flex h-7 w-fit items-center rounded-full glass-strong glass-edge px-3 type-label-s text-ink shadow-raised num">
          Eigene Kundschaft · {ownClientRateLabel}
        </span>
        <h2 id="invite-title" className={cn("type-heading-m", !compact && "lg:type-heading-l")}>
          Bring deine Stammkundschaft mit – nur <span className="num whitespace-nowrap">{ownClientRateLabel}</span> Provision
        </h2>
        {!compact ? (
          <p className="max-w-reading type-body-s text-ink-muted">
            Wer über deinen persönlichen Link bucht, gilt dauerhaft als deine eigene Kundschaft. Du behältst mehr, die Kundschaft bekommt Zahlung, Erinnerungen und Absicherung über SOMA.
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <label className="sr-only" htmlFor="invite-url">
          Dein Einladungslink
        </label>
        <div className="flex h-12 items-center gap-2 rounded-control glass-strong glass-edge px-3.5 shadow-raised transition-shadow duration-fast focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
          <Icon icon={Link2} size={16} className="shrink-0 text-ink-muted" />
          <input
            id="invite-url"
            readOnly
            value={inviteUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="h-full min-w-0 flex-1 truncate bg-transparent text-[15px] text-ink outline-none num"
          />
        </div>
      </div>
      {inactiveNote ? <p className="type-caption text-ink-muted">{inactiveNote}</p> : null}
      <div className={cn("grid grid-cols-2 gap-2", inactiveNote && "hidden", !compact && "sm:flex sm:flex-wrap")}>
        <Button variant="secondary" onClick={copy} icon={<Icon icon={copied ? Check : Copy} />}>
          {copied ? "Kopiert" : "Kopieren"}
        </Button>
        <Button onClick={share} icon={<Icon icon={Share2} />}>
          Teilen
        </Button>
      </div>
    </section>
  );
}
