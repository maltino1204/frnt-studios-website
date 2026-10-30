"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

/** Personal invite link: own clients book via SOMA for the own-client commission. */
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
    <section className={cn("flex flex-col gap-4 border border-line bg-surface-raised p-5 lg:p-6", className)} aria-labelledby="invite-title">
      <div className="flex flex-col gap-2">
        <span aria-hidden className="block h-0.5 w-6 bg-ink" />
        <h2 id="invite-title" className="type-heading-m">
          Bring deine Stammkundschaft mit – nur {ownClientRateLabel} Provision
        </h2>
        {!compact ? (
          <p className="type-body-s text-ink-muted">
            Wer über deinen persönlichen Link bucht, gilt dauerhaft als deine eigene Kundschaft. Du behältst mehr, die Kundschaft bekommt Zahlung, Erinnerungen und Absicherung über SOMA.
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <label className="type-label-s text-ink" htmlFor="invite-url">
          Dein Einladungslink
        </label>
        <input
          id="invite-url"
          readOnly
          value={inviteUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="h-12 w-full truncate rounded-xs border border-line-strong bg-surface px-3.5 text-[15px] text-ink num"
        />
      </div>
      {inactiveNote ? <p className="type-caption text-ink-muted">{inactiveNote}</p> : null}
      <div className={cn("grid grid-cols-2 gap-2", inactiveNote && "hidden")}>
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
