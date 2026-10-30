import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { berlinDateKey } from "@/lib/format";
import type { CatalogLite } from "./search-state";

/**
 * Compact booking prompt for /suche without (or with an unknown) PLZ.
 * A plain GET form: works without JavaScript and keeps the values in the URL.
 */
export function SearchPrompt({
  catalog,
  plz,
  leistung,
  kategorie,
  plzError,
}: {
  catalog: CatalogLite;
  plz?: string | null;
  leistung?: string | null;
  kategorie?: string | null;
  plzError?: string | null;
}) {
  const today = berlinDateKey();
  const tomorrow = berlinDateKey(new Date(Date.now() + 86_400_000));
  return (
    <form action="/suche" method="get" className="flex w-full max-w-form flex-col gap-5 rounded-xs border border-line-strong bg-surface-raised p-5 md:p-6">
      <Input
        label="Wo?"
        name="plz"
        inputMode="numeric"
        autoComplete="postal-code"
        pattern="\d{5}"
        maxLength={5}
        placeholder="Postleitzahl, z. B. 10115"
        defaultValue={plz ?? ""}
        error={plzError}
        required
      />
      <Select label="Was?" name="leistung" defaultValue={leistung ?? kategorie ?? ""}>
        <option value="">Alle Behandlungen</option>
        {catalog.map((c) => (
          <optgroup key={c.slug} label={c.name}>
            <option value={c.slug}>{`${c.name} – alle Leistungen`}</option>
            {c.services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
      <Select label="Wann?" name="datum" defaultValue="">
        <option value="">So bald wie möglich</option>
        <option value={today}>Heute</option>
        <option value={tomorrow}>Morgen</option>
      </Select>
      <Button type="submit" size="l" block iconRight={<Icon icon={ArrowRight} />}>
        Verfügbare Profis anzeigen
      </Button>
    </form>
  );
}
