const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const fs = require('fs');
const OUT = '/home/user/frnt-studios-website/soma/brand/audit/brand-audit-1';
const BASE = 'http://localhost:3100';
const probeSrc = fs.readFileSync('/tmp/audit-scripts/probe.js', 'utf8');

async function login(page, email) {
  await page.goto(BASE + '/anmelden', { waitUntil: 'networkidle' });
  await page.getByLabel('E-Mail').fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill('soma-demo-2026');
  await Promise.all([page.waitForLoadState('networkidle'), page.getByRole('button', { name: 'Anmelden' }).click()]);
  await page.waitForTimeout(1500);
}
async function shot(page, name, vp, report) {
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/live-${name}-${vp}.png` });
  await page.screenshot({ path: `${OUT}/live-${name}-${vp}-full.png`, fullPage: true });
  report[`${name}@${vp}`] = await page.evaluate(probeSrc);
  report[`${name}@${vp}`].url = page.url();
  console.log(name, vp, page.url(), 'ox', report[`${name}@${vp}`].oxblood.length);
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const report = {};
  for (const [vpName, vp] of [['390', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }], ['1440', { viewport: { width: 1440, height: 900 } }]]) {
    const ctx = await browser.newContext({ ...vp, locale: 'de-DE' });
    const page = await ctx.newPage();
    await login(page, 'testkunde@soma.test');
    await shot(page, 'after-login', vpName, report);
    // konto
    await page.goto(BASE + '/konto', { waitUntil: 'networkidle' });
    await shot(page, 'konto', vpName, report);
    await page.goto(BASE + '/konto/termine', { waitUntil: 'networkidle' });
    await shot(page, 'konto-termine', vpName, report);
    // booking detail: first link to /buchung/
    const link = page.locator('a[href*="/buchung/"]').first();
    if (await link.count()) {
      const href = await link.getAttribute('href');
      await page.goto(BASE + href, { waitUntil: 'networkidle' });
      await shot(page, 'buchung-detail', vpName, report);
    } else console.log('no booking link');
    // checkout: search, click Hanna B. slot
    await page.goto(BASE + '/suche?plz=10115&kategorie=massage', { waitUntil: 'networkidle' });
    const card = page.locator('article, li, div').filter({ hasText: 'Hanna B.' }).filter({ hasText: 'Sofort bestätigt' }).last();
    const slot = card.locator('a[href*="/buchen"], button').filter({ hasText: /^\d\d:\d\d$/ }).first();
    console.log('slot count', await slot.count());
    if (await slot.count()) {
      await Promise.all([page.waitForLoadState('networkidle'), slot.click()]);
      await page.waitForTimeout(2500);
      await shot(page, 'buchen', vpName, report);
    }
    await ctx.close();
  }
  fs.writeFileSync('/tmp/audit-scripts/report-customer.json', JSON.stringify(report, null, 1));
  await browser.close();
})();
