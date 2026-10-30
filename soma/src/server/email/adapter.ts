import "server-only";

import { getConfig } from "../config";
import { createDevEmailAdapter } from "./dev";
import { createResendEmailAdapter } from "./resend";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  template: string;
}

export interface EmailAdapter {
  readonly id: "dev" | "resend";
  send(message: EmailMessage): Promise<{ id: string | null }>;
}

export function getEmailAdapter(): EmailAdapter {
  return getConfig().EMAIL_PROVIDER === "resend" ? createResendEmailAdapter() : createDevEmailAdapter();
}
