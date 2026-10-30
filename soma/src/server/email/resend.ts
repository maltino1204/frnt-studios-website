import "server-only";

import { getConfig } from "../config";
import type { EmailAdapter } from "./adapter";

/**
 * Resend adapter (production). NOT CONFIGURED / NOT TESTED here: requires
 * RESEND_API_KEY and a verified sender domain (EMAIL_FROM).
 */
export function createResendEmailAdapter(): EmailAdapter {
  return {
    id: "resend",
    async send(m) {
      const cfg = getConfig();
      if (!cfg.RESEND_API_KEY) throw new Error("RESEND_API_KEY fehlt.");
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: cfg.EMAIL_FROM, to: [m.to], subject: m.subject, text: m.text, tags: [{ name: "template", value: m.template.replace(/[^a-z0-9_-]/gi, "_") }] }),
      });
      if (!res.ok) throw new Error(`Resend: HTTP ${res.status}`);
      const body = (await res.json()) as { id?: unknown };
      return { id: typeof body.id === "string" ? body.id : null };
    },
  };
}
