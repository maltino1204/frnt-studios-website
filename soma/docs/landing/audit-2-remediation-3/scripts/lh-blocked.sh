#!/usr/bin/env bash
# lhb.sh <label> <n> <url> <blocked-pattern>
label=$1; n=$2; url=$3; pat=$4
cd /tmp/lh
for i in $(seq 1 $n); do
  out=/tmp/lh/x-$label-$i.json
  CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome npx lighthouse "$url" --quiet --chrome-flags="--headless=new --no-sandbox" --only-categories=performance --output=json --output-path=$out --blocked-url-patterns="$pat" >/dev/null 2>&1
  node -e 'const r=require("'$out'");const m=r.audits.metrics.details.items[0];console.log("'$label' '$i'", r.categories.performance.score*100|0,"obsFCP",m.observedFirstContentfulPaint,"obsLoad",m.observedLoad,"LCP",Math.round(m.largestContentfulPaint),"SI",Math.round(m.speedIndex))'
done
