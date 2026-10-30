import { expect, test, type Page } from "@playwright/test";
import { berlinDate, cancelViaUi, CUSTOMER_HOME_PLZ, idFromPath, login, USERS } from "./helpers";

/**
 * Regression tests for the audit-1 remediation (QA audit 2, Agent 6).
 *
 * Every booking created here ends in a terminal state through the UI
 * (cancelled, withdrawn or declined), also when an assertion fails half-way.
 * Profile edits are refused by the server and never written; if one is
 * accepted unexpectedly, the original text is restored.
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

// ---------------------------------------------------------------------------
// R2 / N1: open redirect via ?next= — also for visitors who are already signed in
// ---------------------------------------------------------------------------
test.describe("open redirect for signed-in visitors (audit-2 N1)", () => {
  for (const path of ["/anmelden", "/registrieren"]) {
    test(`${path}?next=/%09/evil.example stays on the SOMA origin when already signed in`, async ({ page, baseURL }) => {
      // audit-2 N1 (fixed): both pages now use the shared safeRelativePath guard.
      await login(page, USERS.customer);
      const offOrigin: string[] = [];
      page.on("request", (r) => {
        if (r.isNavigationRequest() && !r.url().startsWith(new URL(baseURL!).origin)) offOrigin.push(r.url());
      });
      await page.goto(`${path}?next=/%09/evil.example`).catch(() => undefined);
      expect(offOrigin, "no navigation away from SOMA").toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// R3: legal pages exist and the checkout consent links to them
// ---------------------------------------------------------------------------
test("Widerrufsbelehrung and ranking explanation resolve (R3)", async ({ page }) => {
  for (const [path, heading] of [["/widerruf", /Widerruf/], ["/ranking", /sortieren|Ranking|Reihenfolge/i]] as const) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
  }
  await expect(page.locator("main")).toContainText(/Bewertung/);
  await page.goto("/widerruf");
  await expect(page.locator("main")).toContainText("Muster-Widerrufsformular");
});

// ---------------------------------------------------------------------------
// R1: no approval while required documents are unreviewed
// ---------------------------------------------------------------------------
test("admin cannot approve a provider with unreviewed documents (R1)", async ({ page }) => {
  await login(page, USERS.admin);
  await page.goto("/admin/profis");
  const nora = page.getByRole("link", { name: /Nora K/ }).first();
  await nora.click();
  await page.waitForURL(/\/admin\/profis\/[0-9a-f-]{36}/);
  await expect(page.getByText(/Pflichtdokumente fehlen oder sind ungeprüft/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Freigeben" })).toBeDisabled();
});

// ---------------------------------------------------------------------------
// R16: guest checkout without a password
// ---------------------------------------------------------------------------
test("guest checkout asks for name, e-mail and mobile only — no password (R16)", async ({ page }) => {
  await page.goto(`/suche?plz=${CUSTOMER_HOME_PLZ}&datum=${berlinDate(4)}`);
  const chip = page.locator('a[href*="/buchen"]').first();
  test.skip(!(await chip.count()), "no bookable slot in the demo data for this date");
  await chip.click();
  await page.waitForURL(/\/buchen\?/);
  const kontakt = page.locator("section", { has: page.getByRole("heading", { name: "Kontakt" }) }).first();
  await expect(kontakt.getByRole("textbox", { name: "Vorname" })).toBeVisible();
  await expect(kontakt.getByRole("textbox", { name: "E-Mail" })).toBeVisible();
  await expect(kontakt.getByRole("textbox", { name: /Mobilnummer/ })).toBeVisible();
  await expect(kontakt.locator('input[type="password"]')).toHaveCount(0);
  await expect(kontakt).toContainText("Ein Passwort brauchen Sie dafür nicht.");
});

// ---------------------------------------------------------------------------
// R10: 15-minute Bedenkzeit on a short-notice booking
// ---------------------------------------------------------------------------
test("short-notice booking is free to cancel within the 15-minute Bedenkzeit (R10)", async ({ page }) => {
  await login(page, USERS.customer);
  // An instant slot that starts in less than 24 h (otherwise the regular free tier applies).
  let href: string | null = null;
  for (const d of [0, 1]) {
    await page.goto(`/suche?plz=${CUSTOMER_HOME_PLZ}&datum=${berlinDate(d)}`);
    const rows = page.locator("article").filter({ hasText: "Sofort bestätigt" });
    for (const a of await rows.locator('a[href*="/buchen"]').all()) {
      const h = (await a.getAttribute("href"))!;
      const start = Date.parse(new URL(h, "http://x").searchParams.get("start")!);
      if (start - Date.now() < 23 * 3_600_000) { href = h; break; }
    }
    if (href) break;
  }
  test.skip(!href, "no instant slot within the next 24 h in the demo data at this time of day");
  await page.goto(href!);
  await expect(page.getByText(/In den ersten 15\s+Minuten nach der Buchung immer kostenlos stornierbar/).filter({ visible: true }).first()).toBeVisible();
  const street = page.getByRole("textbox", { name: "Straße", exact: true });
  if (await street.count() && await street.isVisible()) {
    await street.fill("Kollwitzstraße");
    await page.getByRole("textbox", { name: "Nr.", exact: true }).fill("1");
  }
  await page.getByLabel(/Ich verlange ausdrücklich/).check();
  await visibleCta(page, /Zahlungspflichtig buchen/).click();
  await page.waitForURL(/\/buchung\/[0-9a-f-]{36}/, { timeout: 30_000 });
  const id = idFromPath(page.url());
  created.push({ id, as: USERS.customer });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bestätigt.");

  await page.getByRole("button", { name: "Termin stornieren" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText(/In den ersten 15\s+Minuten nach der Buchung immer kostenlos stornierbar – noch bis \d{2}:\d{2}\s+Uhr/);
  await dialog.getByRole("button", { name: "Kostenlos stornieren" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Storniert.", { timeout: 15_000 });
  await expect(page.locator("main")).toContainText("Es fallen keine Kosten an.");
  created.splice(created.findIndex((c) => c.id === id), 1);
});

// ---------------------------------------------------------------------------
// R8: alternatives after a declined request
// ---------------------------------------------------------------------------
test("a declined request shows alternatives and a way onward (R8)", async ({ page }) => {
  await login(page, USERS.customer);
  let href: string | null = null;
  for (let d = 3; d <= 9 && !href; d += 1) {
    await page.goto(`/suche?plz=${CUSTOMER_HOME_PLZ}&datum=${berlinDate(d)}`);
    const row = page.locator("article").filter({ hasText: "Auf Anfrage" }).filter({ hasText: "Selin A." }).first();
    if (await row.count()) href = await row.locator('a[href*="/buchen"]').first().getAttribute("href");
  }
  test.skip(!href, "Selin A. has no request slot in the next 9 days");
  await page.goto(href!);
  await page.getByLabel(/Ich verlange ausdrücklich/).check();
  await visibleCta(page, /Zahlungspflichtig anfragen/).click();
  await page.waitForURL(/\/buchung\/[0-9a-f-]{36}/, { timeout: 30_000 });
  const id = idFromPath(page.url());
  created.push({ id, as: USERS.customer });

  // Selin declines with a reason.
  await page.context().clearCookies();
  await login(page, USERS.provider);
  await page.goto(`/pro/termine/${id}`);
  await page.getByRole("button", { name: "Ablehnen" }).first().click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("textbox", { name: "Grund" }).fill("An diesem Tag bin ich auf einer Fortbildung.");
  await sheet.getByRole("button", { name: "Anfrage ablehnen" }).click();
  await expect(sheet).toBeHidden({ timeout: 15_000 });
  created.splice(created.findIndex((c) => c.id === id), 1); // declined is terminal

  await page.context().clearCookies();
  await login(page, USERS.customer);
  await page.goto(`/buchung/${id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Leider abgesagt.");
  const alt = page.getByRole("region", { name: /Diese Profis haben Zeit|Andere Profis in Ihrer Nähe/ });
  await expect(alt).toBeVisible();
  const onward = alt.getByRole("link", { name: "Andere Profis finden" });
  await expect(onward).toHaveAttribute("href", /\/suche\?.*plz=/);
});

// ---------------------------------------------------------------------------
// R7: contact details are refused in the provider bio
// ---------------------------------------------------------------------------
test("provider bio with a phone number is refused (R7)", async ({ page }) => {
  await login(page, USERS.provider);
  await page.goto("/pro/profil");
  const bio = page.getByRole("textbox", { name: /Über dich/ });
  const original = await bio.inputValue();
  await bio.fill(`${original.slice(0, 300)} Ruf mich an: 0170 1234567`);
  await page.getByRole("button", { name: "Profil speichern" }).click();
  try {
    await expect(page.getByText(/Kontaktdaten wie Telefonnummern/).first()).toBeVisible({ timeout: 10_000 });
  } finally {
    // Never leave the test text behind, even if the server accepted it.
    await page.reload();
    if ((await bio.inputValue()) !== original) {
      await bio.fill(original);
      await page.getByRole("button", { name: "Profil speichern" }).click();
      await expect(page.getByText("Profil gespeichert.")).toBeVisible();
    }
  }
});

// ---------------------------------------------------------------------------
// R18: no "Termin starten" days ahead
// ---------------------------------------------------------------------------
test("provider sees when the start becomes possible instead of an early start button (R18)", async ({ page }) => {
  await login(page, USERS.provider);
  await page.goto("/pro/termine?tab=bevorstehend");
  const links = page.locator('main a[href^="/pro/termine/"]');
  await expect(links.first()).toBeVisible().catch(() => undefined);
  let found = false;
  for (const a of (await links.all()).slice(0, 12)) {
    const href = (await a.getAttribute("href"))!;
    const p2 = await page.context().newPage();
    await p2.goto(href);
    const text = await p2.locator("main").innerText();
    if (/Bestätigt/.test(text) && /Start ab .* möglich/.test(text)) {
      await expect(p2.getByRole("button", { name: "Termin starten" })).toHaveCount(0);
      found = true;
    }
    await p2.close();
    if (found) break;
  }
  test.skip(!found, "no confirmed appointment more than 30 minutes ahead in the demo data");
});

// ---------------------------------------------------------------------------
// R11: the regions table scrolls inside its container
// ---------------------------------------------------------------------------
test("admin regions page has no page-level horizontal overflow (R11)", async ({ page }) => {
  await login(page, USERS.admin);
  await page.goto("/admin/regionen");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
