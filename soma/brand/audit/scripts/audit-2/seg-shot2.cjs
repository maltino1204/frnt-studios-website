const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const sharp = require('/home/user/frnt-studios-website/soma/node_modules/sharp');
const OUT = '/home/user/frnt-studios-website/soma/brand/audit/brand-audit-2';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:3000/anmelden', { waitUntil: 'networkidle', timeout: 180000 });
  await p.getByLabel('E-Mail').fill('testkunde@soma.test'); await p.getByLabel('Passwort', { exact: true }).fill('soma-demo-2026');
  await p.getByRole('button', { name: 'Anmelden' }).click(); await p.waitForTimeout(2500);
  await p.goto('http://localhost:3000/suche?plz=10115&kategorie=massage', { waitUntil: 'networkidle', timeout: 180000 });
  await Promise.all([p.waitForURL(/buchen/), p.locator('a[aria-label*="bei Hanna B. buchen"]').first().click()]);
  await p.waitForLoadState('networkidle'); await p.waitForTimeout(1500);
  const y = await p.evaluate(() => { const i = [...document.querySelectorAll('input[type=radio].peer')].find(x => x.nextElementSibling && /Zuhause/.test(x.nextElementSibling.innerText)); const g = i.closest('label').parentElement; const r = g.getBoundingClientRect(); return { top: r.top + scrollY, h: r.height }; });
  await p.evaluate((t) => scrollTo(0, t - 300), y.top); await p.waitForTimeout(500); const r2 = await p.evaluate(() => { const i = [...document.querySelectorAll("input[type=radio].peer")].find(x => x.nextElementSibling && /Zuhause/.test(x.nextElementSibling.innerText)); const r = i.closest("label").parentElement.getBoundingClientRect(); return { y: r.top, h: r.height }; }); const buf = await p.screenshot({ clip: { x: 0, y: r2.y - 12, width: 360, height: r2.h + 24 } });
  require("fs").writeFileSync(`${OUT}/regression-checkout-place-switch-360.png`, buf);
  console.log(y);
  await b.close();
})();
