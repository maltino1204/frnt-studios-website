const { launch, BASE } = require('./lib');
(async () => { const b = await launch(); const p = await b.newPage(); await p.goto(BASE + '/?motion=none', { waitUntil: 'networkidle' });
console.log(await p.evaluate(() => [...document.querySelectorAll('section[data-chapter]')].map((s) => s.dataset.chapter + ':' + getComputedStyle(s).contentVisibility + '/' + getComputedStyle(s).containIntrinsicSize).join('  ')));
await b.close(); })();
