import { describe, expect, it } from "vitest";
import { findContactDetails, hasContactDetails } from "@/server/domain/content-lint";

const kinds = (t: string) => findContactDetails(t).map((f) => f.kind).sort();

describe("contact lint (R7)", () => {
  it("finds German phone numbers in common notations", () => {
    for (const t of [
      "Ruf mich an: 0170 1234567",
      "Tel. 0170-123 45 67",
      "+49 170 1234567",
      "+49 (0) 170 / 123 45 67",
      "0049 30 12345678",
      "030/12345678",
      "Handy:01701234567",
    ]) expect(kinds(t)).toContain("phone");
  });
  it("finds e-mails, handles, URLs, domains and messenger mentions", () => {
    expect(kinds("schreib an linh@example.com")).toEqual(["email"]);
    expect(kinds("Insta @linh.nails")).toEqual(["handle", "messenger"]);
    expect(kinds("folgt mir @linh_nails")).toEqual(["handle"]);
    expect(kinds("mehr auf https://linh-nails.de/preise")).toContain("url");
    expect(kinds("Website: www.linh-nails.de")).toContain("url");
    expect(kinds("besuch linhnails.de")).toEqual(["url"]);
    expect(kinds("gern per WhatsApp")).toEqual(["messenger"]);
    expect(kinds("Termine auch über Instagram")).toEqual(["messenger"]);
    expect(kinds("Ruf mich an: 0170 1234567 oder linh@example.com, Insta @linh.nails")).toEqual(["email", "handle", "messenger", "phone"]);
  });
  it("does not flag ordinary wellness texts, prices, times, PLZ or durations", () => {
    for (const t of [
      "Seit 2009 massiere ich in Berlin – 60, 90 oder 120 Minuten, ab 89 € inkl. Anfahrt.",
      "Termine Mo–Fr 09:00–18:00, Sa 10:00–14:00. Einsatzgebiet 10405 und Umgebung (12 km).",
      "Preise: 1.234,56 € für das Paket, 3. OG links, Klingel Hartmann.",
      "Danke für die schöne Massage, bis bald im Mai 2026!",
      "Bitte zweimal klingeln, Parkplatz im Hof (Nr. 12).",
    ]) expect(findContactDetails(t)).toEqual([]);
    expect(hasContactDetails(null)).toBe(false);
  });
});
