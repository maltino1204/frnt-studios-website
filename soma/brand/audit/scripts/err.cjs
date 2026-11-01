const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const OUT = '/home/user/frnt-studios-website/soma/brand/audit/brand-audit-1';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:3100/anmelden', { waitUntil: 'networkidle' });
  await p.getByLabel('E-Mail').fill('testkunde@soma.test');
  await p.getByLabel('Passwort', { exact: true }).fill('falsch-falsch');
  await p.getByRole('button', { name: 'Anmelden' }).click();
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/live-anmelden-error-390.png` });
  const r = await p.evaluate(() => [...document.querySelectorAll('[role=alert],[aria-live],[aria-invalid=true]')].map(e => ({ tag: e.tagName, txt: (e.innerText || '').trim().slice(0, 80), color: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor, svg: !!e.querySelector('svg') })).filter(x => x.txt || x.tag === 'INPUT'));
  console.log(JSON.stringify(r));
  // search empty / invalid PLZ
  await p.goto('http://localhost:3100/suche?plz=99999&kategorie=massage', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  await p.screenshot({ path: `${OUT}/live-suche-empty-390.png` });
  await b.close();
})();
