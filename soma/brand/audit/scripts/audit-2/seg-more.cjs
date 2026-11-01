const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const chk = () => [...document.querySelectorAll('input[type=radio].peer')].map(inp => { const s = inp.nextElementSibling, l = inp.closest('label'); if (!s || !l) return null; const r = l.getBoundingClientRect(); return r.width ? { t: s.innerText.trim(), checked: inp.checked, sw: s.scrollWidth, lw: Math.round(r.width), clip: s.scrollWidth > r.width + 1 } : null; }).filter(Boolean).filter(x => x.checked || x.clip);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const w of [360, 390, 1440]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto('http://localhost:3000/anmelden', { waitUntil: 'networkidle', timeout: 180000 });
    await p.getByLabel('E-Mail').fill('testkunde@soma.test'); await p.getByLabel('Passwort', { exact: true }).fill('soma-demo-2026');
    await p.getByRole('button', { name: 'Anmelden' }).click(); await p.waitForTimeout(2500);
    for (const u of ['/konto/adressen']) { await p.goto('http://localhost:3000' + u, { waitUntil: 'networkidle', timeout: 180000 }); console.log(w, u, JSON.stringify(await p.evaluate(chk))); }
    await p.goto('http://localhost:3000/suche?plz=10115&kategorie=massage', { waitUntil: 'networkidle', timeout: 180000 });
    await Promise.all([p.waitForURL(/buchen/), p.locator('a[aria-label*="bei Hanna B. buchen"]').first().click()]);
    await p.waitForLoadState('networkidle'); await p.waitForTimeout(1200);
    console.log(w, '/buchen', JSON.stringify(await p.evaluate(chk)));
    // try toggling Hotel / Büro
    for (const t of ['Hotel', 'Büro']) { const l = p.locator('label').filter({ hasText: new RegExp('^\\s*' + t + '\\s*$') }).first(); if (await l.count()) { await l.click(); await p.waitForTimeout(300); console.log(w, '/buchen after', t, JSON.stringify(await p.evaluate(chk))); } }
    await p.goto('http://localhost:3000/fuer-profis', { waitUntil: 'networkidle', timeout: 180000 });
    console.log(w, '/fuer-profis', JSON.stringify(await p.evaluate(chk)));
    await p.close();
  }
  await b.close();
})();
