import { notFound } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { DEMO_MODE } from "@/lib/brand";
import { images } from "@/lib/images";
import { Wordmark, Mark } from "@/components/brand/logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Select, Checkbox, Switch, RadioRow, Textarea } from "@/components/ui/field";
import { Chip, ChipRow } from "@/components/ui/chip";
import { SegmentedControl } from "@/components/ui/segmented";
import { Container, Overline, SectionHeader, Panel, FactList } from "@/components/ui/layout";
import { EmptyState, Notice, Skeleton, SkeletonText, Status, CountPill } from "@/components/ui/feedback";
import { Rating, Stars, VerifiedBadge } from "@/components/ui/trust";
import { Photo } from "@/components/ui/photo";
import { Avatar, Portrait } from "@/components/ui/avatar";
import { PriceBreakdown, CheckLine, StepIndicator } from "@/components/ui/summary";
import { StatGrid, StatTile, Table } from "@/components/ui/data";
import { TabLinks } from "@/components/ui/tabs";
import { Icon } from "@/components/ui/icon";
import { KitInteractive } from "./interactive";

export const metadata = { title: "UI-Kit", robots: { index: false } };
// Evaluated at request time so DEMO_MODE=false in production always yields 404 (QA R19).
export const dynamic = "force-dynamic";

