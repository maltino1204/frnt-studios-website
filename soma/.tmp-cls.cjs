const { chromium } = require("@playwright/test");
(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  for (const width of [390, 1440]) for (const who of [null, "testkunde@soma.test"]) {
    const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, locale: "de-DE", timezoneId: "Europe/Berlin" });
    const page = await ctx.newPage();
    if (who) {
      await page.goto("http://localhost:3000/anmelden");
      await page.getByLabel(/E-Mail/i).fill(who);
      await page.getByLabel(/Passwort/i).first().fill("soma-demo-2026");
      await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/anmelden")), page.getByRole("button", { name: /^anmelden$/i }).click()]);
    }
    await page.addInitScript(() => {
      window.__cls = 0; window.__shifts = [];
      new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push({ v: e.value, src: (e.sources || []).map((s) => (s.node && (s.node.id || s.node.className || s.node.nodeName)) + "").slice(0, 3) }); } } }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("http://localhost:3000/entdecken", { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    const r = await page.evaluate(() => ({ cls: window.__cls, shifts: window.__shifts.slice(0, 5), fy: !!document.getElementById("fuer-dich") }));
    console.log(width, who ?? "guest", JSON.stringify(r));
    await ctx.close();
  }
  await browser.close();
})();
