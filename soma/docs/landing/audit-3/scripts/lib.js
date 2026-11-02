// Audit 3 helpers (copied from audit-2/scripts/lib.js; output to docs/landing/audit-3/).
const { chromium, devices } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const path = require('path');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:3100';
const OUT = '/home/user/frnt-studios-website/soma/docs/landing/audit-3';
const DATA = OUT + '/data';
const TMP = '/tmp/audit3/out';
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(DATA, { recursive: true });

const MOB = { deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const VIEWPORTS = {
  d1920: { viewport: { width: 1920, height: 1080 } },
  d1440: { viewport: { width: 1440, height: 900 } },
  d1280: { viewport: { width: 1280, height: 800 } },
  d1280s: { viewport: { width: 1280, height: 720 } },
  t1024: { viewport: { width: 1024, height: 768 }, hasTouch: true },
  d1024: { viewport: { width: 1024, height: 768 } },
  t768: { viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
  t820: { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
  t1023: { viewport: { width: 1023, height: 768 }, hasTouch: true },
  m430: { viewport: { width: 430, height: 932 }, ...MOB },
  m412: { viewport: { width: 412, height: 915 }, ...MOB },
  m390: { viewport: { width: 390, height: 844 }, ...MOB },
  m390s: { viewport: { width: 390, height: 664 }, ...MOB },
  m360: { viewport: { width: 360, height: 740 }, ...MOB },
  m320: { viewport: { width: 320, height: 640 }, ...MOB },
};
/** The tier a real visitor gets at this viewport (headless automation gets `none` without the override). */
const visitorTier = (vp) => (/^d/.test(vp) ? 'full' : 'lite');

async function launch(opts = {}) {
  return chromium.launch({ executablePath: '/opt/pw-browsers/chromium', ...opts });
}
async function ctx(browser, vp, extra = {}) {
  return browser.newContext({ ...VIEWPORTS[vp], locale: 'de-DE', timezoneId: 'Europe/Berlin', ...extra });
}
async function settle(page, ms = 600) {
  await page.waitForTimeout(ms);
}
/** Scroll gradually to y to let observers fire. */
async function scrollToY(page, y, step = 400, pause = 40) {
  const cur = await page.evaluate(() => scrollY);
  const dir = y > cur ? 1 : -1;
  let p = cur;
  while ((dir > 0 && p < y) || (dir < 0 && p > y)) {
    p = dir > 0 ? Math.min(y, p + step) : Math.max(y, p - step);
    await page.evaluate((v) => window.scrollTo(0, v), p);
    await page.waitForTimeout(pause);
  }
}
async function chapterTops(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('section[data-chapter]')].map((s) => {
      const r = s.getBoundingClientRect();
      return { n: s.dataset.chapter, id: s.id, top: Math.round(r.top + scrollY), h: Math.round(r.height) };
    }),
  );
}
/** Collect console errors/warnings and page errors. */
function watchConsole(page, sink, tag) {
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') sink.push(`${tag} ${m.type()}: ${m.text().slice(0, 300)}`); });
  page.on('pageerror', (e) => sink.push(`${tag} pageerror: ${String(e.message || e).slice(0, 300)}`));
}
module.exports = { chromium, devices, BASE, OUT, DATA, TMP, VIEWPORTS, visitorTier, launch, ctx, settle, scrollToY, chapterTops, watchConsole, path, fs };
