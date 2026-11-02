#!/usr/bin/env node
/**
 * Explicit compile hints for the landing's first-load scripts (performance remediation 2, docs/landing/audit-1.md).
 *
 * Chromium compiles a function on the main thread the first time it runs. On `/` that lazy compilation is most of the
 * boot task (≈ 950 ms of main-thread compile at 4× CPU, measured with V8 trace events), because the module factories
 * of React, the Next router and the landing's islands all run once at start-up. A script whose first line is the
 * magic comment `//# allFunctionsCalledOnLoad` is compiled eagerly while it streams in, on a background thread
 * (V8 explicit compile hints, Chrome 136+; other engines ignore the comment). Nothing else changes: same code, same
 * file names, same behaviour.
 *
 * Runs after `next build` (npm `postbuild`). It tags exactly the module scripts that the prerendered landing HTML
 * loads (not the `noModule` polyfills, not lazy chunks), and shifts their source maps by the added line. Idempotent.
 */
import fs from "node:fs";
import path from "node:path";

const HINT = "//# allFunctionsCalledOnLoad\n";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const dist = path.join(root, ".next");
const html = path.join(dist, "server/app/index.html");

if (!fs.existsSync(html)) {
  console.log("[compile-hints] no prerendered landing (.next/server/app/index.html); nothing to do");
  process.exit(0);
}

const doc = fs.readFileSync(html, "utf8");
const files = new Set();
for (const m of doc.matchAll(/<script\b[^>]*\bsrc="\/_next\/static\/chunks\/([^"]+\.js)"[^>]*>/g)) {
  if (/\bnoModule\b/i.test(m[0])) continue;
  files.add(m[1]);
}

let tagged = 0;
for (const f of files) {
  const file = path.join(dist, "static/chunks", f);
  if (!fs.existsSync(file)) continue;
  const js = fs.readFileSync(file, "utf8");
  if (js.startsWith(HINT)) continue;
  fs.writeFileSync(file, HINT + js);
  tagged++;
  // Keep a source map (productionBrowserSourceMaps) aligned: one more generated line at the top.
  const ref = /\/\/# sourceMappingURL=([^\s]+)\s*$/.exec(js)?.[1];
  const mapFile = ref && !ref.startsWith("data:") ? path.join(path.dirname(file), ref) : null;
  if (mapFile && fs.existsSync(mapFile)) {
    const map = JSON.parse(fs.readFileSync(mapFile, "utf8"));
    if (typeof map.mappings === "string") {
      map.mappings = ";" + map.mappings;
      fs.writeFileSync(mapFile, JSON.stringify(map));
    }
  }
}
console.log(`[compile-hints] ${tagged} of ${files.size} first-load scripts of / tagged for eager background compilation`);
