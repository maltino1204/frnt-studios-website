// Content heights (height − vertical padding) of chapters 02–07, every chapter rendered (data-capture=full), fonts
// loaded, none tier. usage: node cvmeasure.js
const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const BASE = process.env.BASE || 'http://localhost:3100';
const W = [[320, 640], [360, 740], [390, 844], [412, 915], [430, 932], [600, 960], [767, 1024], [768, 1024], [820, 1180], [900, 1200], [1023, 768], [1024, 768], [1180, 820], [1280, 800], [1366, 768], [1440, 900], [1920, 1080]];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const rows = [];
  for (const [w, h] of W) {
    const mobile = w < 1024;
    const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1, locale: 'de-DE' });
    const p = await c.newPage();
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => document.documentElement.setAttribute('data-capture', 'full'));
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('main section[data-chapter]')].map((s) => {
      const cs = getComputedStyle(s);
      return [s.dataset.chapter, Math.round(s.offsetHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom))];
    })));
    rows.push([w, h, r]);
    console.log(`${w}x${h}`, Object.entries(r).map(([k, v]) => `${k}:${v}`).join(' '));
    await c.close();
  }
  await b.close();
})();
