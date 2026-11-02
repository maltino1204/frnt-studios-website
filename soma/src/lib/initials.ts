/** Up to two initials of a name ("Leyla Doğan" → "LD"), "·" when there are none. Shared by server and client portraits. */
export function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\s.-]/gu, "").split(/[\s.-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "·";
}
