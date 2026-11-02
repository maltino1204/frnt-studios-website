/**
 * npm run netlify:prepare — runs before `next build` on Netlify (see netlify.toml).
 *
 * 1. Refuses to build without a reachable hosted database: Netlify's build container has no
 *    PostgreSQL, and SOMA's pages read the database while they are prerendered.
 * 2. Applies pending migrations (`npm run db:setup`, never with --reset).
 * 3. With DEMO_MODE=true: reloads the demo data relative to now (`npm run demo:refresh`), so every
 *    deploy — or a "Demo zurücksetzen" build hook — starts from a fresh demo state.
 *    Set DEMO_REFRESH_ON_DEPLOY=false to keep the current demo data.
 */
import { spawnSync } from "node:child_process";

const fail = (lines) => {
  console.error(["", "[netlify:prepare] Build abgebrochen:", ...lines.map((l) => `  ${l}`), ""].join("\n"));
  process.exit(1);
};

const url = process.env.DATABASE_URL ?? "";
if (!url) {
  fail([
    "DATABASE_URL ist nicht gesetzt.",
    "SOMA braucht eine gehostete PostgreSQL-Datenbank (z. B. Neon). Tragen Sie die Verbindungs-URL unter",
    "Site configuration → Environment variables als DATABASE_URL ein (Scope: Builds und Functions).",
    "Anleitung: DEMO.md → „Online-Demo auf Netlify“.",
  ]);
}
let host = "";
try {
  host = new URL(url).hostname;
} catch {
  fail(["DATABASE_URL ist keine gültige postgres://-URL."]);
}
if (["localhost", "127.0.0.1", "::1", "[::1]"].includes(host)) {
  fail([
    `DATABASE_URL zeigt auf ${host}. Im Netlify-Build gibt es keine lokale Datenbank.`,
    "Verwenden Sie die Verbindungs-URL einer gehosteten PostgreSQL-Datenbank (z. B. Neon, „Pooled connection“).",
  ]);
}
// Supabase's direct connection (db.<ref>.supabase.co:5432) is IPv6-only; Netlify's build and functions have no IPv6
// route, so it fails with ENETUNREACH. The pooler (…pooler.supabase.com) is reachable over IPv4.
if (/^db\.[a-z0-9]+\.supabase\.co$/i.test(host)) {
  fail([
    "DATABASE_URL ist Supabases „Direct connection“ (db.….supabase.co:5432). Sie ist nur über IPv6 erreichbar,",
    "Netlify hat kein IPv6 (Fehler ENETUNREACH).",
    "Supabase → Connect → Connection String → Method „Transaction pooler“ (Shared pooler, IPv4, Port 6543) wählen.",
    "Die URL sieht so aus: postgresql://postgres.<projekt-ref>:<passwort>@aws-…pooler.supabase.com:6543/postgres",
    "Anleitung: DEMO.md → „Online-Demo auf Netlify“.",
  ]);
}

const run = (script) => {
  console.log(`[netlify:prepare] npm run ${script}`);
  const r = spawnSync("npm", ["run", script], { stdio: "inherit", env: process.env });
  if (r.status !== 0) fail([`npm run ${script} ist fehlgeschlagen (siehe oben).`]);
};

run("db:setup");
if (process.env.DEMO_MODE === "true" && process.env.DEMO_REFRESH_ON_DEPLOY !== "false") run("demo:refresh");
else console.log("[netlify:prepare] Demo-Daten unverändert (DEMO_MODE oder DEMO_REFRESH_ON_DEPLOY).");
