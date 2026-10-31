"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { replyToReviewAction } from "@/server/actions/pro";
import { proError } from "./labels";

/** One public reply per review (replyToReviewAction). */
export function ReviewReply({ reviewId, authorName }: { reviewId: string; authorName: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!open) {
    return (
      <Button variant="secondary" size="s" className="self-start" icon={<Icon icon={MessageSquare} size={16} />} onClick={() => setOpen(true)}>
        Öffentlich antworten
      </Button>
    );
  }
  const submit = () =>
    start(async () => {
      setError(null);
      const res = await replyToReviewAction({ reviewId, reply: text.trim() });
      if (!res.ok) return setError(res.fieldErrors?.reply ?? proError(res.error));
      toast.show(res.message ?? "Antwort veröffentlicht.");
      setOpen(false);
      router.refresh();
    });
  return (
    <div className="flex animate-fade-in flex-col gap-3 rounded-tile bg-surface-sunken/70 p-4 inset-shadow-sunken">
      <Textarea
        label={`Deine Antwort an ${authorName ?? "die Kundschaft"}`}
        rows={3}
        maxLength={1000}
        value={text}
        autoFocus
        onChange={(e) => setText(e.target.value)}
        error={error}
        hint="Öffentlich sichtbar in deinem Profil. Du kannst einmal antworten."
      />
      <div className="flex flex-wrap gap-2">
        <Button loading={pending} onClick={submit} disabled={text.trim().length < 2}>
          Antwort veröffentlichen
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
