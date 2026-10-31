"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Braces, ExternalLink, ListChecks, Minus, Plus } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Input, Switch, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { upsertContentBlockAction } from "@/server/actions/admin";
import { useMutation } from "./use-mutation";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

const LABELS: Record<string, string> = {
  title: "Titel",
  subtitle: "Untertitel",
  eyebrow: "Überzeile",
  cta: "Button-Text",
  body: "Text",
  text: "Text",
  active: "Aktiv",
  items: "Einträge",
  steps: "Schritte",
  q: "Frage",
  a: "Antwort",
  href: "Link",
  label: "Bezeichnung",
};
const label = (k: string) => LABELS[k] ?? k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, " ");

/** Spa clichés and healing claims the brand voice excludes (design-guideline §3, HWG). Soft check only. */
const FLAGGED = ["Auszeit", "Oase", "Seele baumeln", "Me-Time", "heilt", "Heilung", "therapeutisch", "Schmerzen lindern", "!"];

function isPlainObject(v: unknown): v is Record<string, Json> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function blankLike(v: Json): Json {
  if (typeof v === "string") return "";
  if (typeof v === "number") return 0;
  if (typeof v === "boolean") return false;
  if (Array.isArray(v)) return [];
  if (isPlainObject(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blankLike(x)]));
  return null;
}
function collectText(v: Json, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => collectText(x, out));
  else if (isPlainObject(v)) Object.values(v).forEach((x) => collectText(x, out));
  return out;
}

/** Structured editor for one content block, with a raw JSON mode and a preview link. */
export function ContentEditor({ blockKey, value: initial, previewHref }: { blockKey: string; value: unknown; previewHref: string | null }) {
  const [value, setValue] = useState<Json>((initial ?? {}) as Json);
  const [mode, setMode] = useState<"form" | "json">(isPlainObject(initial) ? "form" : "json");
  const [raw, setRaw] = useState(JSON.stringify(initial ?? {}, null, 2));
  const [rawError, setRawError] = useState<string | null>(null);
  const m = useMutation(upsertContentBlockAction, { success: "Inhalt gespeichert. Er ist sofort live." });
  const dirty = JSON.stringify(value) !== JSON.stringify(initial);
  const flagged = useMemo(() => {
    const text = collectText(value).join(" ");
    return FLAGGED.filter((w) => text.toLowerCase().includes(w.toLowerCase()));
  }, [value]);

  const switchMode = () => {
    if (mode === "form") {
      setRaw(JSON.stringify(value, null, 2));
      setRawError(null);
      setMode("json");
    } else {
      try {
        const parsed = JSON.parse(raw) as Json;
        setValue(parsed);
        setRawError(null);
        if (isPlainObject(parsed)) setMode("form");
        else setRawError("Formularansicht gibt es nur für Objekte. Bitte im JSON-Modus bearbeiten.");
      } catch (e) {
        setRawError(`Ungültiges JSON: ${(e as Error).message}`);
      }
    }
  };

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        let next = value;
        if (mode === "json") {
          try {
            next = JSON.parse(raw) as Json;
            setValue(next);
            setRawError(null);
          } catch (err) {
            setRawError(`Ungültiges JSON: ${(err as Error).message}`);
            return;
          }
        }
        m.run({ key: blockKey, value: next });
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="code-ref text-ink-muted">{blockKey}</p>
        <div className="flex flex-wrap items-center gap-2">
          {previewHref ? (
            <ButtonLink href={previewHref} target="_blank" size="s" variant="ghost" icon={<Icon icon={ExternalLink} size={16} />}>
              Vorschau
            </ButtonLink>
          ) : null}
          <Button size="s" variant="ghost" onClick={switchMode} icon={<Icon icon={mode === "form" ? Braces : ListChecks} size={16} />}>
            {mode === "form" ? "Als JSON bearbeiten" : "Formularansicht"}
          </Button>
        </div>
      </div>

      {mode === "form" && isPlainObject(value) ? (
        <ObjectFields value={value} onChange={setValue} path={blockKey} />
      ) : (
        <Textarea
          label="JSON"
          rows={18}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          error={rawError}
          className="[&_textarea]:font-mono [&_textarea]:text-[13px]"
          spellCheck={false}
          hint="Gültiges JSON. Felder, die die Website nicht kennt, werden ignoriert."
        />
      )}

      {flagged.length ? (
        <Notice kind="warning" title="Bitte Formulierung prüfen">
          Gefunden: {flagged.map((w) => `„${w}“`).join(", ")}. SOMA verzichtet auf Spa-Klischees, Ausrufezeichen und Heilversprechen (HWG).
        </Notice>
      ) : null}
      {m.error ? <Notice kind="danger">{m.error}</Notice> : null}

      <div className="flex items-center gap-3 border-t border-line pt-4">
        <Button type="submit" size="s" loading={m.pending} disabled={!dirty && mode === "form"}>
          Speichern
        </Button>
        {dirty ? (
          <Button
            size="s"
            variant="ghost"
            onClick={() => {
              setValue((initial ?? {}) as Json);
              setRaw(JSON.stringify(initial ?? {}, null, 2));
              setRawError(null);
            }}
          >
            Änderungen verwerfen
          </Button>
        ) : (
          <span className="type-caption text-ink-muted">Keine ungespeicherten Änderungen.</span>
        )}
      </div>
    </form>
  );
}

