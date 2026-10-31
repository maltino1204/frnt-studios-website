import { notFound } from "next/navigation";
import { ArrowRight, CalendarCheck, Car, Search, Wallet } from "lucide-react";
import { DEMO_MODE } from "@/lib/brand";
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
import { AuraArt, AuraBackground } from "@/components/ui/aura";
import { Surface, GlassPanel } from "@/components/ui/surface";
import { Badge, Kbd } from "@/components/ui/badge";
import { SuccessCheck } from "@/components/ui/success";
import { FloatingCard, FloatingStage } from "@/components/ui/floating";
import { AreaChart } from "@/components/ui/chart";
import { CountUp, Reveal, Spotlight } from "@/components/ui/motion";
import { KitInteractive } from "./interactive";

export const metadata = { title: "UI-Kit", robots: { index: false } };
// Evaluated at request time so DEMO_MODE=false in production always yields 404 (QA R19).
export const dynamic = "force-dynamic";

const CATEGORIES = [
  ["massage", "Massage"],
  ["manikuere", "Maniküre"],
  ["pedikuere", "Pediküre"],
  ["kosmetik", "Kosmetik"],
  ["make-up", "Make-up"],
  ["haare-styling", "Haare & Styling"],
  ["brows-lashes", "Brows & Lashes"],
  ["nacht", "Abends"],
] as const;

const WEEKS = [
  { label: "KW 37", value: 3120 },
  { label: "KW 38", value: 3480 },
  { label: "KW 39", value: 3310 },
  { label: "KW 40", value: 3950 },
  { label: "KW 41", value: 4210 },
  { label: "KW 42", value: 4080 },
  { label: "KW 43", value: 4560 },
  { label: "KW 44", value: 4820 },
];

