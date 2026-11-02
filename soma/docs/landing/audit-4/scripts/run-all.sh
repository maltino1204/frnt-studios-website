#!/usr/bin/env bash
# (audit 4) Everything after the first Lighthouse batch, strictly one after another: the timing runs (perf-chain.sh,
# resumed after perf.js), a second Lighthouse batch (the first had 4/9 stalled simulate runs and one noisy `/` run),
# then the functional probes (func-chain.sh). Progress in /tmp/audit4/out/run-all.progress.
set -u
S=/home/user/frnt-studios-website/soma/docs/landing/audit-4/scripts
O=/tmp/audit4/out
SKIP_PERF=1 bash $S/perf-chain.sh; echo "perf-chain $(date +%T)" >> $O/run-all.progress
cd /tmp
$S/lh-batch.sh sim2-lite 9 "http://localhost:3100/?motion=lite" > $O/lh-sim2-lite.log 2>&1
$S/lh-batch.sh sim2-root 5 "http://localhost:3100/" > $O/lh-sim2-root.log 2>&1
$S/lh-batch.sh dev2-lite 5 "http://localhost:3100/?motion=lite" --throttling-method=devtools > $O/lh-dev2-lite.log 2>&1
echo "lh2 $(date +%T)" >> $O/run-all.progress
bash $S/func-chain.sh; echo "func-chain $(date +%T)" >> $O/run-all.progress
echo RUN-ALL-DONE >> $O/run-all.progress
