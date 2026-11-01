// npm run images:fetch   (also runs automatically before `npm run build`; failures never break a build)
// Downloads the art-directed photo set (docs/art-direction.md) from its source CDN,
// crops each image to its target ratio around the documented focal point,
// writes optimized sRGB JPEGs (q85) to public/images/**, and records which
// files exist locally in src/lib/images.local.json. Once a file is local, the
// app serves it from /public instead of the remote URL.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const sources = JSON.parse(fs.readFileSync(path.join(root, "scripts/images/sources.json"), "utf8"));
const localManifest = path.join(root, "src/lib/images.local.json");
const done = new Set(JSON.parse(fs.readFileSync(localManifest, "utf8")));

const parseFocal = (f) => f.split(" ").map((v) => parseFloat(v) / 100);

let failures = 0;
for (const src of sources) {
  const out = path.join(root, "public", src.path);
  // Recrops (brand/photography/tools/recrops.mjs) are derived locally from another entry and are committed as files.
  if (src.recropOf) {
    if (fs.existsSync(out)) done.add(src.path);
    continue;
  }
  if (fs.existsSync(out) && done.has(src.path) && !process.argv.includes("--force")) {
    console.log(`skip  ${src.path}`);
    continue;
  }
  try {
    const res = await fetch(src.remote, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const input = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(input).metadata();
    const targetRatio = src.width / src.height;
    const [fx, fy] = parseFocal(src.focal);
    let cw = meta.width, ch = Math.round(meta.width / targetRatio);
    if (ch > meta.height) { ch = meta.height; cw = Math.round(meta.height * targetRatio); }
    const left = Math.min(Math.max(Math.round(fx * meta.width - cw / 2), 0), meta.width - cw);
    const top = Math.min(Math.max(Math.round(fy * meta.height - ch / 2), 0), meta.height - ch);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await sharp(input)
      .extract({ left, top, width: cw, height: ch })
      .resize({ width: Math.min(src.width, cw), withoutEnlargement: true })
      .toColourspace("srgb")
      .jpeg({ quality: 85, mozjpeg: true })
      .withMetadata({ exif: { IFD0: { ImageDescription: "AI-generated, SOMA art direction v1" } } })
      .toFile(out);
    done.add(src.path);
    console.log(`ok    ${src.path}`);
  } catch (err) {
    failures++;
    if (failures <= 3) console.error(`fail  ${src.path}: ${err.message}`);
  }
}
fs.writeFileSync(localManifest, JSON.stringify([...done].sort(), null, 2) + "\n");
if (failures > 3) console.error(`… ${failures - 3} more failed (network?). Remote URLs stay in use for those.`);
console.log(`${done.size}/${sources.length} images available locally.`);
