// Run from /tmp/lh (needs its lighthouse install): cd /tmp/lh && node <this> run.json trace.json devtoolslog.json
// Re-run Lantern LCP on a saved Lighthouse run (--save-assets) and list what the optimistic and pessimistic graphs hold.
// usage: node lantern.mjs <run.json> <trace.json> <devtoolslog.json>
import fs from 'fs';
import { LanternLargestContentfulPaint } from 'lighthouse/core/computed/metrics/lantern-largest-contentful-paint.js';
const [lhr, tr, dl] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
const trace = tr.traceEvents ? tr : { traceEvents: tr };
const settings = lhr.configSettings;
const data = { trace, devtoolsLog: dl, gatherContext: { gatherMode: 'navigation' }, settings, simulator: null, URL: { requestedUrl: lhr.requestedUrl, mainDocumentUrl: lhr.finalUrl || lhr.mainDocumentUrl || lhr.finalDisplayedUrl, finalDisplayedUrl: lhr.finalDisplayedUrl }, SourceMaps: [] };
const context = { computedCache: new Map(), settings };
const r = await LanternLargestContentfulPaint.request(data, context);
console.log('LCP', Math.round(r.timing), 'opt', Math.round(r.optimisticEstimate.timeInMs), 'pess', Math.round(r.pessimisticEstimate.timeInMs));
for (const [name, est] of [['optimistic', r.optimisticEstimate], ['pessimistic', r.pessimisticEstimate]]) {
  const rows = []; let cpu = 0, cpuN = 0, bytes = 0;
  for (const [node, t] of est.nodeTimings) {
    if (node.type === 'network') { const q = node.request; bytes += q.transferSize; rows.push([Math.round(t.endTime), (q.transferSize / 1024).toFixed(1), q.resourceType, q.url.replace('http://localhost:3100', '').slice(0, 70)]); }
    else { cpu += t.duration; cpuN++; }
  }
  rows.sort((a, b) => a[0] - b[0]);
  console.log(`\n${name}: ${Math.round(est.timeInMs)} ms; network ${rows.length} nodes ${(bytes / 1024).toFixed(0)} KB; cpu ${cpuN} nodes ${Math.round(cpu)} ms`);
  for (const x of rows) console.log('  ', String(x[0]).padStart(5), x[1].padStart(6), (x[2] || '').padEnd(10), x[3]);
}
