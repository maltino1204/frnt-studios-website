import "server-only";

import { randomUUID } from "node:crypto";
import { resolveAppUrl } from "../config";
import type { PaymentProvider } from "./provider";

/**
 * Development payment simulator ("Testmodus – es wird keine echte Zahlung
 * ausgeführt"). Authorizations are confirmed by the customer through
 * confirmDevPayment(); capture/release/refund are recorded only in our tables.
 */
export function createDevPaymentProvider(): PaymentProvider {
  return {
    id: "dev",
    async createAuthorization() {
      return { externalId: `dev_pi_${randomUUID()}`, status: "requires_payment_method", clientSecret: null };
    },
    async capture() {
      /* simulated */
    },
    async release() {
      /* simulated */
    },
    async refund() {
      return { externalId: `dev_re_${randomUUID()}` };
    },
    async createConnectedAccountLink(input) {
      return { url: `${await resolveAppUrl()}/pro/einnahmen?testmodus=auszahlung`, accountId: input.existingAccountId };
    },
  };
}
