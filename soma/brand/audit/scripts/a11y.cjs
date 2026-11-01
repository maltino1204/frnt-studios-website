const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const fs = require('fs');
const OUT = '/home/user/frnt-studios-website/soma/brand/audit/brand-audit-1';
const BASE = 'http://localhost:3100';

const audit = () => {
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const blend = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const bgOf = (el) => {
    const stack = []; let e = el; let overImage = false;
    while (e && e.nodeType === 1) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') overImage = true;
      if (e.tagName === 'IMG' || e.querySelector?.(':scope > img')) { /* sibling images handled loosely */ }
      const c = parse(cs.backgroundColor); if (c && c.a > 0) stack.push(c);
      if (c && c.a === 1) break;
      e = e.parentElement;
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = stack.length - 1; i >= 0; i--) bg = blend(stack[i], bg);
    return { bg, overImage };
  };
  const res = { fails: [], small: [], count: 0, minSize: 99, targets: [] };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode; if (!t.textContent.trim()) continue;
    const el = t.parentElement; if (seen.has(el)) continue; seen.add(el);
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
    if (el.closest('[aria-hidden="true"]') || el.closest('.sr-only')) continue;
    // clipped sr-only
    if (r.width <= 1 || r.height <= 1) continue;
    let fg = parse(cs.color); if (!fg) continue;
    const { bg, overImage } = bgOf(el);
    // opacity chain
    let op = 1; let e = el; while (e && e.nodeType === 1) { op *= parseFloat(getComputedStyle(e).opacity); e = e.parentElement; }
    fg = blend({ ...fg, a: fg.a * op }, bg);
    const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    res.count++;
    const disabled = !!el.closest('[disabled],[aria-disabled="true"]');
    if (size < res.minSize) res.minSize = size;
    if (size < 12 && !disabled) res.small.push({ text: t.textContent.trim().slice(0, 40), size });
    if (ratio < need && !overImage && !disabled) res.fails.push({ text: t.textContent.trim().slice(0, 50), ratio: +ratio.toFixed(2), size, fg: cs.color, bgc: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})` });
  }
  for (const a of document.querySelectorAll('a,button,[role="button"],input,select,[role="radio"],[role="tab"],[role="switch"]')) {
    const r = a.getBoundingClientRect(); const cs = getComputedStyle(a);
    if (r.width === 0 || cs.visibility === 'hidden' || a.closest('[aria-hidden="true"]')) continue;
    if ((r.height < 24 || r.width < 24)) res.targets.push({ t: (a.innerText || a.getAttribute('aria-label') || a.tagName).trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) });
  }
  res.targets = res.targets.slice(0, 15);
  res.fails = res.fails.slice(0, 25);
  res.small = res.small.slice(0, 15);
  return res;
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const out = {};
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'de-DE' });
  const page = await ctx.newPage();
  const pub = [['home', '/'], ['suche', '/suche?plz=10115&kategorie=massage'], ['profil', '/profis/selin-a-berlin'], ['fuer-profis', '/fuer-profis'], ['hilfe', '/hilfe'], ['anmelden', '/anmelden']];
  for (const [n, u] of pub) { await page.goto(BASE + u, { waitUntil: 'networkidle' }); await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } }); await page.waitForTimeout(1200); out[n] = await page.evaluate(audit); console.log(n, 'texts', out[n].count, 'fails', out[n].fails.length, 'min', out[n].minSize); }
  // logged in customer
  await page.goto(BASE + '/anmelden', { waitUntil: 'networkidle' });
  await page.getByLabel('E-Mail').fill('testkunde@soma.test'); await page.getByLabel('Passwort', { exact: true }).fill('soma-demo-2026');
  await Promise.all([page.waitForURL(/konto/), page.getByRole('button', { name: 'Anmelden' }).click()]);
  for (const [n, u] of [['konto', '/konto'], ['termine', '/konto/termine']]) { await page.goto(BASE + u, { waitUntil: 'networkidle' }); await page.waitForTimeout(1200); out[n] = await page.evaluate(audit); console.log(n, 'fails', out[n].fails.length, 'min', out[n].minSize); }
  await page.goto(BASE + '/suche?plz=10115&kategorie=massage', { waitUntil: 'networkidle' });
  await Promise.all([page.waitForURL(/buchen/), page.locator('a[aria-label*="bei Hanna B. buchen"]').first().click()]);
  await page.waitForLoadState('networkidle'); await page.waitForTimeout(1500);
  out['buchen'] = await page.evaluate(audit); console.log('buchen fails', out['buchen'].fails.length);
  // Focus ring check: tab to first few controls on checkout, screenshot focused element
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  const foc = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { tag: a.tagName, text: (a.innerText || a.getAttribute('aria-label') || '').slice(0, 40), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor + ' off ' + cs.outlineOffset, shadow: cs.boxShadow.slice(0, 120) }; });
  out.focus = foc; console.log('focus', JSON.stringify(foc));
  const fb = await page.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return { x: Math.max(0, r.x - 12), y: Math.max(0, r.y - 12), width: Math.min(r.width + 24, 390), height: r.height + 24 }; });
  await page.screenshot({ path: `${OUT}/a11y-focus-ring-checkout-390.png`, clip: fb });
  await ctx.close();
  // Pro
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-DE' });
  const p2 = await ctx2.newPage();
  await p2.goto(BASE + '/anmelden', { waitUntil: 'networkidle' });
  await p2.getByLabel('E-Mail').fill('testkunde-b2b@soma.test'); await p2.getByLabel('Passwort', { exact: true }).fill('soma-demo-2026');
  await p2.getByRole('button', { name: 'Anmelden' }).click(); await p2.waitForTimeout(2500);
  for (const [n, u] of [['pro', '/pro'], ['pro-einnahmen', '/pro/einnahmen'], ['pro-kalender', '/pro/kalender']]) { await p2.goto(BASE + u, { waitUntil: 'networkidle' }); await p2.waitForTimeout(1500); out[n] = await p2.evaluate(audit); console.log(n, 'fails', out[n].fails.length, 'min', out[n].minSize); }
  await ctx2.close();
  const ctx3 = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-DE' });
  const p3 = await ctx3.newPage();
  await p3.goto(BASE + '/anmelden', { waitUntil: 'networkidle' });
  await p3.getByLabel('E-Mail').fill('testadmin@soma.test'); await p3.getByLabel('Passwort', { exact: true }).fill('soma-demo-2026');
  await p3.getByRole('button', { name: 'Anmelden' }).click(); await p3.waitForTimeout(2500);
  for (const [n, u] of [['admin', '/admin'], ['admin-profis', '/admin/profis']]) { await p3.goto(BASE + u, { waitUntil: 'networkidle' }); await p3.waitForTimeout(1500); out[n] = await p3.evaluate(audit); console.log(n, 'fails', out[n].fails.length, 'min', out[n].minSize); }
  await ctx3.close();
  fs.writeFileSync('/tmp/audit-scripts/report-a11y.json', JSON.stringify(out, null, 1));
  await browser.close();
})();
