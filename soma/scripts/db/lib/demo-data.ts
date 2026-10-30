/**
 * Demo data (DEMO_MODE only). All people are fictional. Portraits
 * /images/pros/pro-01 … pro-30 match first name, gender and main category
 * (mapping from the Lead); every provider has a portrait.
 * Hero logins: testkunde@soma.test (Julia H.), testkunde-b2b@soma.test (Selin A.),
 * testadmin@soma.test. Wellness wording only — no healing claims (HWG).
 */

export type Weekly = Array<{ weekday: number; start: string; end: string }>;

const weekdays = (days: number[], start: string, end: string): Weekly => days.map((weekday) => ({ weekday, start, end }));

export const HOURS = {
  officeWeek: weekdays([1, 2, 3, 4, 5], "09:00", "18:00"),
  lateWeek: weekdays([2, 3, 4, 5, 6], "10:00", "20:00"),
  split: [...weekdays([1, 2, 3, 4, 5], "08:00", "12:00"), ...weekdays([1, 2, 3, 4, 5], "15:00", "20:00")],
  afternoons: weekdays([1, 2, 3, 4, 5, 6], "12:00", "21:00"),
  weekend: weekdays([3, 4, 5, 6, 7], "09:00", "17:00"),
  partTime: [...weekdays([1, 2, 3, 4], "17:00", "21:00"), ...weekdays([6], "09:00", "16:00"), ...weekdays([7], "10:00", "15:00")],
  long: weekdays([1, 2, 3, 4, 5, 6], "09:00", "19:00"),
} satisfies Record<string, Weekly>;

export interface DemoOffering {
  service: string; // service slug
  duration?: number;
  price: number; // cents
}

export interface DemoProvider {
  key: string;
  email?: string;
  firstName: string;
  lastName: string;
  displayName: string;
  slug: string;
  city: "berlin" | "muenchen" | "hamburg" | "koeln" | "frankfurt" | "duesseldorf";
  basePostalCode: string;
  avatar: string | null;
  headline: string;
  bio: string;
  yearsExperience: number;
  languages: string[];
  bookingMode: "instant" | "request";
  leadTimeMinutes: number;
  bufferMinutes: number;
  radiusKm: number;
  travelFee: { baseCents: number; includedKm: number; perKmCents: number };
  hours: Weekly;
  offerings: DemoOffering[];
  status?: "approved" | "submitted" | "in_review";
  phone: string;
}

const pic = (n: number) => `/images/pros/pro-${String(n).padStart(2, "0")}.jpg`;

