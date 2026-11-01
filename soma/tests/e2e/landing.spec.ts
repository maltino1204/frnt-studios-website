import { expect, test, type Page } from "@playwright/test";

/**
 * Landing page structure (docs/landing/LANDING_DESIGN_SPEC.md § 4, § 5.1, § 9, § 14). Frontend's basic checks; booking,
 * routing params and SEO are covered by landing-conversion.spec.ts.
 */

const CHAPTERS = [
  ["01", "bei-dir"],
  ["02", "idee"],
  ["03", "behandlungen"],
  ["04", "so-funktionierts"],
  ["05", "dein-ort"],
  ["06", "profis"],
  ["07", "deine-buchung"],
  ["08", "fuer-profis"],
  ["09", "fragen"],
  ["10", "soma"],
] as const;

async function open(page: Page) {
  await page.goto("/");
  await expect(page.locator("main [data-chapter]").first()).toBeAttached();
}

test("ten chapters render in order, each labelled by its heading", async ({ page }) => {
  await open(page);
  const sections = page.locator("main section[data-chapter]");
  await expect(sections).toHaveCount(10);
  const found = await sections.evaluateAll((els) => els.map((el) => [el.getAttribute("data-chapter"), el.id]));
  expect(found).toEqual(CHAPTERS.map(([n, id]) => [n, id]));

  for (const [, id] of CHAPTERS) {
    const section = page.locator(`section#${id}`);
    await expect(section).toHaveAttribute("aria-labelledby", `${id}-titel`);
    const heading = page.locator(`#${id}-titel`);
    await expect(heading).toHaveCount(1);
    expect(await heading.evaluate((el) => el.tagName)).toBe(id === "bei-dir" ? "H1" : "H2");
  }
});

test("one h1 with the tagline and the German line; no <em> in h1/h2; the tagline is English", async ({ page }) => {
  await open(page);
  const h1 = page.locator("h1");
  await expect(h1).toHaveCount(1);
  await expect(h1).toContainText("Your body.");
  await expect(h1).toContainText("Your place.");
  await expect(h1).toContainText("Beauty & Wellness bei dir zu Hause, im Hotel oder im Büro.");
  await expect(h1.locator('[lang="en"]')).toHaveCount(2);
  expect(await page.locator("h1 em, h2 em").count()).toBe(0);
  // Logical hierarchy: no h3 before the first h2, no h4+ on the landing.
  const levels = await page.locator("main").evaluate((m) => [...m.querySelectorAll("h1, h2, h3, h4, h5, h6")].map((h) => Number(h.tagName[1])));
  expect(levels[0]).toBe(1);
  expect(levels.filter((l) => l > 3)).toEqual([]);
  expect(levels.indexOf(3)).toBeGreaterThan(levels.indexOf(2));
});

test("category links resolve to live category pages", async ({ page, request }) => {
  await open(page);
  const hrefs = [
    ...new Set(await page.locator('#behandlungen a[href^="/behandlungen/"]').evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""))),
  ];
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    expect(href).toMatch(/^\/behandlungen\/[a-z0-9-]+$/);
    expect((await request.get(href)).status(), href).toBe(200);
  }
});

test("„Profi werden“ leads to the provider onboarding", async ({ page, request }) => {
  await open(page);
  const links = page.locator("main").getByRole("link", { name: "Profi werden" });
  expect(await links.count()).toBeGreaterThanOrEqual(2); // 08 and 10
  for (const href of await links.evaluateAll((els) => els.map((el) => el.getAttribute("href")))) expect(href).toBe("/pro/registrieren");
  expect((await request.get("/pro/registrieren")).status()).toBe(200);
  await expect(page.locator('#fuer-profis a[href="/fuer-profis#provision"]')).toHaveCount(1);
});

test("every in-page anchor resolves to exactly one id", async ({ page }) => {
  await open(page);
  const targets = await page.locator('main a[href^="#"]').evaluateAll((els) => [...new Set(els.map((el) => el.getAttribute("href")!.slice(1)))]);
  for (const id of targets) expect(await page.locator(`[id="${id}"]`).count(), `#${id}`).toBe(1);
});

test("no horizontal overflow at 390 px", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await open(page);
  const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(scroll).toBeLessThanOrEqual(client);
  await context.close();
});
