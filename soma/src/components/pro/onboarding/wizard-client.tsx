"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Checkbox, Select } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { submitForReviewAction } from "@/server/actions/pro";
import type { ProProfileDTO, VatMode, WeeklyHoursDTO } from "@/server/dto";
import { AreaForm } from "../area-form";
import { ProfileForm } from "../profile-form";
import { WeeklyHoursEditor } from "../weekly-hours-editor";
import { stepHref, WIZARD_STEPS, type WizardSlug } from "./steps";
import { ProgressRing } from "../ui";
import { cn } from "@/lib/cn";
import { proError, VAT_MODE_OPTIONS } from "../labels";

/**
 * Premium progress indicator for the 8-step wizard. Desktop: numbered stepper
 * with connectors that fill in ink; the current step carries the aura ring.
 * Phone: a progress ring with "3/8", the step name and what comes next.
 * Completed steps (except Konto) link back.
 */
export function WizardSteps({ current, done: doneSlugs = [] }: { current: number; /** steps that are really complete (server state) */ done?: WizardSlug[] }) {
  const total = WIZARD_STEPS.length;
  const isDone = (i: number) => i === 0 ? current > 0 : doneSlugs.includes(WIZARD_STEPS[i].slug);
  const next = WIZARD_STEPS[current + 1]?.label;
  return (
    <nav aria-label="Fortschritt" className="rounded-card bg-surface-raised px-4 py-4 shadow-raised sm:px-5 md:px-6 md:py-5">
      {/* phone */}
      <div className="flex items-center gap-4 md:hidden">
        <ProgressRing value={(current + 1) / total} size={52} stroke={4.5}>
          <span className="type-label-s num text-ink">
            {current + 1}/{total}
          </span>
        </ProgressRing>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="type-caption text-ink-muted num">
            Schritt {current + 1} von {total}
          </p>
          <p className="type-heading-s" aria-current="step">
            {WIZARD_STEPS[current].label}
          </p>
          {next ? <p className="truncate type-caption text-ink-muted">Als Nächstes: {next}</p> : null}
        </div>
      </div>
      <div aria-hidden className="mt-4 flex gap-1 md:hidden">
        {WIZARD_STEPS.map((s, i) => (
          <span key={s.slug} className="relative h-1 flex-1 overflow-hidden rounded-full bg-line">
            <span className={cn("absolute inset-0 origin-left rounded-full transition-[scale] duration-calm ease-enter", i === current ? "scale-x-100 bg-ink" : isDone(i) ? "scale-x-100 bg-ink/45" : i < current ? "scale-x-100 bg-warning/60" : "scale-x-0")} />
          </span>
        ))}
      </div>

      {/* tablet / desktop */}
      <ol className="hidden items-start md:flex">
        {WIZARD_STEPS.map((s, i) => {
          const active = i === current;
          const done = !active && isDone(i);
          const open = !active && !done && i < current;
          const linked = (done || open) && i > 0;
          const dot = (
            <span
              className={cn(
                "relative flex size-8 items-center justify-center rounded-full type-label-s num transition-[background-color,box-shadow,color] duration-base",
                done && "bg-ink text-ink-inverse",
                active && "bg-surface-raised text-ink shadow-[inset_0_0_0_1.5px_var(--color-ink),0_0_0_4px_var(--color-surface-sunken)]",
                open && "bg-surface-raised text-ink shadow-[inset_0_0_0_1.5px_var(--color-warning)]",
                !done && !active && !open && "bg-surface-sunken text-ink-muted shadow-[inset_0_0_0_1px_var(--color-line-mid)]",
              )}
            >
              {active ? <span aria-hidden className="absolute inset-[2px] rounded-full bg-surface-raised" /> : null}
              <span className="relative">
                {done ? (
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
                    <path d="M3.5 8.4l2.8 2.8L12.5 5" pathLength={1} strokeDasharray={1} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-draw" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
            </span>
          );
          return (
            <li key={s.slug} className="relative flex flex-1 flex-col items-center gap-2 text-center" aria-current={active ? "step" : undefined}>
              {i < total - 1 ? (
                <span aria-hidden className="absolute top-4 left-[calc(50%+1.25rem)] right-[calc(-50%+1.25rem)] h-0.5 -translate-y-1/2 overflow-hidden rounded-full bg-line">
                  <span className={cn("absolute inset-0 origin-left rounded-full bg-ink transition-[scale] duration-calm ease-enter", i < current ? "scale-x-100" : "scale-x-0")} />
                </span>
              ) : null}
              {linked ? (
                <Link href={stepHref(s.slug)} className="group flex flex-col items-center gap-2 rounded-control focus-ring">
                  {dot}
                  <span className="type-label-s text-ink underline-offset-4 group-hover:underline">
                    {s.label}
                    <span className="sr-only">{done ? " (erledigt, bearbeiten)" : " (noch offen)"}</span>
                  </span>
                  {open ? <span className="-mt-1.5 type-caption text-warning">offen</span> : null}
                </Link>
              ) : (
                <>
                  {dot}
                  <span className={cn("type-label-s", active ? "font-[620] text-ink" : done ? "text-ink" : "text-ink-muted")}>
                    {s.label}
                    {done ? <span className="sr-only"> (erledigt)</span> : null}
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Zurück / Weiter row for steps whose content saves itself (services, documents, payout). */
export function StepNav({ back, next, nextLabel = "Weiter", canContinue = true, hint }: { back?: WizardSlug; next: WizardSlug; nextLabel?: string; canContinue?: boolean; hint?: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-card bg-surface-raised p-4 shadow-raised sm:p-5">
      {!canContinue && hint ? <p className="type-body-s text-ink-muted">{hint}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back ? (
          <ButtonLink href={stepHref(back)} variant="ghost" icon={<Icon icon={ArrowLeft} />}>
            Zurück
          </ButtonLink>
        ) : (
          <span />
        )}
        {canContinue ? (
          <ButtonLink href={stepHref(next)} size="l" iconRight={<Icon icon={ArrowRight} />}>
            {nextLabel}
          </ButtonLink>
        ) : (
          <Button size="l" disabled iconRight={<Icon icon={ArrowRight} />}>
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export function ProfileStep({ profile, next }: { profile: Pick<ProProfileDTO, "displayName" | "headline" | "bio" | "yearsExperience" | "languages">; next: WizardSlug }) {
  const router = useRouter();
  return <ProfileForm profile={profile} submitLabel="Speichern und weiter" onSaved={() => router.push(stepHref(next))} />;
}

export function AreaStep({ profile, cityLabel, next }: { profile: ProProfileDTO; cityLabel: string | null; next: WizardSlug }) {
  const router = useRouter();
  return <AreaForm profile={profile} cityLabel={cityLabel} submitLabel="Speichern und weiter" onSaved={() => router.push(stepHref(next))} />;
}

export function HoursStep({ initial, next }: { initial: WeeklyHoursDTO[]; next: WizardSlug }) {
  const router = useRouter();
  return <WeeklyHoursEditor initial={initial} submitLabel="Speichern und weiter" stickySave={false} onSaved={() => router.push(stepHref(next))} />;
}

/** Final confirmation (terms) + VAT mode + submitForReviewAction. */
export function SubmitForReview({ canSubmit, openSteps, vatMode: initialVatMode }: { canSubmit: boolean; openSteps: string[]; vatMode: VatMode }) {
  const router = useRouter();
  const toast = useToast();
  const [confirmed, setConfirmed] = useState(false);
  const [vatMode, setVatMode] = useState<VatMode>(initialVatMode);
  const [error, setError] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const submit = () => {
    setError(null);
    setCheckError(null);
    if (!confirmed) {
      setCheckError("Bitte bestätige deine Angaben.");
      return;
    }
    start(async () => {
      const res = await submitForReviewAction({ termsAccepted: true, vatMode });
      if (!res.ok) {
        if (res.fieldErrors?.termsAccepted) setCheckError(res.fieldErrors.termsAccepted);
        return setError(proError(res.error));
      }
      toast.show(res.message ?? "Danke. Wir prüfen dein Profil.");
      router.replace("/pro/registrieren");
      router.refresh();
    });
  };
  return (
    <div className="flex flex-col gap-5">
      {!canSubmit && openSteps.length ? (
        <Notice kind="warning" title="Noch nicht ganz fertig">
          Bitte schließ zuerst ab: {openSteps.join(", ")}.
        </Notice>
      ) : null}
      <Select
        label="Umsatzsteuer"
        value={vatMode}
        onChange={(e) => setVatMode(e.target.value as VatMode)}
        hint="Bestimmt den Preishinweis für deine Kundschaft. Du kannst das später in den Einstellungen ändern."
      >
        {VAT_MODE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <Checkbox
        checked={confirmed}
        onChange={(e) => setConfirmed(e.target.checked)}
        error={checkError}
        label="Ich bestätige, dass meine Angaben stimmen und ich die Behandlungen selbstständig mit eigenem Gewerbe anbiete."
        description={
          <>
            Es gelten die <Link href="/agb-profis" className="text-ink underline decoration-line-strong decoration-1 underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">AGB für Profis</Link> und der SOMA-Verhaltenskodex.
          </>
        }
      />
      <div aria-live="polite">{error ? <Notice kind="danger">{error}</Notice> : null}</div>
      <Button size="l" loading={pending} disabled={!canSubmit} onClick={submit} className="self-start" iconRight={<Icon icon={ArrowRight} />}>
        Zur Prüfung einreichen
      </Button>
    </div>
  );
}