export const PROVIDERS: DemoProvider[] = [
  // ------------------------------------------------------------------ Berlin
  {
    key: "selin", email: "testkunde-b2b@soma.test", firstName: "Selin", lastName: "Aydın", displayName: "Selin A.", slug: "selin-a-berlin",
    city: "berlin", basePostalCode: "10405", avatar: pic(1), phone: "+49 151 20304050",
    headline: "Wellnessmassagen mit Ruhe und warmen Ölen",
    bio: "Seit zwölf Jahren schenke ich Menschen eine Stunde nur für sich. Ich arbeite mit warmen Ölen, ruhigen Griffen und bringe Liege, Tücher und Musik mit. Bei mir dürfen Sie einfach loslassen – zu Hause, im Hotel oder in der Mittagspause im Büro.",
    yearsExperience: 12, languages: ["de", "tr", "en"], bookingMode: "request", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 12,
    travelFee: { baseCents: 500, includedKm: 4, perKmCents: 60 }, hours: HOURS.long,
    offerings: [
      { service: "entspannungsmassage", duration: 60, price: 8900 }, { service: "entspannungsmassage", duration: 90, price: 12500 },
      { service: "aromaoelmassage", duration: 60, price: 9200 }, { service: "hot-stone-massage", price: 13900 },
      { service: "ruecken-nacken-massage", duration: 30, price: 4900 },
    ],
  },
  {
    key: "linh", firstName: "Linh", lastName: "Nguyen", displayName: "Linh N.", slug: "linh-n-berlin",
    city: "berlin", basePostalCode: "10997", avatar: pic(3), phone: "+49 152 11223344",
    headline: "Maniküre & Pediküre mit Liebe zum Detail",
    bio: "Gepflegte Hände und Füße sind meine Leidenschaft. Ich arbeite sauber, ruhig und mit hochwertigen, veganen Lacken. Ob klassisch, Shellac oder das Komplettpaket für Hände und Füße – ich nehme mir Zeit für Sie.",
    yearsExperience: 7, languages: ["de", "vi", "en"], bookingMode: "instant", leadTimeMinutes: 120, bufferMinutes: 30, radiusKm: 10,
    travelFee: { baseCents: 400, includedKm: 3, perKmCents: 50 }, hours: HOURS.lateWeek,
    offerings: [
      { service: "klassische-manikuere", price: 4200 }, { service: "shellac-manikuere", price: 5400 },
      { service: "klassische-pedikuere", price: 5200 }, { service: "pedikuere-shellac", price: 6900 },
      { service: "manikuere-pedikuere", price: 9500 },
    ],
  },
  {
    key: "abena", firstName: "Abena", lastName: "Owusu", displayName: "Abena O.", slug: "abena-o-berlin",
    city: "berlin", basePostalCode: "10115", avatar: pic(5), phone: "+49 160 9988776",
    headline: "Make-up-Artist für Hochzeiten, Events & Kamera",
    bio: "Ich schminke seit neun Jahren für Hochzeiten, Fotoshootings und große Abende – mit einem Gespür für jede Hautfarbe und jeden Typ. Auf Wunsch bringe ich Wimpern und Brauen gleich mit in Form. Für Bräute empfehle ich eine Probe vorab.",
    yearsExperience: 9, languages: ["de", "en", "fr"], bookingMode: "request", leadTimeMinutes: 240, bufferMinutes: 45, radiusKm: 18,
    travelFee: { baseCents: 900, includedKm: 5, perKmCents: 80 }, hours: HOURS.weekend,
    offerings: [
      { service: "tages-make-up", price: 6500 }, { service: "event-make-up", price: 9500 }, { service: "braut-make-up-probe", price: 8900 },
      { service: "braut-make-up", price: 21000 }, { service: "wimpernlifting", price: 6900 },
    ],
  },
  {
    key: "jonas", firstName: "Jonas", lastName: "Wolff", displayName: "Jonas W.", slug: "jonas-w-berlin",
    city: "berlin", basePostalCode: "12043", avatar: pic(23), phone: "+49 157 33445566",
    headline: "Friseurmeister – Schnitt & Styling bei Ihnen",
    bio: "Friseurmeister mit eigenem Mobil-Salon im Koffer. Ich schneide präzise und unkompliziert, berate ehrlich und hinterlasse alles so, wie ich es vorgefunden habe – nur Ihre Haare sehen besser aus.",
    yearsExperience: 11, languages: ["de", "en"], bookingMode: "instant", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 10,
    travelFee: { baseCents: 500, includedKm: 3, perKmCents: 70 }, hours: HOURS.officeWeek,
    offerings: [{ service: "damenhaarschnitt", price: 6900 }, { service: "herrenhaarschnitt", price: 3900 }, { service: "foehnen-styling", price: 4900 }],
  },
  {
    key: "friederike", firstName: "Friederike", lastName: "Sommer", displayName: "Friederike S.", slug: "friederike-s-berlin",
    city: "berlin", basePostalCode: "14193", avatar: pic(21), phone: "+49 171 2233445",
    headline: "Kosmetikerin – Gesichtspflege mit Zeit und Ruhe",
    bio: "Staatlich geprüfte Kosmetikerin. Ich verbinde gründliche Reinigung mit entspannenden Massagegriffen und Produkten, die zu Ihrem Hauttyp passen. Ihr Gesicht soll sich danach einfach frisch und gepflegt anfühlen.",
    yearsExperience: 15, languages: ["de"], bookingMode: "instant", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 14,
    travelFee: { baseCents: 600, includedKm: 4, perKmCents: 60 }, hours: HOURS.split,
    offerings: [{ service: "express-gesichtsbehandlung", price: 4900 }, { service: "klassische-gesichtsbehandlung", price: 8200 }, { service: "feuchtigkeitspflege", price: 11900 }, { service: "waxing-beine", price: 5200 }],
  },
  {
    key: "mai", firstName: "Mai", lastName: "Tran", displayName: "Mai T.", slug: "mai-t-berlin",
    city: "berlin", basePostalCode: "10827", avatar: pic(25), phone: "+49 176 5544332",
    headline: "Lashes, Brows & Nägel in einem Termin",
    bio: "Zertifizierte Lash-Stylistin mit Faible für natürliche Looks. Wimpernlifting, Brow Lamination oder eine schnelle Maniküre – vieles lässt sich gut kombinieren. Auf Wunsch mache ich vorab einen Verträglichkeitstest.",
    yearsExperience: 5, languages: ["de", "vi"], bookingMode: "instant", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 9,
    travelFee: { baseCents: 400, includedKm: 3, perKmCents: 50 }, hours: HOURS.afternoons,
    offerings: [{ service: "wimpernlifting", price: 5900 }, { service: "brow-lamination", price: 5400 }, { service: "brauen-zupfen-faerben", price: 2900 }, { service: "shellac-manikuere", price: 4900 }],
  },
  {
    key: "hanna", firstName: "Hanna", lastName: "Berger", displayName: "Hanna B.", slug: "hanna-b-berlin",
    city: "berlin", basePostalCode: "10719", avatar: pic(22), phone: "+49 171 4455990",
    headline: "Thai-Massage und Entspannung im Berliner Westen",
    bio: "Ich habe die traditionelle Thai-Massage in Chiang Mai gelernt und verbinde sie mit klassischen Wellnessgriffen. Bequeme Kleidung genügt – Matte und Tücher bringe ich mit.",
    yearsExperience: 10, languages: ["de", "en"], bookingMode: "instant", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 15,
    travelFee: { baseCents: 600, includedKm: 4, perKmCents: 60 }, hours: HOURS.weekend,
    offerings: [{ service: "thai-massage", price: 11500 }, { service: "entspannungsmassage", duration: 60, price: 8500 }, { service: "ruecken-nacken-massage", duration: 45, price: 6200 }],
  },
  // ---------------------------------------------------------------- München
  {
    key: "thomas", firstName: "Thomas", lastName: "Kellner", displayName: "Thomas K.", slug: "thomas-k-muenchen",
    city: "muenchen", basePostalCode: "80799", avatar: pic(2), phone: "+49 151 66778899",
    headline: "Kräftige Wellnessmassagen für aktive Menschen",
    bio: "Ich komme aus dem Sport und weiß, wie gut eine kräftige Massage nach einer langen Woche tut. Meine Griffe sind klar und gut dosiert – wer es sanfter mag, sagt einfach Bescheid. Liege und Öle bringe ich mit.",
    yearsExperience: 14, languages: ["de", "en"], bookingMode: "instant", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 15,
    travelFee: { baseCents: 600, includedKm: 4, perKmCents: 70 }, hours: HOURS.split,
    offerings: [{ service: "sportmassage", price: 9500 }, { service: "entspannungsmassage", duration: 60, price: 9200 }, { service: "entspannungsmassage", duration: 90, price: 12900 }, { service: "ruecken-nacken-massage", duration: 45, price: 6500 }],
  },
  {
    key: "gabriele", firstName: "Gabriele", lastName: "Huber", displayName: "Gabriele H.", slug: "gabriele-h-muenchen",
    city: "muenchen", basePostalCode: "81925", avatar: pic(4), phone: "+49 172 4455667",
    headline: "Klassische Kosmetik mit 25 Jahren Erfahrung",
    bio: "Seit 25 Jahren pflege ich Haut – erst im Institut, heute bei meinen Kundinnen und Kunden zu Hause. Ich nehme mir Zeit für eine ehrliche Hautanalyse und arbeite mit ausgewählten Pflegelinien. Termine vergebe ich nach kurzer Anfrage.",
    yearsExperience: 25, languages: ["de", "en"], bookingMode: "request", leadTimeMinutes: 240, bufferMinutes: 30, radiusKm: 12,
    travelFee: { baseCents: 700, includedKm: 4, perKmCents: 70 }, hours: HOURS.officeWeek,
    offerings: [{ service: "klassische-gesichtsbehandlung", price: 9500 }, { service: "feuchtigkeitspflege", price: 13500 }, { service: "express-gesichtsbehandlung", price: 5500 }],
  },
  {
    key: "jiwoo", firstName: "Ji-woo", lastName: "Park", displayName: "Ji-woo P.", slug: "ji-woo-p-muenchen",
    city: "muenchen", basePostalCode: "80469", avatar: pic(13), phone: "+49 160 1122334",
    headline: "Wimpern, Brauen & natürliches Make-up",
    bio: "Ich liebe den natürlichen Look: geschwungene Wimpern, gepflegte Brauen und ein Make-up, das nach Ihnen aussieht. Zertifiziert für Lifting und 1:1-Technik, gerne mit Verträglichkeitstest vorab.",
    yearsExperience: 6, languages: ["de", "ko", "en"], bookingMode: "instant", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 10,
    travelFee: { baseCents: 500, includedKm: 3, perKmCents: 60 }, hours: HOURS.lateWeek,
    offerings: [{ service: "wimpernlifting", price: 6500 }, { service: "wimpernverlaengerung-neuset", price: 13900 }, { service: "brow-lamination", price: 5900 }, { service: "tages-make-up", price: 6500 }],
  },
  {
    key: "maximilian", firstName: "Maximilian", lastName: "Fuchs", displayName: "Maximilian F.", slug: "maximilian-f-muenchen",
    city: "muenchen", basePostalCode: "81369", avatar: pic(26), phone: "+49 157 9988771",
    headline: "Haarschnitt & Hochsteckfrisur – mobil in München",
    bio: "Friseurmeister mit Herz für Hochzeiten und Wiesn-Frisuren. Ich komme mit Werkzeug und Ruhe, berate Sie in Ihrem Spiegel und lasse keine Haare liegen.",
    yearsExperience: 10, languages: ["de"], bookingMode: "instant", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 12,
    travelFee: { baseCents: 500, includedKm: 3, perKmCents: 70 }, hours: HOURS.weekend,
    offerings: [{ service: "hochsteckfrisur", price: 8900 }, { service: "damenhaarschnitt", price: 7200 }, { service: "foehnen-styling", price: 5200 }],
  },
  {
    key: "elena", firstName: "Elena", lastName: "Romano", displayName: "Elena R.", slug: "elena-r-muenchen",
    city: "muenchen", basePostalCode: "80636", avatar: pic(20), phone: "+49 176 2233441",
    headline: "Nägel & Füße – gepflegt bis in die Spitzen",
    bio: "Nageldesignerin aus Leidenschaft. Ich arbeite hygienisch mit Einweg-Feilen und sterilisiertem Werkzeug, berate Sie zu Form und Farbe und sorge für ein Ergebnis, das hält.",
    yearsExperience: 8, languages: ["de", "it"], bookingMode: "instant", leadTimeMinutes: 120, bufferMinutes: 30, radiusKm: 11,
    travelFee: { baseCents: 400, includedKm: 3, perKmCents: 60 }, hours: HOURS.afternoons,
    offerings: [{ service: "gelnaegel-neumodellage", price: 8900 }, { service: "gelnaegel-auffuellen", price: 6500 }, { service: "klassische-pedikuere", price: 5500 }, { service: "wellness-pedikuere", price: 7500 }],
  },
  {
    key: "theresa", firstName: "Theresa", lastName: "Hofmann", displayName: "Theresa H.", slug: "theresa-h-muenchen",
    city: "muenchen", basePostalCode: "81667", avatar: pic(30), phone: "+49 171 6677881",
    headline: "Aromaöl- und Hot-Stone-Massagen",
    bio: "Warme Steine, duftende Öle und eine ruhige Atmosphäre – meine Massagen sind eine kleine Reise. Ich arbeite bevorzugt abends und am Wochenende.",
    yearsExperience: 6, languages: ["de", "en"], bookingMode: "request", leadTimeMinutes: 240, bufferMinutes: 45, radiusKm: 10,
    travelFee: { baseCents: 600, includedKm: 3, perKmCents: 80 }, hours: HOURS.partTime,
    offerings: [{ service: "aromaoelmassage", duration: 90, price: 12900 }, { service: "hot-stone-massage", price: 14500 }],
  },
  // ---------------------------------------------------------------- Hamburg
  {
    key: "marcia", firstName: "Márcia", lastName: "Santos", displayName: "Márcia S.", slug: "marcia-s-hamburg",
    city: "hamburg", basePostalCode: "22765", avatar: pic(8), phone: "+49 151 7788990",
    headline: "Massagen mit brasilianischer Wärme",
    bio: "Ich massiere seit über zwanzig Jahren – erst in São Paulo, seit 2009 in Hamburg. Fließende Griffe, warmes Öl und viel Gelassenheit: Bei mir dürfen Sie ankommen und durchatmen.",
    yearsExperience: 22, languages: ["de", "pt", "es"], bookingMode: "request", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 14,
    travelFee: { baseCents: 500, includedKm: 4, perKmCents: 60 }, hours: HOURS.officeWeek,
    offerings: [{ service: "entspannungsmassage", duration: 90, price: 12500 }, { service: "aromaoelmassage", duration: 60, price: 8900 }, { service: "hot-stone-massage", price: 13500 }],
  },
  {
    key: "zuzanna", firstName: "Zuzanna", lastName: "Wójcik", displayName: "Zuzanna W.", slug: "zuzanna-w-hamburg",
    city: "hamburg", basePostalCode: "20357", avatar: pic(7), phone: "+49 152 3344556",
    headline: "Lash- & Brow-Stylistin in Hamburg",
    bio: "Ich bin zertifizierte Lash-Stylistin und arbeite mit leichten, hautfreundlichen Materialien. Von Lifting bis 1:1-Neuset – Sie bekommen einen Look, der zu Ihren Augen passt. Verträglichkeitstest auf Wunsch.",
    yearsExperience: 4, languages: ["de", "pl", "en"], bookingMode: "instant", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 10,
    travelFee: { baseCents: 400, includedKm: 3, perKmCents: 60 }, hours: HOURS.lateWeek,
    offerings: [{ service: "wimpernverlaengerung-neuset", price: 12900 }, { service: "wimpernverlaengerung-auffuellen", price: 6500 }, { service: "wimpernlifting", price: 5900 }, { service: "brauen-zupfen-faerben", price: 2900 }],
  },
  {
    key: "senait", firstName: "Senait", lastName: "Tesfaye", displayName: "Senait T.", slug: "senait-t-hamburg",
    city: "hamburg", basePostalCode: "20099", avatar: pic(14), phone: "+49 160 5566778",
    headline: "Styling, Flechtfrisuren & Schnitt",
    bio: "Friseurmeisterin mit Schwerpunkt auf lockigem und krausem Haar. Ich berate typgerecht, schneide mit Ruhe und style für Alltag, Feier oder Shooting.",
    yearsExperience: 13, languages: ["de", "en", "ti"], bookingMode: "instant", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 12,
    travelFee: { baseCents: 500, includedKm: 3, perKmCents: 60 }, hours: HOURS.afternoons,
    offerings: [{ service: "damenhaarschnitt", price: 6900 }, { service: "foehnen-styling", price: 5200 }, { service: "hochsteckfrisur", price: 8500 }],
  },
  {
    key: "charlotte", firstName: "Charlotte", lastName: "Jansen", displayName: "Charlotte J.", slug: "charlotte-j-hamburg",
    city: "hamburg", basePostalCode: "20249", avatar: pic(19), phone: "+49 157 4433221",
    headline: "Braut- und Event-Make-up",
    bio: "Ich begleite Bräute an ihrem großen Tag und sorge für ein Make-up, das vom Standesamt bis zum letzten Tanz hält. Für Events arbeite ich auch gern im Hotel.",
    yearsExperience: 8, languages: ["de", "en"], bookingMode: "request", leadTimeMinutes: 240, bufferMinutes: 45, radiusKm: 20,
    travelFee: { baseCents: 800, includedKm: 5, perKmCents: 70 }, hours: HOURS.weekend,
    offerings: [{ service: "braut-make-up", price: 19500 }, { service: "braut-make-up-probe", price: 8500 }, { service: "event-make-up", price: 8900 }],
  },
  {
    key: "merle", firstName: "Merle", lastName: "Petersen", displayName: "Merle P.", slug: "merle-p-hamburg",
    city: "hamburg", basePostalCode: "22085", avatar: pic(27), phone: "+49 171 9988112",
    headline: "Gesichtspflege & Waxing an der Alster",
    bio: "Kosmetikerin mit Liebe zu klaren, wirksamen Routinen. Ich arbeite gründlich, erkläre, was ich tue, und gebe Ihnen Tipps für die Pflege danach mit.",
    yearsExperience: 9, languages: ["de", "en"], bookingMode: "instant", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 11,
    travelFee: { baseCents: 500, includedKm: 3, perKmCents: 60 }, hours: HOURS.officeWeek,
    offerings: [{ service: "klassische-gesichtsbehandlung", price: 7900 }, { service: "express-gesichtsbehandlung", price: 4900 }, { service: "waxing-beine", price: 4900 }],
  },
  {
    key: "leyla", firstName: "Leyla", lastName: "Aksoy", displayName: "Leyla A.", slug: "leyla-a-hamburg",
    city: "hamburg", basePostalCode: "22587", avatar: pic(24), phone: "+49 176 7788112",
    headline: "Maniküre & Pediküre im Hamburger Westen",
    bio: "Ich mache Nägel seit sieben Jahren und liebe saubere Formen und langlebige Farben. Termine auch früh morgens vor der Arbeit.",
    yearsExperience: 7, languages: ["de", "tr"], bookingMode: "instant", leadTimeMinutes: 120, bufferMinutes: 30, radiusKm: 12,
    travelFee: { baseCents: 500, includedKm: 3, perKmCents: 60 }, hours: HOURS.split,
    offerings: [{ service: "klassische-manikuere", price: 3900 }, { service: "shellac-manikuere", price: 4900 }, { service: "pedikuere-shellac", price: 6500 }, { service: "manikuere-pedikuere", price: 8900 }],
  },
  // ------------------------------------------------------------------- Köln
  {
    key: "luca", firstName: "Luca", lastName: "Rossi", displayName: "Luca R.", slug: "luca-r-koeln",
    city: "koeln", basePostalCode: "50672", avatar: pic(12), phone: "+49 151 2244668",
    headline: "Sportmassage & kräftige Ganzkörpermassage",
    bio: "Ich arbeite mit Läuferinnen, Radfahrern und allen, die sich nach Bewegung eine kräftige Massage wünschen. Klare Griffe, gute Kommunikation – und eine Liege, die ich selbstverständlich mitbringe.",
    yearsExperience: 9, languages: ["de", "it", "en"], bookingMode: "instant", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 13,
    travelFee: { baseCents: 500, includedKm: 4, perKmCents: 60 }, hours: HOURS.split,
    offerings: [{ service: "sportmassage", price: 8900 }, { service: "entspannungsmassage", duration: 90, price: 11900 }, { service: "ruecken-nacken-massage", duration: 30, price: 4500 }],
  },
  {
    key: "emre", firstName: "Emre", lastName: "Yılmaz", displayName: "Emre Y.", slug: "emre-y-koeln",
    city: "koeln", basePostalCode: "50733", avatar: pic(18), phone: "+49 157 1133557",
    headline: "Herrenschnitte & Fades – zu Hause oder im Büro",
    bio: "Friseurmeister mit Fokus auf Herrenschnitte, Fades und Bartkonturen. Ich komme mit allem, was ich brauche, und bin in 30 Minuten wieder weg.",
    yearsExperience: 8, languages: ["de", "tr", "en"], bookingMode: "instant", leadTimeMinutes: 120, bufferMinutes: 15, radiusKm: 10,
    travelFee: { baseCents: 300, includedKm: 3, perKmCents: 50 }, hours: HOURS.afternoons,
    offerings: [{ service: "herrenhaarschnitt", price: 3900 }, { service: "foehnen-styling", price: 4500 }],
  },
  {
    key: "kiran", firstName: "Kiran", lastName: "Desai", displayName: "Kiran D.", slug: "kiran-d-koeln",
    city: "koeln", basePostalCode: "50679", avatar: pic(9), phone: "+49 160 7755331",
    headline: "Haare & Make-up für Bühne, Fotos und Feiern",
    bio: "Ich style Haare und Make-up für Shootings, Bühnen und Feste – modern, inklusiv und mit viel Gefühl für den Moment. Mit Meisterbrief und Kamera-Erfahrung.",
    yearsExperience: 7, languages: ["de", "en", "hi"], bookingMode: "instant", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 15,
    travelFee: { baseCents: 600, includedKm: 4, perKmCents: 60 }, hours: HOURS.lateWeek,
    offerings: [{ service: "hochsteckfrisur", price: 8500 }, { service: "foehnen-styling", price: 4900 }, { service: "event-make-up", price: 8500 }],
  },
  // -------------------------------------------------------------- Frankfurt
  {
    key: "bernd", firstName: "Bernd", lastName: "Schäfer", displayName: "Bernd S.", slug: "bernd-s-frankfurt",
    city: "frankfurt", basePostalCode: "60318", avatar: pic(17), phone: "+49 171 3355779",
    headline: "Klassische Wellnessmassage – ruhig und erfahren",
    bio: "Ich massiere seit dreißig Jahren und habe in Hotels rund um Frankfurt gearbeitet. Heute komme ich zu Ihnen. Ruhig, pünktlich und mit einem guten Gefühl für Druck und Tempo.",
    yearsExperience: 30, languages: ["de", "en"], bookingMode: "instant", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 15,
    travelFee: { baseCents: 600, includedKm: 4, perKmCents: 70 }, hours: HOURS.officeWeek,
    offerings: [{ service: "entspannungsmassage", duration: 60, price: 8900 }, { service: "entspannungsmassage", duration: 90, price: 12500 }, { service: "thai-massage", price: 11900 }],
  },
  {
    key: "katrin", firstName: "Katrin", lastName: "Brandt", displayName: "Katrin B.", slug: "katrin-b-frankfurt",
    city: "frankfurt", basePostalCode: "60325", avatar: pic(11), phone: "+49 151 8899001",
    headline: "Kosmetik für Business-Kalender",
    bio: "Ich kenne volle Kalender – deshalb komme ich zu Ihnen, auch frühmorgens oder ins Büro. Gründliche Reinigung, eine kurze Massage und Pflege, die zu Ihrer Haut passt.",
    yearsExperience: 18, languages: ["de", "en"], bookingMode: "instant", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 12,
    travelFee: { baseCents: 700, includedKm: 4, perKmCents: 70 }, hours: HOURS.split,
    offerings: [{ service: "express-gesichtsbehandlung", price: 5500 }, { service: "klassische-gesichtsbehandlung", price: 8900 }, { service: "feuchtigkeitspflege", price: 12500 }],
  },
  {
    key: "yasmin", firstName: "Yasmin", lastName: "Khoury", displayName: "Yasmin K.", slug: "yasmin-k-frankfurt",
    city: "frankfurt", basePostalCode: "60594", avatar: pic(16), phone: "+49 176 4466880",
    headline: "Glow-Make-up für Ihren Anlass",
    bio: "Ich liebe strahlende Haut und ausdrucksstarke Augen. Ob Hochzeit, Gala oder Business-Shooting – ich schminke typgerecht und langanhaltend, mit Produkten für jede Hautfarbe.",
    yearsExperience: 5, languages: ["de", "ar", "en", "fr"], bookingMode: "request", leadTimeMinutes: 240, bufferMinutes: 45, radiusKm: 16,
    travelFee: { baseCents: 700, includedKm: 5, perKmCents: 60 }, hours: HOURS.weekend,
    offerings: [{ service: "event-make-up", price: 9500 }, { service: "tages-make-up", price: 6500 }, { service: "braut-make-up", price: 22000 }],
  },
  // ------------------------------------------------------------- Düsseldorf
  {
    key: "karim", firstName: "Karim", lastName: "Haddad", displayName: "Karim H.", slug: "karim-h-duesseldorf",
    city: "duesseldorf", basePostalCode: "40477", avatar: pic(6), phone: "+49 152 6688002",
    headline: "Schnitt & Styling mit Meisterbrief",
    bio: "Ich bin Friseurmeister und schneide seit über zehn Jahren – Damen, Herren und Kinder. Mobil arbeite ich besonders gern, weil ich Sie in Ihrem Alltag beraten kann.",
    yearsExperience: 12, languages: ["de", "ar", "en"], bookingMode: "instant", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 12,
    travelFee: { baseCents: 500, includedKm: 3, perKmCents: 60 }, hours: HOURS.lateWeek,
    offerings: [{ service: "damenhaarschnitt", price: 6500 }, { service: "herrenhaarschnitt", price: 3500 }, { service: "foehnen-styling", price: 4500 }],
  },
  {
    key: "chidi", firstName: "Chidi", lastName: "Okafor", displayName: "Chidi O.", slug: "chidi-o-duesseldorf",
    city: "duesseldorf", basePostalCode: "40211", avatar: pic(10), phone: "+49 160 2244006",
    headline: "Kosmetik & Grooming – auch für Männer",
    bio: "Gepflegte Haut kennt kein Geschlecht. Ich biete Gesichtsbehandlungen und gepflegte Hände für alle, die sich etwas Gutes tun wollen – unkompliziert und diskret.",
    yearsExperience: 5, languages: ["de", "en"], bookingMode: "instant", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 10,
    travelFee: { baseCents: 400, includedKm: 3, perKmCents: 50 }, hours: HOURS.afternoons,
    offerings: [{ service: "klassische-gesichtsbehandlung", price: 7500 }, { service: "express-gesichtsbehandlung", price: 4500 }, { service: "herrenmanikuere", price: 3500 }],
  },
  {
    key: "natalja", firstName: "Natalja", lastName: "Wagner", displayName: "Natalja W.", slug: "natalja-w-duesseldorf",
    city: "duesseldorf", basePostalCode: "40545", avatar: pic(15), phone: "+49 171 5577993",
    headline: "Nageldesign & Pediküre in Oberkassel",
    bio: "Seit 15 Jahren gestalte ich Nägel – von klassisch elegant bis aufwendig. Ich arbeite mit sterilem Werkzeug und nehme mir Zeit für eine gründliche Pflege.",
    yearsExperience: 15, languages: ["de", "ru"], bookingMode: "instant", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 12,
    travelFee: { baseCents: 500, includedKm: 3, perKmCents: 60 }, hours: HOURS.officeWeek,
    offerings: [{ service: "gelnaegel-neumodellage", price: 8500 }, { service: "shellac-manikuere", price: 5200 }, { service: "manikuere-pedikuere", price: 9200 }, { service: "wellness-pedikuere", price: 7200 }],
  },
  // ------------------------------------------------- verification queue (not bookable)
  {
    key: "nora", firstName: "Nora", lastName: "Krause", displayName: "Nora K.", slug: "nora-k-berlin",
    city: "berlin", basePostalCode: "10245", avatar: pic(28), phone: "+49 157 6655443", status: "submitted",
    headline: "Kosmetik & Brauen in Friedrichshain",
    bio: "Frisch selbstständig nach acht Jahren im Studio. Ich freue mich auf meine ersten SOMA-Kundinnen und -Kunden.",
    yearsExperience: 8, languages: ["de", "en"], bookingMode: "request", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 8,
    travelFee: { baseCents: 400, includedKm: 3, perKmCents: 50 }, hours: HOURS.officeWeek,
    offerings: [{ service: "klassische-gesichtsbehandlung", price: 7500 }, { service: "brauen-zupfen-faerben", price: 2900 }],
  },
  {
    key: "paul", firstName: "Paul", lastName: "Albers", displayName: "Paul A.", slug: "paul-a-koeln",
    city: "koeln", basePostalCode: "50674", avatar: pic(29), phone: "+49 176 3311224", status: "in_review",
    headline: "Mobiler Friseur in der Kölner Südstadt",
    bio: "Gelernter Friseur, seit fünf Jahren mobil unterwegs. Meisterbrief folgt in Kürze.",
    yearsExperience: 5, languages: ["de"], bookingMode: "request", leadTimeMinutes: 180, bufferMinutes: 30, radiusKm: 8,
    travelFee: { baseCents: 400, includedKm: 3, perKmCents: 50 }, hours: HOURS.afternoons,
    offerings: [{ service: "herrenhaarschnitt", price: 3500 }, { service: "damenhaarschnitt", price: 5900 }],
  },
];

