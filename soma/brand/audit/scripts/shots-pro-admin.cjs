const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const fs = require('fs');
const OUT = '/home/user/frnt-studios-website/soma/brand/audit/brand-audit-1';
const BASE = 'http://localhost:3100';
const probeSrc = fs.readFileSync('/tmp/audit-scripts/probe.js', 'utf8');
const sets = [
  ['testkunde-b2b@soma.test', [['pro', '/pro'], ['pro-termine', '/pro/termine'], ['pro-einnahmen', '/pro/einnahmen'], ['pro-kalender', '/pro/kalender'], ['pro-verifizierung', '/pro/verifizierung']]],
  ['testadmin@soma.test', [['admin', '/admin'], ['admin-profis', '/admin/profis'], ['admin-buchungen', '/admin/buchungen']]],
];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const report = {};
  for (const [vpName, vp] of [['390', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }], ['1440', { viewport: { width: 1440, height: 900 } }]]) {
    for (const [email, pages] of sets) {
      const ctx = await browser.newContext({ ...vp, locale: 'de-DE' });
      const page = await ctx.newPage();
      await page.goto(BASE + '/anmelden', { waitUntil: 'networkidle' });
      await page.getByLabel('E-Mail').fill(email);
      await page.getByLabel('Passwort', { exact: true }).fill('soma-demo-2026');
      await page.getByRole('button', { name: 'Anmelden' }).click();
      await page.waitForTimeout(2500);
      for (const [name, url] of pages) {
        if (vpName === '390' && name.startsWith('admin') && name !== 'admin') continue;
        await page.goto(BASE + url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1200);
        await page.screenshot({ path: `${OUT}/live-${name}-${vpName}.png` });
        await page.screenshot({ path: `${OUT}/live-${name}-${vpName}-full.png`, fullPage: true });
        report[`${name}@${vpName}`] = await page.evaluate(probeSrc);
        report[`${name}@${vpName}`].url = page.url();
        console.log(name, vpName, page.url(), 'ox', JSON.stringify(report[`${name}@${vpName}`].oxblood.map(o => o.text + '|' + o.hits)));
      }
      await ctx.close();
    }
  }
  fs.writeFileSync('/tmp/audit-scripts/report-pro-admin.json', JSON.stringify(report, null, 1));
  await browser.close();
})();
