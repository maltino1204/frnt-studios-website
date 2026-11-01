// node brand/applications/_src/build-all.mjs  → rebuilds every application artwork (needs the dev server only for capture-live).
import { execFileSync } from "node:child_process";
import path from "node:path";
const dir = path.dirname(new URL(import.meta.url).pathname);
for (const s of ["app-icons", "social", "grid", "ads", "ads-board", "booking", "email", "giftcard", "onboarding", "motion", "showcase", "thumbs"]) {
  console.log("→", s); execFileSync(process.execPath, [path.join(dir, s + ".mjs")], { stdio: "inherit" });
}
console.log("Live screenshots: node brand/applications/_src/capture-live.cjs (dev server on :3000), then showcase.mjs again.");
