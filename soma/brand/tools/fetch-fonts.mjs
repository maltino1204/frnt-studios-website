// Downloads the latin woff2 subsets of the candidate typefaces from the Google Fonts CSS API
// into /tmp/soma-fonts/<id>/ (outside the repo) and records file sizes for the performance comparison.
// Usage: node brand/tools/fetch-fonts.mjs
import fs from "node:fs";
import path from "node:path";

const OUT = "/tmp/soma-fonts";
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
export const CANDIDATES = [
  // display
  { id: "newsreader", family: "Newsreader", spec: "ital,opsz,wght@0,6..72,200..800;1,6..72,200..800", role: "display" },
  { id: "newsreader-static", family: "Newsreader", spec: "ital,opsz,wght@0,72,400;1,72,400", role: "display-static" },
  { id: "bodonimoda", family: "Bodoni Moda", spec: "ital,opsz,wght@0,6..96,400..900;1,6..96,400..900", role: "display" },
  { id: "fraunces", family: "Fraunces", spec: "ital,opsz,wght,SOFT,WONK@0,9..144,100..900,0..100,0..1;1,9..144,100..900,0..100,0..1", role: "display" },
  { id: "gloock", family: "Gloock", spec: "", role: "display" },
  { id: "instrumentserif", family: "Instrument Serif", spec: "ital@0;1", role: "display" },
  { id: "notoserifdisplay", family: "Noto Serif Display", spec: "ital,wdth,wght@0,62.5..100,100..900;1,62.5..100,100..900", role: "display" },
  // UI
  { id: "inter", family: "Inter", spec: "opsz,wght@14..32,100..900", role: "ui" },
  { id: "geist", family: "Geist", spec: "wght@100..900", role: "ui" },
  { id: "instrumentsans", family: "Instrument Sans", spec: "ital,wdth,wght@0,75..100,400..700;1,75..100,400..700", role: "ui" },
  { id: "manrope", family: "Manrope", spec: "wght@200..800", role: "ui" },
  { id: "hankengrotesk", family: "Hanken Grotesk", spec: "wght@100..900", role: "ui" },
  { id: "albertsans", family: "Albert Sans", spec: "wght@100..900", role: "ui" },
  { id: "schibstedgrotesk", family: "Schibsted Grotesk", spec: "wght@400..900", role: "ui" },
];

async function main() {
  const report = [];
  for (const c of CANDIDATES) {
    const q = `${c.family.replace(/ /g, "+")}${c.spec ? ":" + c.spec : ""}`;
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${q}&display=swap`, { headers: { "user-agent": UA } })).text();
    const blocks = css.split("@font-face").slice(1);
    const dir = path.join(OUT, c.id);
    fs.mkdirSync(dir, { recursive: true });
    let local = "";
    for (const b of blocks) {
      const prev = css.slice(0, css.indexOf(b)).split("/*").pop();
      const subset = (prev.match(/^\s*([\w-]+)\s*\*\//) || [])[1];
      if (subset !== "latin" && subset !== "latin-ext") continue;
      const url = b.match(/url\((.*?)\)/)[1];
      const style = b.match(/font-style:\s*(\w+)/)[1];
      const weight = b.match(/font-weight:\s*([\d ]+)/)[1].trim();
      const stretch = (b.match(/font-stretch:\s*([^;]+)/) || [])[1];
      const file = `${subset}-${style}.woff2`;
      const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
      fs.writeFileSync(path.join(dir, file), buf);
      report.push({ id: c.id, family: c.family, role: c.role, subset, style, weight, kb: +(buf.length / 1024).toFixed(1) });
      if (subset === "latin")
        local += `@font-face{font-family:"${c.family}";font-style:${style};font-weight:${weight};${stretch ? `font-stretch:${stretch};` : ""}src:url("file://${dir}/${file}") format("woff2");}\n`;
      else
        local += `@font-face{font-family:"${c.family}";font-style:${style};font-weight:${weight};${stretch ? `font-stretch:${stretch};` : ""}src:url("file://${dir}/${file}") format("woff2");unicode-range:U+0100-02BA,U+1E00-1E9F;}\n`;
    }
    fs.writeFileSync(path.join(dir, "faces.css"), local);
  }
  fs.writeFileSync(path.join(OUT, "sizes.json"), JSON.stringify(report, null, 2));
  console.table(report);
}
if (import.meta.url === `file://${process.argv[1]}`) main();