/** Internal component preview (demo/dev only). */
export default function KitPage() {
  if (!DEMO_MODE) notFound();
  return (
    <main className="py-12">
      <Container className="flex flex-col gap-16">
        <div className="flex items-center gap-8">
          <Wordmark className="h-8 lg:h-8" />
          <Mark className="h-8" />
        </div>
        <SectionHeader overline="Design-System" title="Wellness, die zu Ihnen kommt." lead="Komponenten-Übersicht für Engineering und QA." />

        <section className="flex flex-col gap-4">
          <Overline>Buttons</Overline>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="l" iconRight={<Icon icon={ArrowRight} />}>Verfügbare Profis anzeigen</Button>
            <Button>Primär</Button>
            <Button variant="secondary">Sekundär</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="accent">Akzent</Button>
            <Button variant="link">Link-Button</Button>
            <Button loading>Laden</Button>
            <Button disabled>Deaktiviert</Button>
            <Button size="s" variant="secondary">Klein</Button>
            <ButtonLink href="/" variant="secondary" icon={<Icon icon={Search} />}>Als Link</ButtonLink>
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-5">
            <Overline>Formular</Overline>
            <Input label="Postleitzahl" placeholder="z. B. 10115" hint="Fünfstellig, z. B. 10115" inputMode="numeric" />
            <Input label="E-Mail" error="Bitte geben Sie eine gültige E-Mail-Adresse ein." defaultValue="anna@" />
            <Select label="Behandlung" defaultValue="b">
              <option value="a">Entspannungsmassage</option>
              <option value="b">Shellac-Maniküre</option>
            </Select>
            <Textarea label="Hinweise zur Anfahrt" optional placeholder="z. B. Parken im Hof, 3. OG ohne Aufzug" />
            <Checkbox label="Ich stimme zu, dass die Behandlung vor Ablauf der Widerrufsfrist beginnt." description="Pflichtangabe für Dienstleistungen (§ 356 Abs. 4 BGB)" />
            <Switch label="Erinnerung per SMS" description="24 Stunden vor dem Termin" defaultChecked />
            <SegmentedControl name="ort" label="Ort" defaultValue="home" options={[{ value: "home", label: "Zuhause" }, { value: "hotel", label: "Hotel" }, { value: "office", label: "Büro" }]} />
            <Panel className="px-4">
              <RadioRow name="addr" defaultChecked label="Zuhause" description="Kastanienallee 12, 10435 Berlin" />
              <RadioRow name="addr" label="Büro" description="Am Sandtorkai 50, 20457 Hamburg" />
            </Panel>
          </div>
          <div className="flex flex-col gap-5">
            <Overline>Chips &amp; Status</Overline>
            <ChipRow label="Zeitfenster">
              <Chip selected showCheck>So bald wie möglich</Chip>
              <Chip>Heute</Chip>
              <Chip>Morgen</Chip>
              <Chip>Datum wählen</Chip>
            </ChipRow>
            <div className="flex flex-wrap gap-4">
              <Status tone="success">Bestätigt</Status>
              <Status tone="warning">Angefragt</Status>
              <Status tone="danger">Storniert</Status>
              <Status tone="accent">Läuft</Status>
              <Status>Abgeschlossen</Status>
              <CountPill>3</CountPill>
              <CountPill accent>12</CountPill>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <VerifiedBadge withLabel size={20} />
              <Rating avg={4.87} count={128} />
              <Rating avg={5} count={2} />
              <Stars value={4} />
            </div>
            <Notice kind="info" title="Testmodus">Es wird keine echte Zahlung ausgeführt.</Notice>
            <Notice kind="warning">Belastung erst nach Bestätigung durch die Fachkraft.</Notice>
            <TabLinks label="Termine" items={[{ href: "/kit", label: "Bevorstehend", active: true, count: 2 }, { href: "/kit?b", label: "Vergangen" }, { href: "/kit?c", label: "Storniert" }]} />
            <StepIndicator steps={["Übersicht", "Ort", "Kontakt", "Zahlung"]} current={1} />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <Overline>Fotografie &amp; Fallback</Overline>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div><Photo src={images.category("massage")} alt="Massage" tone="massage" word="Massage" ratio="4/5" sizes="25vw" /><p className="mt-2 type-heading-s">Massage</p></div>
            <div><Photo src={null} alt="" tone="manikuere" word="Maniküre" ratio="4/5" sizes="25vw" /><p className="mt-2 type-heading-s">Maniküre (Fallback)</p></div>
            <div><Photo src={null} alt="" tone="brows-lashes" word="Brows & Lashes" ratio="4/5" sizes="25vw" /><p className="mt-2 type-heading-s">Brows &amp; Lashes</p></div>
            <div><Portrait src="/images/pros/pro-01.jpg" name="Selin A." ratio="4/5" sizes="25vw" /><p className="mt-2 type-heading-s">Portrait</p></div>
          </div>
          <div className="flex items-center gap-3">
            <Avatar name="Selin Aydın" src="/images/pros/pro-01.jpg" size={48} />
            <Avatar name="Jonas Weber" size={40} />
            <Avatar name="Kiran" size={32} />
            <Portrait name="Lena M." sizes="72px" className="w-18" />
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Overline>Preis &amp; Bedingungen</Overline>
            <PriceBreakdown
              lines={[{ label: "Behandlung", detail: "Entspannungsmassage · 60 Min.", cents: 7900 }, { label: "Anfahrt", cents: 500 }, { label: "Guthaben", cents: 1000, kind: "credit" }]}
              totalCents={7400}
              notes={["inkl. 19 % MwSt.", "SOMA vermittelt; Vertragspartner ist Anna K."]}
            />
            <CheckLine>Kostenlos stornierbar bis Mittwoch, 18:30 Uhr.</CheckLine>
            <FactList items={[{ label: "Sprachen", value: "Deutsch, Englisch, Türkisch" }, { label: "Erfahrung", value: "12 Jahre" }]} />
          </div>
          <div className="flex flex-col gap-4">
            <Overline>Interaktiv</Overline>
            <KitInteractive />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <Overline>Dashboard</Overline>
          <StatGrid>
            <StatTile label="Umsatz (Woche)" value="4.820 €" delta={12} />
            <StatTile label="Buchungen" value="38" delta={-4} />
            <StatTile label="Ø Bewertung" value="4,8" hint="aus 214 Bewertungen" />
            <StatTile label="Auslastung" value="71 %" delta={3.5} />
          </StatGrid>
          <Table>
            <thead><tr><th>Referenz</th><th>Profi</th><th>Status</th><th className="text-right">Betrag</th></tr></thead>
            <tbody>
              <tr><td className="code-ref">SM-7KX4Q2</td><td>Selin A.</td><td><Status tone="success">Bestätigt</Status></td><td className="text-right num">84,00 €</td></tr>
              <tr><td className="code-ref">SM-3HD9P1</td><td>Jonas W.</td><td><Status tone="warning">Angefragt</Status></td><td className="text-right num">112,50 €</td></tr>
            </tbody>
          </Table>
        </section>

        <section className="flex flex-col gap-4">
          <Overline>Leer &amp; Laden</Overline>
          <div className="grid gap-8 md:grid-cols-2">
            <EmptyState title="Noch keine Termine." action={<ButtonLink href="/">Behandlung finden</ButtonLink>}>
              Sobald Sie buchen, finden Sie Ihre Termine hier.
            </EmptyState>
            <div className="flex gap-4"><Skeleton className="size-18" /><SkeletonText className="flex-1" /></div>
          </div>
        </section>

        <section data-theme="night" className="-mx-(--space-gutter) flex flex-col gap-4 px-(--space-gutter) py-12">
          <Overline>Nacht</Overline>
          <p className="type-display-m">Abends im Hotel. Ohne Umweg.</p>
          <div className="flex gap-3"><Button>Primär auf Nacht</Button><Button variant="secondary">Sekundär</Button></div>
        </section>
      </Container>
    </main>
  );
}
