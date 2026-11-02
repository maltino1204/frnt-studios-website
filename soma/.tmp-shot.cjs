const { chromium } = require("@playwright/test");
(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const out = "docs/qa/entdecken";
  const jobs = [
    ["/entdecken", "entdecken-gast", null],
    ["/entdecken", "entdecken-testkunde", "testkunde@soma.test"],
    ["/entdecken/im-hotel-ankommen", "sammlung-im-hotel-ankommen", null],
  ];
  for (const width of [390, 1440]) for (const [url, name, who] of jobs) {
    const mobile = width < 600;
    const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, deviceScaleFactor: mobile ? 2 : 1, locale: "de-DE", timezoneId: "Europe/Berlin", isMobile: mobile, hasTouch: mobile });
    const page = await ctx.newPage();
    // the next dev indicator is not part of the product
    await page.addInitScript(() => document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = "nextjs-portal{display:none!important}"; document.head.appendChild(s); }));
    if (who) {
      await page.goto("http://localhost:3000/anmelden");
      await page.getByLabel(/E-Mail/i).fill(who);
      await page.getByLabel(/Passwort/i).first().fill("soma-demo-2026");
      await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/anmelden")), page.getByRole("button", { name: /^anmelden$/i }).click()]);
    }
    await page.goto("http://localhost:3000" + url, { waitUntil: "networkidle" });
    if (who) await page.locator("section#fuer-dich").waitFor({ timeout: 20000 });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 600) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    const file = `${out}/${name}-${width}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(file);
    await ctx.close();
  }
  await browser.close();
})();
