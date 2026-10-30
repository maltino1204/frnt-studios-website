import "server-only";

import Stripe from "stripe";
import { getConfig } from "../config";
import { ServiceError } from "../errors";
import type { PaymentProvider } from "./provider";

/**
 * Stripe Connect Express provider (production).
 *
 * NOT COVERED BY AUTOMATED TESTS: needs STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET.
 * Destination charges with manual capture:
 *   PaymentIntent { capture_method: 'manual', transfer_data.destination, application_fee_amount }
 * The webhook (src/app/api/webhooks/stripe) moves bookings out of pending_payment.
 * Known gap (docs/api.md): bookings > 6 days ahead should use a SetupIntent and
 * an off-session PaymentIntent 48 h before the appointment (7-day auth window).
 */

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = getConfig().STRIPE_SECRET_KEY;
  if (!key) throw new Error("PAYMENTS_PROVIDER=stripe benötigt STRIPE_SECRET_KEY.");
  client ??= new Stripe(key, { appInfo: { name: "SOMA" } });
  return client;
}

export function createStripePaymentProvider(): PaymentProvider {
  return {
    id: "stripe",
    async createAuthorization(input) {
      if (!input.providerAccountId) {
        throw new ServiceError("unavailable", "Dieser Profi kann gerade keine Zahlungen empfangen. Bitte wählen Sie einen anderen Profi.");
      }
      const pi = await getStripe().paymentIntents.create(
        {
          amount: input.amountCents,
          currency: "eur",
          capture_method: "manual",
          automatic_payment_methods: { enabled: true },
          application_fee_amount: Math.max(0, Math.min(input.applicationFeeCents, input.amountCents)),
          transfer_data: { destination: input.providerAccountId },
          description: input.description,
          receipt_email: input.customerEmail ?? undefined,
          metadata: { booking_id: input.bookingId, reference: input.reference },
        },
        { idempotencyKey: `booking-auth-${input.bookingId}` },
      );
      return { externalId: pi.id, status: "requires_payment_method", clientSecret: pi.client_secret };
    },
    async capture(externalId, amountCents, applicationFeeCents) {
      await getStripe().paymentIntents.capture(externalId, {
        amount_to_capture: amountCents,
        ...(applicationFeeCents != null ? { application_fee_amount: Math.max(0, Math.min(applicationFeeCents, amountCents)) } : {}),
      });
    },
    async release(externalId) {
      await getStripe().paymentIntents.cancel(externalId);
    },
    async refund(externalId, amountCents) {
      const r = await getStripe().refunds.create({ payment_intent: externalId, amount: amountCents, reverse_transfer: true, refund_application_fee: true });
      return { externalId: r.id };
    },
    async createConnectedAccountLink(input) {
      const stripe = getStripe();
      let accountId = input.existingAccountId;
      if (!accountId) {
        const account = await stripe.accounts.create({
          type: "express",
          country: "DE",
          email: input.email,
          capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
          metadata: { provider_id: input.providerId },
        });
        accountId = account.id;
      }
      const link = await stripe.accountLinks.create({ account: accountId, refresh_url: input.refreshUrl, return_url: input.returnUrl, type: "account_onboarding" });
      return { url: link.url, accountId };
    },
  };
}
