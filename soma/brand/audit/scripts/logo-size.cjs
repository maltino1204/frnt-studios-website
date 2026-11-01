const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const w of [390, 1440]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    for (const u of ['/', '/pro', '/admin', '/buchen']) {
      await p.goto('http://localhost:3100' + u, { waitUntil: 'domcontentloaded' });
      const r = await p.evaluate(() => { const s = [...document.querySelectorAll('svg[viewBox^="0 -16.8"]')].map(e => { const r = e.getBoundingClientRect(); return { h: +r.height.toFixed(1), w: +r.width.toFixed(1), vb: e.getAttribute('viewBox') }; }); return s.slice(0, 3); });
      console.log(w, u, p.url().replace('http://localhost:3100', ''), JSON.stringify(r));
    }
    await p.close();
  }
  await b.close();
})();
