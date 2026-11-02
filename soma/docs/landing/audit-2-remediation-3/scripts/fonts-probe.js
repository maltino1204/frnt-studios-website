// Which fonts load before `load` on /?motion=lite at 412 × 823, and which visible elements resolve to the roman.
const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
(async () => {
  const url = process.argv[2] || 'http://localhost:3100/?motion=lite';
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const c = await b.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, locale: 'de-DE' });
  const p = await c.newPage();
  await p.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }));
  const reqs = [];
  p.on('request', (r) => { if (r.resourceType() === 'font') reqs.push({ t: Date.now(), url: r.url().split('/').pop() }); });
  const t0 = Date.now();
  await p.goto(url, { waitUntil: 'load' });
  const tLoad = Date.now();
  await p.waitForTimeout(3000);
  console.log('fonts requested (ms after goto; load at', tLoad - t0, '):', reqs.map((r) => `${r.t - t0} ${r.url}`).join(' | '));
  const cdp = await c.newCDPSession(p);
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  // Elements in the first viewport whose text renders with the roman (platform font usage).
  const ids = await p.evaluate(() => {
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; let i = 0;
    while ((n = walker.nextNode())) {
      if (!n.textContent) continue;
      const el = n.parentElement; const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      el.setAttribute('data-fp', String(i)); out.push(i++);
    }
    return out;
  });
  const doc = await cdp.send('DOM.getDocument', { depth: -1 });
  for (const i of ids) {
    let nodeId; try { ({ nodeId } = await cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: `[data-fp="${i}"]` })); } catch (e) { continue; }
    if (!nodeId) continue;
    const _unused = { nodeId } = await cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: `[data-fp="${i}"]` });
    let f; try { f = await cdp.send('CSS.getPlatformFontsForNode', { nodeId }); } catch (e) { continue; }
    const fam = f.fonts.map((x) => `${x.familyName}${x.isCustomFont ? '*' : ''}:${x.glyphCount}`).join(',');
    if (/Newsreader|newsreader|somaDisplay|Display/i.test(fam)) {
      const info = await p.evaluate((k) => { const el = document.querySelector(`[data-fp="${k}"]`); return `${el.tagName}.${(el.className || '').toString().slice(0, 60)} "${el.textContent.slice(0, 40)}" ff=${getComputedStyle(el).fontFamily.slice(0, 80)}`; }, i);
      console.log('roman/display glyphs:', fam, '←', info);
    }
  }
  await b.close();
})();
