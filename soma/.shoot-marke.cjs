const { chromium } = require('@playwright/test');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const out = {};
  for (const w of [1440, 390]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
    const errs = [];
    p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 300)); });
    p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
    await p.goto('http://localhost:3000/kit/marke', { waitUntil: 'networkidle', timeout: 180000 });
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(1500);
    const sw = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    await p.screenshot({ path: `brand/assets/previews/kit-marke-${w}.png`, fullPage: true });
    out[w] = { errs, scroll: sw, fonts: await p.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.style)) };
    await p.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
