"use client";

import { JourneyError } from "@/components/site/checkout-error";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <JourneyError error={error} reset={reset} note="Es wurde nichts gebucht oder belastet." />;
}
