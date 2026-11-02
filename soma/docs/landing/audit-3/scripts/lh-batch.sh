#!/usr/bin/env bash
# Sequential Lighthouse 12 runs against the production build (never in parallel).
# usage: lh-batch.sh <label> <runs> <url> [extra lighthouse flags...]
set -u
label=$1; runs=$2; url=$3; shift 3
cd /tmp/lh || exit 1
for i in $(seq 1 "$runs"); do
  out=/tmp/lh/a3-$label-$i.json
  CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome npx lighthouse "$url" --quiet \
    --chrome-flags="--headless=new --no-sandbox" --only-categories=performance --output=json --output-path="$out" "$@" >/dev/null 2>&1
  node /home/user/frnt-studios-website/soma/docs/landing/audit-3/scripts/lh-sum.js "$out"
done
