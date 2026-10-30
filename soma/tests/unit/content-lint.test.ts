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

describe("contact lint hardening (audit-2 N3, inputs from §7)", () => {
  it("still refuses the inputs audit 2 confirmed", () => {
    for (const t of [
      "0170 1234567",
      "+49 170 1234567",
      "0170/123 45 67",
      "0 1 7 0 1 2 3 4 5 6 7",
      "linh@example.com",
      "@linh.nails",
      "www.linh-nails.de",
      "linh-nails.de",
      "WhatsApp",
      "Insta … linhnails",
      "Signal: 0170 1234567",
    ]) expect(hasContactDetails(t), t).toBe(true);
  });

  it("closes the bypasses: spelled e-mails, letter O, no leading 0, format characters, full-width digits, IG, Instagramm", () => {
    const cases: Array<[string, string]> = [
      ["null eins sieben null, eins zwei drei vier fünf sechs sieben", "phone"],
      ["linh at gmail dot com", "email"],
      ["linh (at) gmail (punkt) com", "email"],
      ["linh [at] gmx [dot] de", "email"],
      ["schreib an linh ät web punkt de", "email"],
      ["O17O 1234567", "phone"],
      ["o170 1234567", "phone"],
      ["1701234567", "phone"],
      ["170 1234567", "phone"],
      ["Ruf an: 0170\u20601234567", "phone"],
      ["0\u200b1\u200b7\u200b0 1234567", "phone"],
      ["\uff10\uff11\uff17\uff10 \uff11\uff12\uff13\uff14\uff15\uff16\uff17", "phone"],
      ["linh\uff20example.com", "email"],
      ["IG: linh.nails", "messenger"],
      ["mehr auf IG", "messenger"],
      ["linh.nails auf Instagramm", "messenger"],
      ["such mich auf insta", "messenger"],
      ["Videos auf TikTok", "messenger"],
      ["Schreib mir per Telegram", "messenger"],
      ["Am besten per Signal", "messenger"],
      ["Signal-Nummer gern auf Anfrage", "messenger"],
    ];
    for (const [raw, kind] of cases) {
      const text = raw.replace(/\\u([0-9a-f]{4})/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)));
      expect(kinds(text), raw).toContain(kind);
    }
  });

  it("does not treat dates, clock times, prices or durations as phone numbers", () => {
    for (const t of [
      "Seit 01.03.2019 selbstständig in Berlin.",
      "Bitte beachten: Ich bin seit 01.01.2020 hier.",
      "Neu ab 1.3.19 und am 24.12.2026 geschlossen.",
      "Termine 09:00–18:00, Preise ab 45,00 €",
      "Termine 09.00 - 18.00 Uhr, Sa 10.00 - 14.00 Uhr",
      "0,5 bis 1,5 Stunden",
      "Paket für 1.234,56 € statt € 1.500",
      "Einsatzgebiet 10405 10115 10119",
      "Seit 2009, 2015 Meisterin, 2020 eigene Praxis",
      "Ein gutes Signal für die Haut: weniger Rötungen.",
      "Ich freue mich auf Ihren Besuch, bis bald.",
      "Bio-Öle, 60 Minuten, ab 89 €",
      "Lotto ist nicht mein Ding, Massage schon.",
    ]) expect(findContactDetails(t), t).toEqual([]);
  });
});

describe("contact lint residual bypasses (audit-3 F13)", () => {
  it("catches spaced e-mails and domains, dot words, Telegramm, more TLDs and mixed digit words", () => {
    const cases: Array<[string, string]> = [
      ["anna @ gmx . de", "email"],
      ["Schreib an anna@ gmx.de", "email"],
      ["linhnails . de", "url"],
      ["linhnails dot de", "url"],
      ["linhnails (dot) com", "url"],
      ["linhnails punkt de", "url"],
      ["Mehr auf linh-nails.fr", "url"],
      ["Portfolio: linhnails.it und linhnails.nl", "url"],
      ["Schreib mir per Telegramm", "messenger"],
      ["t.me/linhnails", "messenger"],
      ["null eins 7 0 eins 2 3 4 5 6 7", "phone"],
    ];
    for (const [text, kind] of cases) expect(kinds(text), text).toContain(kind);
  });

  it("keeps ordinary prose clean", () => {
    for (const t of [
      "Termin im Kurs. Info folgt per SOMA.",
      "Massage am Punkt. De facto entspannt.",
      "Ich arbeite seit 2015 – 1 bis 2 Termine pro Tag.",
      "Zwei bis drei Wochen hält der Lack, eins ist sicher.",
      "Danke für die Ruhe @ home – war wunderbar.",
    ]) expect(findContactDetails(t), t).toEqual([]);
  });
});


describe("contact lint bypasses from audit-4 (A4-12)", () => {
  it("catches letter-spaced text, capital AT/DOT, mail hosts without TLD, other separators and more messengers", () => {
    const cases: Array<[string, string]> = [
      ["a n n a @ g m x . d e", "email"],
      ["annaATgmxDOTde", "email"],
      ["Ruf an: 1 5 1 1 2 3 4 5 6 7 8", "phone"],
      ["linhnails,de", "url"],
      ["linhnails·de", "url"],
      ["Schreib an linh@gmail", "email"],
      ["linh at gmail", "email"],
      ["gmail: linh.nails", "email"],
      ["Am besten über Skype", "messenger"],
      ["Discord: linhnails", "messenger"],
      ["h t t p s : / / linhnails", "url"],
    ];
    for (const [text, kind] of cases) expect(kinds(text), text).toContain(kind);
  });

  it("keeps ordinary prose clean", () => {
    for (const t of [
      "Danke, es war wunderbar – gern wieder.",
      "Termine am 1 2 3. und 4. Tag",
      "Ich habe die Ausbildung in Berlin, dann in Köln gemacht.",
      "Sanfter Druck, warme Öle · 60 Minuten · ab 89 €",
      "Ich bin um 9 Uhr da. Bis dann!",
      "Kurz und gut: Nägel, Lack, fertig.",
    ]) expect(findContactDetails(t), t).toEqual([]);
  });
});
