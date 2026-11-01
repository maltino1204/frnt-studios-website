const { launch, BASE, OUT } = require('./lib');
(async () => {
  const b = await launch();
  for (const [w, h] of [[1440, 900], [1280, 800], [1024, 768], [768, 1024], [390, 844]]) {
    const c = await b.newContext({ viewport: { width: w, height: h } });
    const p = await c.newPage();
    await p.goto(`${BASE}/?motion=lite`, { waitUntil: 'networkidle' });
    const out = [];
    for (const name of ['Zu Hause', 'Im Hotel', 'Im Büro']) {
      await p.getByRole('radio', { name }).click();
      await p.waitForTimeout(300);
      out.push(await p.evaluate(() => { const i = document.querySelector('#termin input[name=plz]'); const cs = getComputedStyle(i); const cv = document.createElement('canvas').getContext('2d'); cv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; const tw = cv.measureText(i.placeholder).width; const avail = i.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); return `"${i.placeholder}" needs ${Math.round(tw)}px / has ${Math.round(avail)}px${tw > avail ? ' TRUNCATED' : ''}`; }));
    }
    console.log(`${w}x${h}`, out.join(' | '));
    if (w === 1280) { await p.getByRole('radio', { name: 'Im Hotel' }).click(); await p.waitForTimeout(900); await p.screenshot({ path: `${OUT}/d1280-placeholder-hotel.png`, clip: { x: 0, y: 620, width: 960, height: 140 } }); }
    await c.close();
  }
  await b.close();
})();
