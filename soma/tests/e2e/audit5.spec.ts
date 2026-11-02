import { expect, test, type Page } from "@playwright/test";
import { berlinDate, cancelViaUi, CUSTOMER_HOME_PLZ, idFromPath, login, USERS } from "./helpers";

/**
 * Regression tests for the design-v2 overhaul (QA audit 5, Agent 6): motion, haptics, overlays and layout.
 *
 * Tests marked `test.fail()` document open audit-5 findings (A5-x in docs/qa/audit-5.md). They pass while the
 * defect exists and turn red once it is fixed: then remove the `test.fail()` line.
 *
 * Clean-up: the haptics test books an instant slot and cancels it in `finally`. Everything else is read-only.
 * Do not run after the final `npm run demo:refresh`.
 */

/** First booking detail link in the demo customer's upcoming list. */
async function firstUpcomingBooking(page: Page): Promise<string> {
  await page.goto("/konto/termine");
  const href = await page.locator('a[href^="/buchung/"]').first().getAttribute("href");
  return idFromPath(href!);
}

const CANCEL_ACTION = /Termin stornieren|Anfrage zurückziehen/;

/**
 * The first booking on /konto/termine that still offers the cancel action. The first upcoming one can already have
 * started (the demo appointment sits at 09:00 when demo:refresh ran outside working hours), so the test must not
 * depend on the time of day.
 */
async function firstCancellableBooking(page: Page): Promise<string> {
  await page.goto("/konto/termine");
  const hrefs = [...new Set(await page.locator('a[href^="/buchung/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? "")))];
  for (const href of hrefs) {
    await page.goto(href);
    if (await page.getByRole("button", { name: CANCEL_ACTION }).count()) return idFromPath(href);
  }
  throw new Error("no booking of the demo customer offers the cancel action; run `npm run demo:refresh`");
}

// ---------------------------------------------------------------------------
// A5-1: the customer cancel dialog is unmounted instead of closed, so focus falls back to <body>.
// ---------------------------------------------------------------------------
test("the cancel dialog opens on the safe action and returns focus to its trigger (A5-1)", async ({ page }) => {
  await login(page, USERS.customer);
  const id = await firstCancellableBooking(page);
  await page.goto(`/buchung/${id}`);
  const trigger = page.getByRole("button", { name: CANCEL_ACTION }).first();
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Termin behalten|Anfrage behalten/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused({ timeout: 2_000 });
});

// ---------------------------------------------------------------------------
// A5-2: three screens are wider than a 320 px viewport.
// ---------------------------------------------------------------------------
async function overflowAt320(page: Page, path: string): Promise<number> {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test("saved addresses fit a 320 px screen (A5-2)", async ({ page }) => {
  await login(page, USERS.customer);
  expect(await overflowAt320(page, "/konto/adressen")).toBe(0);
});

test("the booking detail header fits a 320 px screen (A5-2)", async ({ page }) => {
  await login(page, USERS.customer);
  const id = await firstUpcomingBooking(page);
  expect(await overflowAt320(page, `/buchung/${id}`)).toBe(0);
});

test("the provider document list fits a 320 px screen (A5-2)", async ({ page }) => {
  await login(page, USERS.provider);
  expect(await overflowAt320(page, "/pro/verifizierung")).toBe(0);
});

// ---------------------------------------------------------------------------
// Principle 11: ambient motion pauses offscreen and is off with reduced motion.
// ---------------------------------------------------------------------------
type AnimInfo = { name: string; state: string; infinite: boolean };
const animations = (page: Page) =>
  page.evaluate(() =>
    document.getAnimations().map((a) => ({
      name: (a as CSSAnimation).animationName ?? "",
      state: a.playState,
      infinite: a.effect?.getTiming().iterations === Infinity,
    })),
  ) as Promise<AnimInfo[]>;

// Brand identity 2026 (brand/BRAND_GUIDELINES.md § 8): motion means arrival. Elements settle and stop; the v2 aura
// drift is retired, so no ambient loop may run on a page at rest, at the top or after scrolling.
test("the home page arrives and rests: no ambient loop runs, at the top or offscreen", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  const loops = (list: AnimInfo[]) => list.filter((a) => a.state === "running" && a.infinite);
  expect(loops(await animations(page)), "no looping animation at the top").toEqual([]);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1500);
  expect(loops(await animations(page)), "no looping animation after scrolling").toEqual([]);
  expect((await animations(page)).filter((a) => a.name.startsWith("soma-aura")), "no aura animation exists").toEqual([]);
});

test("reduced motion: no looping animation, no parallax, no scroll reveal", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  const running = (await animations(page)).filter((a) => a.state === "running" && (a.infinite || a.name === "soma-parallax"));
  expect(running, "looping or scroll-linked animations under reduced motion").toEqual([]);
  expect(await page.locator('[data-reveal="hidden"], [data-reveal-stagger="hidden"]').count()).toBe(0);
});

// ---------------------------------------------------------------------------
// Device haptics: one success pattern on the confirmation, a warning pattern on cancellation.
// ---------------------------------------------------------------------------
test("an instant booking vibrates once on confirmation and once on cancellation", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __vib: unknown[] };
    w.__vib = JSON.parse(sessionStorage.getItem("__vib") ?? "[]");
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: (p: unknown) => {
        w.__vib.push(p);
        sessionStorage.setItem("__vib", JSON.stringify(w.__vib));
        return true;
      },
    });
  });
  await login(page, USERS.customer);
  let bookingId: string | null = null;
  try {
    let slot = null;
    for (let d = 3; d <= 9 && !slot; d += 1) {
      await page.goto(`/suche?plz=${CUSTOMER_HOME_PLZ}&datum=${berlinDate(d)}`);
      const row = page.locator("article").filter({ hasText: "Sofort bestätigt" }).filter({ has: page.locator('a[href*="/buchen"]') }).first();
      if (await row.count()) slot = row.locator('a[href*="/buchen"]').first();
    }
    expect(slot, "an instant slot within 9 days").toBeTruthy();
    await slot!.click();
    await page.waitForURL(/\/buchen\?/);
    await page.getByLabel(/Ich verlange ausdrücklich/).check();
    await page.getByRole("button", { name: /Zahlungspflichtig buchen/ }).filter({ visible: true }).first().click();
    await page.waitForURL(/\/buchung\/[0-9a-f-]{36}/, { timeout: 30_000 });
    bookingId = idFromPath(page.url());
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bestätigt.");
    await expect.poll(() => page.evaluate(() => (window as unknown as { __vib: unknown[] }).__vib)).toContainEqual([12, 60, 14]);
    // A reload of the confirmation must not vibrate again.
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bestätigt.");
    const successCount = await page.evaluate(() => (window as unknown as { __vib: unknown[] }).__vib.filter((p) => JSON.stringify(p) === "[12,60,14]").length);
    expect(successCount, "success haptic fires once per booking").toBe(1);
    expect(await cancelViaUi(page, bookingId)).toBe("cancelled");
    bookingId = null;
    await expect.poll(() => page.evaluate(() => (window as unknown as { __vib: unknown[] }).__vib)).toContainEqual([14, 80, 14]);
  } finally {
    if (bookingId) await cancelViaUi(page, bookingId).catch(() => undefined);
  }
});

