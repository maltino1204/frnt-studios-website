#!/usr/bin/env bash
# (audit 5) Everything, strictly one after another. 1. Wait for a quiet machine (1-min load < 1.2, at most 10 min).
# 2. Lighthouse: mobile simulate, landing `/?motion=lite` interleaved with the control route `/hilfe` (9 each), then `/`
# (5), DevTools throttling (5), desktop (3). 3. The timing chain (perf-chain.sh). 4. The functional probes (func-chain.sh).
# Progress in /tmp/audit5/out/run-all.progress; the 1-min load before each Lighthouse run in lh-load.log.
set -u
S=/home/user/frnt-studios-website/soma/docs/landing/audit-5/scripts
O=/tmp/audit5/out
mkdir -p $O
for i in $(seq 1 60); do l=$(cut -d' ' -f1 /proc/loadavg); awk -v l="$l" 'BEGIN{exit !(l < 1.2)}' && break; sleep 10; done
echo "start load $(cut -d' ' -f1-3 /proc/loadavg) $(date +%T)" >> $O/run-all.progress
cd /tmp
for i in $(seq 1 9); do
  # single runs under a scratch label, then renamed (audit 4 lost a run by renaming in place)
  bash $S/lh-batch.sh tmpx-lite 1 "http://localhost:3100/?motion=lite" >> $O/lh-sim-lite.log 2>&1; mv /tmp/lh/a5-tmpx-lite-1.json /tmp/lh/a5-sim-lite-$i.json
  bash $S/lh-batch.sh tmpx-hilfe 1 "http://localhost:3100/hilfe" >> $O/lh-sim-hilfe.log 2>&1; mv /tmp/lh/a5-tmpx-hilfe-1.json /tmp/lh/a5-sim-hilfe-$i.json
done
bash $S/lh-batch.sh sim-root 5 "http://localhost:3100/" > $O/lh-sim-root.log 2>&1
bash $S/lh-batch.sh dev-lite 5 "http://localhost:3100/?motion=lite" --throttling-method=devtools > $O/lh-dev-lite.log 2>&1
bash $S/lh-batch.sh desk-full 3 "http://localhost:3100/?motion=full" --preset=desktop > $O/lh-desk-full.log 2>&1
echo "lh $(date +%T)" >> $O/run-all.progress
bash $S/perf-chain.sh; echo "perf-chain $(date +%T)" >> $O/run-all.progress
bash $S/func-chain.sh; echo "func-chain $(date +%T)" >> $O/run-all.progress
echo RUN-ALL-DONE >> $O/run-all.progress
