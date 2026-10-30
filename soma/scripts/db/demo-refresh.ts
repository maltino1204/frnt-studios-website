/**
 * npm run demo:refresh — run right before a demo (development/demo databases only).
 *
 * Reloads the demo seed relative to now (testkunde ↔ testkunde-b2b appointment starting in ≈ 35 min,
 * open requests with ≥ 3 h to answer, event stamps within 08–21 h) and runs the booking maintenance
 * once. Reads DEMO_MODE / DATABASE_URL from .env.local when they are not set in the shell; refuses
 * unless DEMO_MODE=true. Apply pending migrations first with `npm run db:setup`.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";
import { closeSql } from "../../src/server/db/client";
import { runBookingMaintenance } from "../../src/server/services/booking-maintenance";
import { ROOT } from "./lib/migrate";
import { runDemoSeed } from "./seed";

function loadEnvLocal(): void {
  const file = path.join(ROOT, ".env.local");
  if (!existsSync(file)) return;
  for (const [k, v] of Object.entries(parseEnv(readFileSync(file, "utf8")))) {
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

async function main(): Promise<void> {
  loadEnvLocal();
  const started = Date.now();
  const { demoAppointmentAt } = await runDemoSeed();
  const m = await runBookingMaintenance();
  console.log(`[demo:refresh] Wartung: ${JSON.stringify(m)}`);
  const secs = Math.round((Date.now() - started) / 1000);
  const minutes = demoAppointmentAt ? Math.round((demoAppointmentAt.getTime() - Date.now()) / 60_000) : null;
  if (minutes !== null && minutes <= 45) {
    console.log(`[demo:refresh] Fertig in ${secs} s – der Demo-Termin von testkunde mit testkunde-b2b beginnt in etwa ${minutes} Minuten.`);
  } else {
    const when = demoAppointmentAt
      ? new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(demoAppointmentAt)
      : "–";
    console.log(`[demo:refresh] Fertig in ${secs} s. Es ist gerade außerhalb von Selins Arbeitszeit, deshalb liegt der Demo-Termin am ${when} Uhr.`);
    console.log("[demo:refresh] Für den Live-Start mit Start-Code: demo:refresh während Selins Arbeitszeit ausführen (Mo–Sa zwischen 8:30 und 18 Uhr).");
  }
}

main()
  .catch((err: unknown) => {
    console.error("[demo:refresh]", err instanceof Error && err.message.startsWith("Abgebrochen") ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => closeSql());
