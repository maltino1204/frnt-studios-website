import { getConfig } from "@/server/config";
import { getSql } from "@/server/db/client";

/** GET /api/health — liveness + database reachability. No secrets in the response. */
export async function GET(): Promise<Response> {
  const started = Date.now();
  try {
    await getSql()`select 1`;
    const cfg = getConfig();
    return Response.json(
      {
        status: "ok",
        db: "ok",
        latencyMs: Date.now() - started,
        providers: { auth: cfg.AUTH_PROVIDER, payments: cfg.PAYMENTS_PROVIDER, storage: cfg.STORAGE_PROVIDER, email: cfg.EMAIL_PROVIDER },
        demoMode: cfg.DEMO_MODE,
        time: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ status: "error", db: "unreachable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
