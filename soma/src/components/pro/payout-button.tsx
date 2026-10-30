"use client";

import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { startPayoutOnboardingAction } from "@/server/actions/pro";

/** Starts Stripe Connect onboarding (dev: simulated, comes straight back to /pro/einnahmen). */
export function PayoutButton({ label = "Auszahlungen einrichten", variant = "primary" }: { label?: string; variant?: "primary" | "secondary" }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <Button
        size="l"
        variant={variant}
        loading={pending}
        className="self-start"
        iconRight={<Icon icon={ArrowRight} />}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await startPayoutOnboardingAction();
            if (res && !res.ok) setError(res.error);
          })
        }
      >
        {label}
      </Button>
      <div aria-live="polite">{error ? <Notice kind="danger">{error}</Notice> : null}</div>
    </div>
  );
}
