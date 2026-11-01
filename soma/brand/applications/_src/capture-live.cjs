// Captures real screens of the migrating app (dev server :3000, demo mode) → showcase/live/*.png
// node brand/applications/_src/capture-live.cjs
const path = require("node:path");
const { chromium } = require(path.join(__dirname, "../../../node_modules/@playwright/test"));
const OUT = path.join(__dirname, "../showcase/live");
const BASE = "http://localhost:3000";
const HIDE = "nextjs-portal,[data-nextjs-toast],[data-next-badge-root]{display:none!important}";
async function login(page, email) {
  await page.goto(BASE + "/anmelden", { waitUntil: "networkidle", timeout: 90000 });
  await page.getByLabel(/E-Mail/i).first().fill(email);
  await page.getByLabel(/Passwort/i).first().fill("soma-demo-2026");
  await Promise.all([page.waitForLoadState("networkidle"), page.getByRole("button", { name: /anmelden/i }).first().click()]);
  await page.waitForTimeout(1500);
}
async function shot(page, url, file, { full = false } = {}) {
  if (url) await page.goto(BASE + url, { waitUntil: "networkidle", timeout: 90000 });
  await page.addStyleTag({ content: HIDE });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, file), fullPage: full });
  console.log("ok", file, page.url().replace(BASE, ""));
}
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const mob = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: "reduce" };
  // Customer, logged out
  let c = await b.newContext(mob); let p = await c.newPage();
  await shot(p, "/", "c1-home-390.png");
  await shot(p, "/suche?plz=10115", "c2-suche-390.png");
  const prof = await p.locator('a[href^="/profis/"]').first().getAttribute("href").catch(() => null);
  if (prof) await shot(p, prof.split("?")[0], "c3-profil-390.png");
  await c.close();
  // Customer, logged in
  c = await b.newContext(mob); p = await c.newPage();
  await login(p, "testkunde@soma.test");
  await shot(p, "/konto/termine", "c4-termine-390.png");
  const bk = await p.locator('a[href^="/buchung/"]').first().getAttribute("href").catch(() => null);
  if (bk) await shot(p, bk, "c5-buchung-390.png");
  await c.close();
  // SOMA Pro
  c = await b.newContext(mob); p = await c.newPage();
  await login(p, "testkunde-b2b@soma.test");
  await shot(p, "/pro", "p1-heute-390.png");
  await shot(p, "/pro/einnahmen", "p2-einnahmen-390.png");
  await c.close();
  c = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" }); p = await c.newPage();
  await login(p, "testkunde-b2b@soma.test");
  await shot(p, "/pro", "p3-heute-1440.png");
  await shot(p, "/pro/termine", "p4-termine-1440.png");
  await c.close();
  await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
