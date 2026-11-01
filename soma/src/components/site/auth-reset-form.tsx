"use client";

import { useActionState, useState } from "react";
import { requestPasswordResetAction, resetPasswordAction } from "@/server/actions/auth";
import { initialActionState } from "@/server/actions/types";
import { Input } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { keepValuesOnSubmit } from "./keep-values";

/** Step 1: request a reset link (same answer for every address – no account enumeration). */
export function ResetRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialActionState);
  const [email, setEmail] = useState("");
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} onSubmit={keepValuesOnSubmit(action)} noValidate className="flex flex-col gap-5">
      <Input
        label="E-Mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={state && !state.ok ? (state.fieldErrors?.email ?? null) : null}
        required
      />
      {state && !state.ok && !state.fieldErrors ? <FormMessage state={state} /> : null}
      <SubmitButton variant="accent" size="l" block loading={pending}>
        Link anfordern
      </SubmitButton>
    </form>
  );
}

/** Step 2: set a new password with the token from the e-mail. */
export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initialActionState);
  const [v, setV] = useState({ password: "", passwordConfirm: "" });
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} onSubmit={keepValuesOnSubmit(action)} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <Input
        label="Neues Passwort"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="Mindestens 10 Zeichen."
        value={v.password}
        onChange={(e) => setV({ ...v, password: e.target.value })}
        error={fe?.password}
        required
      />
      <Input
        label="Passwort wiederholen"
        name="passwordConfirm"
        type="password"
        autoComplete="new-password"
        value={v.passwordConfirm}
        onChange={(e) => setV({ ...v, passwordConfirm: e.target.value })}
        error={fe?.passwordConfirm}
        required
      />
      {state && !state.ok && !fe ? <FormMessage state={state} /> : state && !state.ok && fe?.token ? <FormMessage state={{ ok: false, error: fe.token }} /> : null}
      <SubmitButton variant="accent" size="l" block loading={pending}>
        Passwort speichern
      </SubmitButton>
    </form>
  );
}
