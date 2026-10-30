# SOMA – Demo-Anleitung

Diese Anleitung zeigt, wie Sie SOMA starten und einem Kunden vorführen. Ihr Kunde kann es auch selbst testen.
Alle Daten sind fiktiv. Zahlungen laufen im **Testmodus**, es fließt kein echtes Geld.

## 1. Starten (ca. 5 Minuten)

Voraussetzungen: Node.js ≥ 20.11 und PostgreSQL ≥ 15.

```bash
cd soma
npm install
cp .env.example .env.local

createuser -s soma -P          # Passwort: soma
createdb -O soma soma
createdb -O soma soma_test

npm run db:setup -- --reset    # Datenbank anlegen
DEMO_MODE=true npm run db:seed # Demo-Marktplatz mit Testzugängen
npm run dev                    # → http://localhost:3000
```

Für eine Vorführung mit voller Geschwindigkeit verwenden Sie statt `npm run dev` den Produktions-Build:
`npm run build && npm start`.

**Fotos:** `npm run build` lädt alle Fotos automatisch herunter und liefert sie lokal aus. Manuell geht das mit
`npm run images:fetch`. Ohne diesen Schritt kommen die Bilder direkt aus der Bild-CDN und brauchen eine Internetverbindung.

**Vor jeder Vorführung: `npm run demo:refresh`** (höchstens eine Stunde vorher).
Der Befehl stellt den Demo-Zustand neu her. Termine, Bewertungen und Anfragen liegen danach wieder relativ zu „jetzt“.
Zwischen Testkunde und Testkunde B2B gibt es dann einen bestätigten Termin, der **35 Minuten später beginnt**.
So können Sie den Start mit dem Start-Code live zeigen: Ab 30 Minuten vor Beginn lässt sich der Termin starten.
Die offenen Anfragen haben mehrere Stunden Antwortfrist. Laufende Demo-Sitzungen werden dabei abgemeldet.
Führen Sie die automatischen Tests (`npm run test:e2e`) nicht nach dem letzten Refresh aus, denn sie legen Testbuchungen an.

## 2. Die drei Testzugänge

Das Passwort ist für alle drei Zugänge gleich: **`soma-demo-2026`**. Auf `/anmelden` gibt es im Demo-Modus außerdem
Ein-Klick-Buttons für alle drei Zugänge. Passwortänderung, Kontolöschung und Sperren sind für diese Zugänge
deaktiviert. So kann niemand den gemeinsamen Testzugang versehentlich unbrauchbar machen.

| Zugang | E-Mail | Wer | Startseite |
|---|---|---|---|
| **Testkunde** | `testkunde@soma.test` | Julia H., Kundin aus Berlin | `/konto` |
| **Testkunde B2B** | `testkunde-b2b@soma.test` | Selin A., Massage-Profi in Berlin. Profis sind SOMAs Geschäftskunden | `/pro` |
| **Testadmin** | `testadmin@soma.test` | SOMA-Betriebsteam | `/admin` |

### Testkunde – Julia H.
- 3 gespeicherte Adressen: Zuhause in Prenzlauer Berg (10435), Büro in Mitte (10117), Hotel in Frankfurt (60311)
- 10 vergangene Behandlungen bei 6 Profis in 6 Kategorien, darunter Stammprofis; 7 eigene Bewertungen, auf 3 hat der Profi geantwortet
- 2 bevorstehende Termine mit Start-Code, 1 offene Anfrage, 1 kurzfristige Stornierung mit korrekt berechneter Gebühr
- 3 Favoriten, 15 € Guthaben, Empfehlungsprogramm (1 erfolgreich, 1 offen), Benachrichtigungen

### Testkunde B2B – Selin A.
- Vollständiges Profil mit Porträt, Portfolio, 5 Leistungen, Einsatzgebiet und Arbeitszeiten Mo–Sa
- Alle Nachweise geprüft, die Berufshaftpflicht ist gültig bis 2027
- Termine an 5 der nächsten 7 Tage, 2 offene Anfragen mit Antwortfrist
- Einnahmen über 6 Monate mit allen Provisionsstufen (20 % neu · 12 % Stammkundschaft · 5 % über den eigenen Einladungslink), 3 Auszahlungen
- 27 Bewertungen (Ø 4,8), viele davon mit Antwort

### Testadmin
- Verifizierung: 2 Profis warten auf Prüfung (Nora K., Paul A.)
- 1 offener Streitfall; 1 Profi automatisch gesperrt, weil der Versicherungsnachweis abgelaufen ist; 1 Nachweis läuft bald ab
- Auszahlungen bereit (8 Profis), Warteliste und Suchen ohne Ergebnis in der Regionen-Ansicht, Protokoll aller Admin-Aktionen

## 3. Vorschlag für eine 20-Minuten-Demo

1. **Startseite (2 Min.):** Das Versprechen „Wellness, die zu Ihnen kommt“, Kategorien, Echtheit (Bewertungen, SOMA-Garantie).
2. **Buchen als Gast (5 Min.):** PLZ `10115` eingeben, *Massage* wählen, „Verfügbare Profis anzeigen“. Die Preise in der
   Liste sind Endpreise inklusive Anfahrt. Auf einen Termin tippen und die Checkout-Seite durchgehen: Ort (Zuhause, Hotel oder Büro),
   Kontakt ohne Passwort, Preisaufstellung mit MwSt.-Hinweis, kostenlose Stornierung bis zum genannten Zeitpunkt.
   Dann „Zahlungspflichtig buchen“ (Testzahlung). Die Bestätigung zeigt den Start-Code.
3. **Testkunde (4 Min.):** Als Julia anmelden → *Termine* (erneut buchen mit einem Tipp), *Favoriten*, *Guthaben &
   Empfehlungen*, eine Buchung öffnen und die Stornogebühr in der Vorschau zeigen.
4. **Testkunde B2B (5 Min.):** Als Selin anmelden → *Heute* mit offenen Anfragen und Countdown. Eine Anfrage annehmen.
   Den nächsten Termin öffnen und mit dem **Start-Code** starten: Der Code steht beim Testkunden unter *Termine*.
   Dann *Kalender* und *Einnahmen* mit den Provisionsstufen zeigen, zuletzt den Einladungslink („nur 5 % Provision mit deinem Link“).
5. **Testadmin (4 Min.):** *Übersicht* mit Kennzahlen und Arbeitslisten → *Profis & Verifizierung*: Freigabe ist nur
   mit geprüften Nachweisen möglich → *Regionen*: Angebot und Nachfrage pro Stadt → *Provisionen*.

Tipp: Zeigen Sie den Ablauf auf dem Smartphone oder in der mobilen Ansicht des Browsers. SOMA ist mobile-first gestaltet.

## 4. Was in der Demo simuliert ist

| Bereich | In der Demo | Im Live-Betrieb |
|---|---|---|
| Zahlung | Testmodus, deutlich gekennzeichnet, keine Kartendaten | Stripe Connect (Schlüssel erforderlich) |
| E-Mails | werden protokolliert, nicht versendet | E-Mail-Dienst (z. B. Resend) |
| Profis, Kundschaft, Bewertungen | fiktiv; Porträts und Fotos sind KI-generiert und nur zur Illustration | echte Profile mit eigenen Fotos |
| Rechtstexte | Platzhalter, als solche gekennzeichnet | anwaltlich geprüfte Texte |

Der Hinweisbalken „Demo-Umgebung“ oben auf jeder Seite macht das für Ihren Kunden transparent.
Was vor einem echten Start noch fehlt, steht in `docs/STATUS.md` → *Production blockers*.
