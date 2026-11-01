// Auditor: capture public pages at 390 (dsf 2) and 1440, full page + viewport, and collect computed style info.
const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const fs = require('fs');
const OUT = '/home/user/frnt-studios-website/soma/brand/audit/brand-audit-1';
const BASE = 'http://localhost:3100';
const pages = [
  ['home', '/'],
  ['suche', '/suche?plz=10115&kategorie=massage'],
  ['profil', '/profis/selin-a-berlin'],
  ['anmelden', '/anmelden'],
  ['fuer-profis', '/fuer-profis'],
  ['hilfe', '/hilfe'],
  ['kit-marke', '/kit/marke'],
];

// Collect: elements whose bg or color or border is Oxblood-ish, visible in viewport
const probe = () => {
  const ox = ['rgb(84, 44, 53)', 'rgb(69, 35, 43)', 'rgb(54, 27, 33)'];
  const out = { oxblood: [], fonts: new Set(), imgs: [], aiLabels: [], stars: [] };
  const all = document.querySelectorAll('body *');
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const hits = [];
    if (ox.includes(cs.backgroundColor)) hits.push('bg');
    if (ox.includes(cs.color) && el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) hits.push('text');
    if (ox.includes(cs.borderTopColor) && parseFloat(cs.borderTopWidth) > 0) hits.push('border');
    if (hits.length) out.oxblood.push({ tag: el.tagName, hits: hits.join('+'), text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 60), top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width) });
    out.fonts.add(cs.fontFamily.split(',')[0]);
  }
  for (const img of document.querySelectorAll('img')) {
    const r = img.getBoundingClientRect();
    if (r.width < 40) continue;
    out.imgs.push({ src: (img.currentSrc || img.src).replace(location.origin, '').slice(0, 120), w: Math.round(r.width), top: Math.round(r.top + scrollY) });
  }
  const txt = document.body.innerText;
  out.aiLabels = (txt.match(/[^\n]*KI-generiert[^\n]*/g) || []).slice(0, 20);
  out.stars = (txt.match(/[^\n]*(★|Sterne|Bewertung|★)[^\n]*/g) || []).slice(0, 10);
  out.fonts = [...out.fonts];
  out.title = document.title;
  out.h1 = [...document.querySelectorAll('h1')].map(h => h.innerText.trim());
  out.docH = document.documentElement.scrollHeight;
  out.hscroll = document.documentElement.scrollWidth > innerWidth + 1;
  out.sie = (txt.match(/[^\n]*\b(Sie|Ihre?n?|Ihnen)\b[^\n]*/g) || []).slice(0, 15);
  out.excl = (txt.match(/[^\n]*!\s[^\n]*/g) || []).slice(0, 10);
  return out;
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const report = {};
  for (const [vpName, vp] of [['390', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }], ['1440', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }]]) {
    const ctx = await browser.newContext({ ...vp, locale: 'de-DE' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
    for (const [name, url] of pages) {
      try {
        await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 45000 });
      } catch (e) { console.log('nav', name, e.message.slice(0, 80)); }
      await page.waitForTimeout(800);
      // scroll through to trigger lazy images/animations
      await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); });
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${OUT}/live-${name}-${vpName}.png` });
      await page.screenshot({ path: `${OUT}/live-${name}-${vpName}-full.png`, fullPage: true });
      const p = await page.evaluate(probe);
      report[`${name}@${vpName}`] = { ...p, errors: [...errors] };
      errors.length = 0;
      console.log(name, vpName, 'oxblood:', p.oxblood.length, 'h', p.docH);
    }
    await ctx.close();
  }
  fs.writeFileSync('/tmp/audit-scripts/report-public.json', JSON.stringify(report, null, 1));
  await browser.close();
})();
