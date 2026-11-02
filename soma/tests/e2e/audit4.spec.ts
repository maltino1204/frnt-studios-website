import { expect, test, type Page } from "@playwright/test";
import { login, USERS } from "./helpers";

/**
 * Regression tests for the final remediation wave (QA audit 4, Agent 6).
 *
 * Clean-up: the tests that change the demo provider's offerings restore them through the UI
 * in `finally` blocks (the probe service is removed again, the original price is saved back).
 * Everything else is read-only. Do not run after the final `npm run demo:refresh`.
 */

// ---------------------------------------------------------------------------
// F1: encoded and dot-segment variants for signed-in visitors (all must stay on the origin).
// ---------------------------------------------------------------------------
test.describe("open-redirect variants for signed-in visitors (audit-4 F1 re-probe)", () => {
  const vectors = ["/%2E//evil.example", "/./%2Fevil.example", "/%2e/%2fevil.example", "/x/%2e%2e/%2e%2e//evil.example", "%2F.%2F%2Fevil.example", "/%5Cevil.example"];
  test("none of the variants navigates away from SOMA", async ({ page, baseURL }) => {
    await login(page, USERS.customer);
    const origin = new URL(baseURL!).origin;
    const offOrigin: string[] = [];
    page.on("request", (r) => {
      if (r.isNavigationRequest() && !r.url().startsWith(origin)) offOrigin.push(r.url());
    });
    for (const path of ["/anmelden", "/registrieren"]) {
      for (const next of vectors) {
        await page.goto(`${path}?next=${next}`).catch(() => undefined);
        expect(new URL(page.url()).origin, `${path}?next=${next}`).toBe(origin);
      }
    }
    expect(offOrigin, "no navigation away from SOMA").toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// F7: the shared demo logins cannot change their password or delete themselves.
// ---------------------------------------------------------------------------
test("demo customer sees the demo notice instead of password change and deletion (F7)", async ({ page }) => {
  await login(page, USERS.customer);
  await page.goto("/konto/profil");
  await expect(page.getByText(/Im Demo-Zugang deaktiviert/).first()).toBeVisible();
  await expect(page.getByLabel(/Neues Passwort/i)).toHaveCount(0);
});

test("demo provider sees the demo notice instead of password change (F7)", async ({ page }) => {
  await login(page, USERS.provider);
  await page.goto("/pro/einstellungen");
  await expect(page.getByText(/Im Demo-Zugang deaktiviert/).first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// F11: "Erneut buchen" survives many recent cancellations (the suite itself cancels dozens).
// ---------------------------------------------------------------------------
test("the account home still offers one-tap rebooking (F11)", async ({ page }) => {
  await login(page, USERS.customer);
  await page.goto("/konto");
  await expect(page.getByRole("heading", { name: "Erneut buchen" })).toBeVisible();
  expect(await page.getByRole("button", { name: "Erneut buchen" }).count()).toBeGreaterThanOrEqual(3);
});

// ---------------------------------------------------------------------------
// Helpers for the provider offering editor (/pro/leistungen)
// ---------------------------------------------------------------------------
function row(page: Page, serviceName: string, duration: string) {
  return page.getByRole("button").filter({ hasText: serviceName }).filter({ hasText: duration }).first();
}

/** The row reads "<name> / 60 Min. · Richtwert ab 75 € / 89 € / bearbeiten": the price is the line that is only an amount. */
async function priceOf(page: Page, serviceName: string, duration: string): Promise<string | undefined> {
  const lines = (await row(page, serviceName, duration).innerText()).split("\n").map((l) => l.trim());
  return lines.map((l) => l.match(/^(\d+(?:,\d{2})?)\s*€$/)?.[1]).filter(Boolean).at(-1);
}

async function removeOffering(page: Page, serviceName: string, duration: string): Promise<void> {
  await page.goto("/pro/leistungen");
  const r = row(page, serviceName, duration);
  if (!(await r.count())) return;
  await r.click();
  await page.getByRole("dialog").getByRole("button", { name: "Entfernen" }).click();
  await page.getByRole("dialog", { name: /Leistung entfernen/ }).getByRole("button", { name: "Entfernen" }).click();
  await expect(row(page, serviceName, duration)).toHaveCount(0, { timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// F2: an approved provider adds a service in a category whose qualification document is missing.
// ---------------------------------------------------------------------------
test("a service in an unverified category waits for the document and is not bookable (F2)", async ({ page }) => {
  // Many steps (add, check, remove); under a full parallel run it can need more than the default 60 s.
  test.slow();
  await login(page, USERS.provider);
  // Start clean: an earlier run that timed out in its cleanup leaves the offering behind, and the add dialog
  // would then (correctly) refuse it with „Schon in deinem Angebot“.
  await removeOffering(page, "Herrenhaarschnitt", "30 Min.");
  try {
    await page.goto("/pro/leistungen");
    await page.getByRole("button", { name: /Leistung hinzufügen/ }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Kategorie").selectOption({ label: "Haare & Styling" });
    await dialog.getByLabel("Leistung").selectOption({ label: "Herrenhaarschnitt" });
    await expect(dialog.getByText(/Meisterbrief oder Eintragung in die Handwerksrolle/)).toBeVisible();
    await dialog.getByLabel(/Preis in Euro/).fill("35");
    await dialog.getByRole("button", { name: "Hinzufügen" }).click();
    await expect(page.getByText("Wartet auf Nachweis · nicht buchbar")).toBeVisible({ timeout: 10_000 });
    const profile = await page.request.get("/profis/selin-a-berlin");
    expect(await profile.text()).not.toContain("Herrenhaarschnitt");
  } finally {
    await removeOffering(page, "Herrenhaarschnitt", "30 Min.");
  }
});

// ---------------------------------------------------------------------------
// Audit 4 (A4-2): "Leistung hinzufügen" used to open on a service the provider already offers and
// silently overwrote its price. Now it opens on a service not yet offered, and picking an existing
// service/duration shows "Schon in deinem Angebot" with "Hinzufügen" disabled (the server refuses too).
// ---------------------------------------------------------------------------
test("adding a service never overwrites the price of an existing offering (A4-2)", async ({ page }) => {
  await login(page, USERS.provider);
  await page.goto("/pro/leistungen");
  const before = await priceOf(page, "Entspannungsmassage (klassisch)", "60 Min.");
  expect(before, "current price of the 60-min offering").toBeTruthy();
  await page.getByRole("button", { name: /Leistung hinzufügen/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Schon in deinem Angebot")).toHaveCount(0);
  await dialog.getByLabel("Kategorie").selectOption({ label: "Massage" });
  await dialog.getByLabel("Leistung").selectOption({ label: "Entspannungsmassage (klassisch)" });
  await dialog.getByLabel("Dauer").selectOption({ label: "60 Min." });
  await expect(dialog.getByText("Schon in deinem Angebot")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Hinzufügen" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await page.goto("/pro/leistungen");
  expect(await priceOf(page, "Entspannungsmassage (klassisch)", "60 Min.")).toBe(before);
});
