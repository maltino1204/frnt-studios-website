// Usage (from soma/): node scripts/brand/build-og.cjs
// Builds public/brand/og-default.jpg (1200x630) from the brand masters: Bone ground, the tagline lockup (outlined
// SVG, Espresso) left, one photograph in the SOMA arch right. No live text.
const path = require("path");

const sharp = require("sharp");
const fs = require("fs");
const S = path.resolve(__dirname, "../..");
const W = 1200, H = 630;
const BONE = "#F3EFE8", ESPRESSO = "#25211F";

function archPath(x, y, w, h) {
  const rx = w / 2, ry = Math.min(rx * 1.09, h), cx = x + rx, sy = y + ry, f = (v) => +v.toFixed(2);
  return `M${f(x)} ${f(y + h)}L${f(x)} ${f(sy)}C${f(x)} ${f(sy - ry * 0.585)} ${f(cx - rx * 0.57)} ${f(y)} ${f(cx)} ${f(y)}C${f(cx + rx * 0.57)} ${f(y)} ${f(x + w)} ${f(sy - ry * 0.585)} ${f(x + w)} ${f(sy)}L${f(x + w)} ${f(y + h)}Z`;
}

(async () => {
  // Photo in the arch: 4:5, 400 x 500, bottom-aligned with a 64 px margin.
  const aw = 392, ah = 490, ax = W - 96 - aw, ay = H - ah;
  const photo = await sharp(`${S}/public/images/hero/home.jpg`).resize(aw, ah, { fit: "cover", position: "attention" }).toBuffer();
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${aw}" height="${ah}"><path d="${archPath(0, 0, aw, ah + 1)}" fill="#fff"/></svg>`);
  const arch = await sharp(photo).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();

  // Tagline lockup (wordmark + "Your body. Your place."), recoloured to Espresso, 500 px wide.
  let lock = fs.readFileSync(`${S}/brand/assets/logo/final/soma-lockup-tagline.svg`, "utf8").replace(/currentColor/g, ESPRESSO);
  const lw = 470;
  const lockPng = await sharp(Buffer.from(lock), { density: 300 }).resize({ width: lw }).png().toBuffer();
  const lm = await sharp(lockPng).metadata();

  const base = sharp({ create: { width: W, height: H, channels: 3, background: BONE } });
  await base
    .composite([
      { input: arch, left: ax, top: ay },
      { input: lockPng, left: 96, top: Math.round((H - lm.height) / 2) - 8 },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(`${S}/public/brand/og-default.jpg`);
  console.log("ok", lm.width, lm.height);
})();
