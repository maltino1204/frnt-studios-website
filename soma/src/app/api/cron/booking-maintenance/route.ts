import { timingSafeEqual } from "node:crypto";
import { getConfig } from "@/server/config";
import { runBookingMaintenance } from "@/server/services/booking-maintenance";

/**
 * POST /api/cron/booking-maintenance  (Authorization: Bearer ${CRON_SECRET})
 * Expires holds and unanswered requests, auto-completes, sends reminders and queued e-mails.
 * GET is accepted with the same header because Vercel Cron issues GET requests.
 */
function authorized(req: Request): boolean {
  const secret = getConfig().CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function handle(req: Request): Promise<Response> {
  if (!authorized(req)) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const result = await runBookingMaintenance();
  return Response.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
}

export const POST = handle;
export const GET = handle;
