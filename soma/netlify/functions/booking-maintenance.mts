/**
 * Netlify Scheduled Function: calls SOMA's booking maintenance every 10 minutes (expires holds and
 * unanswered requests, auto-completes, sends reminders and queued e-mails).
 * Needs CRON_SECRET (≥ 16 characters) and APP_URL (or Netlify's URL) in the site's environment.
 * Scheduled functions run on the published production deploy only.
 */
export default async (): Promise<void> => {
  const base = (process.env.APP_URL || process.env.URL || "").replace(/\/+$/, "");
  const secret = process.env.CRON_SECRET ?? "";
  if (!base || secret.length < 16) {
    console.log("[booking-maintenance] APP_URL/URL oder CRON_SECRET (≥ 16 Zeichen) fehlt – übersprungen.");
    return;
  }
  const res = await fetch(`${base}/api/cron/booking-maintenance`, { method: "POST", headers: { authorization: `Bearer ${secret}` } });
  console.log(`[booking-maintenance] HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
};

export const config = { schedule: "*/10 * * * *" };
