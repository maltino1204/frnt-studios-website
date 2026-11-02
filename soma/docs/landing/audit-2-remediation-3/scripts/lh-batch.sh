#!/usr/bin/env bash
# Copy of audit-2/scripts/lh-batch.sh; only the output name differs (/tmp/lh/r3-<label>-<n>.json).
# usage: lh-batch.sh <label> <runs> <url> [extra lighthouse flags...]
set -u
label=$1; runs=$2; url=$3; shift 3
cd /tmp/lh || exit 1
for i in $(seq 1 "$runs"); do
  out=/tmp/lh/r3-$label-$i.json
  CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome npx lighthouse "$url" --quiet \
    --chrome-flags="--headless=new --no-sandbox" --only-categories=performance --output=json --output-path="$out" "$@" >/dev/null 2>&1
  node /home/user/frnt-studios-website/soma/docs/landing/audit-2-remediation-3/scripts/lh-sum.js "$out" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{for(const l of s.trim().split("\n")){const r=JSON.parse(l);console.log(r.file,r.score,"FCP",r.fcp,"LCP",r.lcp,"TBT",r.tbt,"SI",r.si,"CLS",r.cls,"rt",r.runtimeLoaded,"scriptKB",r.scriptKB,"bench",Math.round(r.bench))}})'
done
