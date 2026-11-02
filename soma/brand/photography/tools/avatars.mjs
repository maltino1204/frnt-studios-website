// node brand/photography/tools/avatars.mjs [--apply]
// Square head-and-shoulders crops of the current Profi portraits for the avatars (review R7), same mechanism as recrops.mjs:
// boxes in brand/photography/avatars.json, files derived locally with sharp and registered with `recropOf` (the capture
// workflow keeps them as they are). --apply writes /images/pros/<portrait>-face.jpg (512 × 512), adds its registry entry and
// sets `avatar` on the portrait's entry. Always writes the review sheet brand/photography/v3/11-avatars.jpg (64 px and 160 px).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const cfg = JSON.parse(fs.readFileSync(path.join(root, "brand/photography/avatars.json"), "utf8"));
const file = path.join(root, "scripts/images/sources.json");
const S = JSON.parse(fs.readFileSync(file, "utf8"));
const byPath = new Map(S.map((e) => [e.path, e]));
const apply = process.argv.includes("--apply");
const out = [];
for (const [p, b] of Object.entries(cfg.items).sort()) {
  const src = path.join(root, "public", p);
  const m = await sharp(src).metadata();
  const side = Math.min(Math.round((b.fw * m.width) / cfg.fill), m.width, m.height);
  const left = Math.min(Math.max(Math.round(b.cx * m.width - side / 2), 0), m.width - side);
  const top = Math.min(Math.max(Math.round(b.cy * m.height - cfg.yAt * side), 0), m.height - side);
  const face = p.replace(/\.jpg$/, "-face.jpg");
  const buf = await sharp(src).extract({ left, top, width: side, height: side }).resize(cfg.size, cfg.size).jpeg({ quality: 86, mozjpeg: true })
    .withMetadata({ exif: { IFD0: { ImageDescription: "AI-generated development asset, SOMA avatar crop" } } }).toBuffer();
  out.push({ p, face, buf, fill: (b.fw * m.width) / side, shift: { x: (b.cx * m.width - left) / side, y: (b.cy * m.height - top) / side } });
  if (apply) {
    fs.writeFileSync(path.join(root, "public", face), buf);
    // the avatar belongs on the portrait's current entry (a portrait re-registered under a fresh name, v6, carries it there)
    let portrait = byPath.get(p); for (let n = 0; portrait.replacedBy && n < 8; n++) portrait = byPath.get(portrait.replacedBy);
    const e = byPath.get(face) ?? { path: face };
    Object.assign(e, { remote: byPath.get(p).remote, ratio: "1:1", width: cfg.size, height: cfg.size, focal: "50% 50%", recropOf: p,
      box: { x: +(left / m.width).toFixed(4), y: +(top / m.height).toFixed(4), w: +(side / m.width).toFixed(4), h: +(side / m.height).toFixed(4) },
      source: "Square head-and-shoulders avatar crop of " + p.split("/").pop() + " (brand/photography/tools/avatars.mjs, review R7)" });
    if (!byPath.has(face)) { S.push(e); byPath.set(face, e); }
    portrait.avatar = face;
  }
}
if (apply) fs.writeFileSync(file, JSON.stringify(S, null, 2) + "\n");
// review sheet: each crop as a circle at 64 px and at 160 px
const cell = 64 + 8 + 160, rowH = 180, cols = 5, comps = [];
const W = 10 + cols * (cell + 20), H = 34 + Math.ceil(out.length / cols) * rowH + 10;
const circ = (s) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}" fill="#fff"/></svg>`);
for (let i = 0; i < out.length; i++) {
  const o = out[i], x = 10 + (i % cols) * (cell + 20), y = 34 + Math.floor(i / cols) * rowH;
  for (const [s, dx] of [[64, 0], [160, 72]]) {
    const c = await sharp(o.buf).resize(s, s).composite([{ input: circ(s), blend: "dest-in" }]).png().toBuffer();
    comps.push({ input: c, left: x + dx, top: y + (s === 64 ? 48 : 0) });
  }
  comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="16"><text x="0" y="12" font-family="DejaVu Sans" font-size="11" fill="#25211F">${o.face.split("/").pop()} · face ${Math.round(o.fill * 100)} %</text></svg>`), left: x, top: y + 162 });
}
comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="26"><text x="10" y="19" font-family="DejaVu Sans" font-size="15" font-weight="bold" fill="#25211F">Avatar crops (R7) · ${out.length} · each at 64 px and 160 px</text></svg>`), left: 0, top: 0 });
let q = 82, sheet; do { sheet = await sharp({ create: { width: W, height: H, channels: 3, background: "#F3EFE8" } }).composite(comps).jpeg({ quality: q, mozjpeg: true }).toBuffer(); q -= 6; } while (sheet.length > 300 * 1024 && q > 30);
fs.writeFileSync(path.join(root, "brand/photography/v3/11-avatars.jpg"), sheet);
console.log(`${out.length} crops${apply ? " written and registered" : ""}; fill ${Math.min(...out.map((o) => o.fill)).toFixed(2)}–${Math.max(...out.map((o) => o.fill)).toFixed(2)}; sheet ${Math.round(sheet.length / 1024)} KB`);
for (const o of out) if (Math.abs(o.shift.x - 0.5) > 0.03 || Math.abs(o.shift.y - cfg.yAt) > 0.03) console.log("clamped:", o.face, o.shift);
