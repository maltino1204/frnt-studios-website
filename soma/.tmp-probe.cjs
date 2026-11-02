const { chromium } = require("@playwright/test");
(async () => {
  const base = process.argv[2] || "http://localhost:3100";
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const log = [];
  page.on("console", (m) => log.push(`[${m.type()}] ${m.text().slice(0, 300)}`));
  page.on("pageerror", (e) => log.push(`[pageerror] ${e.message.slice(0, 300)}`));
  page.on("framenavigated", (f) => { if (f === page.mainFrame()) log.push(`[nav] ${f.url()}`); });
  await page.goto(base + "/anmelden");
  await page.getByLabel(/E-Mail/i).fill("testadmin@soma.test");
  await page.getByLabel(/Passwort/i).first().fill("soma-demo-2026");
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/anmelden")), page.getByRole("button", { name: /^anmelden$/i }).click()]);
  await page.goto(base + "/admin/entdecken/neu");
  const slug = "probe-" + Date.now().toString(36);
  await page.getByLabel("Titel", { exact: true }).fill("Probe " + slug);
  await page.getByLabel("Adresse", { exact: true }).fill(slug);
  await page.getByRole("button", { name: "Leistung hinzufügen" }).click();
  await page.getByLabel("Leistung", { exact: true }).selectOption({ label: "Sportmassage" });
  await page.getByRole("button", { name: "Anlegen" }).click();
  await page.waitForURL(/\/admin\/entdecken\/[0-9a-f-]{36}$/);
  const t0 = Date.now();
  log.push(`[t] url changed`);
  const sw0 = page.getByRole("switch", { name: /^Aktiv/ });
  await sw0.click({ force: true });
  log.push(`[${Date.now() - t0}ms immediate click] checked=${await sw0.isChecked()}`);
  for (let i = 0; i < 8; i++) {
    const s = await page.evaluate(() => {
      const sw = [...document.querySelectorAll('input[role="switch"]')].map((x) => `${x.id}:${x.checked}:${x.disabled}`);
      const h1 = document.querySelector("h1")?.textContent;
      const btn = [...document.querySelectorAll("button")].filter((b) => /Anlegen|Speichern/.test(b.textContent)).map((b) => `${b.textContent.trim()}${b.getAttribute("aria-busy") ? "(busy)" : ""}`);
      return { h1, sw, btn };
    });
    log.push(`[${Date.now() - t0}ms] ${JSON.stringify(s)}`);
    await page.waitForTimeout(150);
  }
  // try to toggle now
  const sw = page.getByRole("switch", { name: /^Aktiv/ });
  await sw.click({ force: true });
  await page.waitForTimeout(300);
  log.push(`[after click] checked=${await sw.isChecked()}`);
  await sw.click({ force: true });
  await page.waitForTimeout(300);
  log.push(`[after click2] checked=${await sw.isChecked()}`);
  // label click
  await page.getByText("Öffentlich, sobald der Zeitraum läuft.").click();
  await page.waitForTimeout(300);
  log.push(`[after label click] checked=${await sw.isChecked()}`);
  console.log(log.join("\n"));
  console.log("SLUG", slug);
  await browser.close();
})();
