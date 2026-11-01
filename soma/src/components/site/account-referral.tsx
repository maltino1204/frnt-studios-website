"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

/**
 * Referral code with copy / native share. The copy control answers tactilely:
 * it presses in, the icon morphs Copy → Check (pop) and the link field flashes
 * a soft success ring, then everything settles back after 2.5 s.
 */
export function ReferralShare({ code, url, text }: { code: string; url: string; text: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.show("Link kopiert.");
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2500);
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="type-label-s text-ink">Ihr Code</p>
        <p className="inline-flex h-12 w-fit items-center rounded-tile bg-surface-raised px-4 text-[1.375rem] leading-none font-[600] tracking-[0.16em] text-ink shadow-raised num">{code}</p>
      </div>
      <div
        className={cn(
          "flex min-w-0 items-center gap-2 rounded-full bg-surface-raised py-1.5 pr-1.5 pl-4 shadow-raised ring-1 ring-inset transition-[box-shadow] duration-base",
          copied ? "ring-success-line" : "ring-line-mid",
        )}
      >
        <p className="min-w-0 flex-1 truncate type-body-s text-ink-muted" title={url}>
          {url}
        </p>
        <Button variant={copied ? "secondary" : "primary"} size="s" onClick={copy} aria-live="polite" className="shrink-0" icon={<Icon key={copied ? "ok" : "copy"} icon={copied ? Check : Copy} className={cn("animate-pop", copied && "text-success")} />}>
          {copied ? "Kopiert" : "Link kopieren"}
        </Button>
      </div>
      <div>
        <Button variant="secondary" onClick={share} icon={<Icon icon={Share2} />}>
          Link teilen
        </Button>
      </div>
    </div>
  );
}
