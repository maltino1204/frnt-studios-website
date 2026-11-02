#!/usr/bin/env bash
# (audit 5) Repeats of the runs that came out worse than audit 4 (Lead: "if a performance run looks noisy, repeat it and
# report every run"): a third latency batch and the 4x scroll runs, on a quiet machine (1-min load < 1.0, at most 10 min).
set -u
cd /home/user/frnt-studios-website/soma
S=docs/landing/audit-5/scripts
O=/tmp/audit5/out
for i in $(seq 1 60); do l=$(cut -d' ' -f1 /proc/loadavg); awk -v l="$l" 'BEGIN{exit !(l < 1.0)}' && break; sleep 10; done
echo "repeat start load $(cut -d' ' -f1-3 /proc/loadavg) $(date +%T)" >> $O/repeat.progress
node $S/latency.js 3 settled slow4g > $O/latency-settled-3.log 2>&1
cp docs/landing/audit-5/data/latency-settled-slow4g.json docs/landing/audit-5/data/latency-settled-slow4g-batch3.json
echo "latency3 load $(cut -d' ' -f1-3 /proc/loadavg) $(date +%T)" >> $O/repeat.progress
for a in "d1440 full 4" "d1440 full 4" "m390 lite 4"; do node $S/scrollperf.js $a >> $O/scrollperf-repeat.log 2>&1; done
echo "REPEAT-DONE load $(cut -d' ' -f1-3 /proc/loadavg) $(date +%T)" >> $O/repeat.progress
