const { chromium, devices } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:3100';
const OUT = '/home/user/frnt-studios-website/soma/docs/landing/audit-1';
const TMP = '/tmp/audit/out'; // scratch output
require('fs').mkdirSync(TMP, { recursive: true });

const VIEWPORTS = {
  d1440: { viewport: { width: 1440, height: 900 } },
  d1280: { viewport: { width: 1280, height: 800 } },
  t1024: { viewport: { width: 1024, height: 768 }, hasTouch: true },
  t768: { viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
  m390: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  m360: { viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  m320: { viewport: { width: 320, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

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
async function scrollToY(page, y, step = 400) {
  const cur = await page.evaluate(() => scrollY);
  const dir = y > cur ? 1 : -1;
  let p = cur;
  while ((dir > 0 && p < y) || (dir < 0 && p > y)) {
    p = dir > 0 ? Math.min(y, p + step) : Math.max(y, p - step);
    await page.evaluate((v) => window.scrollTo(0, v), p);
    await page.waitForTimeout(40);
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

module.exports = { chromium, devices, BASE, OUT, TMP, VIEWPORTS, launch, ctx, settle, scrollToY, chapterTops, path };
