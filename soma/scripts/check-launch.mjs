// npm run check:launch — production-readiness gate (docs/STATUS.md → Production blockers).
// Exits non-zero while anything that must not ship to production is still present:
// demo mode, development adapters, placeholder secrets, placeholder legal texts.
// Reads the environment of the shell (load your production env before running).
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const env = process.env;
const blockers = [];
const warnings = [];

const need = (key, expected) => {
  if (env[key] !== expected) blockers.push(`${key} must be "${expected}" (is "${env[key] ?? "unset"}")`);
};

if (env.DEMO_MODE === "true") blockers.push("DEMO_MODE is enabled (demo ribbon, demo logins, noindex)");
need("AUTH_PROVIDER", "supabase");
need("PAYMENTS_PROVIDER", "stripe");
need("STORAGE_PROVIDER", "supabase");
need("EMAIL_PROVIDER", "resend");

for (const key of [
  "DATABASE_URL",
  "APP_URL",
  "CRON_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
]) {
  const v = env[key];
  if (!v) blockers.push(`${key} is not set`);
  else if (/placeholder|change-me|your-project|localhost/i.test(v) && key !== "DATABASE_URL") blockers.push(`${key} still has a placeholder value`);
}
if (env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) warnings.push("STRIPE_SECRET_KEY is a test key");

// Legal texts: the pages render a "Platzhalter – rechtliche Prüfung erforderlich" notice via
// the `placeholder` prop and contain [bracketed] stand-ins until a lawyer supplies final texts.
const legal = ["impressum", "datenschutz", "agb", "agb-profis", "widerruf", "stornierung"];
for (const slug of legal) {
  const file = path.join(root, "src/app/(site)", slug, "page.tsx");
  if (!fs.existsSync(file)) {
    blockers.push(`legal page /${slug} is missing`);
    continue;
  }
  const src = fs.readFileSync(file, "utf8");
  if (/\bplaceholder\b/.test(src) || /\[(Firmenname|Anschrift|Name|Registergericht|HRB|USt-IdNr|Widerrufsbelehrung)[^\]]*\]/.test(src)) {
    blockers.push(`legal page /${slug} still contains placeholder text (legal review required)`);
  }
}

// Photography: demo imagery is AI-generated and must not represent real providers.
const sources = JSON.parse(fs.readFileSync(path.join(root, "scripts/images/sources.json"), "utf8"));
const local = JSON.parse(fs.readFileSync(path.join(root, "src/lib/images.local.json"), "utf8"));
if (local.length < sources.length) warnings.push(`${sources.length - local.length} of ${sources.length} photos are still loaded from the generation CDN (run npm run images:fetch or replace them)`);
warnings.push("Replace AI-generated portraits (public/images/pros) — real providers upload their own photos");

for (const w of warnings) console.log(`warn   ${w}`);
for (const b of blockers) console.log(`BLOCK  ${b}`);
console.log(blockers.length ? `\n${blockers.length} launch blocker(s).` : "\nNo launch blockers found.");
process.exit(blockers.length ? 1 : 0);
