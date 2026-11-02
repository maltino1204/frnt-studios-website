// Screenshots for docs/landing/declutter: full page at 390 and 1440 (every chapter rendered, none tier), first views at
// 390×844, 768×1024, 1440×900. JPEG, ≤ 500 KB each. usage: node shots.js <outdir> [prefix]
const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:3100';
const out = process.argv[2] || '/tmp/declutter/shots';
const pre = process.argv[3] || '';
fs.mkdirSync(out, { recursive: true });
async function shot(b, name, vp, { full = false, query = '', dpr = 1, mobile = false } = {}) {
  const c = await b.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile, locale: 'de-DE', timezoneId: 'Europe/Berlin' });
  const p = await c.newPage();
  await p.goto(BASE + '/' + query, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  if (full) {
    await p.evaluate(() => document.documentElement.setAttribute('data-capture', 'full'));
    // load the lazy images on the way down, then back to the top
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 500) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(80); }
    await p.evaluate(() => scrollTo(0, 0));
    await p.waitForTimeout(1200);
  } else await p.waitForTimeout(1200);
  let q = 80;
  for (;;) {
    const buf = await p.screenshot({ fullPage: full, type: 'jpeg', quality: q });
    if (buf.length <= 500 * 1024 || q <= 35) { fs.writeFileSync(`${out}/${pre}${name}.jpg`, buf); console.log(name, (buf.length / 1024).toFixed(0) + ' KB', 'q' + q); break; }
    q -= 8;
  }
  await c.close();
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  await shot(b, 'full-390', { width: 390, height: 844 }, { full: true, mobile: true });
  await shot(b, 'full-1440', { width: 1440, height: 900 }, { full: true });
  await shot(b, 'first-390x844', { width: 390, height: 844 }, { dpr: 2, mobile: true });
  await shot(b, 'first-768x1024', { width: 768, height: 1024 }, { dpr: 1, mobile: true });
  await shot(b, 'first-1440x900', { width: 1440, height: 900 });
  await b.close();
})();
