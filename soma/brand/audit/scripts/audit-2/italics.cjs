const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
for (const u of ['/fuer-profis', '/hilfe', '/suche?plz=10115&kategorie=massage', '/profis/selin-a-berlin', '/anmelden', '/staedte/berlin', '/behandlungen/massage']) {
await p.goto('http://localhost:3000' + u, { waitUntil: 'networkidle', timeout: 180000 });
const r = await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => { const cs = getComputedStyle(e); return cs.fontStyle === 'italic' && /somaAccent|somaDisplay/.test(cs.fontFamily) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && e.getBoundingClientRect().height > 0 && !e.closest('footer'); }).map(e => e.innerText.trim().slice(0, 40)));
const f = await p.evaluate(() => [...document.querySelectorAll('footer *')].filter(e => getComputedStyle(e).fontStyle === 'italic' && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).map(e => e.innerText.trim().slice(0, 30)));
console.log(u, 'italic outside footer:', JSON.stringify(r), '| footer:', JSON.stringify(f));
}
await b.close(); })();
