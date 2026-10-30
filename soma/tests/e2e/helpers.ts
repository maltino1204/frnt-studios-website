import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

/**
 * Shared helpers for the SOMA E2E regression suite (QA, Agent 6).
 *
 * Accounts: the three documented demo logins (testkunde, testkunde-b2b, testadmin) plus two seeded accounts that
 * the demo seed creates (`anna@kunden.soma.test`, `hanna@profis.soma.test`),
 * all with the demo password. Run against a freshly seeded demo database.
 */
export const PASSWORD = process.env.E2E_DEMO_PASSWORD ?? "soma-demo-2026";
export const USERS = {
  customer: "testkunde@soma.test",
  otherCustomer: "anna@kunden.soma.test",
  provider: "testkunde-b2b@soma.test",
  otherProvider: "hanna@profis.soma.test",
  admin: "testadmin@soma.test",
} as const;

/** Postal code of the demo customer's default saved address (Oderberger Straße 21, Berlin-Prenzlauer Berg). */
export const CUSTOMER_HOME_PLZ = "10435";
/** Street of that address (must never leak to other users). */
export const CUSTOMER_HOME_STREET = "Oderberger Straße";

export async function login(page: Page, email: string, password = PASSWORD): Promise<void> {
  await page.goto("/anmelden");
  await page.getByLabel(/E-Mail/i).fill(email);
  await page.getByLabel(/Passwort/i).first().fill(password);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith("/anmelden"), { timeout: 20_000 }),
    page.getByRole("button", { name: /^anmelden$/i }).click(),
  ]);
}

/** A fresh, logged-in browser context that inherits the project's device settings. */
export async function loggedInContext(browser: Browser, email: string, contextOptions: Parameters<Browser["newContext"]>[0] = {}): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  await login(page, email);
  return { context, page };
}

/** "69 €", "70,50 €", "Zahlungspflichtig buchen · 46,50 €" → cents. */
export function euroToCents(text: string): number {
  const m = text.replace(/ | /g, " ").match(/(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{2}))?\s*€/);
  if (!m) throw new Error(`No euro amount in "${text}"`);
  return Number(m[1].replace(/\./g, "")) * 100 + Number(m[2] ?? "0");
}

/** YYYY-MM-DD in Europe/Berlin, `days` from today. */
export function berlinDate(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Booking id from a /buchung/<id> or /pro/termine/<id> URL or href. */
export function idFromPath(href: string): string {
  const m = href.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (!m) throw new Error(`No booking id in ${href}`);
  return m[1];
}

/**
 * Cancels a booking through the customer UI if it is still cancellable.
 * Used for clean-up so the suite never leaves active bookings behind.
 */
export async function cancelViaUi(page: Page, bookingId: string): Promise<"cancelled" | "not-cancellable"> {
  await page.goto(`/buchung/${bookingId}`);
  const trigger = page.getByRole("button", { name: /Termin stornieren|Anfrage zurückziehen/ });
  if (!(await trigger.count())) return "not-cancellable";
  await trigger.first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /stornieren|Zurückziehen/i }).last().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Storniert|Zurückgezogen/, { timeout: 15_000 });
  return "cancelled";
}
