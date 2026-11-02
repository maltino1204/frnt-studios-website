#!/usr/bin/env bash
# Audit 4: functional probes, one after another (after perf-chain.sh). Each probe's stdout goes to /tmp/audit4/out/<name>.log.
set -u
cd /home/user/frnt-studios-website/soma
S=docs/landing/audit-4/scripts
O=/tmp/audit4/out
run() { local name=$1; shift; timeout 900 node "$@" > "$O/$name.log" 2>&1; echo "$name exit $?" >> $O/func-chain.progress; }
run firstview $S/firstview.js
run jump $S/jump.js m390,m412,t768,t1024,d1024,d1440
run jump2 $S/jump2.js
run jump-user $S/jump-user.js
run jump-delay $S/jump-delay.js
run focus-walk $S/focus-walk.js t768,t820,t1023,d1024,d1440,m390
run tiers $S/tiers.js
run nav $S/nav.js
run photos $S/photos.js
for a in "d1440 full" "d1024 full" "t1024 lite" "t768 lite" "m390 lite"; do run "hittest-${a// /-}" $S/hittest.js $a; done
for a in "d1440 full" "m390 lite" "t768 lite"; do run "a11y-${a// /-}" $S/a11y.js $a; done
run keyboard $S/keyboard.js d1440 full
run kb-hero $S/kb-hero.js
run trap $S/trap.js
run skip $S/skip.js
run band $S/band.js
run placeholder $S/placeholder.js
run dockreal $S/dockreal.js
run mobile-m390 $S/mobile.js m390 lite
run mobile-m412 $S/mobile.js m412 lite
run conv $S/conv.js
run conv2 $S/conv2.js
run tech $S/tech.js
run routes $S/routes.js
run fetches $S/fetches.js
run contrast $S/contrast.js
run sealtrig-d1440 $S/sealtrig.js d1440 full
run sealtrig-m390 $S/sealtrig.js m390 lite
run rapid $S/rapid.js
run rebook $S/rebook.js
for a in "d1440 full 0.9" "d1024 full 0.9" "t768 lite 0.9" "t820 lite 0.9" "m390 lite 0.9" "m320 lite 0.9" "m430 lite 0.9" "d1440 auto 0.9 reduce" "d1440 auto 1.0 nojs" "m390 auto 1.0 nojs"; do run "walk-${a// /-}" $S/walk.js $a; done
echo FUNC-CHAIN-DONE >> $O/func-chain.progress
