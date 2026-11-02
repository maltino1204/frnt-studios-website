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
      out.push(await p.evaluate(() => { const i = document.querySelector('#termin input[name=plz]'); const cs = getComputedStyle(i); const measure = (inp) => { const cs = getComputedStyle(inp); const s = document.createElement('span'); for (const k of ['fontFamily','fontSize','fontWeight','fontStyle','fontStretch','fontVariationSettings','letterSpacing','fontFeatureSettings','fontKerning']) s.style[k] = cs[k]; s.style.position = 'absolute'; s.style.whiteSpace = 'pre'; s.style.visibility = 'hidden'; s.textContent = inp.placeholder; document.body.appendChild(s); const w = s.getBoundingClientRect().width; s.remove(); return w; }; const tw = measure(i); const avail = i.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); return `"${i.placeholder}" needs ${Math.round(tw)}px / has ${Math.round(avail)}px${tw > avail ? ' TRUNCATED' : ''} [stretch ${cs.fontStretch}; caption "${document.querySelector('#termin label, #termin [data-place-context]')?.closest('label,div')?.textContent.trim().slice(0,30)}"]`; }));
    }
    console.log(`${w}x${h}`, out.join(' | '));
    if (w === 1280) { await p.getByRole('radio', { name: 'Im Hotel' }).click(); await p.waitForTimeout(900); await p.screenshot({ path: `${OUT}/d1280-placeholder-hotel.png`, clip: { x: 0, y: 560, width: 1280, height: 240 } }); }
    await c.close();
  }
  await b.close();
})();
