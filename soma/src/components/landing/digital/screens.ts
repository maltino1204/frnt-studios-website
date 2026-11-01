/**
 * Chapter 07 screens (spec § 4.7, asset A4): full-page captures of the live demo app at 390 px (DPR 2), made by
 * `scripts/landing/capture-screens.mjs`, which also measures the callout regions and writes `screens.generated.json`.
 * Re-run the script on every UI change of those pages.
 */
import generated from "./screens.generated.json";

export type ScreenId = "suche" | "buchung" | "termine" | "favoriten";
/** A callout region in the capture's CSS px (390 wide). */
export type Region = { x: number; y: number; w: number; h: number };
export type ScreenFile = { id: ScreenId; src: string; width: number; height: number; regions: Record<string, Region> };

export type Callout = {
  id: string;
  /** deck § 07 */
  title: string;
  line: string;
  screen: ScreenId;
  /** ✎ describes the region, never demo values */
  alt: string;
};

export const SCREENS = generated as unknown as Partial<Record<ScreenId, ScreenFile>>;

export const CALLOUTS: readonly Callout[] = [
  { id: "endpreis", title: "Endpreis", line: "Inklusive Anfahrt, bevor du buchst.", screen: "suche", alt: "Ausschnitt aus der Suche: der Endpreis eines Profis inklusive Anfahrt" },
  { id: "stornofrist", title: "Stornofrist", line: "Mit Datum und Uhrzeit, nicht im Kleingedruckten.", screen: "buchung", alt: "Ausschnitt aus der Buchung: die Frist für die kostenlose Stornierung" },
  { id: "startcode", title: "Start-Code", line: "Vier Ziffern, mit denen dein Termin beginnt.", screen: "buchung", alt: "Ausschnitt aus der Buchung: der Start-Code" },
  { id: "kalender", title: "Kalender", line: "Dein Termin mit einem Tipp im Kalender.", screen: "buchung", alt: "Ausschnitt aus der Buchung: „Zum Kalender hinzufügen“" },
  { id: "erneut", title: "Erneut buchen", line: "Profi und Behandlung sind schon gewählt – du wählst nur die Uhrzeit.", screen: "termine", alt: "Ausschnitt aus den Terminen: „Erneut buchen“ bei einem vergangenen Termin" },
  { id: "favoriten", title: "Favoriten", line: "Deine Profis, gespeichert für das nächste Mal.", screen: "favoriten", alt: "Ausschnitt aus den Favoriten: die gespeicherten Profis" },
];

/** Callouts whose screen and region were captured; the chapter shows only these (no placeholder screens). */
export function availableCallouts(): Array<Callout & { file: ScreenFile; region: Region }> {
  return CALLOUTS.flatMap((c) => {
    const file = SCREENS[c.screen];
    const region = file?.regions[c.id];
    return file && region ? [{ ...c, file, region }] : [];
  });
}
