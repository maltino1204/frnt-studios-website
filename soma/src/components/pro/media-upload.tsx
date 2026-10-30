"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash, Upload } from "lucide-react";
import { Avatar, Portrait } from "@/components/ui/avatar";
import { Button, IconButton } from "@/components/ui/button";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Photo } from "@/components/ui/photo";
import { useToast } from "@/components/ui/toast";
import { uploadAvatarAction } from "@/server/actions/account";
import { deletePortfolioItemAction, uploadPortfolioImageAction } from "@/server/actions/pro";
import type { PortfolioItemDTO } from "@/server/dto";

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
      <div className="w-24 shrink-0">
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
          <span className="inline-flex h-control items-center gap-2 rounded-xs border border-ink px-5 type-label text-ink transition-colors hover:bg-surface-sunken peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus">
            <Icon icon={Upload} />
            {pending ? "Wird hochgeladen …" : avatarUrl ? "Foto ändern" : "Foto hochladen"}
          </span>
        </label>
        <p className="type-caption text-ink-muted">JPG, PNG oder WebP, bis 8 MB. Ein helles Porträt, Gesicht gut erkennbar.</p>
        <div aria-live="polite">
          {localError || (state && !state.ok) ? <p className="type-caption text-danger">{localError ?? (state && !state.ok ? state.fieldErrors?.file ?? state.error : "")}</p> : null}
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
      if (!res.ok) return toast.show(res.error, { kind: "error" });
      toast.show("Bild entfernt.");
      router.refresh();
    });
  };

  const full = items.length >= 24;

  return (
    <div className="flex flex-col gap-6">
      {items.length ? (
        <ul className="grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-6" aria-label="Portfolio">
          {items.map((it) => (
            <li key={it.id} className="group relative">
              <Photo src={it.url} alt={it.caption ?? "Portfolio-Bild"} tone={catSlug(it.categoryId)} sizes="(min-width: 1024px) 160px, 33vw" ratio="1/1" />
              <IconButton
                label={`Bild${it.caption ? ` „${it.caption}“` : ""} entfernen`}
                onClick={() => remove(it.id)}
                disabled={deleting && deletingId === it.id}
                className="absolute top-1 right-1 bg-surface-raised/95 hover:bg-surface-raised"
              >
                <Icon icon={Trash} size={18} />
              </IconButton>
              {it.caption ? <p className="truncate px-1 py-1.5 type-caption text-ink-muted">{it.caption}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState className="py-2!" title="Noch kein Portfolio.">
          Zeig {minRecommended} oder mehr Arbeiten – Nägel, Make-up oder dein Set-up vor Ort. Profile mit Bildern werden deutlich häufiger gebucht.
        </EmptyState>
      )}

      <form ref={formRef} action={action} className="flex flex-col gap-4 border border-line bg-surface-raised p-5" noValidate>
        <h3 className="type-heading-s">Bild hinzufügen</h3>
        <label className="flex cursor-pointer flex-col items-start gap-2">
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
          <span className="inline-flex h-control items-center gap-2 rounded-xs border border-line-strong bg-surface px-4 type-label text-ink transition-colors hover:border-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus">
            <Icon icon={ImagePlus} />
            {fileName ?? "Bild auswählen"}
          </span>
          <span className="type-caption text-ink-muted">JPG, PNG oder WebP, bis 8 MB · {items.length} von 24 Bildern</span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="caption" label="Bildunterschrift" optional maxLength={200} placeholder="z. B. Shellac in Nude, Kreuzberg" />
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
          {localError ? <Notice kind="danger">{localError}</Notice> : state && !state.ok ? <Notice kind="danger">{state.fieldErrors?.file ?? state.error}</Notice> : null}
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
