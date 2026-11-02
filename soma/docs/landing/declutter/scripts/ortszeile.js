const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, h] of [[320, 640], [360, 740], [390, 664], [390, 844], [412, 915], [430, 932], [768, 1024], [820, 1180], [1023, 768]]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const p = await c.newPage();
    await p.goto('http://localhost:3100/?motion=lite', { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => {
      const oz = document.querySelector('.lp-hero-figure [data-ortszeile]')?.getBoundingClientRect();
      const dock = document.querySelector('.lp-dock')?.getBoundingClientRect();
      const shown = document.documentElement.dataset.dock;
      return { ozTop: Math.round(oz.top), ozBottom: Math.round(oz.bottom), dockTop: Math.round(dock.top), dock: shown, vh: innerHeight };
    });
    const overlap = r.dock === 'shown' && r.ozBottom > r.dockTop && r.ozTop < r.vh;
    console.log(`${w}x${h}`, JSON.stringify(r), overlap ? 'OVERLAP' : 'ok');
    await c.close();
  }
  await b.close();
})();
