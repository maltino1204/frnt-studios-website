const { launch, BASE } = require('./lib');
(async () => { const b = await launch(); const p = await b.newPage(); await p.goto(BASE + '/?motion=none', { waitUntil: 'networkidle' });
console.log(await p.evaluate(() => ({ nodes: document.getElementsByTagName('*').length, depth: (() => { let m = 0; const w = (e, d) => { m = Math.max(m, d); for (const c of e.children) w(c, d + 1); }; w(document.documentElement, 1); return m; })(), imgs: document.images.length, lazy: [...document.images].filter(i => i.loading === 'lazy').length, svgs: document.querySelectorAll('svg').length })));
await b.close(); })();
