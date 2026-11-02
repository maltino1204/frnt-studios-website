#!/usr/bin/env bash
# Audit 3: the timing-sensitive runs, strictly one after another (nothing else running). Logs in /tmp/audit3/out.
set -u
cd /home/user/frnt-studios-website/soma
S=docs/landing/audit-3/scripts
O=/tmp/audit3/out
MASK=1 node $S/perf.js mobile slow4g 5 > $O/perf-mobile.log 2>&1
node $S/latency.js 3 settled slow4g > $O/latency-settled-1.log 2>&1
cp docs/landing/audit-3/data/latency-settled-slow4g.json docs/landing/audit-3/data/latency-settled-slow4g-batch1.json
node $S/latency.js 3 settled slow4g > $O/latency-settled-2.log 2>&1
cp docs/landing/audit-3/data/latency-settled-slow4g.json docs/landing/audit-3/data/latency-settled-slow4g-batch2.json
node $S/latency.js 3 early slow4g > $O/latency-early-1.log 2>&1
cp docs/landing/audit-3/data/latency-early-slow4g.json docs/landing/audit-3/data/latency-early-slow4g-batch1.json
node $S/latency.js 3 early slow4g > $O/latency-early-2.log 2>&1
cp docs/landing/audit-3/data/latency-early-slow4g.json docs/landing/audit-3/data/latency-early-slow4g-batch2.json
node $S/hydration.js 3 > $O/hydration.log 2>&1
node $S/early.js 3 > $O/early.log 2>&1
for a in "d1440 full 1" "d1440 full 4" "m390 lite 4" "m390 lite 1"; do node $S/scrollperf.js $a >> $O/scrollperf.log 2>&1; done
$S/lh-batch.sh sim-massage 6 "http://localhost:3100/behandlungen/massage" > $O/lh-sim-massage.log 2>&1
echo PERF-CHAIN-DONE >> $O/perf-chain.done
