// List the modules of a Turbopack production chunk: id, raw, gz, a content hint. usage: node chunkmods.js <chunk.js> [n]
const fs = require('fs'); const zlib = require('zlib'); const vm = require('vm');
const file = process.argv[2]; const top = Number(process.argv[3] || 40);
const src = fs.readFileSync(file, 'utf8');
const mods = [];
const sandbox = { globalThis: null, TURBOPACK: { push(a) { const arr = a.flat ? a : a; let list = arr.slice(1).flat(); for (let i = 0; i < list.length; i++) { if (typeof list[i] === 'number') { const ids=[list[i]]; let j=i+1; while (typeof list[j]==='number') {ids.push(list[j]); j++;} const fn = list[j]; if (typeof fn === 'function') { mods.push({ ids, s: fn.toString() }); } i = j; } } } } };
sandbox.globalThis = sandbox; sandbox.document = undefined;
vm.runInNewContext(src, sandbox);
const hint = (s) => { const m = s.match(/"(use client)"|name:"([a-z0-9-]+)"|displayName="([^"]+)"|"(\/images\/[^"]+)"|data-([a-z-]+)|className:"([^"]{0,40})"|function ([A-Za-z]{3,})\(/); return m ? (m.slice(1).find(Boolean)) : s.slice(0, 50); };
let tot = 0;
const rows = mods.map((m) => { const g = zlib.gzipSync(m.s, { level: 9 }).length; tot += g; return { id: m.ids.join(','), raw: m.s.length, gz: g, hint: hint(m.s).slice(0, 60) }; }).sort((a, b) => b.gz - a.gz);
for (const r of rows.slice(0, top)) console.log(String(r.id).padEnd(12), String(r.raw).padStart(7), (r.gz/1024).toFixed(1).padStart(6), r.hint);
console.log('modules', rows.length, 'sum gz (separately) KB', (tot/1024).toFixed(1), 'file gz', (zlib.gzipSync(src,{level:9}).length/1024).toFixed(1));
