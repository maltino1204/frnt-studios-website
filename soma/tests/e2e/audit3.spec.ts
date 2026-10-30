import { expect, test, type Page } from "@playwright/test";
import { berlinDate, cancelViaUi, CUSTOMER_HOME_PLZ, idFromPath, login, USERS } from "./helpers";

/**
 * Regression tests for remediation wave 2 (QA audit 3, Agent 6).
 *
 * Clean-up: every booking created here ends in a terminal state through the UI
 * (cancelled or declined), also when an assertion fails half-way. The form tests
 * submit input the server refuses, so nothing is written.
 */

const created: Array<{ id: string; as: string }> = [];

test.afterEach(async ({ page }) => {
  while (created.length) {
    const { id, as } = created.pop()!;
    await page.context().clearCookies();
    await login(page, as).catch(() => undefined);
    await cancelViaUi(page, id).catch(() => undefined);
  }
});

function visibleCta(page: Page, name: RegExp) {
  return page.getByRole("button", { name }).filter({ visible: true }).first();
}

/** First result-row checkout link for a provider mode (and optionally a provider name), 3–9 days ahead. */
async function findSlot(page: Page, mode: "Sofort bestätigt" | "Auf Anfrage", name?: string): Promise<string | null> {
  for (let d = 3; d <= 9; d += 1) {
    await page.goto(`/suche?plz=${CUSTOMER_HOME_PLZ}&datum=${berlinDate(d)}`);
    let row = page.locator("article").filter({ hasText: mode });
    if (name) row = row.filter({ hasText: name });
    row = row.filter({ has: page.locator('a[href*="/buchen"]') }).first();
    if (await row.count()) return row.locator('a[href*="/buchen"]').first().getAttribute("href");
  }
  return null;
}

// ---------------------------------------------------------------------------
// F1 (new in audit 3): dot segments survive safeRelativePath's normalisation.
// "/.//evil.example" resolves to the path "//evil.example", which the signed-in
// redirect on /anmelden and /registrieren sends as a protocol-relative Location.
// audit-3 F1 fixed: normalised paths starting with "//" are rejected in safeRelativePath.
// ---------------------------------------------------------------------------
test.describe("dot-segment open redirect for signed-in visitors (audit-3 F1)", () => {
  for (const path of ["/anmelden", "/registrieren"]) {
    for (const next of ["/.//evil.example/phish", "/a/..//evil.example/phish"]) {
      test(`${path}?next=${next} stays on the SOMA origin when already signed in`, async ({ page, baseURL }) => {
        await login(page, USERS.customer);
        const offOrigin: string[] = [];
        page.on("request", (r) => {
          if (r.isNavigationRequest() && !r.url().startsWith(new URL(baseURL!).origin)) offOrigin.push(r.url());
        });
        await page.goto(`${path}?next=${next}`).catch(() => undefined);
        expect(offOrigin, "no navigation away from SOMA").toEqual([]);
      });
    }
  }
});

