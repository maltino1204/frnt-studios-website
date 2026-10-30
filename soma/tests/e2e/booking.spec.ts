import { expect, test, type Locator, type Page } from "@playwright/test";
import { berlinDate, cancelViaUi, CUSTOMER_HOME_PLZ, euroToCents, idFromPath, login, USERS } from "./helpers";

/**
 * Critical journey: search → slot chip → checkout (dev payment) → confirmation → cancel.
 * Every booking created here is cancelled again through the UI (also on failure).
 */

const created: string[] = [];

test.afterEach(async ({ page }) => {
  // Clean-up even when an assertion failed half-way.
  while (created.length) {
    const id = created.pop()!;
    await cancelViaUi(page, id).catch(() => undefined);
  }
});

/** First provider row for the given mode with a bookable slot, searching 3–9 days ahead (free-cancellation window). */
async function findRow(page: Page, mode: "Sofort bestätigt" | "Auf Anfrage"): Promise<{ row: Locator; date: string }> {
  for (let d = 3; d <= 9; d += 1) {
    const date = berlinDate(d);
    await page.goto(`/suche?plz=${CUSTOMER_HOME_PLZ}&datum=${date}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const row = page.locator("article").filter({ hasText: mode }).filter({ has: page.locator('a[href*="/buchen"]') }).first();
    if (await row.count()) return { row, date };
  }
  throw new Error(`No provider with mode "${mode}" and free slots for ${CUSTOMER_HOME_PLZ} in the next 9 days`);
}

function visibleCta(page: Page, name: RegExp): Locator {
  return page.getByRole("button", { name }).filter({ visible: true }).first();
}

test("instant booking: search → checkout → confirmation → free cancellation, price consistent", async ({ page }) => {
  await login(page, USERS.customer);
  const { row } = await findRow(page, "Sofort bestätigt");

  // Search: total incl. travel fee (PAngV) on the result row.
  const rowText = await row.innerText();
  expect(rowText).toMatch(/inkl\. Anfahrt/);
  const searchCents = euroToCents(rowText.match(/(\d[\d.]*(?:,\d{2})?)\s*€\s*\n?\s*inkl\. Anfahrt/)![0]);

  // Slot chip goes straight to checkout.
  await row.locator('a[href*="/buchen"]').first().click();
  await page.waitForURL(/\/buchen\?/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Termin buchen.");

  // Saved default address for the searched PLZ is preselected; dev payments are clearly labelled.
  await expect(page.getByRole("radio", { name: /Zuhause · Standard/ })).toBeChecked();
  await expect(page.getByText("Testmodus – es wird keine echte Zahlung ausgeführt")).toBeVisible();
  await expect(page.getByText(/Kostenlos stornierbar bis/).filter({ visible: true }).first()).toBeVisible();

  const price = page.locator("#preis");
  const totalText = await price.getByText("Gesamtpreis").locator("xpath=..").innerText();
  const checkoutCents = euroToCents(totalText);
  expect(checkoutCents, "checkout total equals search total").toBe(searchCents);
  const cta = visibleCta(page, /Zahlungspflichtig buchen/);
  expect(euroToCents(await cta.innerText()), "CTA shows the live total").toBe(checkoutCents);

  // Withdrawal consent is required before payment.
  await cta.click();
  await expect(page).toHaveURL(/\/buchen\?/);
  await expect(page.getByText("Bitte prüfen Sie die markierten Angaben.").filter({ visible: true }).first()).toBeVisible();

  await page.getByLabel(/Ich verlange ausdrücklich/).check();
  await cta.click();
  await page.waitForURL(/\/buchung\/[0-9a-f-]{36}/, { timeout: 30_000 });
  const bookingId = idFromPath(page.url());
  created.push(bookingId);

  // Confirmation: status, Start-Code, same total.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bestätigt.");
  await expect(page.getByText("Ihr Start-Code", { exact: false })).toBeVisible();
  await expect(page.locator("main")).toContainText(/\b\d{4}\b/);
  const confTotal = await page.getByText("Gesamtpreis", { exact: true }).locator("xpath=..").innerText();
  expect(euroToCents(confTotal), "confirmation total equals checkout total").toBe(checkoutCents);

  // The booking shows up in the account.
  await page.goto("/konto/termine");
  await expect(page.locator(`a[href="/buchung/${bookingId}"]`)).toBeVisible();

  // Cancel ≥ 24 h before the start: free.
  await page.goto(`/buchung/${bookingId}`);
  await page.getByRole("button", { name: "Termin stornieren" }).click();
  const dialog = page.getByRole("dialog");
  // Free either by tier (≥ 24 h) or by the 15-minute Bedenkzeit right after booking (audit-1 R10).
  await expect(dialog).toContainText(/Die Stornierung ist jetzt noch kostenlos\.|In den ersten 15 Minuten nach der Buchung immer kostenlos stornierbar/);
  await dialog.getByRole("button", { name: "Kostenlos stornieren" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Storniert.", { timeout: 15_000 });
  await expect(page.locator("main")).toContainText("Es fallen keine Kosten an.");
  created.splice(created.indexOf(bookingId), 1);
});

test("approval mode: request is labelled 'anfragen', shows deadline, and can be withdrawn for free", async ({ page }) => {
  await login(page, USERS.customer);
  const { row } = await findRow(page, "Auf Anfrage");
  await row.locator('a[href*="/buchen"]').first().click();
  await page.waitForURL(/\/buchen\?/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Termin anfragen.");

  const cta = visibleCta(page, /Zahlungspflichtig anfragen/);
  await expect(cta).toBeVisible();
  await expect(page.getByText(/Belastung erst nach Bestätigung/).filter({ visible: true }).first()).toBeVisible();
  await page.getByLabel(/Ich verlange ausdrücklich/).check();
  await cta.click();
  await page.waitForURL(/\/buchung\/[0-9a-f-]{36}/, { timeout: 30_000 });
  const bookingId = idFromPath(page.url());
  created.push(bookingId);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^Angefragt – Antwort bis /);
  await expect(page.locator("main")).toContainText("belastet wird erst nach der Zusage");
  // No Start-Code before the professional accepts.
  await expect(page.getByText("Ihr Start-Code", { exact: false })).toHaveCount(0);

  expect(await cancelViaUi(page, bookingId)).toBe("cancelled");
  await expect(page.locator("main")).toContainText("Es fallen keine Kosten an.");
  created.splice(created.indexOf(bookingId), 1);
});

test("a slot that is already held cannot be booked twice (two customers)", async ({ page, browser }, testInfo) => {
  await login(page, USERS.customer);
  const { row } = await findRow(page, "Sofort bestätigt");
  const href = (await row.locator('a[href*="/buchen"]').first().getAttribute("href"))!;

  // Customer B opens the same checkout first and keeps it open.
  const u = testInfo.project.use;
  const ctxB = await browser.newContext({
    baseURL: u.baseURL, viewport: u.viewport, isMobile: u.isMobile, hasTouch: u.hasTouch, userAgent: u.userAgent,
    deviceScaleFactor: u.deviceScaleFactor, locale: u.locale, timezoneId: u.timezoneId,
  });
  const pageB = await ctxB.newPage();
  await login(pageB, USERS.otherCustomer);
  await pageB.goto(href);
  await expect(pageB.getByRole("heading", { level: 1 })).toHaveText("Termin buchen.");

  // Customer A books the slot.
  await page.goto(href);
  await page.getByLabel(/Ich verlange ausdrücklich/).check();
  await visibleCta(page, /Zahlungspflichtig buchen/).click();
  await page.waitForURL(/\/buchung\/[0-9a-f-]{36}/, { timeout: 30_000 });
  const bookingId = idFromPath(page.url());
  created.push(bookingId);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bestätigt.");

  // Customer B now tries the same slot with a new address in the same PLZ.
  const plz = new URL(href, "http://x").searchParams.get("plz");
  expect(plz).toBe(CUSTOMER_HOME_PLZ);
  const newAddress = pageB.getByRole("radio", { name: /Neue Adresse/ });
  if (await newAddress.count()) await newAddress.check();
  const street = pageB.getByRole("textbox", { name: "Straße", exact: true });
  if (await street.count()) {
    await street.fill("Prenzlauer Allee");
    await pageB.getByRole("textbox", { name: "Nr.", exact: true }).fill("1");
  }
  await pageB.getByLabel(/Ich verlange ausdrücklich/).check();
  await visibleCta(pageB, /Zahlungspflichtig buchen/).click();
  await expect(pageB.getByRole("heading", { name: "Dieser Termin wurde gerade vergeben." })).toBeVisible({ timeout: 20_000 });
  await expect(pageB).toHaveURL(/\/buchen\?/);
  await ctxB.close();
});
