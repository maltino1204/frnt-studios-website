#!/usr/bin/env node
/**
 * Landing asset A1 (docs/landing/LANDING_DESIGN_SPEC.md § 12.2): the hero's 4:5 crop of `landing/hero-mobile.jpg`
 * (9:16, 1440 × 2560), with the arch's focal point (object-position 50% 45%) baked in: 1440 × 1800 from a top offset
 * of 45 % of the vertical slack. Saves about 30 % of the LCP bytes against serving the full 9:16 source.
 *
 *   node scripts/landing/derive-hero.mjs
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "public/images/landing/hero-mobile.jpg");
const OUT = path.join(ROOT, "public/images/landing/hero-home-4x5.jpg");

const meta = await sharp(SRC).metadata();
const width = meta.width;
const height = Math.round((width * 5) / 4);
const top = Math.round((meta.height - height) * 0.45);
await sharp(SRC)
  .extract({ left: 0, top, width, height })
  .withMetadata()
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(OUT);
console.log(`hero-home-4x5.jpg ${width}×${height} (top ${top}px of ${meta.height})`);
