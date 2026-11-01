"use client";

import { Check, Star } from "lucide-react";
import { useActionState, useState } from "react";
import { cn } from "@/lib/cn";
import { createReviewAction } from "@/server/actions/booking";
import { initialActionState } from "@/server/actions/types";
import { chipClasses } from "@/components/ui/chip";
import { Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { SuccessCheck } from "@/components/ui/success";
import { MorphText } from "./checkout-parts";
import { keepValuesOnSubmit } from "./keep-values";

const LABELS = ["", "Nicht gut", "Geht so", "In Ordnung", "Sehr gut", "Hervorragend"];

/**
 * Review composer for completed bookings: five tactile stars (hover lift, the chosen
 * ones pop in from left to right), up to three tag chips that settle, and text.
 */
export function ReviewComposer({ bookingId, providerName, tags }: { bookingId: string; providerName: string; tags: readonly string[] }) {
  const [state, action, pending] = useActionState(createReviewAction, initialActionState);
  // All fields are controlled and the form is submitted without React's reset (N5),
  // so stars, tags and text survive a rejected review.
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [chosen, setChosen] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  if (state?.ok) {
    return (
      <div className="flex items-center gap-4 rounded-tile bg-success-soft/60 p-4">
        <SuccessCheck size={44} glow={false} />
        <div className="min-w-0 flex-1">
          <FormMessage state={state} />
        </div>
      </div>
    );
  }
  const shown = hover || rating;
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  const ratingErrorId = `review-${bookingId}-rating-error`;
  return (
    <form action={action} onSubmit={keepValuesOnSubmit(action)} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="bookingId" value={bookingId} />
      <fieldset className="flex flex-col gap-2" aria-describedby={fe?.rating ? ratingErrorId : undefined}>
        <legend className="mb-2 type-label-s text-ink">{`Wie war dein Termin bei ${providerName}?`}</legend>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="-ml-2 flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => {
              const on = n <= shown;
              return (
                <label key={n} className="group relative inline-flex size-12 cursor-pointer items-center justify-center rounded-full" onMouseEnter={() => setHover(n)}>
                  <input
                    type="radio"
                    name="rating"
                    value={n}
                    checked={rating === n}
                    onChange={() => setRating(n)}
                    className="peer sr-only"
                    aria-label={`${n} ${n === 1 ? "Stern" : "Sterne"}`}
                  />
                  <span
                    aria-hidden
                    className="absolute inset-1 rounded-full transition-[background-color,box-shadow] duration-fast peer-focus-visible:shadow-[0_0_0_2px_var(--color-focus),0_0_0_6px_var(--color-focus-glow)] group-hover:bg-ink/[0.04]"
                  />
                  <span
                    // Re-keyed on every new rating so the chosen stars pop in, one after another.
                    key={n <= rating ? `on-${rating}` : "off"}
                    className={cn("relative inline-flex transition-[scale] duration-spring ease-spring group-hover:scale-110 group-active:scale-90", n <= rating && "animate-pop")}
                    style={n <= rating ? { animationDelay: `${(n - 1) * 45}ms` } : undefined}
                  >
                    <Star
                      size={30}
                      strokeWidth={1.5}
                      absoluteStrokeWidth
                      aria-hidden
                      className={cn("transition-[color,fill] duration-fast", on ? "fill-ink text-ink" : "fill-transparent text-line-strong")}
                    />
                  </span>
                </label>
              );
            })}
          </div>
          <span className="min-w-24 type-label text-ink">
            {shown ? <MorphText text={LABELS[shown]} /> : <span className="type-label-s text-ink-muted">Tipp auf einen Stern</span>}
          </span>
        </div>
        {fe?.rating ? (
          <p id={ratingErrorId} className="type-caption text-danger">
            {fe.rating}
          </p>
        ) : null}
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2.5 type-label-s text-ink">
          Was hat gepasst? <span className="font-normal text-ink-muted">(bis zu drei)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => {
            const on = chosen.includes(t);
            const disabled = !on && chosen.length >= 3;
            return (
              <label
                key={t}
                className={chipClasses(
                  on,
                  cn(
                    "cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
                    disabled && "cursor-not-allowed opacity-45 hover:border-line-mid",
                  ),
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
                {on ? <Icon icon={Check} size={15} className="-ml-0.5 animate-pop" /> : null}
                {t}
              </label>
            );
          })}
        </div>
      </fieldset>
      <Textarea
        label="Deine Worte"
        name="comment"
        optional
        rows={4}
        maxLength={2000}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        error={fe?.comment}
        hint="Deine Bewertung erscheint mit Vorname und erstem Buchstaben des Nachnamens."
      />
      {state && !state.ok && !fe?.comment && !fe?.rating ? <FormMessage state={state} /> : null}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <SubmitButton disabled={rating === 0} loading={pending}>
          Bewertung senden
        </SubmitButton>
        {rating === 0 ? <p className="type-caption text-ink-muted">Wähl zuerst 1 bis 5 Sterne.</p> : null}
      </div>
    </form>
  );
}
