// Summarise Lighthouse JSON runs: node lh-sum.js <file...>  → one JSON line per run (also usable via require).
// Tier evidence: the motion runtime chunk is only imported in the full and lite tiers (motion/loader.tsx), so its
// presence in network-requests tells which tier the Lighthouse browser got.
const RUNTIME_RE = /scene-ready/; // checked against chunk names below
function summarise(f, runtimeChunk) {
  const r = require(f);
  const a = r.audits;
  const items = (a['network-requests'] && a['network-requests'].details.items) || [];
  const scripts = items.filter((i) => i.resourceType === 'Script');
  const mt = a['mainthread-work-breakdown'] && a['mainthread-work-breakdown'].details.items.reduce((o, i) => ((o[i.group] = Math.round(i.duration)), o), {});
  const lcpEl = a['largest-contentful-paint-element'] && a['largest-contentful-paint-element'].details && a['largest-contentful-paint-element'].details.items[0];
  let lcpNode = null;
  try { lcpNode = lcpEl.items[0].node.snippet.slice(0, 120); } catch (e) {}
  const lt = (a['long-tasks'] && a['long-tasks'].details && a['long-tasks'].details.items) || [];
  return {
    file: f.split('/').pop(),
    url: r.finalDisplayedUrl,
    fetchTime: r.fetchTime,
    method: r.configSettings.throttlingMethod,
    formFactor: r.configSettings.formFactor,
    score: Math.round(r.categories.performance.score * 100),
    fcp: Math.round(a['first-contentful-paint'].numericValue),
    lcp: Math.round(a['largest-contentful-paint'].numericValue),
    tbt: Math.round(a['total-blocking-time'].numericValue),
    si: Math.round(a['speed-index'].numericValue),
    cls: +a['cumulative-layout-shift'].numericValue.toFixed(4),
    bench: r.environment.benchmarkIndex,
    runtimeLoaded: runtimeChunk ? items.some((i) => i.url.includes(runtimeChunk)) : null,
    scriptKB: Math.round(scripts.reduce((s, i) => s + i.transferSize, 0) / 1024),
    totalKB: Math.round(items.reduce((s, i) => s + i.transferSize, 0) / 1024),
    requests: items.length,
    mainThread: mt,
    longTasks: lt.map((t) => `${Math.round(t.startTime)}+${Math.round(t.duration)}`),
    lcpNode,
    runtimeError: r.runtimeError ? r.runtimeError.code : null,
  };
}
/** The motion runtime chunk of the current build (the only chunk that writes data-scene-ready). */
function runtimeChunk() {
  const fs = require('fs');
  const dir = '/home/user/frnt-studios-website/soma/.next/static/chunks';
  return fs.readdirSync(dir).filter((f) => f.endsWith('.js')).find((f) => fs.readFileSync(`${dir}/${f}`, 'utf8').includes('scene-ready')) || null;
}
if (require.main === module) {
  const files = process.argv.slice(2);
  const rc = process.env.RUNTIME_CHUNK || runtimeChunk();
  for (const f of files) console.log(JSON.stringify(summarise(f, rc)));
}

module.exports = { summarise, runtimeChunk };
