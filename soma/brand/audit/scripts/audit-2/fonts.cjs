const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const url of ['/profis/selin-a-berlin', '/anmelden', '/suche?plz=10115&kategorie=massage']) {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    const fonts = [];
    p.on('response', async (r) => { if (/\.woff2/.test(r.url())) { let len = 0; try { len = (await r.body()).length; } catch {} fonts.push([r.url().split('/').pop().slice(0, 40), Math.round(len / 1024) + 'KB']); } });
    await p.goto('http://localhost:3000' + url, { waitUntil: 'networkidle', timeout: 180000 });
    await p.waitForTimeout(500);
    const pre = await p.evaluate(() => [...document.querySelectorAll('link[rel=preload][as=font]')].map(l => l.href.split('/').pop().slice(0, 30)));
    console.log(url, 'preload', pre.length, JSON.stringify(pre), 'loaded', JSON.stringify(fonts));
    await p.close();
  }
  await b.close();
})();
