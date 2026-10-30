"use client";

import { Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

/** Referral code with copy / native share. */
export function ReferralShare({ code, url, text }: { code: string; url: string; text: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.show("Link kopiert.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.show("Kopieren war nicht möglich. Bitte markieren Sie den Link.", { kind: "error" });
    }
  };
  const share = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "SOMA", text, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    await copy();
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <p className="type-label-s text-ink">Ihr Code</p>
        <p className="font-display text-[2rem] leading-none tracking-[0.12em] num">{code}</p>
      </div>
      <p className="truncate rounded-xs border border-line-strong bg-surface-raised px-3.5 py-3 type-body-s text-ink-muted" title={url}>
        {url}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={share} icon={<Icon icon={Share2} />}>
          Link teilen
        </Button>
        <Button variant="secondary" onClick={copy} icon={<Icon icon={Copy} />} aria-live="polite">
          {copied ? "Kopiert" : "Link kopieren"}
        </Button>
      </div>
    </div>
  );
}
