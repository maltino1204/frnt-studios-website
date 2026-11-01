// node brand/photography/tools/contact-sheets.mjs
// Builds labelled contact sheets of the development photo set for the audit (brand/photography/audit/sheets).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const pub = path.join(root, "public");
const out = path.join(root, "brand/photography/audit/sheets");
fs.mkdirSync(out, { recursive: true });
const sources = JSON.parse(fs.readFileSync(path.join(root, "scripts/images/sources.json"), "utf8"));
const only = process.argv[2];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
async function sheet(name, items, cols, cellW, ratio) {
  const cellH = Math.round(cellW / ratio);
  const label = 34, gap = 12;
  const rows = Math.ceil(items.length / cols);
  const W = cols * cellW + (cols + 1) * gap;
  const H = rows * (cellH + label) + (rows + 1) * gap;
  const comps = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const x = gap + (i % cols) * (cellW + gap);
    const y = gap + Math.floor(i / cols) * (cellH + label + gap);
    const buf = await sharp(path.join(pub, it.path)).resize(cellW, cellH, { fit: "cover", position: "centre" }).toBuffer();
    comps.push({ input: buf, left: x, top: y });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cellW}" height="${label}"><text x="0" y="24" font-family="DejaVu Sans, sans-serif" font-size="20" fill="#25211F">${esc(it.path.replace("/images/", ""))}</text></svg>`;
    comps.push({ input: Buffer.from(svg), left: x, top: y + cellH + 4 });
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: "#F3EFE8" } }).composite(comps).jpeg({ quality: 82 }).toFile(path.join(out, name + ".jpg"));
  console.log(name, items.length);
}
const by = (re) => sources.filter((s) => re.test(s.path));
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

const jobs = [];
jobs.push(["01-hero-categories", [...by(/hero\//), ...by(/categories\//)], 4, 420, 0.8]);
chunk(by(/pros\//), 6).forEach((c, i) => jobs.push([`02-pros-${i + 1}`, c, 3, 460, 0.8]));
const port = by(/portfolio\//).sort((a, b) => a.path.localeCompare(b.path, "en", { numeric: true }));
chunk(port, 9).forEach((c, i) => jobs.push([`03-portfolio-${String(i + 1).padStart(2, "0")}`, c, 3, 500, 1]));
for (const j of jobs) if (!only || j[0].startsWith(only)) await sheet(...j);
