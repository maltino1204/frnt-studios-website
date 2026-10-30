"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { moderateReviewAction } from "@/server/actions/admin";
import { ConfirmButton } from "./confirm";
import { useMutation } from "./use-mutation";

/** Hide / show one review (audited; the provider's rating follows immediately). */
export function ReviewModerationButton({ reviewId, isPublished, label }: { reviewId: string; isPublished: boolean; label: string }) {
  const [note, setNote] = useState("");
  const m = useMutation(moderateReviewAction);
  const formId = `moderate-${reviewId}`;
  return (
    <ConfirmButton
      label={isPublished ? "Ausblenden" : "Einblenden"}
      variant="ghost"
      icon={<Icon icon={isPublished ? EyeOff : Eye} size={16} />}
      title={isPublished ? "Bewertung ausblenden?" : "Bewertung wieder einblenden?"}
      confirmLabel={isPublished ? "Ausblenden" : "Einblenden"}
      confirmVariant={isPublished ? "destructive" : "primary"}
      formId={formId}
      pending={m.pending}
      error={m.error && !m.fieldErrors.note ? m.error : null}
      onOpen={() => {
        setNote("");
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
            if (isPublished && note.trim().length < 3) {
              m.setFieldErrors({ note: "Bitte einen Grund angeben (mind. 3 Zeichen)." });
              return;
            }
            const res = await m.run({ reviewId, isPublished: !isPublished, note: note.trim() || undefined });
            if (res.ok) close();
          }}
        >
          <p>
            {isPublished
              ? `${label} verschwindet vom Profil und zählt nicht mehr in die Durchschnittsbewertung.`
              : `${label} wird wieder auf dem Profil gezeigt und zählt in die Durchschnittsbewertung.`}
          </p>
          <Textarea
            label="Grund"
            optional={!isPublished}
            name="note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            error={m.fieldErrors.note}
            hint="Nur intern, im Protokoll sichtbar."
            maxLength={500}
          />
        </form>
      )}
    </ConfirmButton>
  );
}
