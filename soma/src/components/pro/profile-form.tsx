"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Notice } from "@/components/ui/feedback";
import { Input, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { updateProProfileAction } from "@/server/actions/pro";
import type { ProProfileDTO } from "@/server/dto";
import { LANGUAGE_OPTIONS, proError } from "./labels";

const BIO_MAX = 400;

/** Display name, headline, bio (≤ 400, HWG-checked on the server), experience, languages. */
export function ProfileForm({
  profile,
  submitLabel = "Profil speichern",
  onSaved,
}: {
  profile: Pick<ProProfileDTO, "displayName" | "headline" | "bio" | "yearsExperience" | "languages">;
  submitLabel?: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [years, setYears] = useState(profile.yearsExperience == null ? "" : String(profile.yearsExperience));
  const [languages, setLanguages] = useState<string[]>(profile.languages?.length ? profile.languages : ["de"]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toggle = (code: string) => setLanguages((l) => (l.includes(code) ? l.filter((x) => x !== code) : [...l, code]));

  const save = () => {
    setErrors({});
    setError(null);
    const y = years.trim() === "" ? null : Number(years);
    if (y !== null && (!Number.isInteger(y) || y < 0 || y > 60)) {
      setErrors({ yearsExperience: "Bitte eine ganze Zahl zwischen 0 und 60." });
      return;
    }
    start(async () => {
      const res = await updateProProfileAction({ displayName: displayName.trim(), headline: headline.trim() || undefined, bio: bio.trim() || undefined, yearsExperience: y, languages });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setError(proError(res.error));
        return;
      }
      toast.show(res.message ?? "Profil gespeichert.");
      if (onSaved) onSaved();
      else router.refresh();
    });
  };

  const bioLen = bio.trim().length;

  return (
    <form
      className="flex flex-col gap-6"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Input
        label="Anzeigename"
        value={displayName}
        maxLength={80}
        onChange={(e) => setDisplayName(e.target.value)}
        error={errors.displayName}
        hint="Vorname und Initial, z. B. „Selin A.“ – so erscheinst du in der Suche."
        autoComplete="nickname"
      />
      <Input
        label="Kurzbeschreibung"
        optional
        value={headline}
        maxLength={120}
        onChange={(e) => setHeadline(e.target.value)}
        error={errors.headline}
        placeholder="z. B. Massagen mit Ruhe und Struktur – ich bringe alles mit."
      />
      <div className="flex flex-col gap-1.5">
        <Textarea
          label="Über dich"
          rows={5}
          maxLength={BIO_MAX}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          error={errors.bio}
          hint="Erzähl, wie du arbeitest und was du mitbringst. Bitte ohne Heilversprechen (z. B. „lindert Schmerzen“) – SOMA bietet Wellness, keine Therapie."
        />
        <p className={cn("self-end type-caption num", bioLen < 40 ? "text-ink-muted" : "text-ink-muted")} aria-live="polite">
          {bioLen} / {BIO_MAX}
          {bioLen < 40 ? ` · mindestens 40 Zeichen` : ""}
        </p>
      </div>
      <Input
        label="Berufserfahrung in Jahren"
        optional
        inputMode="numeric"
        value={years}
        onChange={(e) => setYears(e.target.value.replace(/\D/g, "").slice(0, 2))}
        error={errors.yearsExperience}
        className="sm:max-w-xs"
      />
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1.5 type-label-s text-ink">Sprachen</legend>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((l) => (
            <Chip key={l.code} selected={languages.includes(l.code)} showCheck onClick={() => toggle(l.code)}>
              {l.label}
            </Chip>
          ))}
        </div>
        {errors.languages ? <p className="type-caption text-danger">{errors.languages}</p> : null}
      </fieldset>
      <div aria-live="polite">{error ? <Notice kind="danger">{error}</Notice> : null}</div>
      <Button type="submit" size="l" loading={pending} className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
