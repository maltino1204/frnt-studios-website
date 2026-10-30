// Usage: node scripts/screenshot.mjs <baseUrl> <outDir> <path>[@mobile|@desktop] ...
// Captures full-page screenshots for visual review (used by Lead + QA).
// Optional env: SHOT_LOGIN="email:password" logs in via /anmelden first.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const [, , baseUrl = "http://localhost:3000", outDir = "screenshots", ...targets] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const sizes = { mobile: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } };

// Use a preinstalled Chromium when available (CI/containers), else Playwright's managed one.
const executablePath = process.env.PW_CHROMIUM ?? (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const browser = await chromium.launch({ executablePath });
for (const kind of ["mobile", "desktop"]) {
  const list = targets.filter((t) => !t.includes("@") || t.endsWith(`@${kind}`));
  if (!list.length) continue;
  const ctx = await browser.newContext({
    viewport: sizes[kind],
    deviceScaleFactor: kind === "mobile" ? 2 : 1,
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
    isMobile: kind === "mobile",
    hasTouch: kind === "mobile",
  });
  const page = await ctx.newPage();
  if (process.env.SHOT_LOGIN) {
    const [email, password] = process.env.SHOT_LOGIN.split(":");
    await page.goto(`${baseUrl}/anmelden`);
    await page.getByLabel(/E-Mail/i).fill(email);
    await page.getByLabel(/Passwort/i).first().fill(password);
    await page.getByRole("button", { name: /anmelden/i }).click();
    await page.waitForLoadState("networkidle");
  }
  for (const t of list) {
    const p = t.split("@")[0];
    const res = await page.goto(`${baseUrl}${p}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const name = `${kind}-${p.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home"}.png`;
    await page.screenshot({ path: path.join(outDir, name), fullPage: process.env.SHOT_FULL !== "0" });
    console.log(`${res?.status()} ${kind} ${p} -> ${path.join(outDir, name)}`);
  }
  await ctx.close();
}
await browser.close();
