// Render an HTML document to PNG with Playwright's Chromium (file:// so local @font-face files load).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("@playwright/test");

let browser;
export async function shot(html, out, { width = 1200, height = 800, fullPage = true, scale = 1, selector } = {}) {
  browser ??= await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const file = path.join(os.tmpdir(), `soma-shot-${process.pid}-${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(file, html);
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await page.goto(`file://${file}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (selector) await page.locator(selector).screenshot({ path: out });
  else await page.screenshot({ path: out, fullPage });
  await page.close();
  fs.unlinkSync(file);
  return out;
}
export async function closeBrowser() {
  await browser?.close();
  browser = undefined;
}
export function fontFaces(ids) {
  return ids.map((i) => fs.readFileSync(`/tmp/soma-fonts/${i}/faces.css`, "utf8")).join("\n");
}
