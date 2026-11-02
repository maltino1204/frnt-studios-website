#!/bin/bash
# usage: lh5.sh <label> [url]  — 5 Lighthouse mobile runs, performance only
label=$1; url=${2:-http://localhost:3100/?motion=lite}
cd /tmp/lh
for i in 1 2 3 4 5; do
  CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome npx lighthouse "$url" --quiet --chrome-flags="--headless=new --no-sandbox" --only-categories=performance --output=json --output-path=/tmp/lh/decl-$label-$i.json
  node /tmp/lh/sum.js /tmp/lh/decl-$label-$i.json
done
