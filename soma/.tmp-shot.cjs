const { chromium } = require("@playwright/test");
(async () => {
  const [,, url, out, width, login] = process.argv;
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const ctx = await browser.newContext({ viewport: { width: Number(width), height: Number(width) < 600 ? 844 : 900 }, deviceScaleFactor: Number(width) < 600 ? 2 : 1, locale: "de-DE", timezoneId: "Europe/Berlin" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => errors.push("pageerror " + e.message.slice(0, 200)));
  if (login) {
    await page.goto("http://localhost:3000/anmelden");
    await page.getByLabel(/E-Mail/i).fill(login);
    await page.getByLabel(/Passwort/i).first().fill("soma-demo-2026");
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/anmelden")), page.getByRole("button", { name: /^anmelden$/i }).click()]);
  }
  await page.goto("http://localhost:3000" + url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out, fullPage: true });
  console.log(JSON.stringify(errors));
  await browser.close();
})();
