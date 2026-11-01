const fs = require('fs');
const { launch, BASE } = require('./lib');
(async () => {
  const b = await launch();
  const c = await b.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
  const p = await c.newPage();
  const cdp = await c.newCDPSession(p);
  await cdp.send('Network.enable');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 562.5, downloadThroughput: 184320, uploadThroughput: 86400 });
  const fetches = [];
  cdp.on('Network.requestWillBeSent', (e) => { if (e.type === 'Fetch') fetches.push(e.request.url.replace(BASE, '')); });
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  await cdp.send('Profiler.start');
  await p.goto(BASE + '/?motion=lite', { waitUntil: 'load' });
  await p.waitForTimeout(7000);
  const { profile } = await cdp.send('Profiler.stop');
  const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
  const self = new Map();
  const dt = profile.timeDeltas;
  for (let i = 0; i < profile.samples.length; i++) {
    const n = nodes.get(profile.samples[i]);
    const key = (n.callFrame.url.split('/').pop() || '(' + n.callFrame.functionName + ')');
    self.set(key, (self.get(key) || 0) + (dt[i] || 0) / 1000);
  }
  const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  console.log('self time by script (ms, 4x throttled):');
  for (const [k, v] of top) console.log(String(Math.round(v)).padStart(6), k);
  console.log('Fetch requests:', fetches.length); console.log(fetches.join('\n'));
  await b.close();
})();