// ---------------------------------------------------------------------------
// Admin command palette: keyboard-only search and focus return.
// ---------------------------------------------------------------------------
test("the admin palette finds a booking by reference and gives focus back", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "desktop shortcut");
  await login(page, USERS.admin);
  await page.goto("/admin/buchungen");
  const reference = (await page.locator("tbody tr").first().locator("a").first().innerText()).trim();
  const trigger = page.getByRole("button", { name: /Suchen/ }).first();
  await trigger.focus();
  await page.keyboard.press("Enter");
  const input = page.getByRole("combobox", { name: /Seite, Buchung, Profi oder Konto suchen/ });
  await expect(input).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Control+k");
  await expect(input).toBeFocused();
  await page.keyboard.type(reference);
  await expect(page.getByRole("option").first()).toContainText(reference);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/admin\/buchungen\/[0-9a-f-]{36}/);
});

// ---------------------------------------------------------------------------
// A5-3: <dt>/<dd> must sit directly in <dl> (or one <div> inside it).
// ---------------------------------------------------------------------------
test("booking facts are a valid description list (A5-3)", async ({ page }) => {
  await login(page, USERS.customer);
  const id = await firstUpcomingBooking(page);
  await page.goto(`/buchung/${id}`);
  const invalid = await page.evaluate(
    () =>
      [...document.querySelectorAll("main dt, main dd")].filter((el) => {
        const p = el.parentElement;
        return !(p?.tagName === "DL" || (p?.tagName === "DIV" && p.parentElement?.tagName === "DL"));
      }).length,
  );
  expect(invalid).toBe(0);
});