function ObjectFields({ value, onChange, path }: { value: Record<string, Json>; onChange: (v: Record<string, Json>) => void; path: string }) {
  return (
    <div className="flex flex-col gap-4">
      {Object.entries(value).map(([k, v]) => (
        <Field key={k} name={k} value={v} path={`${path}.${k}`} onChange={(nv) => onChange({ ...value, [k]: nv })} />
      ))}
    </div>
  );
}

function Field({ name, value, onChange, path }: { name: string; value: Json; onChange: (v: Json) => void; path: string }) {
  if (typeof value === "boolean") {
    return <Switch label={label(name)} checked={value} onChange={(e) => onChange(e.target.checked)} />;
  }
  if (typeof value === "number") {
    return <Input dense label={label(name)} inputMode="decimal" value={String(value)} onChange={(e) => onChange(Number(e.target.value.replace(",", ".")) || 0)} />;
  }
  if (typeof value === "string") {
    const long = value.length > 70 || value.includes("\n") || ["body", "a", "subtitle", "text", "description"].includes(name);
    return long ? (
      <Textarea label={label(name)} value={value} rows={Math.min(8, Math.max(3, Math.ceil(value.length / 70)))} onChange={(e) => onChange(e.target.value)} hint={`${value.length} Zeichen`} />
    ) : (
      <Input dense label={label(name)} value={value} onChange={(e) => onChange(e.target.value)} hint={name === "title" ? `${value.length} Zeichen · kurze Aussage mit Punkt` : undefined} />
    );
  }
  if (Array.isArray(value) && (value.length === 0 || value.every(isPlainObject))) {
    return <ObjectList name={name} items={value as Record<string, Json>[]} onChange={onChange} path={path} />;
  }
  return (
    <Textarea
      label={`${label(name)} (JSON)`}
      rows={4}
      defaultValue={JSON.stringify(value, null, 2)}
      className="[&_textarea]:font-mono [&_textarea]:text-[13px]"
      onBlur={(e) => {
        try {
          onChange(JSON.parse(e.target.value) as Json);
        } catch {
          /* keep previous value until valid */
        }
      }}
    />
  );
}

function ObjectList({ name, items, onChange, path }: { name: string; items: Record<string, Json>[]; onChange: (v: Json) => void; path: string }) {
  const template = items[0] ? (blankLike(items[0]) as Record<string, Json>) : { title: "", body: "" };
  const move = (i: number, d: -1 | 1) => {
    const next = [...items];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    onChange(next);
  };
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="pb-2 type-label-s text-ink">
        {label(name)} <span className="font-normal text-ink-muted num">({items.length})</span>
      </legend>
      <ol className="flex flex-col gap-2">
        {items.map((it, i) => (
          <li key={i} className="flex flex-col gap-3 rounded-tile bg-surface-sunken/50 px-4 py-3 ring-1 ring-line ring-inset">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-surface-raised type-caption font-[600] text-ink-muted shadow-raised num">{i + 1}</span>
              <span className="flex items-center gap-1">
                <Button size="s" variant="ghost" aria-label={`Eintrag ${i + 1} nach oben`} disabled={i === 0} onClick={() => move(i, -1)} icon={<Icon icon={ArrowUp} size={16} />} />
                <Button size="s" variant="ghost" aria-label={`Eintrag ${i + 1} nach unten`} disabled={i === items.length - 1} onClick={() => move(i, 1)} icon={<Icon icon={ArrowDown} size={16} />} />
                <Button size="s" variant="ghost" aria-label={`Eintrag ${i + 1} entfernen`} onClick={() => onChange(items.filter((_, j) => j !== i))} icon={<Icon icon={Minus} size={16} />} />
              </span>
            </div>
            <ObjectFields value={it} path={`${path}.${i}`} onChange={(nv) => onChange(items.map((x, j) => (j === i ? nv : x)))} />
          </li>
        ))}
      </ol>
      <div>
        <Button size="s" variant="ghost" icon={<Icon icon={Plus} size={16} />} onClick={() => onChange([...items, template])}>
          Eintrag hinzufügen
        </Button>
      </div>
    </fieldset>
  );
}
