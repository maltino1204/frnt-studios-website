#!/usr/bin/env bash
# Remediation after audit 3: the timing runs, strictly one after another, nothing else running.
# NEW = the remediated build on :3100, BASE = the audited commit (716e488) built from a worktree and served on :3200.
# Lighthouse: the command line of lh-batch.sh, A/B alternating (base, new, base, new …) so machine drift hits both.
set -u
cd /home/user/frnt-studios-website/soma
S=docs/landing/audit-3-remediation/scripts
D=docs/landing/audit-3-remediation/data
O=/tmp/audit3r/out
mkdir -p $O
lh() { # lh <label> <n> <url> [flags]
  local label=$1 n=$2 url=$3; shift 3
  (cd /tmp/lh && CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome npx lighthouse "$url" --quiet \
    --chrome-flags="--headless=new --no-sandbox" --only-categories=performance --output=json --output-path="/tmp/lh/r4-$label-$n.json" "$@" >/dev/null 2>&1)
  node $S/lh-sum.js "/tmp/lh/r4-$label-$n.json"
}
for i in 1 2 3 4 5; do
  lh dev-base $i "http://localhost:3200/?motion=lite" --throttling-method=devtools >> $O/lh-dev-ab.log
  lh dev-new $i "http://localhost:3100/?motion=lite" --throttling-method=devtools >> $O/lh-dev-ab.log
done
for i in 1 2 3; do
  lh sim-base $i "http://localhost:3200/?motion=lite" >> $O/lh-sim-ab.log
  lh sim-new $i "http://localhost:3100/?motion=lite" >> $O/lh-sim-ab.log
done
for i in 1 2 3; do lh desk-new $i "http://localhost:3100/?motion=full" --preset=desktop >> $O/lh-desk.log; done
# Interactions (latency.js as the auditor ran it: 2 batches × 3, settled and early), new build
for s in settled early; do for k in 1 2; do
  node $S/latency.js 3 $s slow4g > $O/latency-$s-$k.log 2>&1
  cp $D/latency-$s-slow4g.json $D/latency-$s-slow4g-batch$k.json
done; done
# … and one more batch of each on the audited build (the first "before" batch ran at the start of the session)
for s in settled early; do
  BASE=http://localhost:3200 node $S/latency.js 3 $s slow4g > $O/before-latency-$s-2.log 2>&1
  cp $D/latency-$s-slow4g.json $D/before-latency-$s-slow4g-batch2.json
done
# First Was? tap right after hydration (pickers.js + shell condition + in-page timing), new ×2, base ×1
node $S/pickers-shell.js > $O/pickers-shell-1.log 2>&1; cp $D/pickers-shell.json $D/pickers-shell-batch1.json
node $S/pickers-shell.js > $O/pickers-shell-2.log 2>&1; cp $D/pickers-shell.json $D/pickers-shell-batch2.json
BASE=http://localhost:3200 node $S/pickers-shell.js > $O/before-pickers-shell.log 2>&1; cp $D/pickers-shell.json $D/before-pickers-shell.json
# Load: audit-1 perf.js (the rules' check, 3 runs) and audit-3's perf.js (PR-1 verify, 5 runs)
MASK=1 node docs/landing/audit-1/scripts/perf.js mobile slow4g 3 > $O/perf-audit1.log 2>&1
MASK=1 node $S/perf.js mobile slow4g 5 > $O/perf-mobile.log 2>&1
# Hydration and early input (kept), first view (PR-4), weight
node $S/hydration.js 3 > $O/hydration.log 2>&1
node $S/early.js 3 > $O/early.log 2>&1
node $S/firstview.js > $O/firstview.log 2>&1
node $S/weight.js > $O/weight.log 2>&1
BASE=http://localhost:3200 node $S/weight.js > $O/before-weight.log 2>&1
echo REMEDIATION-CHAIN-DONE >> $O/chain.done
