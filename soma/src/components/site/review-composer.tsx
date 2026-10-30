"use client";

import { Star } from "lucide-react";
import { useActionState, useState } from "react";
import { cn } from "@/lib/cn";
import { createReviewAction } from "@/server/actions/booking";
import { initialActionState } from "@/server/actions/types";
import { Textarea } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { keepValuesOnSubmit } from "./keep-values";

const LABELS = ["", "Nicht gut", "Geht so", "In Ordnung", "Sehr gut", "Hervorragend"];

/** Review composer for completed bookings: five-star row, up to three tags, text. */
export function ReviewComposer({ bookingId, providerName, tags }: { bookingId: string; providerName: string; tags: readonly string[] }) {
  const [state, action, pending] = useActionState(createReviewAction, initialActionState);
  // All fields are controlled and the form is submitted without React's reset (N5),
  // so stars, tags and text survive a rejected review.
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [chosen, setChosen] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  if (state?.ok) return <FormMessage state={state} />;
  const shown = hover || rating;
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  const ratingErrorId = `review-${bookingId}-rating-error`;
  return (
    <form action={action} onSubmit={keepValuesOnSubmit(action)} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="bookingId" value={bookingId} />
      <fieldset className="flex flex-col gap-2" aria-describedby={fe?.rating ? ratingErrorId : undefined}>
        <legend className="mb-1 type-label-s text-ink">{`Wie war Ihr Termin bei ${providerName}?`}</legend>
        <div className="flex items-center gap-3">
          <div className="flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="relative inline-flex size-touch cursor-pointer items-center justify-center" onMouseEnter={() => setHover(n)}>
                <input
                  type="radio"
                  name="rating"
                  value={n}
                  checked={rating === n}
                  onChange={() => setRating(n)}
                  className="peer sr-only"
                  aria-label={`${n} ${n === 1 ? "Stern" : "Sterne"}`}
                />
                <Star
                  size={28}
                  strokeWidth={1.5}
                  absoluteStrokeWidth
                  aria-hidden
                  className={cn("rounded-xs peer-focus-visible:outline-2 peer-focus-visible:outline-focus", n <= shown ? "fill-ink text-ink" : "text-line-strong")}
                />
              </label>
            ))}
          </div>
          <span className="type-label-s text-ink-muted" aria-live="polite">
            {LABELS[shown]}
          </span>
        </div>
        {fe?.rating ? (
          <p id={ratingErrorId} className="type-caption text-danger">
            {fe.rating}
          </p>
        ) : null}
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 type-label-s text-ink">
          Was hat gepasst? <span className="font-normal text-ink-muted">(bis zu drei)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => {
            const on = chosen.includes(t);
            const disabled = !on && chosen.length >= 3;
            return (
              <label
                key={t}
                className={cn(
                  "relative inline-flex h-9 cursor-pointer items-center rounded-full border px-3.5 text-[14px] font-[520] transition-colors duration-fast has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
                  on ? "border-ink bg-ink text-ink-inverse" : "border-line-strong bg-surface-raised text-ink hover:border-ink",
                  disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <input
                  type="checkbox"
                  name="tags"
                  value={t}
                  checked={on}
                  disabled={disabled}
                  onChange={() => setChosen((c) => (on ? c.filter((x) => x !== t) : [...c, t]))}
                  className="sr-only"
                />
                {t}
              </label>
            );
          })}
        </div>
      </fieldset>
      <Textarea
        label="Ihre Worte"
        name="comment"
        optional
        rows={4}
        maxLength={2000}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        error={fe?.comment}
        hint="Ihre Bewertung erscheint mit Vorname und erstem Buchstaben des Nachnamens."
      />
      {state && !state.ok && !fe?.comment && !fe?.rating ? <FormMessage state={state} /> : null}
      <div className="flex flex-col items-start gap-2">
        <SubmitButton disabled={rating === 0} loading={pending}>
          Bewertung senden
        </SubmitButton>
        {rating === 0 ? <p className="type-caption text-ink-muted">Wählen Sie zuerst 1 bis 5 Sterne.</p> : null}
      </div>
    </form>
  );
}
