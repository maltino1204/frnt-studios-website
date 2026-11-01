const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const fs = require('fs');
const OUT = '/home/user/frnt-studios-website/soma/brand/audit/brand-audit-3';
const BASE = 'http://localhost:3000';
const probeSrc = fs.readFileSync('/tmp/audit3/probe.js', 'utf8');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const report = {};
  for (const [vpName, vp] of [['390', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }], ['1440', { viewport: { width: 1440, height: 900 } }]]) {
    const ctx = await browser.newContext({ ...vp, locale: 'de-DE' });
    const page = await ctx.newPage();
    await page.goto(BASE + '/anmelden', { waitUntil: 'networkidle', timeout: 180000 });
    await page.getByLabel('E-Mail').fill('testkunde@soma.test');
    await page.getByLabel('Passwort', { exact: true }).fill('soma-demo-2026');
    await Promise.all([page.waitForURL(/konto/), page.getByRole('button', { name: 'Anmelden' }).click()]);
    await page.goto(BASE + '/suche?plz=10115&kategorie=massage', { waitUntil: 'networkidle', timeout: 180000 });
    const slot = page.locator('a[aria-label*="bei Hanna B. buchen"]').first();
    await Promise.all([page.waitForURL(/buchen/), slot.click()]);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/live-buchen-${vpName}.png` });
    await page.screenshot({ path: `${OUT}/live-buchen-${vpName}-full.png`, fullPage: true });
    report[vpName] = await page.evaluate(probeSrc);
    report[vpName].url = page.url();
    report[vpName].text = (await page.evaluate(() => document.body.innerText)).slice(0, 5000);
    console.log(vpName, page.url(), report[vpName].oxblood);
    await ctx.close();
  }
  fs.writeFileSync('/tmp/audit3/report-checkout.json', JSON.stringify(report, null, 1));
  await browser.close();
})();
