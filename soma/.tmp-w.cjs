const { chromium } = require("@playwright/test");
(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000/entdecken", { waitUntil: "networkidle" });
  const w = await page.evaluate(() => {
    const a = [...document.querySelectorAll("header a")].find((x) => x.textContent.trim() === "Anmelden");
    const out = {};
    for (const t of ["Anmelden", "Mein Konto", "SOMA Pro", "Admin"]) { a.textContent = t; out[t] = a.getBoundingClientRect().width; }
    return out;
  });
  console.log(w);
  await browser.close();
})();
