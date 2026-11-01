/**
 * The ten chapters of the landing page (docs/landing/LANDING_DESIGN_SPEC.md § 5.1): the single source of truth for
 * the section ids, the chapter index, the overlay, the dock label and the motion layer's chapter events.
 */
export type ChapterTone = "bone" | "stone" | "night" | "linen" | "oxblood";
export type HeaderTheme = "light" | "dark";

export type ChapterDef = {
  n: number;
  /** "01" … "10" (data-chapter, data-chapter-label, html[data-chapter-active]) */
  nn: string;
  id: string;
  /** navigation name (copy deck § 0.2) */
  name: string;
  tone: ChapterTone;
  headerTheme: HeaderTheme;
};

const pad = (n: number) => String(n).padStart(2, "0");

const DEFS: Array<Omit<ChapterDef, "nn">> = [
  { n: 1, id: "bei-dir", name: "Bei dir", tone: "bone", headerTheme: "light" },
  { n: 2, id: "idee", name: "Idee", tone: "bone", headerTheme: "light" },
  { n: 3, id: "behandlungen", name: "Behandlungen", tone: "bone", headerTheme: "light" },
  { n: 4, id: "so-funktionierts", name: "Ablauf", tone: "stone", headerTheme: "light" },
  { n: 5, id: "dein-ort", name: "Dein Ort", tone: "night", headerTheme: "dark" },
  { n: 6, id: "profis", name: "Profis", tone: "bone", headerTheme: "light" },
  { n: 7, id: "deine-buchung", name: "Deine Buchung", tone: "linen", headerTheme: "light" },
  // The photo band inside 08 declares its own data-header-theme="dark"; the chapter itself ends on Bone.
  { n: 8, id: "fuer-profis", name: "Für Profis", tone: "bone", headerTheme: "light" },
  { n: 9, id: "fragen", name: "Fragen", tone: "bone", headerTheme: "light" },
  { n: 10, id: "soma", name: "SOMA", tone: "oxblood", headerTheme: "dark" },
];

export const CHAPTERS: readonly ChapterDef[] = DEFS.map((c) => ({ ...c, nn: pad(c.n) }));

export function chapterByN(n: number): ChapterDef {
  const c = CHAPTERS[n - 1];
  if (!c) throw new Error(`Unknown landing chapter ${n}`);
  return c;
}

/** The chapter after n (for "Weiter: {name}"), or null after the last one. */
export function nextChapter(n: number): ChapterDef | null {
  return CHAPTERS[n] ?? null;
}

/** The id of a chapter's heading (`aria-labelledby`, focus target of chapter jumps). */
export const titleId = (id: string) => `${id}-titel`;
