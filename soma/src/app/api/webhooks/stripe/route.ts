import type Stripe from "stripe";
import { getConfig } from "@/server/config";
import { withService } from "@/server/db/client";
import { getStripe } from "@/server/payments/stripe";
import { markPaymentAuthorizedByExternalId, markPaymentFailedByExternalId } from "@/server/services/bookings";

/**
 * POST /api/webhooks/stripe — Stripe Connect events (signature verified).
 * NOT COVERED BY AUTOMATED TESTS (needs STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET).
 *
 *   payment_intent.amount_capturable_updated → authorized: pending_payment → requested | confirmed
 *   payment_intent.payment_failed            → payment failed (the hold expires via maintenance)
 *   account.updated                          → providers.payouts_enabled
 */
export async function POST(req: Request): Promise<Response> {
  const cfg = getConfig();
  if (cfg.PAYMENTS_PROVIDER !== "stripe" || !cfg.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Stripe ist nicht konfiguriert." }, { status: 404 });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Signatur fehlt." }, { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = getStripe().webhooks.constructEvent(body, signature, cfg.STRIPE_WEBHOOK_SECRET);
  } catch {
    return Response.json({ error: "Ungültige Signatur." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.amount_capturable_updated": {
        const pi = event.data.object;
        let brand: string | null = null;
        let last4: string | null = null;
        if (typeof pi.latest_charge === "string") {
          const charge = await getStripe().charges.retrieve(pi.latest_charge);
          brand = charge.payment_method_details?.card?.brand ?? null;
          last4 = charge.payment_method_details?.card?.last4 ?? null;
        }
        await markPaymentAuthorizedByExternalId(pi.id, { cardBrand: brand, cardLast4: last4 });
        break;
      }
      case "payment_intent.payment_failed":
        await markPaymentFailedByExternalId(event.data.object.id);
        break;
      case "account.updated": {
        const acct = event.data.object;
        // withService: payment webhook (system) — payouts_enabled is not writable by API roles.
        await withService((tx) => tx`
          update public.providers set payouts_enabled = ${Boolean(acct.charges_enabled && acct.payouts_enabled)}
          where stripe_account_id = ${acct.id}`);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("[stripe] webhook handling failed", event.type, e);
    return Response.json({ error: "Verarbeitung fehlgeschlagen." }, { status: 500 });
  }
  return Response.json({ received: true });
}