/**
 * Providers that charge 19 % USt ("regular", ~40 %); everyone else is
 * Kleinunternehmer per § 19 UStG ("small_business").
 */
export const REGULAR_VAT_PROVIDERS = new Set([
  "selin", "abena", "jonas", "friederike", "thomas", "gabriele", "marcia", "senait", "luca", "bernd", "katrin", "natalja",
]);

export interface DemoCustomer {
  key: string;
  email: string;
  firstName: string;
  lastName: string;
  city: DemoProvider["city"];
  street: string;
  houseNumber: string;
  postalCode: string;
  phone: string;
}

const cust = (key: string, firstName: string, lastName: string, city: DemoProvider["city"], street: string, houseNumber: string, postalCode: string, phone: string, email?: string): DemoCustomer =>
  ({ key, email: email ?? `${key}@kunden.soma.test`, firstName, lastName, city, street, houseNumber, postalCode, phone });

export const CUSTOMERS: DemoCustomer[] = [
  cust("julia", "Julia", "Hartmann", "berlin", "Oderberger Straße", "21", "10435", "+49 170 1112233", "testkunde@soma.test"),
  cust("sophie", "Sophie", "Brandt", "berlin", "Oranienstraße", "17", "10997", "+49 170 2223344"),
  cust("anna", "Anna", "Lehmann", "berlin", "Torstraße", "102", "10115", "+49 170 3334455"),
  cust("david", "David", "Cohen", "berlin", "Pariser Straße", "9", "10719", "+49 170 4445566"),
  cust("fatma", "Fatma", "Demir", "berlin", "Weserstraße", "33", "12043", "+49 170 5556677"),
  cust("clara", "Clara", "Neumann", "berlin", "Akazienstraße", "5", "10827", "+49 170 6667788"),
  cust("lukas", "Lukas", "Meyer", "muenchen", "Türkenstraße", "60", "80799", "+49 171 1112233"),
  cust("marie", "Marie", "Schuster", "muenchen", "Wörthstraße", "12", "81667", "+49 171 2223344"),
  cust("valentina", "Valentina", "Greco", "muenchen", "Müllerstraße", "28", "80469", "+49 171 3334455"),
  cust("isabel", "Isabel", "Graf", "muenchen", "Nymphenburger Straße", "88", "80636", "+49 171 4445566"),
  cust("tobias", "Tobias", "Winter", "muenchen", "Prinzregentenstraße", "140", "81925", "+49 171 5556677"),
  cust("hannah", "Hannah", "Koch", "hamburg", "Ottenser Hauptstraße", "22", "22765", "+49 172 1112233"),
  cust("finn", "Finn", "Christiansen", "hamburg", "Schulterblatt", "71", "20357", "+49 172 2223344"),
  cust("mila", "Mila", "Wiese", "hamburg", "Eppendorfer Landstraße", "15", "20249", "+49 172 3334455"),
  cust("aylin", "Aylin", "Kaya", "hamburg", "Lange Reihe", "64", "20099", "+49 172 4445566"),
  cust("greta", "Greta", "Lorenz", "hamburg", "Schöne Aussicht", "3", "22085", "+49 172 5556677"),
  cust("ben", "Ben", "Schröder", "koeln", "Brüsseler Straße", "50", "50672", "+49 173 1112233"),
  cust("emma", "Emma", "Becker", "koeln", "Neusser Straße", "210", "50733", "+49 173 2223344"),
  cust("noah", "Noah", "Okoro", "koeln", "Deutzer Freiheit", "77", "50679", "+49 173 3334455"),
  cust("lea", "Lea", "Hahn", "frankfurt", "Berger Straße", "120", "60318", "+49 174 1112233"),
  cust("samira", "Samira", "Haddou", "frankfurt", "Schweizer Straße", "45", "60594", "+49 174 2223344"),
  cust("felix", "Felix", "Engel", "frankfurt", "Grüneburgweg", "16", "60325", "+49 174 3334455"),
  cust("laura", "Laura", "Vogel", "duesseldorf", "Nordstraße", "30", "40477", "+49 175 1112233"),
  cust("sven", "Sven", "Kowalski", "duesseldorf", "Luegallee", "57", "40545", "+49 175 2223344"),
  cust("ines", "Ines", "Martins", "duesseldorf", "Königsallee", "92", "40211", "+49 175 3334455"),
  cust("katharina", "Katharina", "Vogt", "berlin", "Bergmannstraße", "8", "10961", "+49 170 7778899"),
  cust("mehmet", "Mehmet", "Arslan", "berlin", "Sonnenallee", "140", "12059", "+49 170 8889900"),
  cust("lisa", "Lisa", "Krüger", "berlin", "Kastanienallee", "77", "10435", "+49 170 9990011"),
  cust("olga", "Olga", "Smirnova", "berlin", "Kantstraße", "120", "10625", "+49 170 1231231"),
  cust("johanna", "Johanna", "Maier", "muenchen", "Klenzestraße", "45", "80469", "+49 171 6667788"),
  cust("niklas", "Niklas", "Bauer", "muenchen", "Leopoldstraße", "77", "80802", "+49 171 7778899"),
  cust("sara", "Sara", "Mahmoud", "muenchen", "Lindwurmstraße", "101", "80337", "+49 171 8889900"),
  cust("jana", "Jana", "Möller", "hamburg", "Osterstraße", "120", "20259", "+49 172 6667788"),
  cust("tim", "Tim", "Hansen", "hamburg", "Mühlenkamp", "33", "22303", "+49 172 7778899"),
  cust("nele", "Nele", "Dietrich", "hamburg", "Bahrenfelder Straße", "160", "22765", "+49 172 8889900"),
  cust("marlene", "Marlene", "Esser", "koeln", "Zülpicher Straße", "18", "50674", "+49 173 4445566"),
  cust("can", "Can", "Öztürk", "koeln", "Venloer Straße", "300", "50823", "+49 173 5556677"),
  cust("helen", "Helen", "Fischer", "frankfurt", "Leipziger Straße", "50", "60487", "+49 174 4445566"),
  cust("jonathan", "Jonathan", "Weiß", "frankfurt", "Oeder Weg", "40", "60318", "+49 174 5556677"),
  cust("pia", "Pia", "Schulte", "duesseldorf", "Lorettostraße", "12", "40219", "+49 175 4445566"),
  cust("marco", "Marco", "Lehmann", "duesseldorf", "Kölner Straße", "80", "40211", "+49 175 5556677"),
];

