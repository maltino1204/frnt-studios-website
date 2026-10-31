"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash, Upload } from "lucide-react";
import { Avatar, Portrait } from "@/components/ui/avatar";
import { Button, IconButton, buttonClasses } from "@/components/ui/button";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Photo } from "@/components/ui/photo";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { uploadAvatarAction } from "@/server/actions/account";
import { deletePortfolioItemAction, uploadPortfolioImageAction } from "@/server/actions/pro";
import type { PortfolioItemDTO } from "@/server/dto";
import { proError } from "./labels";
import { keepValuesOnSubmit } from "@/components/site/keep-values";

const IMAGE_TYPES = "image/jpeg,image/png,image/webp";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function tooLarge(file: File | undefined | null, max: number) {
  return !!file && file.size > max;
}

/** Profile photo (also the public portrait). Submits as soon as a file is chosen. */
export function AvatarUpload({ avatarUrl, name, onSaved }: { avatarUrl: string | null; name: string; onSaved?: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [state, action, pending] = useActionState(uploadAvatarAction, null);
  const handled = useRef(state);
  useEffect(() => {
    if (state === handled.current) return;
    handled.current = state;
    if (state?.ok) {
      toast.show(state.message ?? "Foto gespeichert.");
      if (onSaved) onSaved();
      else router.refresh();
    }
  }, [state, toast, router, onSaved]);
  return (
    <form ref={formRef} action={action} className="flex items-center gap-5">
      <div className={cn("relative w-24 shrink-0 rounded-tile shadow-raised transition-opacity duration-base", pending && "opacity-60")}>
        <Portrait src={state?.ok ? state.data.avatarUrl : avatarUrl} name={name} sizes="96px" />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <label className="inline-flex">
          <span className="sr-only">Profilfoto auswählen</span>
          <input
            type="file"
            name="file"
            accept={IMAGE_TYPES}
            className="peer sr-only"
            onChange={(e) => {
              setLocalError(null);
              const f = e.target.files?.[0];
              if (tooLarge(f, MAX_IMAGE_BYTES)) {
                setLocalError("Das Bild ist größer als 8 MB.");
                e.target.value = "";
                return;
              }
              if (f) formRef.current?.requestSubmit();
            }}
          />
          <span className={cn(buttonClasses({ variant: "secondary" }), "cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus")}>
            <Icon icon={Upload} />
            {pending ? "Wird hochgeladen …" : avatarUrl ? "Foto ändern" : "Foto hochladen"}
          </span>
        </label>
        <p className="type-caption text-ink-muted">JPG, PNG oder WebP, bis 8 MB. Ein helles Porträt, Gesicht gut erkennbar.</p>
        <div aria-live="polite">
          {localError || (state && !state.ok) ? <p className="type-caption text-danger">{localError ?? (state && !state.ok ? state.fieldErrors?.file ?? proError(state.error) : "")}</p> : null}
        </div>
      </div>
    </form>
  );
}

/** Small avatar + name line used in summaries. */
export function AvatarLine({ avatarUrl, name }: { avatarUrl: string | null; name: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      <Avatar src={avatarUrl} name={name} size={40} />
      <span className="type-label">{name}</span>
    </span>
  );
}

/** Portfolio: 1:1 thumbnails without gaps, upload with caption + category, delete. Max. 24. */
export function PortfolioManager({
  items,
  categories,
  minRecommended = 3,
}: {
  items: PortfolioItemDTO[];
  categories: { id: string; name: string; slug: string }[];
  minRecommended?: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [state, action, pending] = useActionState(uploadPortfolioImageAction, null);
  const [deleting, startDelete] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const catSlug = (id: string | null) => categories.find((c) => c.id === id)?.slug ?? categories[0]?.slug ?? "massage";

  const handled = useRef(state);
  useEffect(() => {
    if (state === handled.current) return;
    handled.current = state;
    if (state?.ok) {
      toast.show(state.message ?? "Bild hinzugefügt.");
      formRef.current?.reset();
      setFileName(null);
      router.refresh();
    }
  }, [state, toast, router]);

  const remove = (id: string) => {
    setDeletingId(id);
    startDelete(async () => {
      const res = await deletePortfolioItemAction(id);
      setDeletingId(null);
      if (!res.ok) return toast.show(proError(res.error), { kind: "error" });
      toast.show("Bild entfernt.");
      router.refresh();
    });
  };

  const full = items.length >= 24;

  return (
    <div className="flex flex-col gap-6">
      {items.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4" aria-label="Portfolio">
          {items.map((it) => (
            <li key={it.id} className={cn("group relative flex flex-col gap-2 transition-opacity duration-base", deleting && deletingId === it.id && "opacity-50")}>
              <div className="relative overflow-hidden rounded-card shadow-raised transition-[box-shadow,translate] duration-base ease-settle group-hover:-translate-y-0.5 group-hover:shadow-float">
                {/* The visible caption below names the image; repeating it as alt text would be read twice. */}
                <Photo src={it.url} alt={it.caption ? "" : "Portfolio-Bild"} tone={catSlug(it.categoryId)} seed={it.id} sizes="(min-width: 1024px) 260px, 50vw" ratio="1/1" />
                <IconButton
                  label={`Bild${it.caption ? ` „${it.caption}“` : ""} entfernen`}
                  onClick={() => remove(it.id)}
                  disabled={deleting && deletingId === it.id}
                  className="absolute top-2 right-2 z-[4] size-10! glass-strong glass-edge shadow-raised transition-opacity duration-fast hover:bg-white! hover:text-danger [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
                >
                  <Icon icon={Trash} size={18} />
                </IconButton>
              </div>
              {it.caption ? <p className="truncate px-0.5 type-caption text-ink-muted">{it.caption}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-card bg-surface-raised px-5 shadow-raised">
          <EmptyState className="py-6!" seed="pro-portfolio" title="Noch kein Portfolio.">
            Zeig {minRecommended} oder mehr Arbeiten – Nägel, Make-up oder dein Set-up vor Ort. Profile mit Bildern werden deutlich häufiger gebucht.
          </EmptyState>
        </div>
      )}

      {/* Submitted without React's form reset: file, caption and category survive a rejected upload (N5). */}
      <form ref={formRef} action={action} onSubmit={keepValuesOnSubmit(action)} className="flex flex-col gap-5 rounded-card bg-surface-raised p-5 shadow-raised lg:p-6" noValidate>
        <h3 className="type-heading-m">Bild hinzufügen</h3>
        <label className="group/drop flex cursor-pointer flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            name="file"
            accept={IMAGE_TYPES}
            className="peer sr-only"
            disabled={full}
            onChange={(e) => {
              setLocalError(null);
              const f = e.target.files?.[0];
              if (tooLarge(f, MAX_IMAGE_BYTES)) {
                setLocalError("Das Bild ist größer als 8 MB.");
                e.target.value = "";
                setFileName(null);
                return;
              }
              setFileName(f?.name ?? null);
            }}
          />
          <span className="type-label-s text-ink">Bilddatei</span>
          <span
            className={cn(
              "flex min-h-28 flex-col items-center justify-center gap-2 rounded-tile border-[1.5px] border-dashed px-4 py-5 text-center transition-[border-color,background-color] duration-fast peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
              fileName ? "border-ink bg-surface-tint" : "border-line-strong bg-surface hover:border-ink hover:bg-surface-tint",
            )}
          >
            <span className={cn("inline-flex size-10 items-center justify-center rounded-full transition-colors", fileName ? "bg-ink text-ink-inverse" : "bg-surface-raised text-ink shadow-raised")}>
              <Icon icon={ImagePlus} />
            </span>
            <span className="max-w-full truncate type-label text-ink">{fileName ?? "Bild auswählen"}</span>
            <span className="type-caption text-ink-muted">JPG, PNG oder WebP, bis 8 MB · {items.length} von 24 Bildern</span>
          </span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="caption"
            label="Bildunterschrift"
            optional
            maxLength={200}
            placeholder="z. B. Shellac in Nude, Kreuzberg"
            error={state && !state.ok && state.fieldErrors?.caption ? proError(state.fieldErrors.caption) : undefined}
          />
          {categories.length > 1 ? (
            <Select name="categoryId" label="Kategorie" optional defaultValue="">
              <option value="">Keine Angabe</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          ) : categories[0] ? (
            <input type="hidden" name="categoryId" value={categories[0].id} />
          ) : null}
        </div>
        <div aria-live="polite">
          {localError ? (
            <Notice kind="danger">{localError}</Notice>
          ) : state && !state.ok && !state.fieldErrors?.caption ? (
            <Notice kind="danger">{state.fieldErrors?.file ?? proError(state.error)}</Notice>
          ) : null}
        </div>
        <Button
          type="submit"
          loading={pending}
          disabled={full || !fileName}
          className="self-start"
          icon={<Icon icon={Upload} />}
          onClick={(e) => {
            if (!fileRef.current?.files?.length) {
              e.preventDefault();
              setLocalError("Bitte wähle zuerst ein Bild aus.");
            }
          }}
        >
          Hochladen
        </Button>
        {full ? <p className="type-caption text-ink-muted">Du hast das Maximum von 24 Bildern erreicht.</p> : null}
      </form>
    </div>
  );
}
