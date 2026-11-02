// node brand/photography/tools/fresh-check.mjs [--json out.json]
// Photo QA sign-off (landing audit 4, N4-3 / R4-2): is every photo that the product serves the approved attempt, and has its
// file name never carried any other picture? Image optimisers (`.next/cache/images`, the Netlify Image CDN) cache by URL,
// so a path that was ever written with an earlier attempt can be served stale for as long as that cache lives.
// For every chain end in scripts/images/sources.json (an entry without `replacedBy`, i.e. what currentImagePath serves):
//   1. versions — the number of different blobs the file has had in git history: must be 1 (a fresh name);
//   2. fetched-from — the entry's remote in sources.json at the capture commit that last wrote the file: must be today's
//      remote (else the file on disk is an older attempt than the registry says);
//   3. approved — when a ledger (generation/jobs-v3/v4/v5/v6.json) owns the path: its `current` URL is the registry remote.
// Needs the full git history (`git fetch --unshallow` in a shallow clone). Exit code 1 on any failure.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const repo = path.resolve(root, "..");
const git = (...a) => execFileSync("git", ["-C", repo, ...a], { encoding: "utf8", maxBuffer: 1 << 28 });
if (git("rev-parse", "--is-shallow-repository").trim() === "true") { console.error("shallow clone: run git fetch --unshallow first"); process.exit(2); }
const S = JSON.parse(fs.readFileSync(path.join(root, "scripts/images/sources.json"), "utf8"));
const hist = {}; let c = null;
for (const l of git("log", "--format=C %H", "--raw", "--no-abbrev", "--diff-filter=AMD", "--", "soma/public/images").split("\n")) {
  if (l.startsWith("C ")) { c = l.slice(2); continue; }
  const m = /^:\d+ \d+ \w+ (\w+) ([AMD])\t(.+)$/.exec(l); if (!m) continue;
  (hist[m[3].replace(/^soma\/public/, "")] ??= []).push({ c, blob: m[1], st: m[2] }); // newest first
}
const at = new Map(); const sourcesAt = (commit) => {
  if (!at.has(commit)) { try { at.set(commit, new Map(JSON.parse(git("show", `${commit}:soma/scripts/images/sources.json`)).map((e) => [e.path, e]))); } catch { at.set(commit, new Map()); } }
  return at.get(commit);
};
const ledgers = {};
for (const f of fs.readdirSync(path.join(root, "brand/photography/generation")).filter((f) => /^jobs-v\d+\.json$/.test(f)).sort()) {
  const L = JSON.parse(fs.readFileSync(path.join(root, "brand/photography/generation", f), "utf8"));
  for (const [p, cur] of Object.entries(L.current ?? {})) ledgers[p] = { ledger: f, url: cur.url };
}
const rows = [];
for (const e of S.filter((e) => !e.replacedBy && fs.existsSync(path.join(root, "public", e.path)))) {
  const h = (hist[e.path] ?? []).filter((x) => x.st !== "D");
  const versions = new Set(h.map((x) => x.blob)).size;
  const last = h[0];
  const then = last ? sourcesAt(last.c).get(e.path) : null;
  const fetchedOk = e.recropOf ? true : !!then && then.remote === e.remote; // recrops are cut locally from their source
  const led = ledgers[e.path];
  const approvedOk = !led || led.url === e.remote;
  rows.push({ path: e.path, versions, fetchedOk, approvedOk, ledger: led?.ledger ?? null, ok: versions <= 1 && fetchedOk && approvedOk });
}
const bad = rows.filter((r) => !r.ok);
const out = process.argv.indexOf("--json"); if (out > 0) fs.writeFileSync(process.argv[out + 1], JSON.stringify({ checked: rows.length, bad }, null, 1) + "\n");
console.log(`${rows.length} served paths checked: ${rows.filter((r) => r.versions > 1).length} reused names, ${rows.filter((r) => !r.fetchedOk).length} fetched from an older remote, ${rows.filter((r) => !r.approvedOk).length} not the ledger's approved job`);
for (const r of bad) console.log(`  ${r.path}: versions ${r.versions}${r.fetchedOk ? "" : ", file not from today's remote"}${r.approvedOk ? "" : `, not ${r.ledger}'s approved job`}`);
process.exit(bad.length ? 1 : 0);
