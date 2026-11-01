const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const OUT = '/home/user/frnt-studios-website/soma/brand/audit/brand-audit-3';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [vp, w] of [['390', 390], ['1440', 1440]]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 });
    await p.goto('http://localhost:3000/fuer-profis', { waitUntil: 'networkidle', timeout: 180000 });
    // find radiogroups built from segmented control: labels with sr-only radio inputs
    const res = await p.evaluate(() => {
      const out = [];
      for (const inp of document.querySelectorAll('input[type=radio].peer:checked')) {
        const span = inp.nextElementSibling; const lab = inp.closest('label'); if (!span || !lab) continue;
        const sr = span.getBoundingClientRect(), lr = lab.getBoundingClientRect();
        out.push({ text: span.innerText.trim(), spanW: Math.round(span.scrollWidth), labelW: Math.round(lr.width), overflow: span.scrollWidth > lr.width + 1 });
      }
      return out;
    });
    console.log(vp, JSON.stringify(res));
    const el = p.locator('input[type=radio].peer:checked').first();
    if (await el.count()) { const box = await el.locator('xpath=ancestor::*[contains(@class,"rounded-full")][1]/..').first().boundingBox().catch(() => null); if (box) await p.screenshot({ path: `${OUT}/segmented-fuer-profis-${vp}.png`, clip: { x: Math.max(0, box.x - 10), y: box.y - 10, width: Math.min(box.width + 20, w), height: box.height + 20 } }); }
    await p.close();
  }
  await b.close();
})();
