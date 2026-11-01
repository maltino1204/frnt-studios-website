import type { CSSProperties, ReactNode } from "react";
import { notFound } from "next/navigation";
import localFont from "next/font/local";
import {
  ArrowRight,
  CalendarDays,
  Car,
  Check,
  CircleAlert,
  CircleCheck,
  Clock,
  CreditCard,
  Info,
  MapPin,
  Search,
  ShieldCheck,
  TriangleAlert,
  UserRound,
  X,
  House,
  CalendarCheck,
  MessageCircle,
} from "lucide-react";
import { DEMO_MODE } from "@/lib/brand";
import { BRAND } from "./data.generated";
import { DrawOn } from "./draw-on";
import "./marke.css";

/** Class names: every rule in marke.css is prefixed `mk-` and scoped to .mk-root. */
const s = new Proxy({} as Record<string, string>, { get: (_, k) => `mk-${String(k)}` });

/*
 * SOMA brand book (v1.1). Renders the real masters from brand/assets via the generated data module
 * (brand/tools/build-kit-data.mjs). Styles and font variables are scoped to this page (marke.css, prefix mk-).
 * Photos: the v2 development set only, each labelled as AI-generated.
 */

const sans = localFont({
  src: "../../../../brand/assets/typography/fonts/instrument-sans-variable-latin.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-marke-sans",
  declarations: [{ prop: "font-stretch", value: "75% 100%" }],
});
const display = localFont({
  src: "../../../../brand/assets/typography/fonts/newsreader-display-roman-latin.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-marke-display",
  adjustFontFallback: "Times New Roman",
});
const italic = localFont({
  src: "../../../../brand/assets/typography/fonts/newsreader-display-italic-latin.woff2",
  weight: "400",
  style: "italic",
  display: "swap",
  preload: false,
  variable: "--font-marke-italic",
  adjustFontFallback: "Times New Roman",
});