/** Internal component preview (demo/dev only). Reference for Design v2. */
export default function KitPage() {
  if (!DEMO_MODE) notFound();
  return (
    <main className="pb-24">
      {/* Hero reference: product-led floating composition on the aura */}
      <section className="relative isolate overflow-clip pt-10 pb-16 lg:pt-16 lg:pb-24">
        <AuraBackground placement="right" />
        <Container className="grid items-center gap-12 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="flex items-center gap-6">
              <Wordmark className="h-7 lg:h-7" />
              <Mark className="h-7" />
            </div>
            <Overline>Design-System v2</Overline>
            <h1 className="type-display-xl">
              Wellness, die zu Ihnen kommt. <em>Präzise gemacht.</em>
            </h1>
            <p className="max-w-[34rem] type-body-l text-ink-muted">Komponenten-Übersicht für Engineering und QA: Tokens, Haptik, Glas, Aura und Daten.</p>
            <div className="flex flex-wrap gap-3">
              <Button size="l" iconRight={<Icon icon={ArrowRight} />}>Verfügbare Profis anzeigen</Button>
              <Button size="l" variant="secondary">Für Profis</Button>
            </div>
          </div>
          <FloatingStage className="h-[30rem] lg:col-span-7 lg:h-[34rem]" placement="center">
            <FloatingCard className="top-[4%] left-[2%] w-[min(19rem,78%)]" depth={10} tilt={-1.5} enter={0} cardClassName="p-4">
              <div className="flex gap-3">
                <Portrait name="Selin A." sizes="64px" className="w-16 shrink-0" />
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="flex items-center gap-1.5 type-heading-s">Selin A. <VerifiedBadge /></p>
                  <Rating avg={4.9} count={87} />
                  <p className="type-caption text-ink-muted">Entspannungsmassage · 60 Min.</p>
                </div>
              </div>
              <div className="mt-3 flex gap-1.5">
                {["18:30", "19:00", "19:30"].map((t, i) => (
                  <span key={t} className={i === 1 ? "inline-flex h-8 items-center rounded-tile bg-ink px-3 type-label-s text-ink-inverse shadow-ink num" : "inline-flex h-8 items-center rounded-tile border border-line-mid bg-surface-raised px-3 type-label-s num"}>
                    {t}
                  </span>
                ))}
              </div>
            </FloatingCard>
            <FloatingCard className="top-[40%] right-[0%] w-[min(17rem,70%)]" depth={22} glass enter={1} float cardClassName="flex items-center gap-3 p-3.5">
              <SuccessCheck size={36} glow={false} />
              <div>
                <p className="type-heading-s">Bestätigt.</p>
                <p className="type-caption text-ink-muted">Fr., 14. Nov. · 19:00</p>
              </div>
            </FloatingCard>
            <FloatingCard className="bottom-[6%] left-[10%] w-[min(15rem,62%)]" depth={16} tilt={1.5} enter={2} cardClassName="p-4">
              <p className="type-overline text-ink-muted">Start-Code</p>
              <p className="mt-2 flex gap-1.5 stagger-rise">
                {"4827".split("").map((d, i) => (
                  <span key={i} className="inline-flex h-11 w-9 items-center justify-center rounded-tile bg-surface-sunken type-heading-l num">
                    {d}
                  </span>
                ))}
              </p>
            </FloatingCard>
            <FloatingCard className="top-[8%] right-[4%] hidden w-52 sm:block" depth={28} glass enter={3} cardClassName="flex items-center justify-between gap-3 px-4 py-3">
              <span className="inline-flex items-center gap-2 type-label-s text-ink"><Icon icon={Car} size={16} /> Anfahrt</span>
              <span className="type-label-s num">5,00 €</span>
            </FloatingCard>
          </FloatingStage>
        </Container>
      </section>

      <Container className="flex flex-col gap-20">
        <section className="flex flex-col gap-6">
          <SectionHeader overline="Aura" title={<>Generativ, <em>pro Seed gleich.</em></>} lead="Fallbacks für Bilder: Kategorie-Farbtöne, Schichten, feines Korn." />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {CATEGORIES.map(([slug, label]) => (
              <div key={slug} className="flex flex-col gap-2">
                <div className="relative aspect-[4/5] overflow-hidden rounded-card shadow-raised">
                  <Photo src={null} alt="" tone={slug} word={label} sizes="25vw" className="h-full" />
                </div>
                <p className="type-label-s text-ink-muted">{slug}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name="Selin Aydın" size={48} />
            <Avatar name="Jonas Weber" size={40} />
            <Avatar name="Kiran Patel" size={32} />
            <Avatar name="Lena Müller" size={24} />
            <Portrait name="Lena M." sizes="72px" className="w-18" />
            <Portrait name="Anna K." sizes="200px" ratio="4/5" className="w-44 rounded-card" />
            <div className="relative size-24 overflow-hidden rounded-card"><AuraArt seed="kit-art" animate /></div>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <Overline>Elevation &amp; Glas</Overline>
          <div className="relative isolate grid gap-4 overflow-clip rounded-panel p-6 sm:grid-cols-2 lg:grid-cols-4 lg:p-10">
            <AuraBackground variant="section" placement="full" fade="none" />
            <Surface elevation={0} className="p-5"><p className="type-label">Level 0</p><p className="type-caption text-ink-muted">sunken, in der Fläche</p></Surface>
            <Surface elevation={1} className="p-5"><p className="type-label">Level 1</p><p className="type-caption text-ink-muted">shadow-raised: Karten</p></Surface>
            <Surface elevation={2} className="p-5"><p className="type-label">Level 2</p><p className="type-caption text-ink-muted">shadow-float: Hover, Popover</p></Surface>
            <GlassPanel className="p-5"><p className="type-label">Glas</p><p className="type-caption text-ink">glass-strong + glass-edge</p></GlassPanel>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Spotlight className="rounded-panel">
              <Surface as="a" href="#" interactive radius="panel" className="flex flex-col gap-2 p-6">
                <Badge tone="aura" dot>Neu</Badge>
                <p className="type-heading-l">Spotlight + Lift</p>
                <p className="type-body-s text-ink-muted">Zeiger-Licht (nur Maus), Hover hebt auf Level 2, Druck federt.</p>
              </Surface>
            </Spotlight>
            <Surface className="flex flex-col gap-3 p-6">
              <div className="flex flex-wrap gap-2">
                <Badge>Neutral</Badge>
                <Badge tone="accent" dot>Sofort bestätigt</Badge>
                <Badge tone="success" dot>Bezahlt</Badge>
                <Badge tone="warning" dot>Angefragt</Badge>
                <Badge tone="danger" dot>Storniert</Badge>
                <Badge tone="ink" size="s">Pro</Badge>
              </div>
              <p className="flex items-center gap-2 type-body-s text-ink-muted">Schließen mit <Kbd>Esc</Kbd>, Navigation einklappen mit <Kbd>[</Kbd></p>
            </Surface>
          </div>
        </section>

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

        <section className="grid gap-8 md:grid-cols-2 [&>*]:min-w-0">
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
            <div className="flex flex-wrap gap-2">
              <Status tone="success">Bestätigt</Status>
              <Status tone="warning">Angefragt</Status>
              <Status tone="danger">Storniert</Status>
              <Status tone="accent">Läuft</Status>
              <Status>Abgeschlossen</Status>
              <Status tone="success" variant="dot">Dicht</Status>
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
            <Notice kind="success">Adresse gespeichert.</Notice>
            <Notice kind="warning">Belastung erst nach Bestätigung durch die Fachkraft.</Notice>
            <Notice kind="danger" title="Zahlung fehlgeschlagen">Bitte prüfen Sie Ihre Karte.</Notice>
            <TabLinks label="Termine" items={[{ href: "/kit", label: "Bevorstehend", active: true, count: 2 }, { href: "/kit?b", label: "Vergangen" }, { href: "/kit?c", label: "Storniert" }]} />
            <StepIndicator steps={["Übersicht", "Ort", "Kontakt", "Zahlung"]} current={1} />
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-2 [&>*]:min-w-0">
          <div className="flex flex-col gap-4">
            <Overline>Preis &amp; Bedingungen</Overline>
            <Surface className="p-5">
              <PriceBreakdown
                lines={[{ label: "Behandlung", detail: "Entspannungsmassage · 60 Min.", cents: 7900 }, { label: "Anfahrt", cents: 500 }, { label: "Guthaben", cents: 1000, kind: "credit" }]}
                totalCents={7400}
                notes={["inkl. 19 % MwSt.", "SOMA vermittelt; Vertragspartner ist Anna K."]}
              />
              <CheckLine className="mt-3">Kostenlos stornierbar bis Mittwoch, 18:30 Uhr.</CheckLine>
            </Surface>
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
            <StatTile label="Umsatz (Woche)" icon={<Icon icon={Wallet} size={16} />} value={<CountUp value={4820} suffix=" €" />} delta={12} spark={WEEKS.map((w) => w.value)} />
            <StatTile label="Buchungen" icon={<Icon icon={CalendarCheck} size={16} />} value={<CountUp value={38} />} delta={-4} spark={[41, 44, 40, 39, 42, 40, 38]} />
            <StatTile label="Ø Bewertung" value="4,8" hint="aus 214 Bewertungen" />
            <StatTile label="Auslastung" value={<CountUp value={71} suffix=" %" />} delta={3.5} spark={[60, 62, 65, 63, 68, 70, 71]} />
          </StatGrid>
          <Surface className="p-5 lg:p-6">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <p className="type-heading-m">Umsatz</p>
              <p className="type-caption text-ink-muted">Letzte 8 Wochen</p>
            </div>
            <AreaChart data={WEEKS} compare={[2900, 3000, 3200, 3300, 3500, 3600, 3700, 3900]} unit=" €" summary="Umsatz der letzten 8 Wochen: von 3.120 € in KW 37 auf 4.820 € in KW 44, über dem Vorjahreszeitraum." />
          </Surface>
          <Table stickyHeader>
            <thead><tr><th>Referenz</th><th>Profi</th><th>Status</th><th className="text-right">Betrag</th></tr></thead>
            <tbody>
              <tr><td className="code-ref">SM-7KX4Q2</td><td>Selin A.</td><td><Status tone="success">Bestätigt</Status></td><td className="text-right num">84,00 €</td></tr>
              <tr><td className="code-ref">SM-3HD9P1</td><td>Jonas W.</td><td><Status tone="warning">Angefragt</Status></td><td className="text-right num">112,50 €</td></tr>
              <tr><td className="code-ref">SM-9PL2X7</td><td>Lena M.</td><td><Status tone="accent">Läuft</Status></td><td className="text-right num">69,00 €</td></tr>
            </tbody>
          </Table>
        </section>

        <Reveal as="section" className="flex flex-col gap-4">
          <Overline>Leer &amp; Laden</Overline>
          <div className="grid gap-8 md:grid-cols-2">
            <EmptyState title="Noch keine Termine." action={<ButtonLink href="/">Behandlung finden</ButtonLink>}>
              Sobald Sie buchen, finden Sie Ihre Termine hier.
            </EmptyState>
            <Surface className="flex gap-4 p-4"><Skeleton className="size-18 rounded-tile" /><SkeletonText className="flex-1" /></Surface>
          </div>
        </Reveal>

        <Reveal stagger className="grid gap-4 md:grid-cols-3">
          {["Reveal", "mit", "Stagger"].map((w) => (
            <Surface key={w} className="p-6"><p className="type-display-s">{w}</p></Surface>
          ))}
        </Reveal>

        <section data-theme="night" className="relative isolate -mx-(--space-gutter) flex flex-col gap-4 overflow-clip rounded-panel px-(--space-gutter) py-12 lg:mx-0 lg:px-12">
          <AuraBackground variant="night" placement="right" fade="none" />
          <Overline>Nacht (ein Band)</Overline>
          <p className="type-display-m">Abends im Hotel. <em>Ohne Umweg.</em></p>
          <div className="flex gap-3"><Button>Primär auf Nacht</Button><Button variant="secondary">Sekundär</Button></div>
        </section>
      </Container>
    </main>
  );
}
