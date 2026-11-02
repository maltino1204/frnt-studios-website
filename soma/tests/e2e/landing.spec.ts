import { expect, test, type Page } from "@playwright/test";

/**
 * Landing page structure (docs/landing/LANDING_DESIGN_SPEC.md "v2 structure", § 4, § 5.1, § 9, § 14). Frontend’s
 * basic checks; booking, routing params and SEO are covered by landing-conversion.spec.ts.
 */

/** v2 (client decision 2026-11-02): seven chapters; Idee, Dein Ort and Deine Buchung are gone. */
const CHAPTERS = [
  ["01", "bei-dir"],
  ["02", "behandlungen"],
  ["03", "so-funktionierts"],
  ["04", "profis"],
  ["05", "fuer-profis"],
  ["06", "fragen"],
  ["07", "soma"],
] as const;

async function open(page: Page) {
  await page.goto("/");
  await expect(page.locator("main [data-chapter]").first()).toBeAttached();
}

test("exactly the seven chapter ids render in order, each labelled by its heading", async ({ page }) => {
  await open(page);
  const sections = page.locator("main section[data-chapter]");
  await expect(sections).toHaveCount(7);
  // nothing else in main carries a chapter id or a removed chapter's markup
  expect(await page.locator("main [data-chapter]").count()).toBe(7);
  for (const gone of ["idee", "dein-ort", "deine-buchung"]) await expect(page.locator(`[id="${gone}"], [id="${gone}-titel"]`), gone).toHaveCount(0);
  await expect(page.locator('[data-scene="doorway"], [data-scene="stage"], [data-scene="dusk"], [data-scene="dawn"], [data-scene="screens"]')).toHaveCount(0);
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
  expect(await links.count()).toBeGreaterThanOrEqual(2); // 05 and 07
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

test("„Entdecken“ is in the landing header: first link from 1280 px, first page in the overlay („Menü“) below", async ({ page }, ti) => {
  await open(page);
  const header = page.locator("header.lp-header");
  if (ti.project.name === "desktop") {
    const links = header.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("link");
    await expect(links.first()).toHaveText("Entdecken");
    await expect(links.first()).toHaveAttribute("href", "/entdecken");
    await expect(links.first()).toBeVisible();
    expect(await links.allTextContents()).toEqual(["Entdecken", "Behandlungen", "So funktioniert’s", "Für Profis", "Hilfe"]);
  } else {
    await header.getByRole("button", { name: "Menü" }).click();
    const overlay = page.getByRole("dialog", { name: "Kapitel und Seiten" });
    await expect(overlay).toBeVisible();
    const pages = overlay.getByRole("list").filter({ has: page.getByRole("link", { name: "Entdecken" }) }).getByRole("link");
    await expect(pages.first()).toHaveText("Entdecken");
    await expect(pages.first()).toHaveAttribute("href", "/entdecken");
    await expect(overlay.locator("ol a")).toHaveText(CHAPTERS.map(([nn]) => new RegExp(`^${nn}`)));
    await page.keyboard.press("Escape");
    await expect(overlay).toBeHidden();
  }
});

test("02 links to the Themenwelten, 03 carries the three trust points, 06 shows five questions and „Alle Fragen“", async ({ page }) => {
  await open(page);
  const explore = page.locator("#behandlungen").getByRole("link", { name: "Themenwelten entdecken" });
  await expect(explore).toHaveCount(1);
  await expect(explore).toHaveAttribute("href", "/entdecken");
  await expect(page.locator('#behandlungen a[href="/behandlungen"]')).toHaveCount(1);

  const trust = page.locator("#so-funktionierts dl dt");
  await expect(trust).toHaveCount(3);
  await expect(trust.nth(0)).toHaveText("Endpreis");
  await expect(trust.nth(1)).toHaveText("Start-Code");
  // the free window comes from the platform's cancellation policy, the same value as the hero trust row
  const heroFree = (await page.locator("#bei-dir li").allTextContents()).map((t) => t.trim()).find((t) => t.startsWith("Kostenlos stornierbar"));
  if (heroFree) await expect(trust.nth(2)).toHaveText(heroFree);
  else await expect(trust.nth(2)).toHaveText(/^(Stornofrist|Kostenlos stornierbar bis zum Termin)$/);

  await expect(page.locator("#fragen details")).toHaveCount(5);
  const all = page.locator("#fragen").getByRole("link", { name: "Alle Fragen" });
  await expect(all).toHaveCount(1);
  await expect(all).toHaveAttribute("href", "/hilfe");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the whole page renders in order; „Menü“ leads to the static list of the seven chapters and the pages", async ({ page }) => {
    await page.goto("/");
    const found = await page.locator("main section[data-chapter]").evaluateAll((els) => els.map((el) => [el.getAttribute("data-chapter"), el.id]));
    expect(found).toEqual(CHAPTERS.map(([n, id]) => [n, id]));
    for (const [, id] of CHAPTERS) await expect(page.locator(`#${id}-titel`), id).toBeVisible();
    const list = page.locator("nav#kapitel");
    await expect(list).toHaveCount(1);
    await expect(list.locator("ol a")).toHaveText(CHAPTERS.map(([nn]) => new RegExp(`^${nn}`)));
    for (const [, id] of CHAPTERS) await expect(list.locator(`ol a[href="#${id}"]`)).toHaveCount(1);
    await expect(list.locator('ul a[href="/entdecken"]')).toHaveText("Entdecken");
    const menu = page.locator('header a[href="#kapitel"]:visible');
    expect(await menu.count()).toBeGreaterThan(0);
  });
});

test("the hero photo is fetched once per viewport: the preload and the <img> pick the same width (audit-4 N4-2)", async ({ browser }, ti) => {
  test.skip(ti.project.name !== "mobile", "the viewports are set here; once is enough");
  test.setTimeout(120_000);
  for (const vp of [
    { width: 360, height: 740, dpr: 3 },
    { width: 390, height: 844, dpr: 2 },
    { width: 412, height: 915, dpr: 2.625 },
    { width: 768, height: 1024, dpr: 2 },
    { width: 820, height: 1180, dpr: 2 },
    { width: 1023, height: 768, dpr: 1 },
    { width: 1440, height: 900, dpr: 1 },
  ]) {
    const mobile = vp.width < 1024;
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, isMobile: mobile, hasTouch: mobile, locale: "de-DE" });
    const page = await context.newPage();
    const hero: string[] = [];
    const warnings: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("hero-home-4x5")) hero.push(new URL(r.url()).searchParams.get("w") ?? r.url());
    });
    page.on("console", (m) => {
      if (m.type() === "warning" || m.type() === "error") warnings.push(m.text().slice(0, 160));
    });
    await page.goto("/", { waitUntil: "load" });
    await page.waitForTimeout(3500); // Chromium warns about an unused preload a few seconds after load
    expect(hero, `${vp.width}×${vp.height}: one hero request`).toHaveLength(1);
    const current = await page.locator("#hero-ort img[data-lcp]").evaluate((img: HTMLImageElement) => new URL(img.currentSrc).searchParams.get("w"));
    expect(current, `${vp.width}×${vp.height}: the <img> shows the preloaded file`).toBe(hero[0]);
    expect(warnings, `${vp.width}×${vp.height}: no console warnings`).toEqual([]);
    await context.close();
  }
});
