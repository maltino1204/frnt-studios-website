"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { confirmDevPaymentAction } from "@/server/actions/booking";

/** Completes a held booking in the dev payment simulator ("Testmodus"). */
export function DevPayButton({ bookingId }: { bookingId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="flex flex-col items-start gap-3">
      <Button
        size="l"
        loading={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await confirmDevPaymentAction(bookingId);
            if (!r.ok) setError(r.error);
            router.refresh();
          })
        }
      >
        Testzahlung abschließen
      </Button>
      {error ? <Notice kind="danger">{error}</Notice> : null}
    </div>
  );
}
