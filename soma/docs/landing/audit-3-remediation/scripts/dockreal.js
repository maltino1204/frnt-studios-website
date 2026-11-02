const { launch, BASE, OUT } = require('./lib');
(async () => { const b = await launch();
for (const [w, h] of [[390, 664], [390, 844], [430, 740], [430, 932], [412, 915], [360, 740]]) {
const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const p = await c.newPage();
await p.goto(BASE + '/?motion=lite', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
const r = await p.evaluate(() => ({ dock: document.documentElement.dataset.dock, capTop: Math.round(document.querySelector('#hero-ort figcaption').getBoundingClientRect().top), cardTop: Math.round(document.querySelector('#termin').getBoundingClientRect().top) }));
console.log(`${w}x${h}`, JSON.stringify(r)); await c.close(); }
await b.close(); })();
