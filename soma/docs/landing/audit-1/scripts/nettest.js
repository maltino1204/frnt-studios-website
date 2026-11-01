const { launch, BASE } = require('./lib');
(async () => {
  const b = await launch();
  const c = await b.newContext({ viewport: { width: 412, height: 823 } });
  const p = await c.newPage();
  const cdp = await c.newCDPSession(p);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 562.5, downloadThroughput: 184320, uploadThroughput: 86400 });
  const t0 = Date.now();
  await p.goto(BASE + '/?motion=lite', { waitUntil: 'load' });
  console.log('wall load', Date.now() - t0);
  console.log(await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return JSON.stringify({ rs: n.requestStart, resp: n.responseStart, respEnd: n.responseEnd, transfer: n.transferSize, load: n.loadEventEnd }); }));
  console.log(await p.evaluate(() => performance.getEntriesByType('resource').filter(r=>/hero-home|\.css|woff2/.test(r.name)).map(r => `${r.name.slice(-50)} start ${Math.round(r.startTime)} resp ${Math.round(r.responseStart)} end ${Math.round(r.responseEnd)} size ${r.transferSize}`).join('\n')));
  await b.close();
})();