/** Review texts by category, with ratings attached; credible, varied, not all 5 stars. */
/**
 * Review templates (audit-3 F3): every text fits the booked service. `services` lists the service
 * slugs it may be used for ("slug" or "slug:duration"); without it the text is neutral for the whole
 * category. `reply` is written for exactly this review (critical reviews get an apologetic reply).
 * Texts never name the provider's gender, a weekday, a place (hotel/office) or a duration unless tagged.
 */
export interface ReviewTemplate {
  rating: number;
  text: string | null;
  tags: string[];
  services?: string[];
  reply?: string;
}

const FACE = ["express-gesichtsbehandlung", "klassische-gesichtsbehandlung", "feuchtigkeitspflege"];
const CUT = ["damenhaarschnitt", "herrenhaarschnitt"];
const BROWS = ["brauen-zupfen-faerben", "brow-lamination"];
const NAILS_COLOUR = ["klassische-manikuere", "shellac-manikuere", "gelnaegel-neumodellage", "gelnaegel-auffuellen"];

export const REVIEWS: Record<string, ReviewTemplate[]> = {
  massage: [
    { rating: 5, text: "Ich war selten so entspannt. Pünktlich, ruhig, alles mitgebracht – sogar warme Handtücher.", tags: ["Pünktlich", "Entspannend"], reply: "Danke dir, genau so soll es sein. Bis zum nächsten Mal." },
    { rating: 5, text: "Perfekter Druck, sehr angenehme Atmosphäre. Ich buche definitiv wieder.", tags: ["Entspannend", "Wieder buchen"] },
    { rating: 4, text: "Sehr schöne Massage. Der Aufbau der Liege hat etwas gedauert, danach war es top.", tags: ["Professionell"], reply: "Danke für den Hinweis – beim nächsten Mal geht der Aufbau schneller." },
    { rating: 5, text: "Hot Stone im eigenen Wohnzimmer – ein Traum. Danke für die ruhige Art.", tags: ["Entspannend"], services: ["hot-stone-massage"], reply: "Freut mich sehr, dass die warmen Steine so gut angekommen sind." },
    { rating: 4, text: "Gute Massage, ich hätte mir etwas mehr Fokus auf den Nacken gewünscht. Trotzdem sehr wohltuend.", tags: ["Freundlich"], reply: "Danke für dein Feedback, beim nächsten Termin nehme ich mir den Nacken gezielt vor." },
    { rating: 3, text: "15 Minuten später als vereinbart, die Zeit wurde aber drangehängt. Die Massage war okay.", tags: [], reply: "Entschuldige die Verspätung – danke, dass du so geduldig warst." },
    { rating: 5, text: null, tags: ["Pünktlich", "Professionell"] },
    { rating: 5, text: "Mein Mann hat die Massage zuerst ausprobiert, jetzt bin ich auch überzeugt.", tags: ["Wieder buchen"] },
    { rating: 4, text: "Kräftig, aber angenehm. Genau das, was ich nach dem Halbmarathon gebraucht habe.", tags: ["Professionell"], services: ["sportmassage"], reply: "Glückwunsch zum Halbmarathon und gute Regeneration." },
    { rating: 2, text: "Leider sehr hektisch und kaum Kommunikation. Für den Preis hatte ich mehr erwartet.", tags: [], reply: "Das tut mir leid. Danke für die offenen Worte – beim nächsten Mal nehme ich mir mehr Zeit für das Vorgespräch." },
    { rating: 5, text: "Vorher wurde genau nach Verspannungen gefragt und die Massage darauf abgestimmt.", tags: ["Gute Beratung"] },
    { rating: 5, text: "Liege, Öle, leise Musik – ich musste mich um nichts kümmern.", tags: ["Entspannend"] },
    { rating: 4, text: "Angenehmer Druck an den Schultern, die Beine kamen etwas kurz.", tags: ["Freundlich"], services: ["entspannungsmassage", "aromaoelmassage", "hot-stone-massage", "sportmassage"], reply: "Danke, beim nächsten Mal plane ich mehr Zeit für die Beine ein." },
    { rating: 5, text: "Nach der Spätschicht genau das Richtige. Ich bin danach sofort eingeschlafen.", tags: ["Entspannend"], reply: "Wie schön, dass du so gut abschalten konntest." },
    { rating: 5, text: "Sehr professionell, sogar ein frisches Laken für die Liege war dabei.", tags: ["Professionell", "Sauber gearbeitet"] },
    { rating: 4, text: "Schöne Aromaölmassage, der Duft war mir etwas zu intensiv.", tags: [], services: ["aromaoelmassage"], reply: "Danke – beim nächsten Mal nehme ich ein milderes Öl." },
    { rating: 5, text: "Zum zweiten Mal gebucht und wieder rundum zufrieden.", tags: ["Wieder buchen"], reply: "Danke für dein Vertrauen, ich freue mich auf das nächste Mal." },
    { rating: 5, text: "Pünktlich auf die Minute, freundlich und sehr ruhig in der Ausführung.", tags: ["Pünktlich"] },
    { rating: 3, text: "Die Massage an sich war gut, wir haben aber 20 Minuten später angefangen als geplant.", tags: [], reply: "Entschuldige die Verspätung, ich stand im Stau. Danke für dein Verständnis." },
    { rating: 5, text: "Meine Schultern fühlen sich zwei Tage später immer noch locker an.", tags: ["Professionell"] },
    { rating: 4, text: "Sehr nett und aufmerksam, der Raum war allerdings etwas zu kühl für mich.", tags: ["Freundlich"], reply: "Danke für den Hinweis – nächstes Mal bringe ich eine zusätzliche Decke mit." },
    { rating: 5, text: "Zum Schluss gab es noch zwei Dehnübungen für den Schreibtisch.", tags: ["Gute Beratung"], reply: "Gern – die Übungen wirken am besten jeden Tag ein paar Minuten." },
    { rating: 4, text: "Solide Sportmassage, beim nächsten Mal gern etwas fester.", tags: [], services: ["sportmassage"] },
    { rating: 5, text: "Unkomplizierte Buchung, freundliche Begrüßung, eine wunderbare Massage.", tags: ["Entspannend", "Freundlich"] },
    { rating: 5, text: "Kein Studio-Stress, kein Parkplatzsuchen. So möchte ich das immer.", tags: ["Pünktlich"] },
    { rating: 5, text: "Rücken und Nacken in der Mittagspause – danach konnte ich wieder klar denken.", tags: ["Entspannend"], services: ["ruecken-nacken-massage"], reply: "Schön, dass die kurze Pause so viel gebracht hat." },
    { rating: 5, text: "Die Thai-Massage war intensiv und trotzdem sehr achtsam. Ich fühle mich wie neu.", tags: ["Professionell"], services: ["thai-massage"], reply: "Danke dir, die Dehnungen tun nach ein paar Terminen noch besser." },
    { rating: 3, text: "Ganz okay, für mich war der Druck insgesamt zu sanft.", tags: [], reply: "Danke für die ehrliche Rückmeldung – sag beim nächsten Mal gern direkt Bescheid, dann arbeite ich fester." },
    { rating: 5, text: "Die warmen Steine auf dem Rücken waren das Highlight.", tags: ["Entspannend"], services: ["hot-stone-massage"] },
    { rating: 4, text: "Angenehme Öle und eine ruhige Hand, nur der Start war etwas hektisch.", tags: ["Freundlich"], services: ["aromaoelmassage"], reply: "Danke dir, beim nächsten Mal komme ich mit mehr Puffer." },
    { rating: 5, text: "Die Dehnungen bei der Thai-Massage haben meinem Rücken richtig gutgetan.", tags: ["Professionell"], services: ["thai-massage"] },
    { rating: 5, text: "Nacken und Schultern waren nach der kurzen Massage spürbar lockerer.", tags: ["Professionell"], services: ["ruecken-nacken-massage"] },
  ],
  manikuere: [
    { rating: 5, text: "Die Nägel sehen nach zwei Wochen noch aus wie frisch gemacht. Super sauber gearbeitet.", tags: ["Sauber gearbeitet"], services: ["shellac-manikuere", "gelnaegel-neumodellage", "gelnaegel-auffuellen"], reply: "Danke dir, schön zu hören, dass alles so gut hält." },
    { rating: 5, text: "Sehr sorgfältig und hygienisch, tolle Farbberatung.", tags: ["Gute Beratung", "Sauber gearbeitet"], services: NAILS_COLOUR },
    { rating: 4, text: "Schönes Ergebnis, die Zeit war allerdings knapp kalkuliert.", tags: ["Freundlich"], reply: "Danke, beim nächsten Termin plane ich etwas mehr Puffer ein." },
    { rating: 5, text: "Endlich keine Wartezeit im Studio mehr. Perfekt für die Mittagspause.", tags: ["Pünktlich"] },
    { rating: 3, text: "Ergebnis gut, aber am Zeigefinger ist der Lack nach drei Tagen abgeplatzt.", tags: [], services: ["klassische-manikuere"], reply: "Das tut mir leid – melde dich gern, dann bessere ich den Nagel kostenlos aus." },
    { rating: 5, text: null, tags: ["Wieder buchen"] },
    { rating: 5, text: "Saubere Nagelhaut, perfekte Form – sehr gepflegt.", tags: ["Sauber gearbeitet"] },
    { rating: 5, text: "Kam mit komplettem Set, alles wirkte sehr hygienisch.", tags: ["Professionell"] },
    { rating: 4, text: "Hübsches French, die Kanten am kleinen Finger waren nicht ganz gleichmäßig.", tags: [], services: ["klassische-manikuere", "shellac-manikuere"], reply: "Danke für den Hinweis, beim nächsten Mal achte ich besonders auf die kleinen Finger." },
    { rating: 5, text: "Sehr geduldig, obwohl ich mich lange nicht für eine Farbe entscheiden konnte.", tags: ["Gute Beratung", "Freundlich"], services: NAILS_COLOUR },
    { rating: 5, text: "Gelnägel vor dem Urlaub – haben die ganzen zwei Wochen am Strand gehalten.", tags: ["Sauber gearbeitet"], services: ["gelnaegel-neumodellage", "gelnaegel-auffuellen"], reply: "Wie schön, dann war der Urlaub auch für die Nägel ein Erfolg." },
    { rating: 5, text: "Meine Nägel waren völlig kaputt, jetzt sehen sie wieder gepflegt aus.", tags: ["Professionell"] },
    { rating: 5, text: "Angenehmes Gespräch, ruhige Hände, tolles Ergebnis.", tags: ["Freundlich"] },
    { rating: 3, text: "Schöne Farbe, aber das Auffüllen hat fast doppelt so lange gedauert wie angegeben.", tags: [], services: ["gelnaegel-auffuellen"], reply: "Danke für dein Feedback – das Auffüllen war diesmal aufwendiger, ich sage das künftig vorher an." },
    { rating: 5, text: "Kurz, unkompliziert und die Hände sehen wieder gepflegt aus.", tags: ["Pünktlich"], services: ["herrenmanikuere", "klassische-manikuere"] },
    { rating: 5, text: "Shellac in einem ruhigen Nude-Ton, genau wie gewünscht.", tags: ["Gute Beratung"], services: ["shellac-manikuere"] },
  ],
  pedikuere: [
    { rating: 5, text: "So gepflegte Füße hatte ich lange nicht. Die Fußmassage am Ende war das Highlight.", tags: ["Entspannend"], services: ["wellness-pedikuere"], reply: "Freut mich, dass dir die Fußmassage so gutgetan hat." },
    { rating: 4, text: "Sehr angenehm und gründlich. Gerne wieder vor dem nächsten Urlaub.", tags: ["Sauber gearbeitet"] },
    { rating: 5, text: "Professionell, freundlich und alles blitzsauber hinterlassen.", tags: ["Professionell", "Freundlich"] },
    { rating: 5, text: "Sehr gründlich an der Hornhaut, ohne dass es unangenehm war.", tags: ["Sauber gearbeitet"] },
    { rating: 5, text: "Alles war dabei, sogar ein Fußbad mit warmem Wasser.", tags: ["Professionell"] },
    { rating: 4, text: "Schönes Ergebnis, der Lack war am nächsten Tag an einem Zeh leicht verwischt.", tags: [], services: ["pedikuere-shellac", "manikuere-pedikuere"], reply: "Danke für den Hinweis, melde dich gern – ich bessere das kostenlos nach." },
    { rating: 5, text: "Für meine Mutter gebucht, sie war begeistert, wie behutsam gearbeitet wurde.", tags: ["Freundlich"], reply: "Liebe Grüße an deine Mutter, es war ein schöner Termin." },
    { rating: 5, text: "Pediküre auf dem Balkon – besser geht es kaum.", tags: ["Entspannend"] },
    { rating: 4, text: "Gute Pflege, nächstes Mal würde ich die Variante mit Fußmassage nehmen.", tags: ["Wieder buchen"], services: ["klassische-pedikuere"] },
    { rating: 5, text: "Hände und Füße in einem Termin – sehr gepflegtes Ergebnis und gut geplant.", tags: ["Sauber gearbeitet"], services: ["manikuere-pedikuere"], reply: "Danke dir, das Komplettpaket mache ich besonders gern." },
  ],
  kosmetik: [
    { rating: 5, text: "Meine Haut fühlt sich wunderbar frisch an. Sehr kompetente Beratung zur Pflege danach.", tags: ["Gute Beratung"], services: FACE },
    { rating: 5, text: "Ruhig, gründlich, sehr angenehme Produkte. Eine echte Auszeit.", tags: ["Entspannend"], services: ["klassische-gesichtsbehandlung", "feuchtigkeitspflege"] },
    { rating: 4, text: "Saubere Arbeit beim Waxing, für mich war es etwas unangenehm – liegt eher an mir.", tags: ["Professionell"], services: ["waxing-beine"], reply: "Danke dir – beim nächsten Mal geht es meist schon leichter." },
    { rating: 3, text: "Die Behandlung war in Ordnung, aber deutlich kürzer als die angegebenen 60 Minuten.", tags: [], services: ["klassische-gesichtsbehandlung"], reply: "Das tut mir leid, dir stehen die vollen 60 Minuten zu. Ich melde mich über SOMA wegen einer Gutschrift." },
    { rating: 5, text: null, tags: ["Pünktlich", "Wieder buchen"] },
    { rating: 5, text: "Die Gesichtsreinigung war gründlich und trotzdem sanft zu meiner empfindlichen Haut.", tags: ["Professionell"], services: FACE },
    { rating: 5, text: "Es gab eine klare Empfehlung, welche Pflege morgens und abends passt. Sehr hilfreich.", tags: ["Gute Beratung"], services: FACE, reply: "Gern, viel Freude mit der neuen Routine." },
    { rating: 4, text: "Schöne Behandlung, die Maske am Ende hätte ich gern etwas länger gehabt.", tags: ["Entspannend"], services: ["feuchtigkeitspflege", "klassische-gesichtsbehandlung"], reply: "Danke, das merke ich mir für den nächsten Termin." },
    { rating: 5, text: "Pünktlich, freundlich und alles wieder ordentlich weggeräumt.", tags: ["Pünktlich", "Sauber gearbeitet"] },
    { rating: 5, text: "Meine Haut strahlt richtig, eine Kollegin hat sofort gefragt, was ich gemacht habe.", tags: ["Wieder buchen"], services: FACE, reply: "Wie schön – danke für das tolle Feedback." },
    { rating: 5, text: "Eine Stunde nur für mich – genau die Auszeit, die ich gebraucht habe.", tags: ["Entspannend"], services: ["klassische-gesichtsbehandlung"] },
    { rating: 3, text: "Freundlich, aber die Produkte waren mir zu stark parfümiert.", tags: [], services: FACE, reply: "Danke für den Hinweis – ich habe auch parfümfreie Produkte dabei, sag gern vorher Bescheid." },
    { rating: 5, text: "Sehr hygienisch, mit Einweghandschuhen und frischen Tüchern.", tags: ["Sauber gearbeitet"] },
    { rating: 4, text: "Schöne Behandlung, die Terminabstimmung lief über die App ganz einfach.", tags: ["Freundlich"] },
    { rating: 5, text: "Kompetent und herzlich, ich habe direkt den nächsten Termin gebucht.", tags: ["Wieder buchen"], reply: "Ich freue mich schon auf den nächsten Termin." },
    { rating: 5, text: "Kurz vor einem wichtigen Termin – in einer halben Stunde sah meine Haut deutlich frischer aus.", tags: ["Pünktlich"], services: ["express-gesichtsbehandlung"] },
    { rating: 4, text: "Für die kurze Zeit erstaunlich gründlich, beim nächsten Mal nehme ich die längere Behandlung.", tags: [], services: ["express-gesichtsbehandlung"], reply: "Danke dir, die klassische Behandlung lohnt sich bestimmt." },
    { rating: 5, text: "Waxing schnell und sauber, die Haut war danach kaum gerötet.", tags: ["Sauber gearbeitet"], services: ["waxing-beine"] },
    { rating: 5, text: "Nach der Feuchtigkeitsbehandlung fühlt sich meine trockene Haut endlich wieder weich an.", tags: ["Professionell"], services: ["feuchtigkeitspflege"] },
    { rating: 5, text: "Sehr angenehme, ruhige Atmosphäre – trotz Hausbesuch wie im Spa.", tags: ["Entspannend"] },
    { rating: 5, text: "Die Augenpartie wirkt nach der Behandlung richtig erholt.", tags: ["Professionell"], services: ["klassische-gesichtsbehandlung", "feuchtigkeitspflege"] },
  ],
  "make-up": [
    { rating: 5, text: "Mein Braut-Make-up hat den ganzen Tag gehalten, bis spät in die Nacht.", tags: ["Professionell", "Gute Beratung"], services: ["braut-make-up"], reply: "Herzlichen Glückwunsch zur Hochzeit, es war mir eine Ehre." },
    { rating: 5, text: "Natürlich und trotzdem fotogen – genau wie besprochen.", tags: ["Gute Beratung"] },
    { rating: 4, text: "Sehr schönes Event-Make-up, die Wimpern waren mir etwas zu dramatisch.", tags: ["Freundlich"], services: ["event-make-up"], reply: "Danke – beim nächsten Mal nehme ich dezentere Wimpern." },
    { rating: 5, text: "Entspannt und schnell, und alle haben gefragt, wer mich geschminkt hat.", tags: ["Pünktlich"] },
    { rating: 5, text: "Das Make-up für das Fotoshooting war perfekt, auch unter starkem Licht.", tags: ["Professionell"], services: ["tages-make-up", "event-make-up"] },
    { rating: 5, text: "Es wurde genau geschaut, was zu meinem Kleid passt.", tags: ["Gute Beratung"], services: ["event-make-up", "braut-make-up", "braut-make-up-probe"] },
    { rating: 4, text: "Schönes Abend-Make-up, der Lippenstift war mir am Ende etwas zu kräftig.", tags: [], services: ["event-make-up"], reply: "Danke dir, ich nehme beim nächsten Mal einen sanfteren Ton." },
    { rating: 5, text: "Am Hochzeitsmorgen lief alles im Zeitplan, obwohl es bei uns ziemlich turbulent war.", tags: ["Pünktlich"], services: ["braut-make-up"], reply: "Danke dir, ich hoffe, der Tag war wunderschön." },
    { rating: 5, text: "Sehr ruhig und souverän, das hat mich vor dem großen Abend entspannt.", tags: ["Freundlich"], services: ["event-make-up"] },
    { rating: 5, text: "Das Make-up sah auf den Fotos natürlich aus und hat zehn Stunden gehalten.", tags: ["Professionell"], services: ["braut-make-up"] },
    { rating: 4, text: "Die Probe hat geholfen, für den großen Tag passen wir den Lidschatten noch etwas an.", tags: ["Gute Beratung"], services: ["braut-make-up-probe"], reply: "Genau dafür ist die Probe da – ich freue mich auf den großen Tag." },
    { rating: 5, text: "Für den Abiball gebucht – meine Tochter hat sich wunderschön gefühlt.", tags: ["Freundlich"], services: ["event-make-up"] },
    { rating: 3, text: "Grundsätzlich gut, aber das Augen-Make-up war nicht so dezent wie besprochen.", tags: [], reply: "Das tut mir leid, ich hätte vorher noch einmal nachfragen sollen. Danke für die offene Rückmeldung." },
    { rating: 5, text: "Alle Produkte waren dabei, und zum Nachbessern gab es noch Puder für unterwegs.", tags: ["Professionell"] },
    { rating: 5, text: "Dezentes Tages-Make-up für ein Vorstellungsgespräch – genau richtig.", tags: ["Gute Beratung"], services: ["tages-make-up"] },
    { rating: 5, text: "Bei der Probe haben wir drei Looks ausprobiert, jetzt weiß ich genau, was ich will.", tags: ["Gute Beratung"], services: ["braut-make-up-probe"] },
  ],
  "haare-styling": [
    { rating: 5, text: "Bester Haarschnitt seit Jahren – und das in meiner Küche. Alles sauber hinterlassen.", tags: ["Sauber gearbeitet"], services: CUT, reply: "Danke dir, dann bis zum nächsten Schnitt." },
    { rating: 4, text: "Guter Schnitt, nächstes Mal etwas mehr Zeit für die Beratung wäre schön.", tags: ["Professionell"], services: CUT, reply: "Danke für den Hinweis, beim nächsten Mal planen wir mehr Zeit fürs Gespräch ein." },
    { rating: 5, text: "Die Hochsteckfrisur zur Hochzeit hat bombenfest gehalten. Sehr empfehlenswert.", tags: ["Professionell", "Wieder buchen"], services: ["hochsteckfrisur"], reply: "Wie schön, herzlichen Glückwunsch zur Hochzeit." },
    { rating: 5, text: "Schnell, präzise und super nett. Fade genau wie gewünscht.", tags: ["Pünktlich", "Freundlich"], services: ["herrenhaarschnitt"] },
    { rating: 3, text: "Der Schnitt ist okay, aber nicht ganz das, was ich mir vorgestellt hatte.", tags: [], services: CUT, reply: "Danke für die ehrliche Rückmeldung – melde dich gern, dann korrigiere ich die Form kostenlos." },
    { rating: 5, text: "Der Schnitt ist genau so geworden, wie ich ihn mir auf dem Foto vorgestellt hatte.", tags: ["Professionell"], services: ["damenhaarschnitt"] },
    { rating: 5, text: "Der Boden wurde danach gesaugt, als wäre nie jemand da gewesen.", tags: ["Sauber gearbeitet"], services: CUT },
    { rating: 4, text: "Schönes Styling, das Föhnen am Ende war etwas schnell.", tags: [], services: ["foehnen-styling"], reply: "Danke dir, beim nächsten Mal nehme ich mir mehr Zeit fürs Finish." },
    { rating: 5, text: "Locken endlich richtig geschnitten – endlich jemand, der sich damit auskennt.", tags: ["Gute Beratung"], services: ["damenhaarschnitt"] },
    { rating: 5, text: "Pünktlich, freundlich und schnell fertig.", tags: ["Pünktlich"] },
    { rating: 4, text: "Guter Haarschnitt, die Konturen hätten etwas schärfer sein dürfen.", tags: [], services: ["herrenhaarschnitt"], reply: "Danke, beim nächsten Mal arbeite ich die Konturen genauer nach." },
    { rating: 5, text: "Mein Vater kommt schlecht aus dem Haus, so ist der Friseurbesuch für ihn wieder einfach.", tags: ["Freundlich"], services: CUT, reply: "Liebe Grüße an deinen Vater, es war ein schöner Termin." },
    { rating: 3, text: "Schnitt in Ordnung, aber hinten ist eine Seite etwas kürzer geworden.", tags: [], services: CUT, reply: "Das tut mir leid – ich gleiche das gern kostenlos aus, melde dich einfach." },
    { rating: 5, text: "Styling für die Hochzeit meiner Schwester – alle waren begeistert.", tags: ["Professionell"], services: ["hochsteckfrisur", "foehnen-styling"] },
    { rating: 4, text: "Schöner Pony, der Termin hat sich aber eine halbe Stunde verschoben.", tags: ["Freundlich"], services: ["damenhaarschnitt"], reply: "Entschuldige die Verspätung und danke für deine Geduld." },
    { rating: 5, text: "Spitzen geschnitten, ehrlich beraten und kein Verkaufsgespräch. Genau richtig.", tags: ["Gute Beratung"], services: ["damenhaarschnitt"] },
    { rating: 5, text: "Handtuch und Umhang waren dabei, alles sehr ordentlich.", tags: ["Sauber gearbeitet"] },
    { rating: 5, text: "Zum dritten Mal gebucht, es sitzt jedes Mal.", tags: ["Wieder buchen"], reply: "Danke für deine Treue, bis zum nächsten Mal." },
    { rating: 4, text: "Sehr nett, nur etwas mehr Zeit für das Styling am Ende wäre schön gewesen.", tags: ["Freundlich"], services: ["foehnen-styling", "hochsteckfrisur"] },
    { rating: 5, text: "Undercut nachgeschnitten, schnell und präzise.", tags: ["Pünktlich", "Professionell"], services: ["herrenhaarschnitt"] },
    { rating: 5, text: "Die Föhnfrisur hat den ganzen Abend gehalten.", tags: ["Professionell"], services: ["foehnen-styling"] },
    { rating: 2, text: "Leider wurde deutlich mehr abgeschnitten als besprochen.", tags: [], services: CUT, reply: "Das tut mir sehr leid. Ich hätte vor dem Schneiden noch einmal nachfragen müssen – ich melde mich über SOMA bei dir." },
    { rating: 5, text: "Fade und Übergang sauber gearbeitet, ich bin sehr zufrieden.", tags: ["Sauber gearbeitet"], services: ["herrenhaarschnitt"] },
    { rating: 5, text: "Meine Haare fühlen sich nach Schnitt und Pflege viel weicher an.", tags: ["Professionell"], services: ["damenhaarschnitt"] },
    { rating: 5, text: null, tags: ["Wieder buchen", "Pünktlich"] },
  ],
  "brows-lashes": [
    { rating: 5, text: "Das Wimpernlifting sieht so natürlich aus. Sehr sanft und geduldig.", tags: ["Professionell"], services: ["wimpernlifting"], reply: "Danke dir, viel Freude mit den geschwungenen Wimpern." },
    { rating: 5, text: "Brauen endlich in Form. Super Beratung zur passenden Form.", tags: ["Gute Beratung"], services: BROWS },
    { rating: 4, text: "Tolles Ergebnis, der Verträglichkeitstest vorab war eine gute Idee.", tags: ["Freundlich"], services: ["wimpernlifting", "brow-lamination"] },
    { rating: 5, text: null, tags: ["Wieder buchen"] },
    { rating: 4, text: "Sehr schön geworden, hat insgesamt aber fast zwei Stunden gedauert.", tags: [], services: ["wimpernverlaengerung-neuset"], reply: "Danke – ein Neuset braucht diese Zeit, ich sage das künftig vorher klarer an." },
    { rating: 5, text: "Die Brauen sind voller, aber nicht künstlich. Genau richtig.", tags: ["Professionell"], services: ["brow-lamination"] },
    { rating: 5, text: "Sehr sanft beim Zupfen, das kenne ich sonst ganz anders.", tags: ["Freundlich"], services: ["brauen-zupfen-faerben"], reply: "Freut mich sehr, dass es so angenehm war." },
    { rating: 4, text: "Schönes Lifting, die rechte Seite ist minimal stärker geschwungen.", tags: [], services: ["wimpernlifting"], reply: "Danke für den Hinweis, beim nächsten Mal gleiche ich das genauer aus." },
    { rating: 5, text: "Wimpern seit drei Wochen schön geschwungen, ich spare mir jeden Morgen Zeit.", tags: ["Wieder buchen"], services: ["wimpernlifting"] },
    { rating: 5, text: "Pünktlich, ruhig und sehr sauber gearbeitet.", tags: ["Pünktlich", "Sauber gearbeitet"] },
    { rating: 4, text: "Gute Färbung, die Farbe ist einen Ton dunkler als gedacht.", tags: [], services: ["brauen-zupfen-faerben"], reply: "Danke – die Farbe wird in ein paar Tagen etwas heller, sonst melde dich gern." },
    { rating: 5, text: "Die Brow Lamination hat die ganzen Ferien gehalten.", tags: ["Professionell"], services: ["brow-lamination"] },
    { rating: 5, text: "Sehr gute Beratung, welche Brauenform zu meinem Gesicht passt.", tags: ["Gute Beratung"], services: BROWS },
    { rating: 3, text: "Ergebnis okay, aber das Lifting hat sich nach zwei Wochen schon gelöst.", tags: [], services: ["wimpernlifting"], reply: "Das tut mir leid. Melde dich gern über SOMA, dann schauen wir uns das gemeinsam an." },
    { rating: 5, text: "Das Auffüllen ging schnell, und die Wimpern sehen wieder gleichmäßig aus.", tags: ["Pünktlich"], services: ["wimpernverlaengerung-auffuellen"] },
  ],
};