export const metadata = { title: "Markenbuch", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NB = " ";
type Paths = readonly { readonly id: string; readonly d: string }[];
type VB = readonly number[];

/* ------------------------------------------------------------------ artwork primitives */
function Mark({ viewBox, paths, label, className, style }: { viewBox: VB; paths: Paths; label: string; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox={viewBox.join(" ")} role="img" aria-label={label} className={className} style={style}>
      <g fill="currentColor">
        {paths.map((p) => (
          <path key={p.id} d={p.d} />
        ))}
      </g>
    </svg>
  );
}
type Lock = { readonly viewBox: VB; readonly groups: readonly { readonly id: string; readonly transform: string | null; readonly paths: readonly string[] }[] };
function Lockup({ lock, label, style }: { lock: Lock; label: string; style?: CSSProperties }) {
  return (
    <svg viewBox={lock.viewBox.join(" ")} role="img" aria-label={label} style={{ width: "100%", height: "auto", maxHeight: "none", ...style }}>
      <g fill="currentColor">
        {lock.groups.map((g) => (
          <g key={g.id} transform={g.transform ?? undefined}>
            {g.paths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
const W = BRAND.final.wordmark;
function Wordmark({ height, micro, label = "SOMA", style }: { height?: number; micro?: boolean; label?: string; style?: CSSProperties }) {
  const m = micro ? BRAND.final.micro : W;
  return <Mark viewBox={m.viewBox} paths={m.paths} label={label} style={{ height, width: height ? "auto" : "100%", display: "block", ...style }} />;
}
/** The mark, "S im O" (line cut from 32 px). */
function Symbol({ height = 96, label = "SOMA Zeichen" }: { height?: number; label?: string }) {
  const sym = BRAND.final.symbol;
  return <Mark viewBox={sym.viewBox} paths={sym.paths} label={label} style={{ height, width: "auto", display: "block", maxHeight: "none" }} />;
}
/** The seal cut (under 32 px): the O filled, the S set into it. */
function Seal({ height = 32, label = "SOMA Zeichen, Siegel-Schnitt" }: { height?: number; label?: string }) {
  const sym = BRAND.final.seal;
  return <Mark viewBox={sym.viewBox} paths={sym.paths} label={label} style={{ height, width: "auto", display: "block", maxHeight: "none" }} />;
}
function AppIcon({ size = 120, radius = 0.2237 }: { size?: number; radius?: number }) {
  return (
    <svg viewBox="0 0 1024 1024" width={size} height={size} role="img" aria-label="SOMA App-Icon" style={{ display: "block", flex: "none", width: size, height: size, maxHeight: "none" }}>
      <rect width="1024" height="1024" rx={1024 * radius} fill="#542C35" />
      <g fill="#F3EFE8">
        {BRAND.final.appIcon.paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
/** Favicon as shipped (brand/assets/icons/favicon.svg): the seal in Oxblood over a Bone rim (keeps its edge on dark tabs). */
function Favicon({ size = 16 }: { size?: number }) {
  const sym = BRAND.final.seal;
  const [, , w, h] = sym.viewBox;
  const k = (size * 0.875) / h;
  const rim = size * 0.05;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden style={{ display: "block", flex: "none", width: size, height: size, maxHeight: "none" }}>
      <ellipse cx={size / 2} cy={size / 2} rx={(w * k) / 2 + rim} ry={(h * k) / 2 + rim} fill="#F3EFE8" />
      <g transform={`translate(${(size - w * k) / 2} ${(size - h * k) / 2}) scale(${k})`} fill="#542C35">
        {sym.paths.map((p) => (
          <path key={p.id} d={p.d} />
        ))}
      </g>
    </svg>
  );
}
/** The SOMA arch: the upper half of the wordmark O (ry = 1.09 rx) on straight flanks. */
function archD(x: number, y: number, w: number, h: number) {
  const rx = w / 2;
  const ry = Math.min(rx * BRAND.archRatio, h);
  const cx = x + rx;
  const sy = y + ry;
  const f = (v: number) => +v.toFixed(2);
  return `M${f(x)} ${f(y + h)}L${f(x)} ${f(sy)}C${f(x)} ${f(sy - ry * 0.585)} ${f(cx - rx * 0.57)} ${f(y)} ${f(cx)} ${f(y)}C${f(cx + rx * 0.57)} ${f(y)} ${f(x + w)} ${f(sy - ry * 0.585)} ${f(x + w)} ${f(sy)}L${f(x + w)} ${f(y + h)}`;
}
function ArchLine({ className, w = 80, h = 100 }: { className?: string; w?: number; h?: number }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke">
      <path d={archD(1, 1, w - 2, h - 1)} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
function CustomIcon({ name, size = 24 }: { name: keyof typeof BRAND.icons; size?: number }) {
  const sw = (1.5 * 24) / size;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {BRAND.icons[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
const lucide = { size: 20, strokeWidth: 1.5, absoluteStrokeWidth: true, "aria-hidden": true } as const;

function Section({ id, eyebrow, title, lead, children }: { id: string; eyebrow: string; title: ReactNode; lead?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className={s.section} aria-labelledby={`${id}-t`}>
      <div className={s.wrap}>
        <p className={s.eyebrow}>{eyebrow}</p>
        <h2 id={`${id}-t`} className={s.h1}>
          {title}
        </h2>
        {lead ? <p className={s.lead}>{lead}</p> : null}
        <div style={{ marginTop: 40 }}>{children}</div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ page */
export default function MarkePage() {
  if (!DEMO_MODE) notFound();
  const P = BRAND.palette;
  const fontVars = `${sans.variable} ${display.variable} ${italic.variable}`;
  return (
    <main className={`${s.root} ${fontVars}`} lang="de">
      <header className={s.topbar}>
        <div className={`${s.wrap} ${s.topbarInner}`}>
          <Wordmark height={15} micro label="SOMA" />
          <span className={s.small} style={{ fontWeight: 600, color: "var(--ink)" }}>
            Markenbuch
          </span>
          <nav className={s.toc} aria-label="Kapitel">
            <a href="#logo">Logo</a>
            <a href="#farbe">Farbe</a>
            <a href="#typo">Typografie</a>
            <a href="#motiv">Motiv</a>
            <a href="#icons">Icons</a>
            <a href="#komponenten">Komponenten</a>
          </nav>
        </div>
      </header>

      {/* Hero: the wordmark with real photography */}
      <div className={`${s.wrap} ${s.hero}`}>
        <div className={s.heroGrid}>
          <div>
            <p className={s.eyebrow}>SOMA · Markenidentität 2026 · v1.1</p>
            <div className={s.heroMark}>
              <Wordmark label="SOMA" />
            </div>
            <p className={s.display} style={{ fontSize: "clamp(1.75rem, 1.3rem + 2vw, 3.25rem)", marginTop: 36 }} lang="en">
              <em style={{ fontFamily: "var(--serif-italic)", fontStyle: "italic" }}>Your body. Your place.</em>
            </p>
            <p className={s.lead} style={{ marginTop: 16 }}>
              Beauty &amp; Wellness. Bei dir. Du bleibst. Dein Profi kommt. Dieses Markenbuch zeigt die echten Master-Dateien aus{" "}
              <code>brand/assets</code>: Logo-Exploration, das gewählte System, Farbe, Schrift, Motiv, Icons und die Kernkomponenten im neuen Stil.
            </p>
          </div>
          <figure style={{ margin: 0 }}>
            <div className={`${s.arch} ${s.archIn} ${s.heroPhoto}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/editorial/arrival-v2.jpg" alt="Eine Profi kommt mit Tasche und Liege durch die Wohnungstür. Bild KI-generiert." />
            </div>
            <figcaption className={s.place}>Altbau, 2. OG · Hamburg-Eppendorf · 18:40</figcaption>
            <p className={s.aiLabel}>Entwicklungsbild, KI-generiert</p>
          </figure>
        </div>
      </div>

      {/* ------------------------------------------------------------- LOGO */}
      <Section
        id="logo"
        eyebrow="1 · Logo"
        title={
          <>
            Drei Richtungen, ein Zeichen.
          </>
        }
        lead="Jede Richtung ist aus eigenen Formen gebaut (Ellipsen, Bänder, analytische Kurven), keine Schrift diente als Rohmaterial. Bewertet nach Originalität, Eleganz, Skalierbarkeit und Einprägsamkeit (0–10). Das Zeichen ist seit v1.1 das S im O."
      >
        <div className={s.grid3}>
          {BRAND.concepts.map((c) => {
            const total = c.scores.originality + c.scores.elegance + c.scores.scalability + c.scores.memorability;
            const chosen = c.key === "C";
            return (
              <article key={c.key} className={`${s.tile} ${s.concept} ${chosen ? s.chosen : ""}`}>
                <div className={s.row} style={{ justifyContent: "space-between" }}>
                  <span className={s.badge}>
                    {c.key} · {c.name}
                  </span>
                  {chosen ? <span className={`${s.badge} ${s.badgeAccent}`}>Gewählt</span> : null}
                </div>
                <div className={s.conceptArt}>
                  <div className={`${s.stage} ${s.onBone}`} style={{ minHeight: 140 }}>
                    <Mark viewBox={c.viewBox} paths={c.paths} label={`Konzept ${c.key}`} />
                  </div>
                  <div className={`${s.stage} ${s.onEspresso}`} style={{ minHeight: 110 }}>
                    <Mark viewBox={c.viewBox} paths={c.paths} label={`Konzept ${c.key}, dunkel`} style={{ maxHeight: 64 }} />
                  </div>
                </div>
                <div>
                  <div className={s.small} style={{ marginBottom: 6 }}>
                    Kleingrößen-Test · Versalhöhe 16 / 20 / 24 px
                  </div>
                  <div className={s.smallTests}>
                    {[16, 20, 24].map((cap) => (
                      <span key={cap} className={`${s.smallTest} ${s.onBone}`}>
                        <Mark viewBox={c.viewBox} paths={c.paths} label="" style={{ height: (cap * c.viewBox[3]) / 700 }} />
                      </span>
                    ))}
                    {[16, 24].map((cap) => (
                      <span key={`d${cap}`} className={`${s.smallTest} ${s.onEspresso}`}>
                        <Mark viewBox={c.viewBox} paths={c.paths} label="" style={{ height: (cap * c.viewBox[3]) / 700 }} />
                      </span>
                    ))}
                  </div>
                </div>
                <p className={s.p} style={{ margin: 0, fontSize: 14 }}>
                  {c.idea}
                </p>
                <table className={s.scores}>
                  <tbody>
                    {(
                      [
                        ["Originalität", c.scores.originality],
                        ["Eleganz", c.scores.elegance],
                        ["Skalierbarkeit", c.scores.scalability],
                        ["Einprägsamkeit", c.scores.memorability],
                      ] as const
                    ).map(([k, v]) => (
                      <tr key={k}>
                        <td>
                          <span className={s.bar} style={{ width: v * 9 }} />
                          {k}
                        </td>
                        <td>{v}</td>
                      </tr>
                    ))}
                    <tr>
                      <td>Summe</td>
                      <td>{total} / 40</td>
                    </tr>
                  </tbody>
                </table>
                <p className={s.small} style={{ margin: 0 }}>
                  {c.verdict}
                </p>
              </article>
            );
          })}
        </div>

        <div className={s.tile} style={{ marginTop: 24 }}>
          <p className={s.demoTitle}>Ehrlich eingeordnet</p>
          <p className={s.p} style={{ margin: 0 }}>
            Die drei Richtungen sind enger als ihre Namen: B und C teilen ein Genre (kontrastreiche Versalien mit vertikaler Achse), B fügt nur Serifen hinzu; A ist eine
            bekannte geometrische Grotesk. Das war vertretbar, weil die Entscheidung über das Genre (ruhige, kontrastreiche Versalien statt Schreibschrift, Kleinbuchstaben
            oder Monogramm-Ornament) vorher aus Strategie und Fotografie feststand und die Exploration die Frage beantworten sollte, wie eigenständig dieses Genre werden
            kann. Die Antwort liegt nicht in den Buchstaben, sondern im Zeichen: das S im O.
          </p>
        </div>

        <h3 className={s.h3}>Zeichen-Studien 2 · die Konstruktion sichtbar machen</h3>
        <p className={s.p}>
          Kriterium (Brand Audit 1, O1): Überlappung (IoU) mit dem S von fünf Serifenschriften unter 0,35, ein Merkmal jenseits des Buchstabens, lesbar bei 16 px. Die
          Serifen-S überlappen einander mit 0,52–0,62.
        </p>
        <div className={s.tableWrap}>
          <table className={s.table} style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th>Studie</th>
                {Object.keys(BRAND.final.symbolStudies[0].iou).map((k) => (
                  <th key={k} style={{ textAlign: "right" }}>
                    {k}
                  </th>
                ))}
                <th style={{ textAlign: "right" }}>Max.</th>
                <th>Befund</th>
              </tr>
            </thead>
            <tbody>
              {BRAND.final.symbolStudies.map((r) => (
                <tr key={r.key} style={r.chosen ? { background: "var(--oxblood-50)" } : undefined}>
                  <td style={{ fontWeight: r.chosen ? 600 : 400 }}>{r.name}</td>
                  {Object.values(r.iou).map((v, i) => (
                    <td key={i} style={{ textAlign: "right" }}>
                      {v.toFixed(2).replace(".", ",")}
                    </td>
                  ))}
                  <td style={{ textAlign: "right" }} className={r.maxIoU < 0.35 ? s.pass : s.fail}>
                    {r.maxIoU.toFixed(2).replace(".", ",")}
                  </td>
                  <td className={s.small}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className={s.h3}>Das System: Wortmarke, Mikro-Master, Zeichen, Lockups</h3>
        <div className={s.grid3}>
          <div>
            <div className={`${s.stage} ${s.onBone}`}>
              <Wordmark />
            </div>
            <p className={s.caption}>Primär: Espresso auf Bone.</p>
          </div>
          <div>
            <div className={`${s.stage} ${s.onEspresso}`}>
              <Wordmark />
            </div>
            <p className={s.caption}>Dunkel: Bone auf Espresso.</p>
          </div>
          <div>
            <div className={`${s.stage} ${s.onOxblood}`}>
              <Wordmark />
            </div>
            <p className={s.caption}>Markenmoment: Bone auf Oxblood.</p>
          </div>
          <div>
            <div className={`${s.stage} ${s.onWhite}`}>
              <Wordmark />
            </div>
            <p className={s.caption}>Monochrom Schwarz (Druck, Behörden, Fax).</p>
          </div>
          <div>
            <div className={`${s.stage} ${s.onBlack}`}>
              <Wordmark />
            </div>
            <p className={s.caption}>Monochrom Weiß (Foto mit Scrim, Prägung).</p>
          </div>
          <div>
            <div className={`${s.stage} ${s.onBone}`} style={{ color: P.oxblood.value }}>
              <Wordmark />
            </div>
            <p className={s.caption}>Oxblood auf Bone: nur Druck und Verpackung, nie im UI.</p>
          </div>
        </div>

        <div className={s.grid3} style={{ marginTop: 24 }}>
          <div>
            <div className={`${s.stage} ${s.onBone}`} style={{ minHeight: 240 }}>
              <Lockup lock={BRAND.final.descriptor} label="SOMA, Beauty & Wellness, wherever you are." style={{ maxWidth: 360 }} />
            </div>
            <p className={s.caption}>Sekundär: mit Deskriptor (Instrument Sans Medium, gesperrt, in Pfaden).</p>
          </div>
          <div>
            <div className={`${s.stage} ${s.onEspresso}`} style={{ minHeight: 240 }}>
              <Lockup lock={BRAND.final.tagline} label="SOMA, Your body. Your place." style={{ maxWidth: 360 }} />
            </div>
            <p className={s.caption}>Mit Tagline (Newsreader Display Italic, in Pfaden).</p>
          </div>
          <div>
            <div className={`${s.stage} ${s.onOxblood}`} style={{ minHeight: 240 }}>
              <Lockup lock={BRAND.final.stacked} label="SOMA Zeichen und Wortmarke" style={{ maxWidth: 170 }} />
            </div>
            <p className={s.caption}>Gestapelt: Zeichen über Wortmarke (Social, Verpackung, Splash).</p>
          </div>
        </div>

        <h3 className={s.h3}>Das Zeichen: das S im O</h3>
        <p className={s.p}>
          Das S der Wortmarke (der Körper) steht im O der Wortmarke (dem Ort): „Your body. Your place.“ als ein Zeichen, und zugleich die ersten zwei Buchstaben des
          Namens. Ab 32 px der Linienschnitt; darunter der Siegel-Schnitt, in dem das O gefüllt ist und das S eingesetzt. Das Favicon ist das Siegel mit einer feinen
          Bone-Kante, damit es auch in dunklen Tab-Leisten seine Form behält.
        </p>
        <div className={s.grid4}>
          <div className={`${s.stage} ${s.onBone}`}>
            <Symbol height={128} />
          </div>
          <div className={`${s.stage} ${s.onEspresso}`}>
            <Symbol height={128} />
          </div>
          <div className={`${s.stage} ${s.onBone}`} style={{ gap: 20 }}>
            <AppIcon size={120} />
            <AppIcon size={60} />
          </div>
          <div className={`${s.stage} ${s.onBone}`} style={{ gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
            <Seal height={32} />
            <Seal height={24} />
            <Seal height={16} />
            <span style={{ display: "flex", gap: 10, alignItems: "flex-end", padding: "8px 10px", borderRadius: 8, background: "#202124" }}>
              <Favicon size={32} />
              <Favicon size={16} />
            </span>
          </div>
        </div>
        <div className={s.grid2} style={{ marginTop: 16 }}>
          <div className={s.tile} style={{ display: "flex", flexDirection: "column", gap: 0, padding: 0, overflow: "hidden", alignSelf: "start" }}>
            <div className={s.tab} style={{ background: "#DEE1E6", color: "#3C4043" }}>
              <Favicon size={16} />
              SOMA – Beauty &amp; Wellness. Bei dir.
            </div>
            <div className={s.tab} style={{ background: "#202124", color: "#E8EAED", borderRadius: 0 }}>
              <Favicon size={16} />
              SOMA – Beauty &amp; Wellness. Bei dir.
            </div>
          </div>
          <div className={`${s.stage} ${s.onBone}`}>
            <DrawOn viewBox={BRAND.final.drawOn.viewBox} o={BRAND.final.drawOn.o} s={BRAND.final.drawOn.s} />
          </div>
        </div>
        <p className={s.caption}>
          Rechts: das Zeichen zeichnet sich (1,2 s, einmal, kein Loop; bei reduzierter Bewegung sofort das Endbild). Einsatz: PWA-Start, Abspann von Videos,
          Social-Avatar. Spezifikation: brand/assets/splash/SPLASH.md.
        </p>

        <h3 className={s.h3}>Logo auf Fotografie</h3>
        <div className={s.grid2}>
          <figure style={{ margin: 0 }}>
            <div style={{ position: "relative", aspectRatio: "4 / 3", borderRadius: 16, overflow: "hidden", background: P.stone.value }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/editorial/setup-v2.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0%", display: "block" }} />
              <div style={{ position: "absolute", right: "6%", top: "8%", color: "#25211F", width: "22%" }}>
                <Wordmark label="SOMA auf Foto" />
              </div>
            </div>
            <figcaption className={s.caption}>Helles Bild: Espresso auf der ruhigsten Zone (Wand), Schutzraum frei. Entwicklungsbild, KI-generiert.</figcaption>
          </figure>
          <figure style={{ margin: 0 }}>
            <div style={{ position: "relative", aspectRatio: "4 / 3", borderRadius: 16, overflow: "hidden", background: P.stone.value }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/hero/home-v2.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 35%", display: "block" }} />
              <div style={{ position: "absolute", inset: "auto 0 0 0", padding: "40px 24px 24px", background: "rgb(23 20 18 / 0.62)", color: "#F3EFE8" }}>
                <div style={{ width: "30%" }}>
                  <Wordmark micro label="SOMA auf Foto mit Scrim" />
                </div>
                <p className={s.place} style={{ color: "#D8CFC3", marginBottom: 0 }}>
                  Zuhause · Berlin-Mitte · 10:00
                </p>
              </div>
            </div>
            <figcaption className={s.caption}>Unruhiges Bild: Scrim-Fläche (62 %, flach, kein Verlauf) unter Logo und Ortszeile. Entwicklungsbild, KI-generiert.</figcaption>
          </figure>
        </div>
      </Section>

      {/* ------------------------------------------------------------- COLOUR */}
      <Section
        id="farbe"
        eyebrow="2 · Farbe"
        title={
          <>
            Bone und Espresso tragen. Oxblood signiert.
          </>
        }
        lead="Die Kundenpalette bleibt unverändert; ergänzt sind Tonleitern, Text- und Kontrollvarianten, Funktionsfarben und semantische Tokens. Oxblood erscheint höchstens einmal pro Screen."
      >
        <div className={s.brandSwatches}>
          {(
            [
              ["bone", "Bone", "Seite, Grundton"],
              ["stone", "Stone", "Zweite Fläche"],
              ["taupe", "Taupe", "nur dekorativ"],
              ["oxblood", "Oxblood", "Signatur"],
              ["espresso", "Espresso", "Text, dunkle Fläche"],
            ] as const
          ).map(([k, n, r]) => {
            const dark = k === "oxblood" || k === "espresso";
            return (
              <div key={k} className={s.swatch} style={{ background: P[k].value, color: dark ? P.bone.value : P.espresso.value }}>
                <b>{n}</b>
                <span>
                  {P[k].value}
                  <br />
                  {r}
                </span>
              </div>
            );
          })}
        </div>

        <h3 className={s.h3}>Tonleitern</h3>
        <div className={s.ramp}>
          {(["paper", "bone", "linen", "oat", "stone", "stone-deep", "taupe", "taupe-deep", "umber", "umber-deep", "cocoa", "espresso"] as const).map((k, i) => (
            <div key={k} className={s.swatch} style={{ background: P[k].value, color: i < 7 ? P.espresso.value : P.bone.value }}>
              <b>{k}</b>
              <span>{P[k].value}</span>
            </div>
          ))}
        </div>
        <div className={`${s.ramp} ${s.rampOx}`} style={{ marginTop: 12 }}>
          {(["oxblood-50", "oxblood-100", "oxblood-200", "oxblood-300", "oxblood-400", "oxblood-500", "oxblood", "oxblood-700", "oxblood-800", "oxblood-900"] as const).map((k, i) => (
            <div key={k} className={s.swatch} style={{ background: P[k].value, color: i < 3 ? P.espresso.value : P.bone.value }}>
              <b>{k === "oxblood" ? "600 · Oxblood" : k.replace("oxblood-", "")}</b>
              <span>{P[k].value}</span>
            </div>
          ))}
        </div>

        <h3 className={s.h3}>Funktionsfarben · immer mit Icon und Wort</h3>
        <div className={s.grid4}>
          {Object.entries(BRAND.feedback).map(([k, f]) => {
            const I = { success: CircleCheck, warning: TriangleAlert, danger: CircleAlert, info: Info }[k as "success" | "warning" | "danger" | "info"];
            return (
              <div key={k} className={s.notice} style={{ background: f.bg, color: f.fg, boxShadow: `inset 0 0 0 1px ${f.border}` }}>
                <I {...lucide} />
                <div>
                  <b>{f.word}</b>
                  <span className={s.num}>
                    {k} · {f.fg} auf {f.bg}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <h3 className={s.h3}>Semantische Tokens</h3>
        <div className={s.grid3}>
          {Object.entries(BRAND.semantic).map(([group, entries]) => (
            <div key={group} className={s.tile}>
              <p className={s.demoTitle}>{group}</p>
              {Object.entries(entries).map(([k, v]) => (
                <div key={k} className={s.line} style={{ padding: "5px 0", borderTop: `1px solid ${P.oat.value}`, fontSize: 13 }}>
                  <span style={{ color: "var(--ink)" }}>
                    <span className={s.chip2} style={{ background: v.value }} />
                    {group}.{k}
                  </span>
                  <span className={s.num} style={{ color: "var(--muted)", textAlign: "right" }}>
                    {v.ref ?? v.value}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <h3 className={s.h3}>Kontrast (WCAG 2.2, berechnet)</h3>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Gruppe</th>
                <th>Vordergrund</th>
                <th>Hintergrund</th>
                <th style={{ textAlign: "right" }}>Verhältnis</th>
                <th>Ziel</th>
                <th>Hinweis</th>
              </tr>
            </thead>
            <tbody>
              {BRAND.contrast.map((r, i) => (
                <tr key={i}>
                  <td>{r.group}</td>
                  <td>
                    <span className={s.chip2} style={{ background: r.fgHex }} />
                    {r.fg}
                  </td>
                  <td>
                    <span className={s.chip2} style={{ background: r.bgHex }} />
                    {r.bg}
                  </td>
                  <td style={{ textAlign: "right" }}>{r.ratio.toFixed(2)}:1</td>
                  <td>{r.need === 1 ? <span>Info</span> : r.pass ? <span className={s.pass}>✓ {r.need}:1</span> : <span className={s.fail}>✕ {r.need}:1</span>}</td>
                  <td className={s.small}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={s.rules} style={{ marginTop: 24 }}>
          <div className={s.tile}>
            <p className={s.demoTitle}>Oxblood: ja</p>
            <ul>
              <li>Die eine Primäraktion pro Screen (z. B. „Zahlungspflichtig buchen“).</li>
              <li>Markenmomente: App-Icon, Splash, ein Markenband, Gutschein.</li>
              <li>Fokusring (nur bei Tastatur sichtbar) und Link-Hover.</li>
            </ul>
          </div>
          <div className={s.tile}>
            <p className={s.demoTitle}>Oxblood: nein</p>
            <ul>
              <li>Keine Fehler, keine Warnungen: dafür gibt es Vermilion mit Icon und Wort.</li>
              <li>Keine Auswahlzustände, Chips, Slots, Tabs: die sind Espresso.</li>
              <li>Keine Flächen hinter Fließtext, keine Verläufe, nie auf Espresso (1,4:1).</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------- TYPE */}
      <Section
        id="typo"
        eyebrow="3 · Typografie"
        title={
          <>
            Die Serife spricht. Die Grotesk arbeitet.
          </>
        }
        lead="Newsreader Display (opsz 72) für Tagline und redaktionelle Headlines, Instrument Sans für Interface, Zahlen und Formulare. Beide SIL OFL, beide mit vollem Deutsch. Auf der Startseite: 2 vorgeladene Dateien, 79 KB (mit Kursive 102 KB)."
      >
        <div className={s.specimen}>
          <div>
            <p className={s.display} style={{ fontSize: "clamp(2.75rem, 1.5rem + 5.5vw, 6.5rem)" }}>
              Massage, <em>bei dir</em> zu Hause.
            </p>
            <p className={s.place} style={{ marginTop: 20 }}>
              Hotelsuite, 6. Stock · Frankfurt-Westend · 21:10
            </p>
            <p className={s.lead} style={{ marginTop: 12, color: "var(--ink)" }}>
              Geprüfte Profis für Massage, Nägel, Kosmetik, Haare und Make-up kommen zu dir – nach Hause, ins Hotel oder ins Büro.
            </p>
          </div>
          <div className={s.stack}>
            <div className={s.tile}>
              <p className={s.demoTitle}>Newsreader Display · Roman / Italic</p>
              <div className={s.glyphs}>
                Aa Ää Öö Üü ß
                <br />
                <em style={{ fontFamily: "var(--serif-italic)" }}>Aa Ää Öö Üü ß</em>
              </div>
            </div>
            <div className={s.tile}>
              <p className={s.demoTitle}>Instrument Sans · 400–700 · wdth 75–100</p>
              <div style={{ fontSize: 28, lineHeight: 1.3 }}>
                Aa Ää Öö Üü ß ẞ <b style={{ fontWeight: 600 }}>„84{NB}€“ 14:30{NB}Uhr</b>
              </div>
              <div className={s.num} style={{ fontSize: 28, marginTop: 6 }}>
                0123456789 · 1.284,50{NB}€
              </div>
              <div style={{ fontSize: 15, fontWeight: 540, marginTop: 10, fontStretch: "86%" }}>Wimpernverlängerung · Gesichtsbehandlung (wdth 86)</div>
            </div>
          </div>
        </div>

        <h3 className={s.h3}>Skala · fluid von 360 bis 1440 px</h3>
        <div>
          {Object.entries(BRAND.type).map(([k, t]) => {
            const serif = t.family === "display";
            const sample =
              k === "numeric"
                ? `1.284,50${NB}€`
                : k === "eyebrow"
                  ? "Hotelsuite · 21:10"
                  : k === "button"
                    ? `Zahlungspflichtig buchen · 84${NB}€`
                    : k === "control"
                      ? "Straße, Hausnummer"
                      : serif
                        ? "Du bleibst."
                        : "Gesichtsbehandlung bei dir";
            return (
              <div key={k} className={s.typeRow}>
                <div className={s.typeMeta}>
                  <b style={{ color: "var(--ink)" }}>{k}</b> · {serif ? "Newsreader" : "Instrument Sans"} {t.weight}
                  <br />
                  {t.min}→{t.max}
                  {NB}px · {t.lineHeight} · {t.tracking}em
                </div>
                <div
                  className={s.typeSample}
                  style={{
                    fontFamily: serif ? "var(--serif)" : "var(--sans)",
                    fontSize: t.size,
                    lineHeight: t.lineHeight,
                    letterSpacing: `${t.tracking}em`,
                    fontWeight: t.weight,
                    textTransform: k === "eyebrow" ? "uppercase" : undefined,
                    fontVariantNumeric: k === "numeric" ? "tabular-nums lining-nums" : undefined,
                  }}
                >
                  {sample}
                  {k === "display-xl" ? (
                    <>
                      {" "}
                      <em style={{ fontFamily: "var(--serif-italic)", fontStyle: "italic" }}>Dein Profi kommt.</em>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ------------------------------------------------------------- MOTIF */}
      <Section
        id="motiv"
        eyebrow="4 · Motiv"
        title={
          <>
            Der Bogen: die obere Hälfte des O.
          </>
        }
        lead="Ein Fenster, eine Tür, ein Ort: Bilder öffnen sich im Bogen, der exakt aus dem Wortmarken-O konstruiert ist. Zwei Bögen stehen im Kontrapost-Versatz, wie die zwei Hälften des S. Bewegung heißt Ankommen: Bilder steigen 16 px und kommen zur Ruhe."
      >
        <div className={s.grid2}>
          <div className={s.pair}>
            <figure>
              <div className={`${s.arch} ${s.archIn}`} style={{ aspectRatio: "4 / 5" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/editorial/after-v2.jpg" alt="Nach der Behandlung: Tee auf dem Sofa, die Profi räumt die Liege ab. Bild KI-generiert." />
              </div>
              <figcaption className={s.place}>Zuhause · Hamburg-Winterhude · 19:30</figcaption>
              <p className={s.aiLabel}>KI-generiert</p>
            </figure>
            <figure>
              <div className={`${s.arch} ${s.archIn}`} style={{ aspectRatio: "4 / 5", animationDelay: "120ms" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/categories/manikuere-v2.jpg" alt="Maniküre am Tisch am Fenster. Bild KI-generiert." />
              </div>
              <figcaption className={s.place}>Zuhause · Köln-Ehrenfeld · 12:30</figcaption>
              <p className={s.aiLabel}>KI-generiert</p>
            </figure>
          </div>
          <div className={s.stack}>
            <div className={s.tile}>
              <p className={s.demoTitle}>Konstruktion</p>
              <svg viewBox="0 0 700 520" style={{ width: "100%", height: "auto" }} aria-label="Bogen aus dem O">
                <path d={archD(170, 20, 360, 480)} fill={P.oxblood.value} />
                <ellipse cx="350" cy="216" rx="180" ry="196" fill="none" stroke={P.bone.value} strokeWidth="2" strokeDasharray="8 7" />
                <path d="M350 0V520M120 216H580" stroke={P.taupe.value} strokeWidth="1.5" />
              </svg>
              <p className={s.small}>Breite = Breite des O; Bogenhöhe = 1,09 × halbe Breite; gerade Flanken. CSS: radius-arch mit --arch-aspect.</p>
            </div>
            <div className={s.grid2} style={{ gap: 12 }}>
              <div>
                <div className={s.arch} style={{ aspectRatio: "4 / 5", background: BRAND.tones.massage.wash }}>
                  <div className={s.fallback}>
                    <ArchLine className="" />
                    Massage
                  </div>
                </div>
                <p className={s.caption}>Leerer Bildplatz: Kategorie-Ton, Bogenlinie, Wort in der Kursiven. Ersetzt die v2-Aura.</p>
              </div>
              <div className={s.stack} style={{ justifyContent: "center" }}>
                <div className={s.avatarRow}>
                  {(
                    [
                      ["LH", 48, "massage"],
                      ["AK", 40, "kosmetik"],
                      ["MS", 32, "make-up"],
                      ["JW", 24, "haare-styling"],
                    ] as const
                  ).map(([i, z, t]) => (
                    <span key={i} className={s.avatar} style={{ width: z, height: z, fontSize: z * 0.42, background: BRAND.tones[t].wash }}>
                      {i}
                    </span>
                  ))}
                </div>
                <div className={s.portrait} style={{ width: 120 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/pros/pro-02-v2.jpg" alt="Porträt, KI-generiert" />
                </div>
                <p className={s.caption}>Avatare: Initialen in Newsreader auf Kategorie-Ton. Porträts im O-Oval. Foto KI-generiert.</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------- ICONS */}
      <Section
        id="icons"
        eyebrow="5 · Ikonografie"
        title={
          <>
            Lucide, auf SOMA gestimmt.
          </>
        }
        lead="24-px-Raster, 2 px Schutzzone, 1,5 px absoluter Strich, runde Enden. Lucide passt mit diesen Einstellungen. Eigene Icons nur für Orte und Kategorien, wo Lucide keine klischeefreie Metapher hat; Tür und Finger tragen den Bogen."
      >
        <div className={s.iconGrid}>
          {(Object.keys(BRAND.icons) as (keyof typeof BRAND.icons)[]).map((n) => (
            <div key={n} className={s.iconCell}>
              <div className={s.iconSizes}>
                <CustomIcon name={n} size={24} />
                <CustomIcon name={n} size={20} />
                <CustomIcon name={n} size={16} />
              </div>
              {n}
            </div>
          ))}
          {(
            [
              [Search, "search"],
              [CalendarDays, "calendar-days"],
              [MapPin, "map-pin"],
              [Clock, "clock"],
              [ArrowRight, "arrow-right"],
              [Check, "check"],
              [X, "x"],
              [UserRound, "user-round"],
              [CreditCard, "credit-card"],
              [Car, "car"],
              [ShieldCheck, "shield-check"],
            ] as const
          ).map(([I, n]) => (
            <div key={n} className={s.iconCell}>
              <div className={s.iconSizes}>
                <I size={24} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                <I size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                <I size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
              </div>
              lucide · {n}
            </div>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------- COMPONENTS */}
      <Section
        id="komponenten"
        eyebrow="6 · Komponenten"
        title={
          <>
            Ruhig im Bild, klar in der Funktion.
          </>
        }
        lead="Die Kernkomponenten mit ihren Zuständen. Die Werte entsprechen brand/DESIGN_TOKENS/tokens.css, die Produktkomponenten in src/components/ui folgen ihnen."
      >
        <div className={s.stack} style={{ gap: 24 }}>
          <div className={s.demo}>
            <p className={s.demoTitle}>Buttons</p>
            <div className={s.row}>
              <button type="button" className={`${s.btn} ${s.btnL} ${s.btnAccent}`}>
                Zahlungspflichtig buchen · 84{NB}€
              </button>
              <button type="button" className={`${s.btn} ${s.btnStrong}`}>
                Termin wählen
              </button>
              <button type="button" className={`${s.btn} ${s.btnSecondary}`}>
                Profil ansehen
              </button>
              <button type="button" className={`${s.btn} ${s.btnGhost}`}>
                <CalendarCheck {...lucide} />
                Später
              </button>
              <a href="#komponenten" className={`${s.btn} ${s.btnLink}`}>
                Stornobedingungen
              </a>
              <button type="button" className={`${s.btn} ${s.btnDanger}`}>
                Buchung stornieren
              </button>
            </div>
            <div className={s.row} style={{ marginTop: 20, alignItems: "flex-start" }}>
              {(
                [
                  ["Standard", ""],
                  ["Hover", s.isHover],
                  ["Gedrückt", s.isPressed],
                  ["Fokus", s.isFocus],
                ] as const
              ).map(([l, c]) => (
                <div key={l}>
                  <span className={`${s.btn} ${s.btnAccent} ${c}`}>Buchen</span>
                  <div className={s.stateLabel}>{l}</div>
                </div>
              ))}
              <div>
                <button type="button" className={`${s.btn} ${s.btnAccent}`} disabled>
                  Buchen
                </button>
                <div className={s.stateLabel}>Deaktiviert</div>
              </div>
              <div>
                <span className={`${s.btn} ${s.btnAccent}`} aria-busy="true">
                  <span className={s.spin} aria-hidden />
                  Wird gebucht
                </span>
                <div className={s.stateLabel}>Lädt</div>
              </div>
              {(
                [
                  ["Standard", ""],
                  ["Hover", s.isHover],
                  ["Fokus", s.isFocus],
                ] as const
              ).map(([l, c]) => (
                <div key={`s${l}`}>
                  <span className={`${s.btn} ${s.btnSecondary} ${c}`}>Ändern</span>
                  <div className={s.stateLabel}>{l}</div>
                </div>
              ))}
            </div>
            <p className={s.small} style={{ marginTop: 16 }}>
              Ein Oxblood-Button pro Screen. Höhen: S 36 (Trefferfläche 44), M 48, L 52. Pille. Drücken: 0,98, 100{NB}ms, ohne Nachfedern.
            </p>
          </div>

          <div className={s.grid2}>
            <div className={s.demo}>
              <p className={s.demoTitle}>Eingabefelder</p>
              <div className={s.stack}>
                <label className={s.field}>
                  <span className={s.label}>E-Mail</span>
                  <input className={s.input} placeholder="name@beispiel.de" />
                  <span className={s.help}>Für deine Buchungsbestätigung.</span>
                </label>
                <label className={s.field}>
                  <span className={s.label}>Straße und Hausnummer</span>
                  <input className={`${s.input} ${s.inputFocus}`} defaultValue="Isestraße 21" />
                </label>
                <label className={s.field}>
                  <span className={s.label}>Postleitzahl</span>
                  <input className={`${s.input} ${s.inputError}`} defaultValue="2014" aria-invalid="true" aria-describedby="plz-err" />
                  <span id="plz-err" className={s.err}>
                    <CircleAlert size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                    Bitte gib eine fünfstellige Postleitzahl ein.
                  </span>
                </label>
                <label className={s.field}>
                  <span className={s.label}>Etage (gesperrt)</span>
                  <input className={`${s.input} ${s.inputDisabled}`} defaultValue="2. OG" disabled />
                </label>
                <span className={s.ok}>
                  <CircleCheck size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                  Adresse liegt im Einsatzgebiet.
                </span>
              </div>
            </div>
            <div className={s.demo}>
              <p className={s.demoTitle}>Suche · Kategorien · Datum und Uhrzeit</p>
              <div className={s.search} role="search">
                <div className={s.searchPart}>
                  <small>Behandlung</small>
                  <span>Klassische Massage</span>
                </div>
                <div className={s.searchPart}>
                  <small>Ort</small>
                  <span>Hamburg-Eppendorf</span>
                </div>
                <div className={s.searchPart}>
                  <small>Wann</small>
                  <span>Fr., 14.{NB}Nov.</span>
                </div>
                <button type="button" className={`${s.btn} ${s.btnAccent} ${s.searchBtn}`} aria-label="Suchen">
                  <Search {...lucide} />
                  Suchen
                </button>
              </div>
              <div className={s.chips} style={{ marginTop: 18 }}>
                <span className={`${s.chip} ${s.chipOn}`}>
                  <Check size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                  Massage
                </span>
                <span className={s.chip}>Maniküre</span>
                <span className={s.chip}>Kosmetik</span>
                <span className={s.chip} style={{ fontStretch: "86%" }}>
                  Wimpernverlängerung
                </span>
                <span className={s.chip}>Haare &amp; Styling</span>
              </div>
              <div className={s.dates} style={{ marginTop: 18 }} role="radiogroup" aria-label="Datum">
                {(
                  [
                    ["Heute", "13"],
                    ["Fr.", "14"],
                    ["Sa.", "15"],
                    ["So.", "16"],
                    ["Mo.", "17"],
                  ] as const
                ).map(([d, n], i) => (
                  <span key={n} className={`${s.date} ${i === 0 ? s.today : ""} ${i === 1 ? s.dateOn : ""}`} role="radio" aria-checked={i === 1}>
                    <small>{d}</small>
                    <b>{n}</b>
                  </span>
                ))}
              </div>
              <div className={s.slots} style={{ marginTop: 12 }} role="radiogroup" aria-label="Uhrzeit">
                {["09:00", "11:30", "14:30", "18:00"].map((t, i) => (
                  <span key={t} role="radio" aria-checked={i === 2} className={`${s.slot} ${i === 2 ? s.slotOn : ""} ${i === 0 ? s.slotOff : ""}`}>
                    {i === 2 ? <Check size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden /> : null}
                    {t}
                  </span>
                ))}
              </div>
              <p className={s.small} style={{ marginTop: 10 }}>
                Auswahl ist Espresso mit Häkchen, nie Oxblood. „Heute“ trägt den kleinen Bogen. Vergeben: durchgestrichen und „ausgebucht“ im Screenreader. Der Such-Button ist auf der Startseite die eine Oxblood-Aktion.
              </p>
            </div>
          </div>

          <div className={s.grid3}>
            <article className={s.card}>
              <div className={s.cardMedia}>
                <div className={s.arch} style={{ aspectRatio: "4 / 3", ["--arch-aspect" as string]: 1.333 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/landing/experience-choice.jpg" alt="" />
                </div>
              </div>
              <div className={s.cardBody}>
                <p className={s.eyebrow} style={{ marginBottom: 8 }}>
                  Massage
                </p>
                <h3 className={s.h3} style={{ margin: 0, fontSize: 19 }}>Klassische Massage</h3>
                <div className={s.meta}>
                  <span>
                    <Clock size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                    60{NB}Min.
                  </span>
                  <span>
                    <CustomIcon name="massage" size={16} />
                    Liege und Öle inklusive
                  </span>
                </div>
                <div className={s.priceRow}>
                  <span className={s.small}>Endpreis inkl. Anfahrt</span>
                  <span className={s.price}>ab 84{NB}€</span>
                </div>
              </div>
            </article>
            <article className={s.card}>
              <div className={s.profile}>
                <div className={s.portrait}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/pros/pro-01-v2.jpg" alt="Demo-Profil, Foto KI-generiert" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 className={s.serifTitle}>Lea Hoffmann</h3>
                  <p className={s.aiLabel} style={{ margin: "2px 0 0" }}>Demo-Profil · Foto KI-generiert</p>
                  <div className={s.meta}>
                    <span>Massage · Kosmetik</span>
                  </div>
                  <div className={s.meta}>
                    <span>
                      <ShieldCheck size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                      Profil geprüft
                    </span>
                  </div>
                </div>
              </div>
              <div className={s.cardBody} style={{ paddingTop: 0 }}>
                <div className={s.locs}>
                  <span className={s.loc}>
                    <CustomIcon name="zuhause" size={16} />
                    Zuhause
                  </span>
                  <span className={s.loc}>
                    <CustomIcon name="hotel" size={16} />
                    Hotel
                  </span>
                  <span className={s.loc}>
                    <CustomIcon name="buero" size={16} />
                    Büro
                  </span>
                </div>
                <div className={s.priceRow}>
                  <span className={s.small}>Nächster freier Termin</span>
                  <span className={s.num} style={{ fontWeight: 600 }}>
                    Fr., 14.{NB}Nov., 14:30
                  </span>
                </div>
              </div>
            </article>
            <article className={s.card}>
              <div className={s.cardBody}>
                <p className={s.demoTitle}>Buchungsübersicht</p>
                <div className={s.summary}>
                  <div className={s.line}>
                    <span>Klassische Massage · 60{NB}Min.</span>
                    <span>76,00{NB}€</span>
                  </div>
                  <div className={s.line}>
                    <span>Anfahrt Hamburg-Eppendorf</span>
                    <span>8,00{NB}€</span>
                  </div>
                  <div className={s.line}>
                    <span>Fr., 14.{NB}Nov. · 14:30–15:30</span>
                    <span />
                  </div>
                  <div className={s.total}>
                    <span>Endpreis</span>
                    <b>84{NB}€</b>
                  </div>
                  <button type="button" className={`${s.btn} ${s.btnL} ${s.btnAccent}`} style={{ width: "100%", marginTop: 6 }}>
                    Zahlungspflichtig buchen · 84{NB}€
                  </button>
                  <p className={s.small} style={{ textAlign: "center", margin: 0 }}>
                    Kostenlos stornierbar bis Do., 13.{NB}Nov., 14:30{NB}Uhr
                  </p>
                </div>
              </div>
            </article>
          </div>

          <div className={s.grid2}>
            <div className={s.demo}>
              <p className={s.demoTitle}>Benachrichtigungen und Formular-Feedback</p>
              <div className={s.stack}>
                {Object.entries(BRAND.feedback).map(([k, f]) => {
                  const I = { success: CircleCheck, warning: TriangleAlert, danger: CircleAlert, info: Info }[k as "success" | "warning" | "danger" | "info"];
                  const text = {
                    success: ["Gebucht.", "Lea kommt am Fr., 14. Nov., um 14:30 zu dir."],
                    warning: ["Noch 2 Stunden.", "Danach ist die Stornierung kostenpflichtig."],
                    danger: ["Zahlung fehlgeschlagen.", "Deine Karte wurde nicht belastet. Versuch es mit einer anderen Karte."],
                    info: ["Start-Code.", "Nenne ihn deinem Profi bei der Ankunft."],
                  }[k as "success" | "warning" | "danger" | "info"];
                  return (
                    <div key={k} className={s.notice} style={{ background: f.bg, color: "var(--espresso)", boxShadow: `inset 0 0 0 1px ${f.border}` }} role={k === "danger" ? "alert" : "status"}>
                      <span style={{ color: f.fg, display: "flex" }}>
                        <I {...lucide} />
                      </span>
                      <div>
                        <b style={{ color: f.fg }}>{text[0]}</b>
                        {text[1]}
                      </div>
                    </div>
                  );
                })}
                <div className={s.toast} role="status">
                  <CircleCheck {...lucide} />
                  Termin gespeichert.
                  <button type="button">Rückgängig</button>
                </div>
              </div>
            </div>
            <div className={s.demo}>
              <p className={s.demoTitle}>Modal und Bottom-Sheet</p>
              <div className={s.grid2} style={{ gap: 12 }}>
                <div className={s.overlayStage} aria-hidden>
                  <div className={s.backdrop} />
                  <div className={s.dialog}>
                    <p className={s.serifTitle} style={{ fontSize: 24 }}>
                      Termin stornieren?
                    </p>
                    <p className={s.small} style={{ margin: "8px 0 18px" }}>
                      Bis Do., 13. Nov., 14:30 Uhr ist das kostenlos.
                    </p>
                    <div className={s.stack} style={{ gap: 8 }}>
                      <span className={`${s.btn} ${s.btnStrong}`}>Behalten</span>
                      <span className={`${s.btn} ${s.btnGhost}`} style={{ color: "var(--danger)" }}>
                        Stornieren
                      </span>
                    </div>
                  </div>
                </div>
                <div className={s.overlayStage} aria-hidden>
                  <div className={s.backdrop} />
                  <div className={s.sheet}>
                    <div className={s.grabber} />
                    <div className={s.line} style={{ alignItems: "center" }}>
                      <b style={{ fontSize: 18 }}>Ort wählen</b>
                      <X {...lucide} />
                    </div>
                    <div className={s.stack} style={{ gap: 8, marginTop: 14 }}>
                      {(["zuhause", "hotel", "buero"] as const).map((n, i) => (
                        <div key={n} className={s.loc} style={{ height: 48, borderRadius: 12, padding: "0 14px", background: i === 0 ? "var(--espresso)" : "var(--linen)", color: i === 0 ? "var(--bone)" : "inherit" }}>
                          <CustomIcon name={n} size={20} />
                          {["Zuhause", "Hotel", "Büro"][i]}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={s.grid3}>
            <div className={s.demo}>
              <p className={s.demoTitle}>Laden</p>
              <div className={s.stack}>
                <div className={s.skeleton} style={{ aspectRatio: "16 / 9", borderRadius: 12 }} />
                <div className={s.skeleton} style={{ height: 14, width: "60%", borderRadius: 999 }} />
                <div className={s.skeleton} style={{ height: 14, width: "40%", borderRadius: 999 }} />
                <span className={s.row} style={{ gap: 10, color: "var(--muted)", fontSize: 14 }}>
                  <span className={s.spin} aria-hidden />
                  Freie Termine werden geladen …
                </span>
              </div>
            </div>
            <div className={s.demo}>
              <p className={s.demoTitle}>Leerer Zustand</p>
              <div className={s.empty}>
                <ArchLine className={s.archLine} />
                <p className={s.serifTitle}>Noch keine Buchungen.</p>
                <p className={s.small} style={{ margin: 0, maxWidth: 260 }}>
                  Wenn du einen Termin buchst, findest du ihn hier – mit Start-Code und Stornofrist.
                </p>
                <span className={`${s.btn} ${s.btnSecondary}`} style={{ marginTop: 8 }}>
                  Behandlungen ansehen
                  <ArrowRight {...lucide} />
                </span>
              </div>
            </div>
            <div className={s.phone}>
              <div className={s.appbar}>
                <svg viewBox={W.viewBox.join(" ")} className={s.wm} aria-label="SOMA">
                  <g fill="currentColor">
                    {BRAND.final.micro.paths.map((p) => (
                      <path key={p.id} d={p.d} />
                    ))}
                  </g>
                </svg>
                <span style={{ marginLeft: "auto", display: "flex" }}>
                  <UserRound {...lucide} />
                </span>
              </div>
              <div className={s.tabs}>
                <span className={`${s.tab} ${s.tabOn}`}>Anstehend</span>
                <span className={s.tab}>Vergangen</span>
                <span className={s.tab}>Storniert</span>
              </div>
              <div className={s.phoneBody}>
                <div className={s.notice} style={{ background: "var(--linen)" }}>
                  <MapPin {...lucide} />
                  <div>
                    <b>Fr., 14. Nov. · 14:30</b>
                    Lea Hoffmann · Isestraße 21
                  </div>
                </div>
              </div>
              <nav className={s.bottomNav} aria-label="Beispiel-Navigation">
                {(
                  [
                    [House, "Start", false],
                    [Search, "Suchen", false],
                    [CalendarCheck, "Termine", true],
                    [MessageCircle, "Hilfe", false],
                  ] as const
                ).map(([I, l, on]) => (
                  <span key={l} className={`${s.navItem} ${on ? s.navOn : ""}`} aria-current={on ? "page" : undefined}>
                    <I size={22} strokeWidth={on ? 1.9 : 1.5} absoluteStrokeWidth aria-hidden />
                    {l}
                  </span>
                ))}
              </nav>
            </div>
          </div>

          <div className={`${s.demo} ${s.night}`}>
            <p className={s.demoTitle}>Night-Band · gleiche Komponenten, Bone als Akzent</p>
            <div className={s.row}>
              <span className={`${s.btn} ${s.btnL} ${s.btnAccent}`}>Abendtermin buchen</span>
              <span className={`${s.btn} ${s.btnSecondary}`}>Mehr erfahren</span>
              <span className={`${s.chip} ${s.chipOn}`}>21:10</span>
              <span className={s.chip}>21:40</span>
              <span className={s.ok} style={{ color: "var(--success)" }}>
                <CircleCheck size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                Profi bestätigt
              </span>
              <span className={s.err} style={{ color: "var(--danger)" }}>
                <CircleAlert size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                Zahlung fehlgeschlagen
              </span>
            </div>
          </div>
          <div className={`${s.demo} ${s.oxbloodScope}`} style={{ display: "grid", gap: 20, alignItems: "center", gridTemplateColumns: "auto 1fr" }}>
            <Symbol height={72} />
            <div>
              <p className={s.display} style={{ fontSize: "clamp(1.75rem, 1.4rem + 1.5vw, 2.75rem)" }}>
                Du bleibst. Dein Profi kommt.
              </p>
              <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>Der eine Markenmoment: Oxblood-Fläche, Bone-Schrift, kein weiteres Oxblood im Screen.</p>
            </div>
          </div>
        </div>
      </Section>

      <footer className={s.footer}>
        <div className={s.wrap}>
          Quellen: <code>brand/assets/**</code>, <code>brand/DESIGN_TOKENS/**</code>, <code>brand/BRAND_GUIDELINES.md</code>, <code>brand/LOGO_USAGE.md</code>. Alle Fotos sind
          Entwicklungsbilder (KI-generiert, Fotoset v2); Ersatzanforderungen in brand/photography/PHOTOGRAPHY.md. Fonts: Newsreader und Instrument Sans, SIL OFL 1.1.
          Icons: Lucide (ISC) und eigene SOMA-Icons.
        </div>
      </footer>
    </main>
  );
}
