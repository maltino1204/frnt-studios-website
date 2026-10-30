"use client";

import { useActionState } from "react";
import { joinWaitlistAction } from "@/server/actions/booking";
import { initialActionState } from "@/server/actions/types";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/form";
import { CheckLine } from "@/components/ui/summary";

/** "Benachrichtigen, sobald verfügbar" – logged as demand for the city/category. */
export function WaitlistForm({ postalCode, categorySlug, cta = "Benachrichtigen" }: { postalCode: string; categorySlug?: string | null; cta?: string }) {
  const [state, action] = useActionState(joinWaitlistAction, initialActionState);
  if (state?.ok) {
    return (
      <div role="status" className="flex flex-col gap-2">
        <CheckLine className="type-body-s">{state.message ?? "Danke. Wir melden uns, sobald es losgeht."}</CheckLine>
      </div>
    );
  }
  return (
    <form action={action} noValidate className="flex w-full max-w-form flex-col gap-3 sm:flex-row sm:items-start">
      <input type="hidden" name="postalCode" value={postalCode} />
      {categorySlug ? <input type="hidden" name="categorySlug" value={categorySlug} /> : null}
      <Input
        label="E-Mail-Adresse"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="z. B. lena@beispiel.de"
        required
        className="flex-1"
        error={state && !state.ok ? (state.fieldErrors?.email ?? state.error) : null}
      />
      <SubmitButton className="sm:mt-6">{cta}</SubmitButton>
    </form>
  );
}
