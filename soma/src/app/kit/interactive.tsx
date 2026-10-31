"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SuccessCheck } from "@/components/ui/success";
import { CountUp } from "@/components/ui/motion";
import { haptic } from "@/lib/haptic";
import { DateStrip, TimeSlots } from "@/components/ui/booking";
import { Sheet } from "@/components/ui/sheet";
import { Modal } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { berlinDateKey } from "@/lib/format";

export function KitInteractive() {
  const now = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now.getTime() + i * 86400000);
    return { key: berlinDateKey(d), date: d, available: i % 5 !== 3 };
  });
  const [day, setDay] = useState<string | null>(days[0]!.key);
  const [slot, setSlot] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [earned, setEarned] = useState(4820);
  const toast = useToast();
  const base = new Date(`${day}T08:00:00+01:00`).getTime();
  const slots = [0, 1, 2, 5, 6, 9, 10, 11].map((h) => ({ start: new Date(base + h * 3600000).toISOString() }));
  return (
    <div className="flex flex-col gap-5">
      <DateStrip days={days} selected={day} onSelect={setDay} />
      <TimeSlots slots={slots} selected={slot} onSelect={setSlot} />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setSheet(true)}>Sheet öffnen</Button>
        <Button variant="secondary" onClick={() => setModal(true)}>Dialog</Button>
        <Button variant="secondary" onClick={() => toast.show("Termin gespeichert.")}>Toast</Button>
        <Button
          loading={busy}
          onClick={() => {
            setBusy(true);
            window.setTimeout(() => {
              setBusy(false);
              setDone((n) => n + 1);
              haptic("success");
            }, 1200);
          }}
        >
          Anfrage annehmen
        </Button>
      </div>
      {done ? (
        <div key={done} className="flex items-center gap-3">
          <SuccessCheck size={44} />
          <p className="type-heading-m">Bestätigt.</p>
          <span className="rounded-full bg-surface-sunken px-3 py-1 type-caption">Nachbar</span>
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        <p className="type-stat" data-testid="kit-countup">
          <CountUp value={earned} suffix=" €" />
        </p>
        <Button size="s" variant="secondary" onClick={() => setEarned((v) => v + 250)}>
          +250 €
        </Button>
      </div>
      <Sheet open={sheet} onClose={() => setSheet(false)} title="Behandlung wählen" footer={<Button block size="l" onClick={() => setSheet(false)}>Übernehmen</Button>}>
        <p className="type-body-s text-ink-muted">Inhalt des Sheets.</p>
      </Sheet>
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Termin stornieren?"
        actions={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>Behalten</Button>
            <Button variant="destructive" onClick={() => setModal(false)}>Kostenlos stornieren</Button>
          </>
        }
      >
        Bis Mittwoch, 18:30 Uhr ist die Stornierung kostenlos.
      </Modal>
    </div>
  );
}
