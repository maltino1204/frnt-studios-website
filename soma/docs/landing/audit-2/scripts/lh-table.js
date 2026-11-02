// Aggregate every audit-2 Lighthouse run (/tmp/lh/a2-<set>-<n>.json) into data/lighthouse-runs.json and print
// per-set rows plus medians. usage: node lh-table.js
const fs = require('fs');
const { summarise } = require('./lh-sum');
const files = fs.readdirSync('/tmp/lh').filter((f) => /^a2-(sim|dev|desk)-[a-z]+-\d+\.json$/.test(f));
const sets = {};
for (const f of files.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))) {
  const s = summarise('/tmp/lh/' + f, '2k0u0yk373bpv');
  const set = f.replace(/^a2-/, '').replace(/-\d+\.json$/, '');
  (sets[set] = sets[set] || []).push(s);
}
const med = (a) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const out = {};
for (const [set, runs] of Object.entries(sets)) {
  out[set] = { runs, median: { score: med(runs.map((r) => r.score)), fcp: med(runs.map((r) => r.fcp)), lcp: med(runs.map((r) => r.lcp)), tbt: med(runs.map((r) => r.tbt)), si: med(runs.map((r) => r.si)), cls: med(runs.map((r) => r.cls)) } };
  console.log(`\n${set} (${runs[0].url}, ${runs[0].method}, ${runs[0].formFactor}; motion runtime loaded: ${[...new Set(runs.map((r) => r.runtimeLoaded))].join('/')})`);
  for (const r of runs) console.log(`  ${r.score} · FCP ${(r.fcp / 1000).toFixed(2)} · LCP ${(r.lcp / 1000).toFixed(2)} · TBT ${r.tbt} · SI ${(r.si / 1000).toFixed(2)} · CLS ${r.cls} · bench ${Math.round(r.bench)}`);
  const m = out[set].median;
  console.log(`  median: ${m.score} · FCP ${(m.fcp / 1000).toFixed(2)} · LCP ${(m.lcp / 1000).toFixed(2)} · TBT ${m.tbt} · CLS ${m.cls}`);
}
fs.writeFileSync('/home/user/frnt-studios-website/soma/docs/landing/audit-2/data/lighthouse-runs.json', JSON.stringify(out, null, 1));
