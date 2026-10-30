import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";

/** Asks for the PLZ when /buchen is opened without one (plain GET form, keeps the slot in the URL). */
export function CheckoutPlzForm({
  angebot,
  start,
  einladung,
  von,
  error,
  initial,
}: {
  angebot: string;
  start: string;
  einladung?: string | null;
  von?: string | null;
  error?: string | null;
  initial?: string | null;
}) {
  return (
    <form action="/buchen" method="get" className="flex flex-col gap-4">
      <input type="hidden" name="angebot" value={angebot} />
      <input type="hidden" name="start" value={start} />
      {einladung ? <input type="hidden" name="einladung" value={einladung} /> : null}
      {von ? <input type="hidden" name="von" value={von} /> : null}
      <Input
        label="Postleitzahl"
        name="plz"
        inputMode="numeric"
        autoComplete="postal-code"
        pattern="\d{5}"
        maxLength={5}
        required
        placeholder="z. B. 10115"
        defaultValue={initial ?? ""}
        error={error}
      />
      <Button type="submit" size="l" block iconRight={<Icon icon={ArrowRight} />}>
        Weiter
      </Button>
    </form>
  );
}
