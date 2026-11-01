const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const w of [390, 1440]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto('http://localhost:3000/anmelden', { waitUntil: 'networkidle', timeout: 180000 });
  await p.getByLabel('E-Mail').fill('testadmin@soma.test'); await p.getByLabel('Passwort', { exact: true }).fill('soma-demo-2026');
  await p.getByRole('button', { name: 'Anmelden' }).click(); await p.waitForTimeout(3000);
  for (const u of ['/admin', '/admin/zahlungen', '/admin/bewertungen', '/admin/nutzer', '/admin/streitfaelle', '/admin/provisionen']) {
    await p.goto('http://localhost:3000' + u, { waitUntil: 'networkidle', timeout: 180000 });
    const res = await p.evaluate(() => [...document.querySelectorAll('input[type=radio].peer:checked')].map(inp => { const s = inp.nextElementSibling, l = inp.closest('label'); return s && l ? { t: s.innerText.trim(), sw: s.scrollWidth, lw: Math.round(l.getBoundingClientRect().width), clip: s.scrollWidth > l.getBoundingClientRect().width + 1 } : null; }).filter(Boolean));
    console.log(w, u, JSON.stringify(res));
  }
  await p.close(); }
  await b.close();
})();
