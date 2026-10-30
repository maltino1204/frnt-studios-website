import "server-only";

/**
 * Heilmittelwerbegesetz (HWG) guard for provider texts: SOMA sells wellness,
 * not therapy. Finds healing / medical claims and protected titles in bios
 * and headlines. Pure; heuristic by design (admins review the rest).
 */
const PATTERNS: Array<{ re: RegExp; hint: string }> = [
  { re: /\bheil(t|en|ung|end|wirkung)\w*/i, hint: "Heilversprechen" },
  { re: /\blinder(t|n|ung)\w*/i, hint: "Linderungsversprechen" },
  { re: /therap(ie|ien|eut|eutin|eutisch)\w*/i, hint: "Therapie" },
  { re: /\bphysiotherap\w*/i, hint: "geschützter Berufstitel" },
  { re: /\bpodolog\w*/i, hint: "geschützter Berufstitel" },
  { re: /\bmedizinisch\w*/i, hint: "medizinische Aussage" },
  { re: /(schmerz|krankheit|beschwerden)\w*/i, hint: "Krankheitsbezug" },
  { re: /\b(masseur und medizinischer bademeister|med\.\s*bademeister|medizinische fußpflege)\b/i, hint: "geschützter Berufstitel" },
];

export interface HealthClaim {
  match: string;
  hint: string;
}

export function findHealthClaims(text: string | null | undefined): HealthClaim[] {
  if (!text) return [];
  const found: HealthClaim[] = [];
  for (const p of PATTERNS) {
    const m = p.re.exec(text);
    if (m) found.push({ match: m[0], hint: p.hint });
  }
  return found;
}