// ---------------------------------------------------------------------------
// N3: the decline note is contact-linted (it is shown to the customer)
// ---------------------------------------------------------------------------
test("a decline note with a phone number is refused; a clean reason declines (N3)", async ({ page }) => {
  await login(page, USERS.customer);
  const href = await findSlot(page, "Auf Anfrage", "Selin A.");
  test.skip(!href, "Selin A. has no request slot in the next 9 days");
  await page.goto(href!);
  await page.getByLabel(/Ich verlange ausdrücklich/).check();
  await visibleCta(page, /Zahlungspflichtig anfragen/).click();
  await page.waitForURL(/\/buchung\/[0-9a-f-]{36}/, { timeout: 30_000 });
  const id = idFromPath(page.url());
  created.push({ id, as: USERS.customer });

  await page.context().clearCookies();
  await login(page, USERS.provider);
  await page.goto(`/pro/termine/${id}`);
  await page.getByRole("button", { name: "Ablehnen" }).first().click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("textbox", { name: "Grund" }).fill("Ruf mich direkt an: 0170 1234567, dann klappt es ohne SOMA.");
  await sheet.getByRole("button", { name: "Anfrage ablehnen" }).click();
  await expect(sheet).toContainText("Kontaktdaten", { timeout: 15_000 });
  await expect(sheet).toBeVisible();

  await sheet.getByRole("textbox", { name: "Grund" }).fill("An diesem Tag bin ich leider auf einer Fortbildung.");
  await sheet.getByRole("button", { name: "Anfrage ablehnen" }).click();
  await expect(sheet).toBeHidden({ timeout: 15_000 });
  created.splice(created.findIndex((c) => c.id === id), 1); // declined is terminal

  await page.context().clearCookies();
  await login(page, USERS.customer);
  await page.goto(`/buchung/${id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Leider abgesagt.");
  await expect(page.locator("main")).not.toContainText("0170 1234567");
});

// ---------------------------------------------------------------------------
// N5: forms keep what the user typed after a server-side error
// ---------------------------------------------------------------------------
test("a refused review keeps stars and text (N5)", async ({ page }) => {
  await login(page, USERS.customer);
  await page.goto("/konto/termine?ansicht=vergangen");
  // Reviewable bookings carry a "Bewerten" link to /buchung/<id>#bewerten.
  const href = await page.locator('a[href$="#bewerten"]').first().getAttribute("href").catch(() => null);
  test.skip(!href, "no reviewable booking for the demo customer");
  await page.goto(href!);
  await expect(page.getByRole("button", { name: "Bewertung senden" })).toBeVisible();
  const stars = page.getByRole("radio", { name: /Stern/ });
  await stars.nth(3).check({ force: true });
  const text = "Sehr angenehm! Für den nächsten Termin: 0170 1234567";
  await page.getByLabel(/Ihre Worte/).fill(text);
  await page.getByRole("button", { name: "Bewertung senden" }).click();
  await expect(page.locator("main")).toContainText("Kontaktdaten", { timeout: 15_000 });
  await expect(page.getByLabel(/Ihre Worte/)).toHaveValue(text);
  await expect(stars.nth(3)).toBeChecked();
});

test("the address form keeps its values and names an unknown PLZ (N5)", async ({ page }) => {
  await login(page, USERS.customer);
  await page.goto("/konto/adressen");
  await page.getByRole("button", { name: /Adresse hinzufügen/ }).click();
  await page.getByLabel(/^Straße/).fill("Teststraße");
  await page.getByLabel(/^Nr/).fill("5");
  await page.getByLabel(/Postleitzahl|PLZ/).fill("00000");
  await page.getByRole("textbox", { name: "Ort", exact: true }).fill("Nirgendwo");
  await page.getByRole("button", { name: /Adresse speichern/ }).click();
  await expect(page.getByText("Diese Postleitzahl kennen wir nicht.").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByLabel(/^Straße/)).toHaveValue("Teststraße");
  await expect(page.getByLabel(/^Nr/)).toHaveValue("5");
  await expect(page.getByLabel(/Postleitzahl|PLZ/)).toHaveValue("00000");
});

// ---------------------------------------------------------------------------
// N6: the request checkout names the concrete answer deadline
// ---------------------------------------------------------------------------
test("request checkout states the concrete answer deadline (N6)", async ({ page }) => {
  const href = await findSlot(page, "Auf Anfrage");
  test.skip(!href, "no request-mode slot in the next 9 days");
  await page.goto(href!);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Termin anfragen.");
  await expect(page.locator("main")).toContainText(/antwortet bis (heute|morgen|[A-Z][a-z]\.,\s\d{1,2}\.\s\p{L}+\.?),\s\d{2}:\d{2}\sUhr/u);
  await expect(page.locator("main")).not.toContainText(/innerhalb von 12\sStunden/);
});

// ---------------------------------------------------------------------------
// N10: for a booking ≥ 24 h ahead the cancel dialog shows the regular free line
// ---------------------------------------------------------------------------
test("cancel dialog for a booking days ahead says it is free now (N10)", async ({ page }) => {
  await login(page, USERS.customer);
  const href = await findSlot(page, "Sofort bestätigt");
  test.skip(!href, "no instant slot in the next 9 days");
  await page.goto(href!);
  await page.getByLabel(/Ich verlange ausdrücklich/).check();
  await visibleCta(page, /Zahlungspflichtig buchen/).click();
  await page.waitForURL(/\/buchung\/[0-9a-f-]{36}/, { timeout: 30_000 });
  const id = idFromPath(page.url());
  created.push({ id, as: USERS.customer });
  await page.getByRole("button", { name: "Termin stornieren" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Die Stornierung ist jetzt noch kostenlos.");
  await expect(dialog).not.toContainText("In den ersten 15 Minuten");
  await dialog.getByRole("button", { name: "Kostenlos stornieren" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Storniert.", { timeout: 15_000 });
  created.splice(created.findIndex((c) => c.id === id), 1);
});

// ---------------------------------------------------------------------------
// N4: a provider whose required document lapsed is hidden and queued for admins
// (the demo seed ships Leyla A. with an expired liability insurance)
// ---------------------------------------------------------------------------
test("an auto-paused provider is not public and shows up in the admin queue (N4)", async ({ page }) => {
  const res = await page.goto("/profis/leyla-a-hamburg");
  expect(res?.status()).toBe(404);
  await page.goto("/suche?plz=22587&kategorie=manikuere");
  await expect(page.locator("main")).not.toContainText("Leyla A.");
  await login(page, USERS.admin);
  await page.goto("/admin");
  await expect(page.locator("main")).toContainText(/Leyla A\.[\s\S]*Automatisch pausiert/);
});

// ---------------------------------------------------------------------------
// N7: admin tables scroll inside their container, not the page
// ---------------------------------------------------------------------------
test("admin tables do not overflow the page (N7)", async ({ page }) => {
  await login(page, USERS.admin);
  await page.goto("/admin/profis");
  const providerHref = await page.locator('a[href^="/admin/profis/"]').first().getAttribute("href");
  for (const path of ["/admin/kategorien", "/admin/provisionen", providerHref!]) {
    for (const width of [320, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      // Measure the rendered page, not the loading skeleton (its fixed-width table rows overflow at 320 px, see audit-3).
      await expect(page.getByRole("region", { name: /^Tabelle/ }).first()).toBeVisible();
      const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(sw, `${path} at ${width}px`).toBeLessThanOrEqual(cw);
    }
  }
});

// ---------------------------------------------------------------------------
// N11: the notification inbox hydrates without React errors
// ---------------------------------------------------------------------------
test("notification inbox reloads without hydration errors (N11)", async ({ page }) => {
  await login(page, USERS.customer);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (let i = 0; i < 5; i += 1) {
    await page.goto("/konto/benachrichtigungen");
    await page.waitForTimeout(500);
  }
  expect(errors).toEqual([]);
});
