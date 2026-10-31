"use client";

import { BedDouble, Building2, House, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { Checkbox, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { SegmentedControl } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction } from "@/server/actions/account";
import { initialActionState } from "@/server/actions/types";
import type { AddressDTO, LocationKind } from "@/server/dto";
import { LOCATION_LABELS } from "./checkout-format";
import { keepValuesOnSubmit } from "./keep-values";

const KIND_ICON = { home: House, hotel: BedDouble, office: Building2, other: MapPin } as const;

function AddressForm({ address, onDone, isFirst }: { address: AddressDTO | null; onDone: () => void; isFirst: boolean }) {
  const [state, action, pending] = useActionState(saveAddressAction, initialActionState);
  const [kind, setKind] = useState<LocationKind>(address?.kind === "other" ? "home" : (address?.kind ?? "home"));
  const toast = useToast();
  const handled = useRef<unknown>(null);
  useEffect(() => {
    if (state?.ok && handled.current !== state) {
      handled.current = state;
      toast.show(state.message ?? "Adresse gespeichert.");
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to a new action result only
  }, [state]);
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  // Field errors we can show next to a field; anything else goes into the notice.
  const shownOnField = !!fe && ["label", "street", "houseNumber", "postalCode", "city", "details"].some((k) => fe[k]);
  return (
    // Submitted without React's form reset (N5): every typed value survives a server error.
    <form action={action} onSubmit={keepValuesOnSubmit(action)} noValidate className="flex flex-col gap-5">
      {address ? <input type="hidden" name="id" value={address.id} /> : null}
      <SegmentedControl
        name="kind"
        label="Art des Ortes"
        value={kind}
        onChange={(v) => setKind(v as LocationKind)}
        options={(["home", "hotel", "office"] as const).map((k) => ({
          value: k,
          label: (
            <span className="inline-flex items-center gap-1.5">
              <Icon icon={KIND_ICON[k]} size={16} className="hidden min-[360px]:block" />
              {LOCATION_LABELS[k]}
            </span>
          ),
        }))}
      />
      <Input label="Bezeichnung" name="label" optional placeholder={`z. B. ${LOCATION_LABELS[kind]}`} defaultValue={address?.label ?? ""} maxLength={60} error={fe?.label} />
      <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-3">
        <Input label="Straße" name="street" autoComplete="address-line1" defaultValue={address?.street ?? ""} error={fe?.street} required />
        <Input label="Nr." name="houseNumber" autoComplete="address-line2" defaultValue={address?.houseNumber ?? ""} error={fe?.houseNumber} required />
      </div>
      <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
        <Input label="PLZ" name="postalCode" inputMode="numeric" autoComplete="postal-code" maxLength={5} defaultValue={address?.postalCode ?? ""} error={fe?.postalCode} required />
        <Input label="Ort" name="city" autoComplete="address-level2" defaultValue={address?.city ?? ""} error={fe?.city} required />
      </div>
      <Input
        label={kind === "hotel" ? "Hotel, Zimmer, Rezeption" : kind === "office" ? "Firma, Empfang oder Etage" : "Etage, Klingelname"}
        name="details"
        optional
        maxLength={300}
        defaultValue={address?.details ?? ""}
        error={fe?.details}
      />
      {!isFirst ? <Checkbox name="isDefault" label="Als Standardadresse verwenden" defaultChecked={address?.isDefault ?? false} /> : null}
      {state && !state.ok && !shownOnField ? <Notice kind="danger">{state.error}</Notice> : null}
      <SubmitButton size="l" block loading={pending}>
        Adresse speichern
      </SubmitButton>
    </form>
  );
}

/** Address book: list, add / edit in a sheet, delete with confirmation, set default. */
export function AddressManager({ addresses }: { addresses: AddressDTO[] }) {
  const [editing, setEditing] = useState<AddressDTO | "new" | null>(null);
  const [deleting, setDeleting] = useState<AddressDTO | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();

  const remove = () => {
    if (!deleting) return;
    start(async () => {
      const r = await deleteAddressAction(deleting.id);
      toast.show(r.ok ? (r.message ?? "Adresse gelöscht.") : r.error, { kind: r.ok ? "success" : "error" });
      setDeleting(null);
    });
  };
  const makeDefault = (a: AddressDTO) =>
    start(async () => {
      const r = await setDefaultAddressAction(a.id);
      toast.show(r.ok ? `${a.label ?? LOCATION_LABELS[a.kind]} ist jetzt Ihre Standardadresse.` : r.error, { kind: r.ok ? "success" : "error" });
    });

  const full = addresses.length >= 20;
  return (
    <div className="flex flex-col gap-6">
      {!addresses.length ? (
        <div className="rounded-card bg-surface-raised px-5 shadow-raised md:px-7">
          <EmptyState title="Noch keine Adressen." seed="konto-adressen" className="py-8">
            Speichern Sie Zuhause, Hotel oder Büro – beim nächsten Termin wählen Sie mit einem Tipp.
          </EmptyState>
        </div>
      ) : null}
      <ul className="grid gap-3 md:grid-cols-2 md:gap-4">
        {addresses.map((a) => (
          <li key={a.id} className="flex min-w-0 flex-col gap-4 rounded-card bg-surface-raised p-4 shadow-raised md:p-5">
            <div className="flex min-w-0 items-start gap-3.5">
              <span
                aria-hidden
                className={a.isDefault ? "inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-ink-inverse shadow-ink" : "inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink"}
              >
                <Icon icon={KIND_ICON[a.kind]} size={18} />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="flex flex-wrap items-center gap-2 type-heading-s">
                  {a.label ?? LOCATION_LABELS[a.kind]}
                  {a.isDefault ? (
                    <Badge size="s" tone="accent" dot>
                      Standard
                    </Badge>
                  ) : null}
                </p>
                <p className="type-body-s text-ink">{`${a.street} ${a.houseNumber}`}</p>
                <p className="type-body-s text-ink num">{`${a.postalCode} ${a.city}`}</p>
                {a.details ? <p className="line-clamp-2 type-caption text-ink-muted">{a.details}</p> : null}
                {a.label && a.label !== LOCATION_LABELS[a.kind] ? <p className="type-caption text-ink-muted">{LOCATION_LABELS[a.kind]}</p> : null}
              </div>
            </div>
            <div className="mt-auto -mb-1 -ml-2 flex items-center gap-1 border-t border-line pt-3">
              <Button variant="ghost" size="s" onClick={() => setEditing(a)} icon={<Icon icon={Pencil} />}>
                Bearbeiten
              </Button>
              {!a.isDefault ? (
                <Button variant="ghost" size="s" onClick={() => makeDefault(a)} disabled={pending} icon={<Icon icon={Star} />}>
                  Als Standard
                </Button>
              ) : null}
              <IconButton label="Löschen" onClick={() => setDeleting(a)} className="-mr-2.5 ml-auto text-danger hover:bg-danger-soft active:bg-danger-soft">
                <Icon icon={Trash2} size={18} />
              </IconButton>
            </div>
          </li>
        ))}
        <li className="flex">
          <button
            type="button"
            onClick={() => setEditing("new")}
            disabled={full}
            className="group flex min-h-32 w-full flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line-strong bg-surface-raised/50 p-5 text-ink transition-[background-color,border-color,box-shadow] duration-base pressable focus-ring hover:border-ink-muted hover:bg-surface-raised hover:shadow-raised disabled:text-ink-disabled"
          >
            <span aria-hidden className="inline-flex size-11 items-center justify-center rounded-full bg-ink text-ink-inverse shadow-ink transition-[scale] duration-spring ease-spring group-hover:scale-105 group-disabled:bg-surface-sunken group-disabled:text-ink-disabled group-disabled:shadow-none">
              <Icon icon={Plus} size={20} />
            </span>
            <span className="type-label">Adresse hinzufügen</span>
            <span className="type-caption text-ink-muted">{full ? "Höchstens 20 Adressen." : "Zuhause, Hotel oder Büro"}</span>
          </button>
        </li>
      </ul>

      {editing ? (
        <Sheet open onClose={() => setEditing(null)} title={editing === "new" ? "Neue Adresse" : "Adresse bearbeiten"}>
          <AddressForm address={editing === "new" ? null : editing} onDone={() => setEditing(null)} isFirst={addresses.length === 0} />
        </Sheet>
      ) : null}
      {deleting ? (
        <Modal
          open
          onClose={() => setDeleting(null)}
          title="Adresse löschen?"
          actions={
            <>
              <Button variant="ghost" onClick={() => setDeleting(null)}>
                Behalten
              </Button>
              <Button variant="destructive" onClick={remove} loading={pending}>
                Löschen
              </Button>
            </>
          }
        >
          {`${deleting.street} ${deleting.houseNumber}, ${deleting.postalCode} ${deleting.city}. Gebuchte Termine behalten ihre Adresse.`}
        </Modal>
      ) : null}
    </div>
  );
}
