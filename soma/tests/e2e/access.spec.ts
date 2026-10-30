import { expect, test, type Browser, type TestInfo } from "@playwright/test";
import { idFromPath, login, USERS } from "./helpers";

/**
 * Access control regression checks: login redirects for protected areas,
 * role isolation (customer ↛ admin/pro, provider ↛ admin), IDOR on booking
 * pages, and open-redirect protection of /anmelden?next=.
 */

function contextOptions(testInfo: TestInfo) {
  const u = testInfo.project.use;
  return {
    baseURL: u.baseURL, viewport: u.viewport, isMobile: u.isMobile, hasTouch: u.hasTouch, userAgent: u.userAgent,
    deviceScaleFactor: u.deviceScaleFactor, locale: u.locale, timezoneId: u.timezoneId,
  };
}

async function asUser(browser: Browser, testInfo: TestInfo, email: string) {
  const context = await browser.newContext(contextOptions(testInfo));
  const page = await context.newPage();
  await login(page, email);
  return { context, page };
}

test.describe("signed-out visitors", () => {
  for (const path of ["/konto", "/konto/termine", "/konto/adressen", "/pro", "/pro/termine", "/pro/einnahmen", "/admin", "/admin/buchungen", "/admin/zahlungen"]) {
    test(`${path} redirects to /anmelden with next`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL((u) => u.pathname === "/anmelden" && u.searchParams.get("next") === path);
      await expect(page.getByRole("button", { name: /^anmelden$/i })).toBeVisible();
    });
  }

  test("a booking link redirects to login", async ({ page }) => {
    await page.goto("/buchung/00000000-0000-4000-8000-000000000000");
    await expect(page).toHaveURL(/\/anmelden\?next=%2Fbuchung%2F/);
  });

  test("provider sign-up stays public", async ({ page }) => {
    await page.goto("/pro/registrieren");
    await expect(page).toHaveURL(/\/pro\/registrieren/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("login honours a safe next= target", async ({ page }) => {
    await page.goto("/anmelden?next=%2Fkonto%2Ffavoriten");
    await page.getByLabel(/E-Mail/i).fill(USERS.customer);
    await page.getByLabel(/Passwort/i).first().fill(process.env.E2E_DEMO_PASSWORD ?? "soma-demo-2026");
    await page.getByRole("button", { name: /^anmelden$/i }).click();
    await expect(page).toHaveURL(/\/konto\/favoriten$/);
  });
});

test.describe("open redirect protection on /anmelden?next=", () => {
  const targets = ["//evil.example/x", "https://evil.example/", "/\\evil.example", "javascript:alert(1)"];
  for (const next of targets) {
    test(`next=${next} stays on the SOMA origin`, async ({ page, baseURL }) => {
      await page.goto(`/anmelden?next=${encodeURIComponent(next)}`);
      await page.getByLabel(/E-Mail/i).fill(USERS.customer);
      await page.getByLabel(/Passwort/i).first().fill(process.env.E2E_DEMO_PASSWORD ?? "soma-demo-2026");
      await page.getByRole("button", { name: /^anmelden$/i }).click();
      await page.waitForURL((u) => !u.pathname.startsWith("/anmelden"));
      expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin);
    });
  }

  // Known bug (audit-1 R2): a TAB/CR/LF after the leading slash passes safeNext() and the browser
  // strips it, turning "/\t/evil.example" into the protocol-relative "//evil.example".
  // Marked as an expected failure so the suite stays green; remove test.fail() once R2 is fixed.
  test("next=/%09/evil.example (control character) stays on the SOMA origin", async ({ page, baseURL }) => {
    test.fail(true, "audit-1 R2: open redirect via control characters in next=");
    const offOrigin: string[] = [];
    page.on("request", (r) => {
      if (!r.url().startsWith(new URL(baseURL!).origin)) offOrigin.push(r.url());
    });
    await page.goto("/anmelden?next=/%09/evil.example");
    await page.getByLabel(/E-Mail/i).fill(USERS.customer);
    await page.getByLabel(/Passwort/i).first().fill(process.env.E2E_DEMO_PASSWORD ?? "soma-demo-2026");
    await page.getByRole("button", { name: /^anmelden$/i }).click();
    await page.waitForTimeout(3000);
    expect(offOrigin.filter((u) => u.includes("evil.example")), "no navigation to a foreign host").toEqual([]);
  });
});

test.describe("role isolation", () => {
  test("customer cannot open admin or provider areas", async ({ browser }, testInfo) => {
    const { context, page } = await asUser(browser, testInfo, USERS.customer);
    for (const path of ["/admin", "/admin/nutzer", "/admin/zahlungen", "/pro", "/pro/termine"]) {
      await page.goto(path);
      await expect(page, `${path} → /konto`).toHaveURL(/\/konto$/);
    }
    await context.close();
  });

  test("provider cannot open admin or customer areas", async ({ browser }, testInfo) => {
    const { context, page } = await asUser(browser, testInfo, USERS.provider);
    for (const path of ["/admin", "/admin/profis"]) {
      await page.goto(path);
      await expect(page, `${path} → /pro`).toHaveURL(/\/pro$/);
    }
    await page.goto("/konto/termine");
    await expect(page).toHaveURL(/\/pro$/);
    await context.close();
  });

  test("admin lands in /admin", async ({ browser }, testInfo) => {
    const { context, page } = await asUser(browser, testInfo, USERS.admin);
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/konto");
    await expect(page).toHaveURL(/\/admin$/);
    await context.close();
  });
});

test.describe("IDOR on booking pages", () => {
  test("customer B cannot see customer A's booking", async ({ browser }, testInfo) => {
    const a = await asUser(browser, testInfo, USERS.customer);
    await a.page.goto("/konto/termine");
    const href = await a.page.locator('a[href^="/buchung/"]').first().getAttribute("href");
    expect(href, "demo customer has at least one upcoming booking").toBeTruthy();
    const id = idFromPath(href!);
    await a.page.goto(`/buchung/${id}`);
    const ownerText = await a.page.locator("main").innerText();
    const startCode = ownerText.match(/IHR START-CODE\s*\n?\s*(\d{4})/i)?.[1];
    await a.context.close();

    const b = await asUser(browser, testInfo, USERS.otherCustomer);
    await b.page.goto(`/buchung/${id}`);
    await expect(b.page.getByRole("heading", { name: "Diese Buchung finden wir nicht." })).toBeVisible();
    const text = await b.page.locator("main").innerText();
    expect(text).not.toContain("Kollwitzstraße");
    if (startCode) expect(text).not.toContain(startCode);
    const cal = await b.page.request.get(`/buchung/${id}/kalender`);
    expect(cal.status(), "calendar export of a foreign booking").toBe(404);
    await b.context.close();
  });

  test("provider cannot open another provider's appointment", async ({ browser }, testInfo) => {
    const owner = await asUser(browser, testInfo, USERS.provider);
    await owner.page.goto("/pro/termine");
    const href = await owner.page.locator('a[href^="/pro/termine/"]').first().getAttribute("href");
    expect(href, "demo provider has at least one appointment").toBeTruthy();
    const id = idFromPath(href!);
    await owner.context.close();

    const other = await asUser(browser, testInfo, USERS.otherProvider);
    await other.page.goto(`/pro/termine/${id}`);
    await expect(other.page.getByRole("heading", { name: "Termin nicht gefunden." })).toBeVisible();
    await expect(other.page.getByRole("button", { name: /Annehmen|Termin starten|Termin abschließen/ })).toHaveCount(0);
    await other.context.close();
  });

  test("private verification documents are not public", async ({ request }) => {
    const res = await request.get("/api/media/documents/00000000-0000-4000-8000-000000000000/x.pdf");
    expect([401, 403, 404]).toContain(res.status());
  });
});
