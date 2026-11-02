import { expect, test, type Page } from "@playwright/test";
import { login, USERS } from "./helpers";

/**
 * /entdecken („Entdecken / Für dich“, 2026-11-02). Run against a freshly seeded demo database
 * (`npm run demo:refresh`): six editorial collections, none sponsored; testkunde has history, favourites and a saved
 * address in 10435 Berlin; Hanna B. is a recently approved Profi there.
 *
 * Clean-up: the opt-out test switches the preference back on in `finally`; the admin test deletes its collection.
 * Works against the dev server too: `E2E_PORT=3000 npx playwright test tests/e2e/entdecken.spec.ts`.
 */

const hydrationErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && /hydrat|did not match|server rendered/i.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
};

const forYou = (page: Page) => page.locator("section#fuer-dich");

test.describe("public /entdecken", () => {
  test("shows the editorial collections with their label, the city switch and new Profis, and no slot claims", async ({ page }, testInfo) => {
    const errors = hydrationErrors(page);
    await page.goto("/entdecken");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Ideen für deinen nächsten Termin\./);

    // „Entdecken“ is the first site link and marked current
    if (testInfo.project.name === "desktop") {
      const first = page.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("link").first();
      await expect(first).toHaveText("Entdecken");
      await expect(first).toHaveAttribute("aria-current", "page");
    } else {
      await page.getByRole("button", { name: "Menü öffnen" }).click();
      const first = page.getByRole("dialog", { name: "Menü" }).getByRole("link").nth(1); // after the wordmark
      await expect(first).toHaveText(/Entdecken/);
      await expect(first).toHaveAttribute("aria-current", "page");
      await page.getByRole("button", { name: "Menü schließen" }).click();
    }

    const collections = page.getByRole("list", { name: "Von SOMA ausgewählt" });
    await expect(collections.getByRole("listitem")).toHaveCount(6);
    for (const card of await collections.getByRole("link").all()) await expect(card).toContainText("Von SOMA ausgewählt");
    await expect(collections).not.toContainText("Anzeige");
    await expect(page.getByText("Niemand bezahlt dafür, hier zu erscheinen.").first()).toBeVisible();

    // guests: one quiet line, no personal section
    const invite = page.getByRole("complementary", { name: "Für dich" });
    await expect(invite).toContainText("Melde dich an");
    await expect(invite.getByRole("link", { name: /Anmelden/ })).toHaveAttribute("href", "/anmelden?next=%2Fentdecken");
    await expect(forYou(page)).toHaveCount(0);
    await expect(page.getByText(/Nächster freier Termin/)).toHaveCount(0);

    // „Beliebt in <Stadt>“: Berlin by default, tabs switch the panel (keyboard too)
    const tabs = page.getByRole("tablist", { name: "Stadt wählen" });
    await expect(tabs.getByRole("tab", { name: "Berlin" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { name: "Beliebt in Berlin" })).toBeVisible();
    const second = tabs.getByRole("tab").nth(1);
    const secondName = (await second.textContent())?.trim() ?? "";
    await tabs.getByRole("tab", { name: "Berlin" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(second).toBeFocused();
    await expect(second).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { name: `Beliebt in ${secondName}` })).toBeVisible();
    await expect(page.getByRole("tabpanel")).toHaveCount(1);

    // „Neu auf SOMA“: every card carries the chip and the real date
    const fresh = page.getByRole("list", { name: "Neu auf SOMA" });
    expect(await fresh.getByRole("listitem").count()).toBeGreaterThan(0);
    for (const card of await fresh.getByRole("link").all()) await expect(card).toContainText(/Neu[\s\S]*Auf SOMA seit/);
    await expect(fresh.getByText("Demo-Profil · Foto KI-generiert").first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("a collection page lists its items with the editorial label and links into the flow", async ({ page }) => {
    await page.goto("/entdecken");
    await page.getByRole("list", { name: "Von SOMA ausgewählt" }).getByRole("link", { name: /Massage im Hotel/ }).click();
    await expect(page).toHaveURL(/\/entdecken\/im-hotel-ankommen$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Massage im Hotel.");
    const hint = page.getByTestId("sammlung-hinweis");
    await expect(hint).toContainText("Von SOMA ausgewählt.");
    await expect(hint).toContainText("Eine redaktionelle Auswahl von SOMA. Niemand bezahlt dafür, hier zu erscheinen.");
    await expect(hint.getByRole("link", { name: "So wählen wir aus" })).toHaveAttribute("href", "/ranking#auswahl");
    const items = page.getByRole("region", { name: "In dieser Auswahl" }).getByRole("listitem");
    expect(await items.count()).toBeGreaterThanOrEqual(3);
    for (const href of await page.getByRole("region", { name: "In dieser Auswahl" }).getByRole("list").getByRole("link").evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""))) {
      expect(href).toMatch(/^\/(profis\/[a-z0-9-]+|suche)\?/);
    }
    await expect(page.getByText("Anzeige", { exact: true })).toHaveCount(0);
    await expect(page.getByText(/Nächster freier Termin/)).toHaveCount(0);
  });
});

test.describe("signed in", () => {
  test("testkunde gets „Für dich“ from her own bookings, favourites and address", async ({ page }) => {
    const errors = hydrationErrors(page);
    await login(page, USERS.customer);
    await page.goto("/entdecken");
    const fy = forYou(page);
    await expect(fy.getByRole("heading", { name: "Für dich, Julia" })).toBeVisible({ timeout: 20_000 });
    await expect(fy).toContainText("10435 Berlin");
    await expect(fy.getByRole("link", { name: "Warum sehe ich das?" })).toHaveAttribute("href", "/ranking#fuer-dich");

    const rebook = fy.getByRole("group", { name: "Wieder buchen" });
    await expect(rebook).toContainText("Selin A.");
    await expect(rebook).toContainText("Linh N.");
    await expect(rebook).toContainText("Demo-Profil · Foto KI-generiert");
    const matching = fy.getByRole("group", { name: "Passend zu deinen Buchungen" });
    expect(await matching.getByRole("listitem").count()).toBeGreaterThan(0);
    await expect(matching.getByText("Endpreis inkl. Anfahrt").first()).toBeVisible();
    await expect(fy.getByRole("group", { name: "Neu in deiner Nähe" })).toContainText("Hanna B.");
    // availability claims only inside „Für dich“
    expect(await fy.getByText(/Nächster freier Termin/).count()).toBeGreaterThan(0);
    await expect(page.locator("main section:not(#fuer-dich)").getByText(/Nächster freier Termin/)).toHaveCount(0);
    // her city is preselected for „Beliebt“
    await expect(page.getByRole("tab", { name: "Berlin" })).toHaveAttribute("aria-selected", "true");

    // the existing one-tap rebook
    await rebook.getByRole("button", { name: "Wieder bei Selin buchen" }).click();
    await expect(page.getByRole("dialog", { name: /Wieder bei Selin A\./ })).toBeVisible({ timeout: 15_000 });
    expect(errors).toEqual([]);
  });

  test("„Entdecken“ in the account navigation opens /entdecken and stays active there", async ({ page }, testInfo) => {
    await login(page, USERS.customer);
    await page.goto("/konto");
    const mobile = testInfo.project.name === "mobile";
    const nav = mobile ? page.locator("nav.fixed").filter({ hasText: "Termine" }) : page.getByRole("navigation", { name: "Konto" });
    // keyboard activation: in `next dev` the dev-tools button sits over the bar's first item
    await nav.getByRole("link", { name: "Entdecken" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/entdecken$/);
    if (mobile) {
      const bar = page.locator("nav.fixed").filter({ hasText: "Termine" });
      await expect(bar.getByRole("link", { name: "Entdecken" })).toHaveAttribute("aria-current", "page", { timeout: 15_000 });
      await expect(bar.getByRole("link", { name: "Termine" })).not.toHaveAttribute("aria-current", "page");
    } else {
      await expect(page.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("link", { name: "Entdecken" })).toHaveAttribute("aria-current", "page");
    }
  });

  test("the opt-out hides „Für dich“", async ({ page }) => {
    await login(page, USERS.customer);
    await page.goto("/konto/profil");
    const toggle = page.getByRole("switch", { name: /Persönliche Vorschläge/ });
    try {
      await expect(toggle).toBeChecked();
      await toggle.uncheck({ force: true });
      await expect(page.getByText("Persönliche Vorschläge sind aus.")).toBeVisible();
      await expect(toggle).not.toBeChecked();
      await page.goto("/entdecken");
      await expect(page.getByRole("heading", { name: "Von SOMA ausgewählt" })).toBeVisible();
      await page.waitForLoadState("networkidle");
      await expect(page.getByRole("status", { name: "Für dich wird geladen" })).toHaveCount(0);
      await expect(forYou(page)).toHaveCount(0);
      await expect(page.getByText(/Für dich, Julia|Melde dich an, dann siehst du/)).toHaveCount(0);
      await expect(page.getByText(/Nächster freier Termin/)).toHaveCount(0);
    } finally {
      await page.goto("/konto/profil");
      const again = page.getByRole("switch", { name: /Persönliche Vorschläge/ });
      if (!(await again.isChecked())) {
        await again.check({ force: true });
        await expect(page.getByText("Persönliche Vorschläge sind an.")).toBeVisible();
      }
    }
  });
});

test.describe("admin", () => {
  test("creates and activates a collection that then appears, and „Anzeige“ when it is sponsored", async ({ page }, testInfo) => {
    const slug = `e2e-${testInfo.project.name}-${Date.now().toString(36)}`;
    const title = `E2E Abendmassage ${testInfo.project.name}`;
    await login(page, USERS.admin);
    await page.goto("/admin/entdecken");
    await page.getByRole("link", { name: "Sammlung anlegen" }).click();
    await expect(page).toHaveURL(/\/admin\/entdecken\/neu$/);
    await page.getByLabel("Titel", { exact: true }).fill(title);
    await page.getByLabel("Adresse", { exact: true }).fill(slug);
    await page.getByLabel(/Unterzeile/).fill("Ruhige Griffe nach einem langen Tag.");
    await page.getByRole("button", { name: "Leistung hinzufügen" }).click();
    await page.getByLabel("Leistung", { exact: true }).selectOption({ label: "Sportmassage" });
    await page.getByRole("button", { name: "Anlegen" }).click();
    await expect(page).toHaveURL(/\/admin\/entdecken\/[0-9a-f-]{36}$/, { timeout: 20_000 });
    const editUrl = page.url();

    try {
      // a draft is not public yet
      expect((await page.request.get(`/entdecken/${slug}`)).status()).toBe(404);

      await page.getByRole("switch", { name: /^Aktiv/ }).check({ force: true });
      await page.getByRole("button", { name: "Speichern" }).click();
      await expect(page.getByText("Sammlung gespeichert.")).toBeVisible();
      await expect(page.getByText("Aktiv", { exact: true }).first()).toBeVisible();

      await page.goto("/entdecken");
      const card = page.getByRole("list", { name: "Von SOMA ausgewählt" }).getByRole("link", { name: new RegExp(title) });
      await expect(card).toBeVisible();
      await expect(card).toContainText("Von SOMA ausgewählt");
      await expect(card).not.toContainText("Anzeige");

      // sponsored → „Anzeige“ with the sponsor, on the card and on the page
      await page.goto(editUrl);
      await page.getByRole("switch", { name: /Bezahlte Platzierung/ }).check({ force: true });
      await page.getByRole("textbox", { name: "Auftraggeber" }).fill("Beispiel GmbH");
      await page.getByRole("button", { name: "Speichern" }).click();
      await expect(page.getByText("Sammlung gespeichert.")).toBeVisible();

      await page.goto("/entdecken");
      const sponsoredCard = page.getByRole("list", { name: "Von SOMA ausgewählt" }).getByRole("link", { name: new RegExp(title) });
      await expect(sponsoredCard).toContainText("Anzeige");
      await expect(sponsoredCard).toContainText("Bezahlte Platzierung im Auftrag von Beispiel GmbH.");
      await expect(sponsoredCard).not.toContainText("Von SOMA ausgewählt");
      await expect(page.getByText(/Bezahlte Platzierungen tragen den Hinweis „Anzeige“/)).toBeVisible();

      await page.goto(`/entdecken/${slug}`);
      const hint = page.getByTestId("sammlung-hinweis");
      await expect(hint).toContainText("Anzeige.");
      await expect(hint).toContainText("Bezahlte Platzierung im Auftrag von Beispiel GmbH.");
      await expect(page.getByRole("link", { name: /Sportmassage/ }).first()).toHaveAttribute("href", "/suche?kategorie=massage&leistung=sportmassage");
    } finally {
      await page.goto(editUrl);
      await page.getByRole("button", { name: "Löschen" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Löschen" }).click();
      await expect(page).toHaveURL(/\/admin\/entdecken$/, { timeout: 20_000 });
      await expect(page.getByTestId(`sammlung-${slug}`)).toHaveCount(0);
    }
  });
});
