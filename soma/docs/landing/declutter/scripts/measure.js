// Page heights and DOM counts of `/` per viewport. usage: node measure.js [label]
// - none tier (automation default) with every chapter rendered (html[data-capture="full"]): the real content height;
// - the same with content-visibility left on (what scrollHeight reports at load);
// - 1440 also in the full tier after the motion runtime (pins + spacers), the desktop visitor's page.
const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const BASE = process.env.BASE || 'http://localhost:3100';
const VPS = { 390: { width: 390, height: 844, mobile: true }, 768: { width: 768, height: 1024, mobile: true }, 1440: { width: 1440, height: 900, mobile: false } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const out = {};
  for (const [w, vp] of Object.entries(VPS)) {
    const c = await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile, deviceScaleFactor: vp.mobile ? 2 : 1, locale: 'de-DE' });
    const p = await c.newPage();
    const errors = [];
    p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
    p.on('pageerror', (e) => errors.push('pageerror ' + e.message.slice(0, 160)));
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    const atLoad = await p.evaluate(() => document.documentElement.scrollHeight);
    const dom = await p.evaluate(() => ({ all: document.querySelectorAll('*').length, main: document.querySelectorAll('main *').length, chapters: [...document.querySelectorAll('main section[data-chapter]')].map((s) => s.dataset.chapter + ':' + s.id) }));
    await p.evaluate(() => document.documentElement.setAttribute('data-capture', 'full'));
    await p.waitForTimeout(800);
    const full = await p.evaluate(() => ({ h: document.documentElement.scrollHeight, sections: [...document.querySelectorAll('main section[data-chapter]')].map((s) => [s.id, Math.round(s.getBoundingClientRect().height)]), footer: Math.round(document.querySelector('footer')?.getBoundingClientRect().height ?? 0) }));
    out[w] = { atLoad, full: full.h, sections: full.sections, footer: full.footer, dom, errors };
    if (w === '1440') {
      await p.goto(BASE + '/?motion=full', { waitUntil: 'networkidle' });
      await p.evaluate(() => window.scrollBy(0, 1));
      await p.waitForFunction(() => performance.getEntriesByName('lp-motion:init').length === 1, null, { timeout: 15000 }).catch(() => {});
      await p.evaluate(() => document.documentElement.setAttribute('data-capture', 'full'));
      await p.waitForTimeout(800);
      out[w].fullTier = await p.evaluate(() => document.documentElement.scrollHeight);
    }
    await c.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
