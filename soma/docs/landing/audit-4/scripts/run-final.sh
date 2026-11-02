#!/usr/bin/env bash
# (audit 4) The last timing runs, after everything else: wait for a quiet machine (1-min load < 1.2, at most 10 min),
# then Lighthouse mobile simulate interleaved, landing `/?motion=lite` and a control route `/hilfe` (same app, fonts,
# header and footer, no landing code), 8 runs each, so a stall or a busy neighbour hits both alike; then preload-lcp.js.
set -u
S=/home/user/frnt-studios-website/soma/docs/landing/audit-4/scripts
O=/tmp/audit4/out
for i in $(seq 1 60); do l=$(cut -d' ' -f1 /proc/loadavg); awk -v l="$l" 'BEGIN{exit !(l < 1.2)}' && break; sleep 10; done
echo "start load $(cut -d' ' -f1-3 /proc/loadavg) $(date +%T)" >> $O/run-final.progress
cd /tmp
for i in $(seq 1 8); do
  bash $S/lh-batch.sh sim3-lite 1 "http://localhost:3100/?motion=lite" >> $O/lh-sim3-lite.log 2>&1; mv /tmp/lh/a4-sim3-lite-1.json /tmp/lh/a4-sim3-lite-$i.json
  bash $S/lh-batch.sh sim3-hilfe 1 "http://localhost:3100/hilfe" >> $O/lh-sim3-hilfe.log 2>&1; mv /tmp/lh/a4-sim3-hilfe-1.json /tmp/lh/a4-sim3-hilfe-$i.json
done
echo "lh3 $(date +%T)" >> $O/run-final.progress
cd /home/user/frnt-studios-website/soma && node $S/preload-lcp.js 3 > $O/preload-lcp.log 2>&1
echo "RUN-FINAL-DONE $(date +%T)" >> $O/run-final.progress
