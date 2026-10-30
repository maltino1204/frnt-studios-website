"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Checkbox } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { StepIndicator } from "@/components/ui/summary";
import { useToast } from "@/components/ui/toast";
import { submitForReviewAction } from "@/server/actions/pro";
import type { ProProfileDTO, WeeklyHoursDTO } from "@/server/dto";
import { AreaForm } from "../area-form";
import { ProfileForm } from "../profile-form";
import { WeeklyHoursEditor } from "../weekly-hours-editor";
import { stepHref, WIZARD_STEPS, type WizardSlug } from "./steps";
import { proError } from "../labels";

/** StepIndicator with links back to completed steps (konto is not revisitable). */
export function WizardSteps({ current }: { current: number }) {
  const router = useRouter();
  return (
    <StepIndicator
      steps={WIZARD_STEPS.map((s) => s.label)}
      current={current}
      onStepClick={(i) => {
        if (i > 0) router.push(stepHref(WIZARD_STEPS[i].slug));
      }}
    />
  );
}

/** Zurück / Weiter row for steps whose content saves itself (services, documents, payout). */
export function StepNav({ back, next, nextLabel = "Weiter", canContinue = true, hint }: { back?: WizardSlug; next: WizardSlug; nextLabel?: string; canContinue?: boolean; hint?: string }) {
  return (
    <div className="flex flex-col gap-3 border-t border-line pt-6">
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

/** Final confirmation + submitForReviewAction. */
export function SubmitForReview({ canSubmit, openSteps }: { canSubmit: boolean; openSteps: string[] }) {
  const router = useRouter();
  const toast = useToast();
  const [confirmed, setConfirmed] = useState(false);
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
      const res = await submitForReviewAction();
      if (!res.ok) return setError(proError(res.error));
      toast.show(res.message ?? "Danke! Wir prüfen dein Profil.");
      router.replace("/pro/registrieren");
      router.refresh();
    });
  };
  return (
    <div className="flex flex-col gap-5">
      {!canSubmit && openSteps.length ? (
        <Notice kind="warning" title="Noch nicht ganz fertig">
          Bitte schließe zuerst ab: {openSteps.join(", ")}.
        </Notice>
      ) : null}
      <Checkbox
        checked={confirmed}
        onChange={(e) => setConfirmed(e.target.checked)}
        error={checkError}
        label="Ich bestätige, dass meine Angaben stimmen und ich die Behandlungen selbstständig mit eigenem Gewerbe anbiete."
        description={
          <>
            Es gelten die <Link href="/agb-profis" className="text-accent underline">AGB für Profis</Link> und der SOMA-Verhaltenskodex.
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
