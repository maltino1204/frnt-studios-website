// node brand/photography/tools/recrops.mjs            → before/after sheets in brand/photography/audit/recrops-*.jpg
// node brand/photography/tools/recrops.mjs --apply    → writes public/images/**/<name>-v2.jpg (v1 files stay untouched)
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const { items } = JSON.parse(fs.readFileSync(path.join(root, "brand/photography/audit/recrops.json"), "utf8"));
const apply = process.argv.includes("--apply");

async function cropBuf(p, c) {
  const src = path.join(root, "public", p);
  const m = await sharp(src).metadata();
  const w = Math.round(m.width * c.f), h = Math.round(m.height * c.f);
  const left = Math.round(m.width * c.x), top = Math.round(m.height * c.y);
  return { img: sharp(src).extract({ left, top, width: Math.min(w, m.width - left), height: Math.min(h, m.height - top) }), m };
}

const entries = Object.entries(items);
if (apply) {
  for (const [p, c] of entries) {
    const { img } = await cropBuf(p, c);
    const out = path.join(root, "public", p.replace(/\.jpg$/, "-v2.jpg"));
    await img.jpeg({ quality: 85, mozjpeg: true }).withMetadata({ exif: { IFD0: { ImageDescription: "AI-generated development asset, SOMA art direction v2 (recrop)" } } }).toFile(out);
    console.log("ok", out.replace(root, ""));
  }
} else {
  const cell = 300, gap = 10, lab = 26;
  const per = 8; // pairs per sheet
  for (let s = 0; s * per < entries.length; s++) {
    const chunk = entries.slice(s * per, s * per + per);
    const comps = [];
    for (let i = 0; i < chunk.length; i++) {
      const [p, c] = chunk[i];
      const src = path.join(root, "public", p);
      const m = await sharp(src).metadata();
      const ch = Math.round(cell * m.height / m.width);
      const x0 = gap + (i % 4) * (cell * 2 + gap * 3), y0 = gap + Math.floor(i / 4) * (Math.round(cell * 1.25) + lab + gap * 2);
      const before = await sharp(src).resize(cell).toBuffer();
      // draw the crop box on the before image
      const box = `<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="${ch}"><rect x="${c.x * cell}" y="${c.y * ch}" width="${c.f * cell}" height="${c.f * ch}" fill="none" stroke="#542C35" stroke-width="3"/></svg>`;
      comps.push({ input: await sharp(before).composite([{ input: Buffer.from(box) }]).toBuffer(), left: x0, top: y0 });
      const { img } = await cropBuf(p, c);
      comps.push({ input: await img.resize(cell, ch, { fit: "cover" }).toBuffer(), left: x0 + cell + gap, top: y0 });
      comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cell * 2}" height="${lab}"><text x="0" y="18" font-family="DejaVu Sans" font-size="15" fill="#25211F">${p.replace("/images/", "")}</text></svg>`), left: x0, top: y0 + ch + 4 });
    }
    const rows = Math.ceil(chunk.length / 4);
    const ch = Math.round(cell * 1.25);
    await sharp({ create: { width: 4 * (cell * 2 + gap * 3) + gap, height: rows * (ch + lab + gap * 2) + gap, channels: 3, background: "#F3EFE8" } })
      .composite(comps).jpeg({ quality: 78 }).toFile(path.join(root, `brand/photography/audit/recrops-${s + 1}.jpg`));
    console.log("sheet", s + 1);
  }
}
