// Scroll smoothness + CLS during a full scroll. usage: node scrollperf.js <vp> <tier> <cpu>
const { launch, ctx, BASE } = require('./lib');
(async () => {
  const [vp = 'd1440', tier = 'full', cpu = '1'] = process.argv.slice(2);
  const b = await launch();
  const c = await ctx(b, vp);
  const p = await c.newPage();
  await p.addInitScript(() => {
    window.__cls = [];
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__cls.push({ t: e.startTime, v: e.value, rec: e.hadRecentInput, src: (e.sources || []).map((s) => s.node ? s.node.nodeName + '.' + String(s.node.className || '').slice(0, 50) : '?').join('|') }); }).observe({ type: 'layout-shift', buffered: true });
    window.__lt = [];
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push(e.duration); }).observe({ type: 'longtask', buffered: true });
  });
  await p.goto(`${BASE}/?motion=${tier}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);
  const cdp = await c.newCDPSession(p);
  if (Number(cpu) > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(cpu) });
  await p.evaluate(() => { window.__clsBase = window.__cls.length; window.__ltBase = window.__lt.length; window.__frames = []; let last = performance.now(); const f = (t) => { window.__frames.push(t - last); last = t; if (!window.__stopF) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  const t0 = Date.now();
  if (vp.startsWith('d')) {
    await p.mouse.move(700, 450);
    for (let y = 0; y < H; y += 100) { await p.mouse.wheel(0, 100); await p.waitForTimeout(16); }
  } else {
    // touch-like: programmatic scroll steps
    for (let y = 0; y < H; y += 60) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(16); }
  }
  await p.waitForTimeout(1500);
  const dur = Date.now() - t0;
  const r = await p.evaluate(() => { window.__stopF = true; const fr = window.__frames.slice(2); const sorted = [...fr].sort((a, b) => a - b); const pct = (q) => sorted[Math.floor(q * (sorted.length - 1))]; return { frames: fr.length, p50: pct(0.5), p95: pct(0.95), p99: pct(0.99), max: sorted[sorted.length - 1], over50: fr.filter((x) => x > 50).length, over33: fr.filter((x) => x > 33.4).length, cls: window.__cls.slice(window.__clsBase), lt: window.__lt.slice(window.__ltBase) }; });
  const clsSum = r.cls.reduce((a, x) => a + x.v, 0);
  console.log(`${vp} ${tier} cpu${cpu} scroll ${dur}ms frames ${r.frames} p50 ${r.p50.toFixed(1)} p95 ${r.p95.toFixed(1)} p99 ${r.p99.toFixed(1)} max ${r.max.toFixed(0)} >33ms ${r.over33} >50ms ${r.over50} longtasks ${r.lt.length} (max ${Math.round(Math.max(0, ...r.lt))}) scrollCLS ${clsSum.toFixed(4)}`);
  for (const x of r.cls.slice(0, 8)) console.log('  shift', x.v.toFixed(4), x.src);
  await b.close();
})();
