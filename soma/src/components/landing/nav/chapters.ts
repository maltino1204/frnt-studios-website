/**
 * The seven chapters of the landing page (docs/landing/LANDING_DESIGN_SPEC.md § 0.1 v2 structure, § 5.1): the single
 * source of truth for the section ids, the chapter index, the overlay, the static no-JS list, the dock label and the
 * motion layer's chapter events. v2 (client decision 2026-11-02) removed Idee, Dein Ort and Deine Buchung.
 */
export type ChapterTone = "bone" | "stone" | "oxblood";
export type HeaderTheme = "light" | "dark";

export type ChapterDef = {
  n: number;
  /** "01" … "07" (data-chapter, data-chapter-label, html[data-chapter-active]) */
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
  { n: 2, id: "behandlungen", name: "Behandlungen", tone: "bone", headerTheme: "light" },
  { n: 3, id: "so-funktionierts", name: "So funktioniert’s", tone: "stone", headerTheme: "light" },
  { n: 4, id: "profis", name: "Profis", tone: "bone", headerTheme: "light" },
  // From 1024 the photo band inside 05 declares its own data-header-theme="dark"; below, the chapter is Bone.
  { n: 5, id: "fuer-profis", name: "Für Profis", tone: "bone", headerTheme: "light" },
  { n: 6, id: "fragen", name: "Fragen", tone: "bone", headerTheme: "light" },
  { n: 7, id: "soma", name: "SOMA", tone: "oxblood", headerTheme: "dark" },
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
