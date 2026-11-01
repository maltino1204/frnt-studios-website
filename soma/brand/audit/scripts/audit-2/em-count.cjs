const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const B = 'http://localhost:3000';
const cnt = () => ({ em: [...document.querySelectorAll('h1 em, h2 em, h3 em, [class*="type-display"] em, [class*="type-h1"] em, [class*="type-h2"] em')].map(e => e.innerText.trim().slice(0, 40)), serifHeads: [...document.querySelectorAll('h1,h2,h3')].filter(h => /somaDisplay/.test(getComputedStyle(h).fontFamily) && h.getBoundingClientRect().height > 0).map(h => h.innerText.trim().slice(0, 40)) });
async function login(p, email) { await p.goto(B + '/anmelden', { waitUntil: 'networkidle', timeout: 180000 }); await p.getByLabel('E-Mail').fill(email); await p.getByLabel('Passwort', { exact: true }).fill('soma-demo-2026'); await p.getByRole('button', { name: 'Anmelden' }).click(); await p.waitForTimeout(2500); }
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  let p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  for (const u of ['/suche?plz=10115&kategorie=massage', '/profis/selin-a-berlin', '/anmelden', '/fuer-profis', '/hilfe', '/behandlungen', '/staedte', '/behandlungen/massage', '/staedte/berlin']) { await p.goto(B + u, { waitUntil: 'networkidle', timeout: 180000 }); console.log(u, JSON.stringify(await p.evaluate(cnt))); }
  await login(p, 'testkunde@soma.test');
  for (const u of ['/konto', '/konto/termine', '/konto/favoriten', '/konto/guthaben']) { await p.goto(B + u, { waitUntil: 'networkidle', timeout: 180000 }); console.log(u, JSON.stringify(await p.evaluate(cnt))); }
  const href = await p.locator('a[href*="/buchung/"]').first().getAttribute('href').catch(() => null);
  if (href) { await p.goto(B + href, { waitUntil: 'networkidle', timeout: 180000 }); console.log(href, JSON.stringify(await p.evaluate(cnt))); }
  await p.close(); p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await login(p, 'testkunde-b2b@soma.test');
  for (const u of ['/pro', '/pro/termine', '/pro/einnahmen', '/pro/profil', '/pro/verifizierung']) { await p.goto(B + u, { waitUntil: 'networkidle', timeout: 180000 }); console.log(u, JSON.stringify(await p.evaluate(cnt))); }
  await b.close();
})();
