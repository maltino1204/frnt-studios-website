"use client";

import { Plus } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
        options={[
          { value: "home", label: "Zuhause" },
          { value: "hotel", label: "Hotel" },
          { value: "office", label: "Büro" },
        ]}
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

  return (
    <div className="flex flex-col gap-6">
      {addresses.length ? (
        <ul className="flex flex-col border-t border-line">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-col gap-3 border-b border-line py-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="flex flex-wrap items-center gap-2 type-heading-s">
                  {a.label ?? LOCATION_LABELS[a.kind]}
                  {a.isDefault ? <span className="rounded-full border border-line-strong px-2 py-0.5 type-caption font-normal text-ink">Standard</span> : null}
                </p>
                <p className="type-body-s text-ink">{`${a.street} ${a.houseNumber}`}</p>
                <p className="type-body-s text-ink num">{`${a.postalCode} ${a.city}`}</p>
                {a.details ? <p className="type-caption text-ink-muted">{a.details}</p> : null}
                <p className="type-caption text-ink-muted">{LOCATION_LABELS[a.kind]}</p>
              </div>
              <div className="-ml-3 flex shrink-0 flex-wrap gap-1 sm:ml-0">
                <Button variant="ghost" size="s" onClick={() => setEditing(a)}>
                  Bearbeiten
                </Button>
                {!a.isDefault ? (
                  <Button variant="ghost" size="s" onClick={() => makeDefault(a)} disabled={pending}>
                    Als Standard
                  </Button>
                ) : null}
                <Button variant="ghost" size="s" onClick={() => setDeleting(a)} className="text-danger">
                  Löschen
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Noch keine Adressen.">Speichern Sie Zuhause, Hotel oder Büro – beim nächsten Termin wählen Sie mit einem Tipp.</EmptyState>
      )}
      <Button variant="secondary" icon={<Icon icon={Plus} />} onClick={() => setEditing("new")} className="self-start" disabled={addresses.length >= 20}>
        Adresse hinzufügen
      </Button>

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
