// 480 px thumbnails for README.md + one overview board.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import * as L from "./lib.mjs";
const sharp = createRequire(path.join(L.SOMA, "package.json"))("sharp");
const A = L.APPS, T = path.join(A, "_thumbs");
fs.mkdirSync(T, { recursive: true });
export const ITEMS = [
  ["app-icons", "app-icons/app-icons-board.png"], ["social-grid", "social/instagram-grid-preview.png"], ["social-stories", "social/stories-overview.png"],
  ["linkedin", "social/linkedin-banner-1584x396.png"], ["ads-a", "ads/a-schon-zu-hause/board.png"], ["ads-b", "ads/b-zimmer-614/board.png"], ["ads-c", "ads/c-dein-kalender/board.png"],
  ["booking", "booking-confirmation/board.png"], ["email", "email/preview-board.png"], ["email-fallback", "email/preview-fallback-light-680.png"], ["email-dark", "email/preview-fallback-dark-680.png"], ["social-signature", "social/instagram/post-03-evening.png"], ["giftcard", "giftcard/board.png"],
  ["onboarding", "onboarding/pages/page-01.png"], ["onboarding-6", "onboarding/pages/page-06.png"], ["showcase-customer", "showcase/customer-app.png"], ["showcase-pro", "showcase/pro-dashboard.png"],
  ["app-on-table", "showcase/app-on-table.png"], ["motion-1", "motion/storyboard-1.png"], ["motion-2", "motion/storyboard-2.png"], ["motion-3", "motion/storyboard-3.png"],
];
for (const [n, f] of ITEMS) await sharp(path.join(A, f)).resize({ width: 480, height: 480, fit: "inside" }).jpeg({ quality: 76 }).toFile(path.join(T, n + ".jpg"));
const pick = ["app-icons", "social-grid", "ads-b", "booking", "email-dark", "giftcard", "onboarding", "showcase-customer", "showcase-pro", "app-on-table", "motion-2", "ads-c"];
const cells = await Promise.all(pick.map((n) => sharp(path.join(T, n + ".jpg")).resize(420, 300, { fit: "contain", background: "#F3EFE8" }).toBuffer()));
await sharp({ create: { width: 4 * 432 + 12, height: 3 * 312 + 12, channels: 3, background: "#F3EFE8" } })
  .composite(cells.map((b, i) => ({ input: b, left: 12 + (i % 4) * 432, top: 12 + Math.floor(i / 4) * 312 }))).jpeg({ quality: 80 }).toFile(path.join(A, "overview.jpg"));
console.log("thumbs done");
