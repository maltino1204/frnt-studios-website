// Captures the landing-page reference (theoneagency.de) for internal analysis: structure, stack clues,
// scroll sequences, menu and hover states, and short videos at desktop and mobile size.
// Run from soma/ (it resolves @playwright/test from there):  node ../research/capture-reference.mjs <outDir>
// Internal research only (client-approved): never copy its assets, code or copy into SOMA.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(path.join(process.cwd(), "/"));
const { chromium, devices } = require("@playwright/test");
const OUT = path.resolve(process.argv[2] ?? "reference");
const BASE = "https://theoneagency.de/";
fs.mkdirSync(OUT, { recursive: true });
const log = [];
const note = (m) => { console.log(m); log.push(m); };

const inspect = () => {
  const g = (k) => { try { return typeof window[k] !== "undefined"; } catch { return false; } };
  const libs = ["gsap", "ScrollTrigger", "Lenis", "lenis", "THREE", "barba", "Swup", "LocomotiveScroll", "Webflow", "__NEXT_DATA__", "__NUXT__", "Splitting", "SplitType", "Swiper", "anime", "lottie", "bodymovin", "PIXI", "Alpine", "Vue", "React", "jQuery", "wp"].filter(g);
  const txt = (el) => (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 160);
  const rect = (el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width) }; };
  const sections = [...document.querySelectorAll("body > *, main > *, section, [data-section], [class*='section']")]
    .filter((el, i, a) => a.indexOf(el) === i && el.getBoundingClientRect().height > 200)
    .slice(0, 80)
    .map((el) => ({ tag: el.tagName.toLowerCase(), id: el.id || null, cls: (el.className?.toString() || "").slice(0, 120), ...rect(el), text: txt(el) }));
  const count = (prop, val) => [...document.querySelectorAll("*")].filter((el) => getComputedStyle(el)[prop] === val).length;
  return {
    url: location.href,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content ?? null,
    generator: document.querySelector('meta[name="generator"]')?.content ?? null,
    htmlAttrs: [...document.documentElement.attributes].map((a) => `${a.name}=${a.value.slice(0, 60)}`),
    libs,
    headings: [...document.querySelectorAll("h1,h2,h3")].slice(0, 60).map((h) => `${h.tagName}: ${txt(h)}`),
    nav: [...document.querySelectorAll("header a, nav a")].slice(0, 40).map((a) => ({ text: txt(a), href: a.getAttribute("href") })),
    buttons: [...document.querySelectorAll("button, [role=button]")].slice(0, 40).map((b) => ({ text: txt(b), aria: b.getAttribute("aria-label") })),
    scripts: [...document.scripts].map((s) => s.src || `inline:${s.textContent.length}`).slice(0, 80),
    styles: [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href),
    fonts: [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.style} ${f.status}`).filter((v, i, a) => a.indexOf(v) === i),
    videos: [...document.querySelectorAll("video")].map((v) => ({ src: v.currentSrc || v.querySelector("source")?.src, autoplay: v.autoplay, loop: v.loop, muted: v.muted })),
    canvases: document.querySelectorAll("canvas").length,
    images: document.images.length,
    sticky: count("position", "sticky"),
    fixed: count("position", "fixed"),
    scrollSnap: [...document.querySelectorAll("*")].filter((el) => getComputedStyle(el).scrollSnapType !== "none").length,
    docHeight: document.documentElement.scrollHeight,
    sections,
  };
};

async function scrollShots(page, dir, vh, max = 60) {
  fs.mkdirSync(dir, { recursive: true });
  let i = 0, last = -1;
  while (i < max) {
    await page.screenshot({ path: path.join(dir, `scroll-${String(i).padStart(2, "0")}.jpg`), type: "jpeg", quality: 70 });
    const y = await page.evaluate(() => scrollY);
    if (y === last && i > 0) break;
    last = y;
    await page.mouse.wheel(0, Math.round(vh * 0.5));
    await page.waitForTimeout(650);
    i++;
  }
  return i;
}

async function run(name, ctxOpts) {
  const browser = await chromium.launch();
  const videoSize = ctxOpts.viewport.width > 800 ? { width: 1280, height: 800 } : { width: 390, height: 844 };
  const ctx = await browser.newContext({ ...ctxOpts, recordVideo: { dir: path.join(OUT, name, "video"), size: videoSize } });
  const page = await ctx.newPage();
  const vh = ctxOpts.viewport.height;
  fs.mkdirSync(path.join(OUT, name), { recursive: true });
  try {
    await page.goto(BASE, { waitUntil: "networkidle", timeout: 90_000 });
  } catch (e) { note(`${name}: goto warning ${e.message}`); }
  await page.waitForTimeout(4000);
  fs.writeFileSync(path.join(OUT, name, "page.html"), await page.content());
  const info = await page.evaluate(inspect);
  const resources = await page.evaluate(() => performance.getEntriesByType("resource").map((r) => ({ type: r.initiatorType, name: r.name.slice(0, 160), kb: Math.round((r.transferSize || 0) / 1024) })));
  fs.writeFileSync(path.join(OUT, name, "summary.json"), JSON.stringify({ info, resources }, null, 2));
  await page.screenshot({ path: path.join(OUT, name, "00-initial.jpg"), type: "jpeg", quality: 75 });
  if (!ctxOpts.isMobile) {
    for (let k = 0; k < 6; k++) {
      await page.mouse.move(200 + k * 200, 250 + (k % 2) * 250, { steps: 12 });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, name, `01-pointer-${k}.jpg`), type: "jpeg", quality: 70 });
    }
  }
  const menu = page.locator('button[aria-label*="enu" i], button:has-text("Menu"), button:has-text("Menü"), [class*="burger" i], [class*="menu-toggle" i], [class*="hamburger" i]').first();
  if (await menu.count()) {
    try {
      await menu.click({ timeout: 5000 });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUT, name, "02-menu-open.jpg"), type: "jpeg", quality: 75 });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(800);
    } catch (e) { note(`${name}: menu click failed ${e.message}`); }
  } else note(`${name}: no menu toggle found`);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(800);
  const shots = await scrollShots(page, path.join(OUT, name, "scroll"), vh);
  note(`${name}: ${shots} scroll shots, doc height ${info.docHeight}, libs ${info.libs.join(",")}`);
  try {
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, name, "03-fullpage.jpg"), type: "jpeg", quality: 55, fullPage: true });
  } catch (e) { note(`${name}: fullpage failed ${e.message}`); }
  if (!ctxOpts.isMobile) {
    const links = [...new Set(info.nav.map((n) => n.href).filter((h) => h && !h.startsWith("#") && !h.startsWith("mailto") && !h.startsWith("tel")))]
      .map((h) => new URL(h, BASE).href).filter((h) => h.startsWith(BASE) && h !== BASE).slice(0, 3);
    for (const [j, href] of links.entries()) {
      try {
        await page.goto(href, { waitUntil: "networkidle", timeout: 60_000 });
        await page.waitForTimeout(2500);
        const sub = path.join(OUT, name, `inner-${j}`);
        fs.mkdirSync(sub, { recursive: true });
        fs.writeFileSync(path.join(sub, "summary.json"), JSON.stringify(await page.evaluate(inspect), null, 2));
        await scrollShots(page, sub, vh, 10);
        note(`${name}: inner page ${href}`);
      } catch (e) { note(`${name}: inner ${href} failed ${e.message}`); }
    }
  }
  await ctx.close();
  await browser.close();
}

await run("desktop", { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: "de-DE" });
await run("mobile", { ...devices["iPhone 13"], locale: "de-DE" });
fs.writeFileSync(path.join(OUT, "capture-log.txt"), log.join("\n") + "\n");
