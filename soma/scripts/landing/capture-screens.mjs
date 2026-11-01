#!/usr/bin/env node
/**
 * Landing asset A4 (docs/landing/LANDING_DESIGN_SPEC.md § 12.2): captures of the live demo app for chapter 07.
 *
 *   node scripts/landing/capture-screens.mjs [baseUrl]        (default http://localhost:3000, demo data seeded)
 *
 * Viewport 390 × 844, DPR 2, reduced motion, signed in as the demo customer. The demo ribbon is hidden by an
 * injected style (the chapter's caption carries the label). Writes public/images/landing/screens/{id}.png and
 * src/components/landing/digital/screens.generated.json with the callout regions (y, h in 390 px CSS coordinates).
 * Re-run on every UI change of these pages.
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("@playwright/test");
const sharp = require("sharp");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT_DIR = path.join(ROOT, "public/images/landing/screens");
const JSON_OUT = path.join(ROOT, "src/components/landing/digital/screens.generated.json");
const EMAIL = "testkunde@soma.test";
const PASSWORD = process.env.E2E_DEMO_PASSWORD ?? "soma-demo-2026";
/** Longest capture kept (CSS px): the chapter only ever shows the upper part of each page. */
const MAX_H = 2400;

const HIDE = `
  [aria-label="Hinweis zur Demo-Umgebung"], nextjs-portal { display: none !important; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
`;

/** Bounding box (page coordinates) of the closest ancestor of the first element matching `text` that satisfies `pick`. */
async function regionOf(page, text, pick = "self", pad = 0) {
  return page.evaluate(
    ({ text, pick, pad }) => {
      const all = [...document.querySelectorAll("main *")].filter((el) => el.children.length === 0 || [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
      const hit = all.find((el) => el.textContent && el.textContent.replace(/\s+/g, " ").includes(text) && el.getBoundingClientRect().height > 0);
      if (!hit) return null;
      let el = hit;
      if (pick === "parent") el = hit.parentElement;
      else if (pick !== "self") el = hit.closest(pick) ?? hit;
      const r = el.getBoundingClientRect();
      const x = Math.max(0, Math.round(r.left - pad));
      return { x, y: Math.max(0, Math.round(r.top + window.scrollY - pad)), w: Math.min(390 - x, Math.round(r.width + 2 * pad)), h: Math.round(r.height + 2 * pad) };
    },
    { text, pick, pad },
  );
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ executablePath: fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce", locale: "de-DE", timezoneId: "Europe/Berlin" });
  await ctx.addInitScript((css) => {
    const add = () => {
      const s = document.createElement("style");
      s.textContent = css;
      document.head.appendChild(s);
    };
    if (document.head) add();
    else document.addEventListener("DOMContentLoaded", add);
  }, HIDE);
  const page = await ctx.newPage();

  await page.goto(`${BASE}/anmelden`);
  await page.getByLabel(/E-Mail/i).fill(EMAIL);
  await page.getByLabel(/Passwort/i).first().fill(PASSWORD);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/anmelden"), { timeout: 30_000 }), page.getByRole("button", { name: /^anmelden$/i }).click()]);

  // A confirmed upcoming booking of the demo customer (for the Start-Code, the deadline and the calendar button).
  await page.goto(`${BASE}/konto/termine`, { waitUntil: "networkidle" });
  const candidates = await page.evaluate(() => [...new Set([...document.querySelectorAll("a[href^='/buchung/']")].map((a) => a.getAttribute("href")))]);
  // The first one that still shows a free-cancellation deadline and a Start-Code (a confirmed booking > 24 h ahead).
  let bookingHref = null;
  for (const href of candidates) {
    await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
    const ok = await page.evaluate(() => /Kostenlos\sstornierbar\sbis/.test(document.body.textContent) && /Dein Start-Code/.test(document.body.textContent));
    if (ok) {
      bookingHref = href;
      break;
    }
  }
  bookingHref ??= candidates[0] ?? null;
  if (!bookingHref) throw new Error("No booking of the demo customer found on /konto/termine.");

  const pages = [
    { id: "suche", url: `/suche?plz=10115`, regions: { endpreis: ["inkl. Anfahrt", "parent", 10] } },
    {
      id: "buchung",
      url: bookingHref,
      regions: {
        stornofrist: ["stornierbar bis", "self", 10],
        startcode: ["Dein Start-Code", "section", 0],
        kalender: ["Zum Kalender hinzufügen", "a", 6],
      },
    },
    { id: "termine", url: `/konto/termine?ansicht=vergangen`, regions: { erneut: ["Erneut buchen", "button, a", 6] } },
    { id: "favoriten", url: `/konto/favoriten`, regions: { favoriten: ["", "main ul, main ol", 0] } },
  ];

  const out = {};
  for (const p of pages) {
    await page.goto(`${BASE}${p.url}`, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);
    // Fixed chrome (the app's bottom tab bar, toasts) would land mid-page in a full-page capture.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll("body *")) {
        if (getComputedStyle(el).position === "fixed") el.style.setProperty("display", "none", "important");
      }
    });
    const regions = {};
    for (const [key, [text, pick, pad]] of Object.entries(p.regions)) {
      const r = text ? await regionOf(page, text, pick, pad) : await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { x: Math.round(b.left), y: Math.round(b.top + window.scrollY), w: Math.round(b.width), h: Math.round(b.height) };
      }, pick);
      if (!r) {
        console.warn(`  ! ${p.id}/${key}: region not found, callout skipped`);
        continue;
      }
      regions[key] = r;
    }
    const fullH = await page.evaluate(() => document.documentElement.scrollHeight);
    const h = Math.min(fullH, MAX_H);
    const buf = await page.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: 390, height: h } });
    const file = path.join(OUT_DIR, `${p.id}.png`);
    await sharp(buf).png({ compressionLevel: 9, palette: false }).toFile(file);
    out[p.id] = { id: p.id, src: `/images/landing/screens/${p.id}.png`, width: 390, height: h, regions: Object.fromEntries(Object.entries(regions).filter(([, r]) => r.y + r.h <= h)) };
    console.log(`  ✓ ${p.id} ${h}px`, JSON.stringify(out[p.id].regions));
  }
  fs.writeFileSync(JSON_OUT, `${JSON.stringify(out, null, 2)}\n`);
  await browser.close();
  console.log(`wrote ${path.relative(ROOT, JSON_OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
