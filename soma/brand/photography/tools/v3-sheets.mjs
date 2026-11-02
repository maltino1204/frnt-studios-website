// node brand/photography/tools/v3-sheets.mjs
// Before/after contact sheets of the v3 set → brand/photography/v3/*.jpg (each ≤ 300 KB). Before = the file in use that
// the v3 image replaces (from sources.json `replaces`); after = the v3 file. Labels are the registry paths.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const out = path.join(root, "brand/photography/v3");
fs.mkdirSync(out, { recursive: true });
const S = JSON.parse(fs.readFileSync(path.join(root, "scripts/images/sources.json"), "utf8"));
const v3 = S.filter((e) => /-v3\.jpg$/.test(e.path) || e.path.startsWith("/images/explore/"));
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function sheet(name, items, cols, cellW, ratio, title) {
  const cellH = Math.round(cellW / ratio), label = 18, gap = 8, head = 30;
  const rows = Math.ceil(items.length / cols);
  const W = cols * cellW + (cols + 1) * gap, H = head + rows * (cellH + label) + (rows + 1) * gap;
  const comps = [{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${head}"><text x="${gap}" y="21" font-family="DejaVu Sans" font-size="16" font-weight="bold" fill="#25211F">${esc(title)}</text></svg>`), left: 0, top: 0 }];
  for (let i = 0; i < items.length; i++) {
    const [lab, p] = items[i];
    const x = gap + (i % cols) * (cellW + gap), y = head + gap + Math.floor(i / cols) * (cellH + label + gap);
    const f = path.join(root, "public", p);
    if (fs.existsSync(f)) comps.push({ input: await sharp(f).resize(cellW, cellH, { fit: "cover" }).toBuffer(), left: x, top: y });
    comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cellW}" height="${label}"><text x="0" y="13" font-family="DejaVu Sans" font-size="11" fill="#25211F">${esc(lab)}</text></svg>`), left: x, top: y + cellH + 2 });
  }
  let q = 80, buf;
  do { buf = await sharp({ create: { width: W, height: H, channels: 3, background: "#F3EFE8" } }).composite(comps).jpeg({ quality: q, mozjpeg: true }).toBuffer(); q -= 6; } while (buf.length > 300 * 1024 && q > 30);
  fs.writeFileSync(path.join(out, name + ".jpg"), buf);
  console.log(`${name}.jpg ${items.length} images, ${Math.round(buf.length / 1024)} KB`);
}
const short = (p) => p.replace("/images/", "").replace(".jpg", "");
const pair = (list, cols, w, r, base, title) => Promise.all([
  sheet(`${base}-before`, list.filter((e) => e.replaces).map((e) => [short(e.replaces), e.replaces]), cols, w, r, `${title} · before (v2 in use)`),
  sheet(`${base}-after`, list.map((e) => [short(e.path), e.path]), cols, w, r, `${title} · after (v3 Tageslicht)`),
]);
const grp = (re) => v3.filter((e) => re.test(e.path)).sort((a, b) => a.path.localeCompare(b.path, "en", { numeric: true }));
await pair(grp(/\/pros\//), 6, 150, 0.8, "01-pros", "Profi portraits (30)");
await pair(grp(/\/(landing|hero|editorial)\/|og-default/), 5, 200, 1.25, "02-keys", "Landing, hero, editorial, OG");
await pair(grp(/\/categories\//), 7, 150, 0.8, "03-categories", "Category tiles (7)");
await sheet("04-explore-new", grp(/\/explore\//).map((e) => [short(e.path), e.path]), 6, 170, 0.8, "„Entdecken“ covers (6, new)");
const port = grp(/\/portfolio\//);
await pair(port.slice(0, 43), 9, 120, 1, "05-portfolio-a", "Portfolio 1/2");
await pair(port.slice(43), 9, 120, 1, "06-portfolio-b", "Portfolio 2/2");
