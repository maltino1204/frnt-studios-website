import "server-only";

import { getConfig } from "../config";
import type { PaymentProviderId, PaymentStatus } from "../dto";
import { createDevPaymentProvider } from "./dev";
import { createStripePaymentProvider } from "./stripe";

/**
 * PaymentProvider (docs/architecture.md §5.6). SOMA never sees or stores card
 * data: card entry happens in Stripe Elements; we keep brand + last4 for display.
 */
export interface AuthorizationInput {
  bookingId: string;
  reference: string;
  amountCents: number;
  /** platform fee kept by SOMA (commission + service fee − credits, never negative) */
  applicationFeeCents: number;
  description: string;
  providerAccountId: string | null;
  customerEmail: string | null;
}

export interface AuthorizationResult {
  externalId: string;
  status: PaymentStatus;
  clientSecret: string | null;
}

export interface ConnectedAccountLinkInput {
  providerId: string;
  existingAccountId: string | null;
  email: string;
  returnUrl: string;
  refreshUrl: string;
}

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  createAuthorization(input: AuthorizationInput): Promise<AuthorizationResult>;
  /** captures `amountCents` of the authorization (partial capture for fees) */
  capture(externalId: string, amountCents: number, applicationFeeCents?: number): Promise<void>;
  /** voids the authorization (decline, expiry, free cancellation) */
  release(externalId: string): Promise<void>;
  refund(externalId: string, amountCents: number): Promise<{ externalId: string }>;
  createConnectedAccountLink(input: ConnectedAccountLinkInput): Promise<{ url: string; accountId: string | null }>;
}

export function getPaymentProvider(): PaymentProvider {
  return getConfig().PAYMENTS_PROVIDER === "stripe" ? createStripePaymentProvider() : createDevPaymentProvider();
}
