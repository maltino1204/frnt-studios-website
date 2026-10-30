import "server-only";

import type { EmailAdapter } from "./adapter";

/** Development e-mail: logged to the console; the email_outbox row is the record. */
export function createDevEmailAdapter(): EmailAdapter {
  return {
    id: "dev",
    async send(m) {
      if (process.env.NODE_ENV !== "test") {
        console.info(`[email:dev] → ${m.to} · ${m.subject} (${m.template})\n${m.text}\n`);
      }
      return { id: null };
    },
  };
}