/** Reviews for Selin A. (testkunde-b2b@soma.test): 30+ texts, about 4.8 ★; replies written per review. */
export const SELIN_REVIEWS: ReviewTemplate[] = [
  { rating: 5, text: "Selin hat eine unglaublich ruhige Art. Nach zehn Minuten war ich weg.", tags: ["Entspannend"], reply: "Danke dir, genau so soll es sein." },
  { rating: 5, text: "Selin hat wirklich an alles gedacht: Liege, warme Tücher, leise Musik.", tags: ["Professionell"] },
  { rating: 5, text: "Die Hot-Stone-Massage war genau das Richtige nach einer langen Woche.", tags: ["Entspannend", "Wieder buchen"], services: ["hot-stone-massage"], reply: "Freut mich sehr, dass die Hot-Stones so gut angekommen sind." },
  { rating: 4, text: "Sehr angenehm, beim nächsten Mal wünsche ich mir etwas mehr Druck im Nacken.", tags: ["Freundlich"], reply: "Danke für den Hinweis mit dem Nacken – das merke ich mir für den nächsten Termin." },
  { rating: 5, text: "Pünktlich, herzlich und eine Massage, an die ich noch Tage später denke.", tags: ["Pünktlich", "Entspannend"] },
  { rating: 5, text: "Ich buche Selin jetzt jeden Monat. Jedes Mal genauso gut.", tags: ["Wieder buchen"], reply: "Danke dir, bis zum nächsten Monat." },
  { rating: 5, text: "Selin hat vorher nach meinen Verspannungen gefragt und genau dort gearbeitet.", tags: ["Gute Beratung"] },
  { rating: 5, text: "Nach einem langen Messetag war die Massage zu Hause genau das Richtige.", tags: ["Entspannend"], reply: "Schön, dass du nach dem Messetag so gut abschalten konntest." },
  { rating: 4, text: "Wunderbare Aromaölmassage. Der Aufbau hat ein paar Minuten länger gedauert.", tags: ["Entspannend"], services: ["aromaoelmassage"], reply: "Danke für deine Geduld beim Aufbau – beim nächsten Mal bin ich schneller." },
  { rating: 5, text: "So entspannt war ich seit dem Urlaub nicht mehr.", tags: ["Entspannend"] },
  { rating: 5, text: "Sehr professionell und trotzdem persönlich. Klare Empfehlung.", tags: ["Professionell", "Freundlich"], reply: "Vielen Dank für die schöne Bewertung." },
  { rating: 5, text: "Meine Schultern fühlen sich wie neu an, und die Öle duften herrlich.", tags: ["Entspannend"], services: ["aromaoelmassage"], reply: "Danke dir, die Öle mische ich jedes Mal frisch." },
  { rating: 5, text: "30 Minuten Rücken und Nacken in der Mittagspause – genau richtig.", tags: ["Pünktlich"], services: ["ruecken-nacken-massage"] },
  { rating: 4, text: "Tolle Massage, die Musik hätte für meinen Geschmack etwas leiser sein dürfen.", tags: ["Freundlich"], reply: "Danke, ich drehe die Musik beim nächsten Mal leiser." },
  { rating: 5, text: "Selin ist zuverlässig, ruhig und sehr aufmerksam. Danke für die schöne Stunde.", tags: ["Freundlich"], services: ["entspannungsmassage:60", "aromaoelmassage:60"], reply: "Danke dir, es war mir eine Freude." },
  { rating: 5, text: "Ich hatte das erste Mal eine Massage zu Hause und war begeistert, wie unkompliziert es war.", tags: ["Professionell"] },
  { rating: 5, text: "90 Minuten, die sich wie Urlaub angefühlt haben.", tags: ["Entspannend", "Wieder buchen"], services: ["entspannungsmassage:90", "hot-stone-massage"], reply: "Wie schön – die lange Variante lohnt sich wirklich." },
  { rating: 5, text: "Die Liege stand so, dass ich danach direkt auf dem Sofa liegen bleiben konnte.", tags: ["Professionell"] },
  { rating: 5, text: "Sehr sauber, sehr freundlich und eine wunderbar gleichmäßige Massage.", tags: ["Sauber gearbeitet"] },
  { rating: 4, text: "Gute Massage, ich hätte gern etwas mehr Zeit für die Beine gehabt.", tags: [], services: ["entspannungsmassage", "aromaoelmassage", "hot-stone-massage"], reply: "Danke, dass du mir Feedback gibst. Beim nächsten Mal plane ich mehr Zeit für die Beine ein." },
  { rating: 5, text: "Als Geschenk für meine Mutter gebucht – sie schwärmt noch heute davon.", tags: ["Freundlich"], reply: "Herzlichen Dank, liebe Grüße an deine Mutter." },
  { rating: 5, text: "Kräftig, wo es nötig war, sanft, wo es gut tat. Genau so soll es sein.", tags: ["Professionell"] },
  { rating: 5, text: "Pünktlich auf die Minute und alles wieder ordentlich zusammengepackt.", tags: ["Pünktlich", "Sauber gearbeitet"] },
  { rating: 5, text: "Ich schlafe nach Selins Massagen immer besonders gut.", tags: ["Entspannend"], reply: "Ich freue mich, dass du so gut schlafen kannst." },
  { rating: 5, text: "Angenehme Gespräche am Anfang, danach ganz viel Ruhe. Perfekt.", tags: ["Freundlich", "Entspannend"] },
  { rating: 4, text: "Sehr gute Massage, der Termin hat sich um eine Viertelstunde verschoben.", tags: ["Freundlich"], reply: "Sorry für die Verspätung und danke für deine Geduld." },
  { rating: 5, text: "Die warmen Steine auf dem Rücken waren ein Traum.", tags: ["Entspannend"], services: ["hot-stone-massage"] },
  { rating: 5, text: "Zum dritten Mal gebucht, und jedes Mal ein bisschen besser auf mich abgestimmt.", tags: ["Wieder buchen", "Gute Beratung"], reply: "Danke für das Vertrauen, bis bald." },
  { rating: 5, text: "Sehr empfehlenswert für alle, die viel am Schreibtisch sitzen.", tags: ["Professionell"] },
  { rating: 5, text: "Zum Schluss gab es noch zwei Dehnübungen, die wirklich helfen.", tags: ["Gute Beratung"], reply: "Danke dir. Die Dehnübungen wirken am besten, wenn du sie täglich machst." },
  { rating: 5, text: "Ruhig, warm, gut organisiert – ich freue mich schon auf den nächsten Termin.", tags: ["Wieder buchen"] },
  { rating: 5, text: "Ich war skeptisch wegen Massage zu Hause, jetzt will ich nichts anderes mehr.", tags: ["Entspannend"], reply: "Danke, dass du es ausprobiert hast – schön, dass es dich überzeugt hat." },
  { rating: 5, text: "Mein Nacken war nach den 30 Minuten endlich wieder beweglich.", tags: ["Professionell"], services: ["ruecken-nacken-massage"], reply: "Freut mich, dass die kurze Massage so viel gebracht hat." },
];

/** true when a template may be used for a booking of `serviceSlug` with `durationMinutes`. */
export function reviewFits(t: ReviewTemplate, serviceSlug: string, durationMinutes: number): boolean {
  return !t.services || t.services.includes(serviceSlug) || t.services.includes(`${serviceSlug}:${durationMinutes}`);
}

export const SEARCH_POSTAL_CODES: Record<string, string[]> = {
  berlin: ["10405", "10997", "10115", "10719", "12043", "10827", "10437", "10178", "13353", "12049"],
  muenchen: ["80799", "81667", "80469", "81369", "80636", "80331", "81543"],
  hamburg: ["22765", "20357", "20249", "22085", "20099", "20146", "22303"],
  koeln: ["50672", "50679", "50733", "50674"],
  frankfurt: ["60318", "60325", "60594", "60316"],
  duesseldorf: ["40477", "40545", "40211", "40219"],
  none: ["01067", "70173", "04109", "90402", "30159"],
};
