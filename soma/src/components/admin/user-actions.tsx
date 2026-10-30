"use client";

import { useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { setUserBlockedAction } from "@/server/actions/admin";
import { ConfirmButton } from "./confirm";
import { useMutation } from "./use-mutation";

/** Block / unblock an account with a reason (blocking also ends all sessions). */
export function UserBlockButton({ userId, name, blocked, role }: { userId: string; name: string; blocked: boolean; role: string }) {
  const [reason, setReason] = useState("");
  const m = useMutation(setUserBlockedAction, { success: blocked ? `${name} ist wieder entsperrt.` : `${name} ist gesperrt.` });
  const formId = `block-${userId}`;
  return (
    <ConfirmButton
      label={blocked ? "Entsperren" : "Sperren"}
      variant="ghost"
      icon={<Icon icon={blocked ? LockOpen : Lock} size={16} />}
      title={blocked ? `${name} entsperren?` : `${name} sperren?`}
      confirmLabel={blocked ? "Entsperren" : "Sperren"}
      confirmVariant={blocked ? "primary" : "destructive"}
      formId={formId}
      pending={m.pending}
      error={m.error && !m.fieldErrors.reason ? m.error : null}
      onOpen={() => {
        setReason("");
        m.reset();
      }}
    >
      {({ close }) => (
        <form
          id={formId}
          noValidate
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (reason.trim().length < 3) {
              m.setFieldErrors({ reason: "Bitte einen Grund angeben (mind. 3 Zeichen)." });
              return;
            }
            const res = await m.run({ userId, blocked: !blocked, reason: reason.trim() });
            if (res.ok) close();
          }}
        >
          <p>
            {blocked
              ? "Das Konto kann sich wieder anmelden."
              : `Das Konto (${role}) wird sofort abgemeldet und kann sich nicht mehr anmelden. Bestehende Buchungen bleiben bestehen und müssen gesondert geklärt werden.`}
          </p>
          <Textarea label="Grund" name="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} error={m.fieldErrors.reason} hint="Nur intern, im Protokoll sichtbar." maxLength={500} />
        </form>
      )}
    </ConfirmButton>
  );
}
