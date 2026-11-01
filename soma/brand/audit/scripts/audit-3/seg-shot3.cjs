const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const OUT = '/home/user/frnt-studios-website/soma/brand/audit/brand-audit-3';
const B = 'http://localhost:3000';
async function clipGroup(p, re, file, w) {
  const y = await p.evaluate((src) => { const r = new RegExp(src); const i = [...document.querySelectorAll('input[type=radio].peer')].find(x => x.nextElementSibling && r.test(x.nextElementSibling.innerText)); const g = i.closest('label').parentElement; const b = g.getBoundingClientRect(); return b.top + scrollY; }, re.source);
  await p.evaluate((t) => scrollTo(0, t - 300), y); await p.waitForTimeout(600);
  const r2 = await p.evaluate((src) => { const r = new RegExp(src); const i = [...document.querySelectorAll('input[type=radio].peer')].find(x => x.nextElementSibling && r.test(x.nextElementSibling.innerText)); const b = i.closest('label').parentElement.getBoundingClientRect(); return { y: b.top, h: b.height, x: b.left, w: b.width }; }, re.source);
  await p.screenshot({ path: `${OUT}/${file}`, clip: { x: Math.max(0, r2.x - 12), y: r2.y - 12, width: Math.min(w, r2.w + 24), height: r2.h + 24 } });
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 });
  await p.goto(B + '/anmelden', { waitUntil: 'networkidle', timeout: 180000 });
  await p.getByLabel('E-Mail').fill('testkunde@soma.test'); await p.getByLabel('Passwort', { exact: true }).fill('soma-demo-2026');
  await p.getByRole('button', { name: 'Anmelden' }).click(); await p.waitForTimeout(2500);
  await p.goto(B + '/suche?plz=10115&kategorie=massage', { waitUntil: 'networkidle', timeout: 180000 });
  await Promise.all([p.waitForURL(/buchen/), p.locator('a[aria-label*="bei Hanna B. buchen"]').first().click()]);
  await p.waitForLoadState('networkidle'); await p.waitForTimeout(1500);
  await clipGroup(p, /Zuhause/, 'fixed-checkout-place-switch-360.png', 360);
  await p.goto(B + '/fuer-profis', { waitUntil: 'networkidle', timeout: 180000 });
  await clipGroup(p, /Stammkundschaft/, 'fixed-fuer-profis-segmented-360.png', 360);
  const p2 = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await p2.goto(B + '/anmelden', { waitUntil: 'networkidle', timeout: 180000 });
  await p2.getByLabel('E-Mail').fill('testadmin@soma.test'); await p2.getByLabel('Passwort', { exact: true }).fill('soma-demo-2026');
  await p2.getByRole('button', { name: 'Anmelden' }).click(); await p2.waitForTimeout(2500);
  await p2.goto(B + '/admin', { waitUntil: 'networkidle', timeout: 180000 });
  await clipGroup(p2, /30 Tage/, 'fixed-admin-range-switch-1440.png', 1440);
  await b.close();
})();
