// (audit 5) Verifies the engineer's R4-3 claim (commit 9737d2c): "Chromium's preload scanner evaluates vh/svh and height
// media queries against the screen height, the <img> against the viewport, so any height in `sizes` fetched the hero
// twice on phones", and that neither of audit 4's two options (height media conditions instead of svh; no preload below
// 1024) would have fixed it.
// A local page (port 3199, not the product) holds the hero's real optimiser srcset from :3100 and one of five `sizes`
// set-ups. Each is loaded in a fresh context with the cache off, once with screen = viewport (Playwright's default) and
// once with a screen taller than the viewport (browser UI, as on a real phone or tablet). Recorded: every hero width
// requested and the width the <img> uses.
const http = require('http');
const fs = require('fs');
const { launch, DATA } = require('./lib');
const IMG = 'http://localhost:3100/_next/image?url=%2Fimages%2Flanding%2Fhero-home-4x5-v3.jpg';
const SRCSET = [256, 384, 390, 640, 828, 1080, 1280, 1600, 2048].map((w) => `${IMG}&w=${w}&q=75 ${w}w`).join(', ');
const A4 = '(min-width: 1440px) 628px, (min-width: 1280px) 45vw, (min-width: 1024px) 37vw, (min-width: 768px) min(100vw - 64px, 576px, max(80svh - 8.72vw - 508.8px, max(240px, 80svh - 8.72vw - 260px) - clamp(0px, (100svh - 10.9vw - 936px) * 1000, 99999px))), (min-width: 768px) 68vw, (max-width: 399px) min(100vw - 40px, 80svh - 395.2px + clamp(0px, (125vw + 331px - 100svh) * 1000, 99999px)), (max-width: 399px) calc(100vw - 40px), min(100vw - 40px, 80svh - 381.6px + clamp(0px, (125vw + 331px - 100svh) * 1000, 99999px)), calc(100vw - 40px)';
// audit 4's option 1: the cap as height media conditions (no svh / clamp in the lengths)
const OPT1 = '(min-width: 1024px) 37vw, (min-width: 768px) and (max-height: 1100px) 34vw, (min-width: 768px) 68vw, (max-width: 399px) and (max-height: 700px) 60vw, (max-width: 399px) and (max-height: 900px) 72vw, calc(100vw - 40px)';
const NOW = '(min-width: 1440px) 628px, (min-width: 1280px) 45vw, (min-width: 1024px) 37vw, (min-width: 768px) min(100vw - 64px, 576px), calc(100vw - 40px)';
const VARIANTS = {
  'A4 (svh, preload)': { sizes: A4, preload: true },
  'A4 (svh, no preload)': { sizes: A4, preload: false },
  'option 1 (height media, preload)': { sizes: OPT1, preload: true },
  'option 2 (svh, preload only >= 1024)': { sizes: A4, preload: true, media: '(min-width: 1024px)' },
  'A4 with vh instead of svh (preload)': { sizes: A4.replace(/svh/g, 'vh'), preload: true },
  'now (width-only, preload)': { sizes: NOW, preload: true },
};
const page = (v) => `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">${v.preload ? `<link rel="preload" as="image" fetchpriority="high" imagesrcset="${SRCSET}" imagesizes="${v.sizes}"${v.media ? ` media="${v.media}"` : ''}>` : ''}</head><body style="margin:0"><img id="h" alt="" fetchpriority="high" srcset="${SRCSET}" sizes="${v.sizes}" style="width:280px;height:auto"></body></html>`;
const DEVICES = {
  'phone 390, screen = viewport 390 × 844': { viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'phone 390, viewport 390 × 664 in a 390 × 844 screen': { viewport: { width: 390, height: 664 }, screen: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'phone 390 DPR 3, viewport 390 × 664 in 390 × 844': { viewport: { width: 390, height: 664 }, screen: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  'tablet 768, screen = viewport 768 × 1024': { viewport: { width: 768, height: 1024 }, screen: { width: 768, height: 1024 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'tablet 768, viewport 768 × 954 in a 768 × 1024 screen': { viewport: { width: 768, height: 954 }, screen: { width: 768, height: 1024 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
(async () => {
  let current = null;
  const srv = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' }); res.end(page(VARIANTS[current])); }).listen(3199);
  const b = await launch();
  const out = [];
  for (const [dev, opts] of Object.entries(DEVICES)) {
    for (const v of Object.keys(VARIANTS)) {
      current = v;
      const c = await b.newContext(opts);
      const p = await c.newPage();
      const cdp = await c.newCDPSession(p);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      const widths = [];
      p.on('request', (r) => { if (r.url().includes('hero-home-4x5')) widths.push(Number(new URL(r.url()).searchParams.get('w'))); });
      await p.goto('http://localhost:3199/', { waitUntil: 'networkidle' });
      await p.waitForTimeout(300);
      const used = await p.evaluate(() => Number(new URL(document.getElementById('h').currentSrc).searchParams.get('w')));
      const row = { device: dev, variant: v, requested: widths, imgUses: used, fetches: widths.length };
      console.log(JSON.stringify(row));
      out.push(row);
      await c.close();
    }
  }
  fs.writeFileSync(`${DATA}/sizes-lab.json`, JSON.stringify(out, null, 1));
  await b.close();
  srv.close();
})();
