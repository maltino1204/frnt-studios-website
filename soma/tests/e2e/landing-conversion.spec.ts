import { expect, test, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import { berlinDate } from "./helpers";

/**
 * Landing conversion and integration acceptance tests T1–T22 (docs/landing/INTEGRATION.md § 8).
 * Contract: LANDING_DESIGN_SPEC.md § 4.1.6 (hero entry `#termin`), § 5 (header, dock „Schnellzugriff“, booking bar and
 * sheet), § 5.1 (chapter ids), § 11.3 (`html[data-dock]`), INTEGRATION.md § 7 (`data-cta`).
 * Run against a seeded demo database: `E2E_BASE_URL=http://localhost:3000 npx playwright test landing-conversion`.
 */

const TITLE = "SOMA – Beauty & Wellness bei dir zu Hause, im Hotel und im Büro";

const hero = (page: Page) => page.locator("#termin");
const plzIn = (scope: Locator) => scope.locator('input[name="plz"]');
const submitIn = (scope: Locator) => scope.getByRole("button", { name: "Freie Termine finden" });
const dock = (page: Page) => page.locator('nav[aria-label="Schnellzugriff"]');
const params = (page: Page) => Object.fromEntries(new URL(page.url()).searchParams);

async function demoMode(request: APIRequestContext): Promise<boolean> {
  const res = await request.get("/api/health");
  return res.ok() ? (await res.json()).demoMode === true : false;
}

async function openLanding(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(hero(page)).toBeAttached();
}

/** Types a PLZ into an entry and waits for the city lookup (proves hydration). */
async function enterPlz(scope: Locator, plz: string, expectText: RegExp | string) {
  await plzIn(scope).fill(plz);
  await expect(scope.getByText(expectText).first()).toBeVisible({ timeout: 15_000 });
}

async function isFocused(loc: Locator): Promise<boolean> {
  return loc.evaluate((el) => el === document.activeElement).catch(() => false);
}

async function tabUntil(page: Page, done: () => Promise<boolean>, max = 80) {
  for (let i = 0; i < max; i++) {
    if (await done()) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("focus target not reached by Tab");
}

async function scrollToId(page: Page, id: string) {
  await page.evaluate((x) => document.getElementById(x)?.scrollIntoView({ block: "start", behavior: "instant" }), id);
  await page.waitForTimeout(400);
}

const dockState = (page: Page) => page.evaluate(() => document.documentElement.dataset.dock ?? null);

type LdNode = Record<string, unknown>;
async function jsonLdNodes(page: Page): Promise<LdNode[]> {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  return raw.flatMap((t) => {
    const d = JSON.parse(t) as LdNode | LdNode[];
    const list = Array.isArray(d) ? d : [d];
    return list.flatMap((n) => (Array.isArray(n["@graph"]) ? (n["@graph"] as LdNode[]) : [n]));
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// T1–T7: the hero booking entry
// ---------------------------------------------------------------------------------------------------------------------
test("T1 the hero search carries PLZ, service, day and time window to /suche", async ({ page }) => {
  await openLanding(page);
  const entry = hero(page);
  await enterPlz(entry, "10115", "Berlin");

  await entry.getByRole("button", { name: /^Was\?/ }).click();
  const was = page.getByRole("dialog", { name: "Behandlung wählen" });
  await was.getByRole("button", { name: /^Massage/ }).click();
  await was.getByRole("button", { name: /^Entspannungsmassage/ }).click();
  await expect(was).toBeHidden();

  await entry.getByRole("button", { name: /^Wann\?/ }).click();
  const wann = page.getByRole("dialog", { name: "Zeitpunkt wählen" });
  await wann.getByRole("button", { name: "Morgen", exact: true }).click();
  await wann.getByRole("button", { name: /^Abends/ }).click();
  await wann.getByRole("button", { name: "Fertig" }).click();
  await expect(wann).toBeHidden();

  await submitIn(entry).click();
  await page.waitForURL(/\/suche\?/);
  expect(params(page)).toEqual({ plz: "10115", kategorie: "massage", leistung: "entspannungsmassage", datum: berlinDate(1), zeit: "abends" });
  await expect(page.locator("h1")).toContainText("in 10115 Berlin");
});

test("T2 a PLZ alone searches without empty parameters", async ({ page }) => {
  await openLanding(page);
  await enterPlz(hero(page), "10115", "Berlin");
  await plzIn(hero(page)).press("Enter");
  await page.waitForURL(/\/suche\?/);
  expect(params(page)).toEqual({ plz: "10115" });
});

test("T3 validation: empty, short and unknown PLZ", async ({ page }) => {
  await openLanding(page);
  const entry = hero(page);
  await submitIn(entry).click();
  await expect(entry.getByText("Bitte gib deine Postleitzahl ein.")).toBeVisible();
  await expect(plzIn(entry)).toBeFocused();
  await expect(plzIn(entry)).toHaveAttribute("aria-invalid", "true");

  await plzIn(entry).fill("1011");
  await submitIn(entry).click();
  await expect(entry.getByText("Bitte gib eine fünfstellige Postleitzahl ein.")).toBeVisible();

  await plzIn(entry).fill("00000");
  await expect(entry.getByText("Diese Postleitzahl kennen wir nicht.", { exact: false })).toBeVisible({ timeout: 15_000 });
  await submitIn(entry).click();
  await page.waitForTimeout(500);
  expect(new URL(page.url()).pathname).toBe("/");
});

test("T4 an unserved PLZ offers the waitlist and still reaches /suche", async ({ page }) => {
  await openLanding(page);
  const entry = hero(page);
  await enterPlz(entry, "01067", "noch nicht verfügbar");
  await expect(entry.getByText(/In 01067 gibt es noch keine Profis auf SOMA\./)).toBeVisible();
  await expect(entry.getByRole("button", { name: "Benachrichtigen" })).toBeVisible();
  await submitIn(entry).click();
  await page.waitForURL(/\/suche\?plz=01067/);
  await expect(page.getByText("In 01067 gibt es noch keine Profis auf SOMA.")).toBeVisible();
  await expect(page.getByLabel(/E-Mail/).first()).toBeVisible();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("T5 the entry is a plain GET form and every booking link is a real anchor", async ({ page }) => {
    await page.goto("/");
    await plzIn(hero(page)).fill("10115");
    await plzIn(hero(page)).press("Enter");
    await page.waitForURL(/\/suche\?/);
    expect(params(page)).toEqual({ plz: "10115" });

    await page.goto("/");
    for (const href of await page.locator("a[data-cta]").evaluateAll((as) => as.map((a) => a.getAttribute("href")))) {
      expect(href, "every CTA has a real href").toBeTruthy();
    }
    const finalSearch = page.locator('a[data-cta="final-search"]');
    if (await finalSearch.count()) await expect(finalSearch.first()).toHaveAttribute("href", "/suche");
  });
});

test("T6 keyboard only: PLZ, Was?, Wann? and submit (desktop)", async ({ page }, ti) => {
  test.skip(ti.project.name !== "desktop", "popover keyboard flow is the desktop variant");
  await openLanding(page);
  const entry = hero(page);
  const plz = plzIn(entry);
  const was = entry.getByRole("button", { name: /^Was\?/ });
  const wann = entry.getByRole("button", { name: /^Wann\?/ });

  await page.locator("body").focus();
  await tabUntil(page, () => isFocused(plz));
  await page.keyboard.type("10115");
  await expect(entry.getByText("Berlin").first()).toBeVisible({ timeout: 15_000 });

  await tabUntil(page, () => isFocused(was), 4);
  await page.keyboard.press("Enter");
  const pop = page.getByRole("dialog", { name: "Behandlung wählen" });
  await expect(pop).toBeVisible();
  expect(await pop.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(pop).toBeHidden();
  await expect(was).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(pop).toBeVisible();
  await tabUntil(page, () => isFocused(pop.getByRole("button", { name: /^Massage/ })), 6);
  await page.keyboard.press("Enter");
  // Drilling in keeps focus inside the popover (it would close on the next Tab otherwise).
  expect(await pop.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  await tabUntil(page, () => isFocused(pop.getByRole("button", { name: /^Entspannungsmassage/ })), 6);
  await page.keyboard.press("Enter");
  await expect(pop).toBeHidden();
  await expect(was).toBeFocused();
  await expect(was).toContainText("Entspannungsmassage");

  await tabUntil(page, () => isFocused(wann), 3);
  await page.keyboard.press("Enter");
  const wpop = page.getByRole("dialog", { name: "Zeitpunkt wählen" });
  await expect(wpop).toBeVisible();
  await tabUntil(page, () => isFocused(wpop.getByRole("button", { name: "Morgen", exact: true })), 6);
  await page.keyboard.press("Enter");
  await tabUntil(page, () => isFocused(wpop.getByRole("button", { name: "Fertig" })), 10);
  await page.keyboard.press("Enter");
  await expect(wann).toBeFocused();
  await expect(wann).toContainText("Morgen");

  await tabUntil(page, () => isFocused(submitIn(entry)), 3);
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/suche\?/);
  expect(params(page)).toEqual({ plz: "10115", kategorie: "massage", leistung: "entspannungsmassage", datum: berlinDate(1) });
});

test("T7 screen-reader semantics of the entry", async ({ page }) => {
  await openLanding(page);
  await expect(page.getByRole("search", { name: "Termin finden" })).toHaveCount(1);
  const entry = hero(page);
  await expect(entry.getByLabel(/^Wo\?\s+Postleitzahl/)).toBeVisible();
  const was = entry.getByRole("button", { name: /^Was\?/ });
  await expect(was).toHaveAttribute("aria-expanded", "false");
  await was.click();
  await expect(was).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");

  await submitIn(entry).click();
  const describedBy = await plzIn(entry).getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  const msg = page.locator(`[id="${describedBy}"]`);
  await expect(msg).toHaveText("Bitte gib deine Postleitzahl ein.");
  expect(await msg.evaluate((el) => !!el.closest('[aria-live="polite"]'))).toBe(true);
});

// ---------------------------------------------------------------------------------------------------------------------
// T8–T11: routes
// ---------------------------------------------------------------------------------------------------------------------
test("T8 every category tile links to a live category route", async ({ page, request }) => {
  await openLanding(page);
  const tiles = await page.locator('#behandlungen a[href^="/behandlungen/"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")!))]);
  const footer = await page.locator('footer a[href^="/behandlungen/"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")!))]);
  expect(tiles.length, "one tile per active category").toBeGreaterThan(0);
  expect([...tiles].sort()).toEqual([...footer].sort());
  for (const href of tiles) {
    expect(href).toMatch(/^\/behandlungen\/[a-z0-9-]+$/);
    expect((await request.get(href)).status(), href).toBe(200);
  }
  await expect(page.locator('#behandlungen a[href="/behandlungen"]').first()).toBeAttached();
});

test("T9 city and provider links resolve; ratings only from three reviews; demo labels", async ({ page, request }) => {
  await openLanding(page);
  const links = await page.locator('a[href^="/staedte/"], a[href^="/profis/"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")!))]);
  for (const href of links) {
    expect(href).toMatch(/^\/(staedte|profis)\/[a-z0-9-]+$/);
    expect((await request.get(href)).status(), href).toBe(200);
  }
  const cards = page.locator('#profis a[href^="/profis/"]');
  const n = await cards.count();
  for (let i = 0; i < n; i++) {
    const text = (await cards.nth(i).innerText()).replace(/\s+/g, " ");
    expect(text, "the landing never shows „Neu auf SOMA“").not.toContain("Neu auf SOMA");
    const count = text.match(/\((\d+)\)/);
    if (count) expect(Number(count[1])).toBeGreaterThanOrEqual(3);
  }
  if (n > 0 && (await demoMode(request))) {
    await expect(page.locator("#profis").getByText("Demo-Profil · Foto KI-generiert").first()).toBeAttached();
  }
});

test("T10 „Profi werden“ reaches onboarding; „Konditionen ansehen“ reaches the commission section", async ({ page, request }) => {
  await openLanding(page);
  await expect(page.locator('#soma a[href="/pro/registrieren"]').first()).toBeAttached();
  await expect(page.locator('#fuer-profis a[href="/fuer-profis#provision"]').first()).toBeAttached();
  expect(await (await request.get("/fuer-profis")).text()).toContain('id="provision"');
  const cta = page.locator('#fuer-profis a[href="/pro/registrieren"]').first();
  await cta.scrollIntoViewIfNeeded();
  await cta.click();
  await page.waitForURL(/\/pro\/registrieren$/);
  await expect(page.locator("h1")).toContainText("Werde Profi auf SOMA.");
});

test("T11 login and legal links resolve", async ({ page, request }) => {
  await openLanding(page);
  await expect(page.locator('a[href="/anmelden"], a[href="/konto"], a[href="/pro"], a[href="/admin"]').first()).toBeAttached();
  for (const href of ["/impressum", "/datenschutz", "/agb", "/agb-profis", "/widerruf"]) {
    await expect(page.locator(`footer a[href="${href}"]`).first()).toBeAttached();
    expect((await request.get(href)).status(), href).toBe(200);
  }
  await expect(page.locator('footer a[href="/datenschutz#cookies"]')).toBeAttached();
  expect(await (await request.get("/datenschutz")).text()).toContain('id="cookies"');
  expect(await (await request.get("/ranking")).text()).toContain('id="bewertungen"');
});

// ---------------------------------------------------------------------------------------------------------------------
// T12–T14: booking access (dock, sheet, bar) and anchors
// ---------------------------------------------------------------------------------------------------------------------
test("T12 mobile dock opens the booking sheet: shared PLZ, inline pickers, focus return, submit", async ({ page }, ti) => {
  test.skip(ti.project.name !== "mobile", "the dock exists below 1024 px only");
  await openLanding(page);
  await enterPlz(hero(page), "10115", "Berlin");
  await scrollToId(page, "behandlungen");
  await page.locator("body").focus();

  const cta = dock(page).getByRole("link", { name: "Termin finden" });
  await expect(cta).toBeVisible();
  await cta.click();
  const sheet = page.getByRole("dialog", { name: "Termin finden" });
  await expect(sheet).toBeVisible();
  await expect(plzIn(sheet)).toHaveValue("10115");
  expect(await page.evaluate(() => document.documentElement.dataset.bookingOpen)).toBe("sheet");

  await sheet.getByRole("button", { name: /^Was\?/ }).click();
  await expect(sheet.getByRole("group", { name: "Behandlung wählen" })).toBeVisible();
  await expect(page.locator("dialog[open]")).toHaveCount(1); // inline, never a second sheet
  await sheet.getByRole("button", { name: /^Massage/ }).click();
  await sheet.getByRole("button", { name: /Massage: alle Leistungen/ }).click();
  await expect(sheet.getByRole("button", { name: /^Was\?/ })).toContainText("Massage");

  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(cta).toBeFocused();

  // The choice made in the sheet flows back into the hero entry.
  await expect(hero(page).getByRole("button", { name: /^Was\?/ })).toContainText("Massage");

  await cta.click();
  await expect(sheet).toBeVisible();
  await submitIn(sheet).click();
  await page.waitForURL(/\/suche\?/);
  expect(params(page)).toEqual({ plz: "10115", kategorie: "massage" });
});

/** The dock's visibility rules are written by the motion layer (`html[data-dock]`, spec § 11.3, phase L3). */
async function requireDockState(page: Page) {
  const state = await dockState(page);
  test.skip(state === null, "html[data-dock] is not written yet (motion layer, phase L3)");
}

test("T12a dock visibility: hidden for the hero entry and a focused field, shown elsewhere", async ({ page }, ti) => {
  test.skip(ti.project.name !== "mobile", "the dock exists below 1024 px only");
  await openLanding(page);
  await page.waitForTimeout(800);
  await requireDockState(page);
  await page.evaluate(() => document.getElementById("termin")?.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect.poll(() => dockState(page)).toBe("hidden");
  await scrollToId(page, "behandlungen");
  await page.locator("body").focus();
  await expect.poll(() => dockState(page)).toBe("shown");
  await expect(dock(page).getByRole("link", { name: "Termin finden" })).toBeVisible();
  await page.evaluate(() => document.querySelector<HTMLInputElement>('#termin input[name="plz"]')?.focus({ preventScroll: true }));
  await expect.poll(() => dockState(page)).toBe("hidden");
});

test("T13 desktop header „Termin finden“: hero in view → focus; scrolled → booking bar", async ({ page }, ti) => {
  test.skip(ti.project.name !== "desktop", "the header CTA exists from 1024 px");
  await openLanding(page);
  const headerCta = page.locator("header").getByRole("link", { name: "Termin finden" });
  await headerCta.click();
  await expect(plzIn(hero(page))).toBeFocused();
  await expect(page.getByRole("dialog", { name: "Termin finden" })).toBeHidden();

  await scrollToId(page, "fragen");
  await headerCta.click();
  const bar = page.getByRole("dialog", { name: "Termin finden" });
  await expect(bar).toBeVisible();
  await expect(plzIn(bar)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(bar).toBeHidden();
  await expect(headerCta).toBeFocused();
});

test("T14 every in-page anchor resolves to exactly one target", async ({ page }) => {
  await openLanding(page);
  const result = await page.evaluate(() => {
    const ids = [...new Set([...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute("href")!.slice(1)).filter(Boolean))];
    return ids.map((id) => ({ id, n: document.querySelectorAll(`[id="${CSS.escape(decodeURIComponent(id))}"]`).length }));
  });
  for (const r of result) expect(r.n, `#${r.id}`).toBe(1);
  expect(await page.locator('[id="termin"]').count()).toBe(1);
  for (const id of ["bei-dir", "idee", "behandlungen", "so-funktionierts", "dein-ort", "profis", "deine-buchung", "fuer-profis", "fragen", "soma"]) {
    await expect(page.locator(`section#${id}`), id).toHaveCount(1);
  }
});

// ---------------------------------------------------------------------------------------------------------------------
// T15–T19: SEO and data truth
// ---------------------------------------------------------------------------------------------------------------------
test("T15 the FAQPage JSON-LD equals the visible FAQ", async ({ page }) => {
  await openLanding(page);
  const faqs = (await jsonLdNodes(page)).filter((n) => n["@type"] === "FAQPage");
  expect(faqs, "exactly one FAQPage").toHaveLength(1);
  const ld = (faqs[0].mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>).map((q) => ({ q: q.name, a: q.acceptedAnswer.text }));
  const visible = await page.locator("#fragen details").evaluateAll((ds) =>
    ds.map((d) => {
      const s = d.querySelector("summary")!;
      const norm = (t: string | null | undefined) => (t ?? "").replace(/\s+/g, " ").trim();
      const q = norm(s.textContent);
      const a = norm(d.textContent).slice(q.length).trim();
      return { q, a, shown: getComputedStyle(d).display !== "none" };
    }),
  );
  expect(visible.length).toBe(ld.length);
  visible.forEach((v, i) => {
    expect(v.shown, `question ${i + 1} is not hidden at this width`).toBe(true);
    expect(v.q).toBe(ld[i].q.replace(/\s+/g, " ").trim());
    expect(v.a).toBe(ld[i].a.replace(/\s+/g, " ").trim());
  });
});

test("T16 metadata: title, one h1, canonical, Open Graph, Twitter, bound description", async ({ page, request }) => {
  await openLanding(page);
  await expect(page).toHaveTitle(TITLE);
  await expect(page.locator("h1")).toHaveCount(1);
  const meta = (sel: string) => page.locator(sel).first().getAttribute("content");
  expect(new URL((await page.locator('link[rel="canonical"]').getAttribute("href"))!).pathname).toBe("/");
  const ogImage = (await meta('meta[property="og:image"]'))!;
  expect(ogImage).toMatch(/^https?:\/\//);
  expect(await meta('meta[property="og:image:width"]')).toBe("1200");
  expect(await meta('meta[property="og:image:height"]')).toBe("630");
  expect(await meta('meta[property="og:url"]')).toBeTruthy();
  expect(await meta('meta[property="og:title"]')).toBe("SOMA · Your body. Your place.");
  expect(await meta('meta[name="twitter:card"]')).toBe("summary_large_image");
  expect((await request.get(new URL(ogImage).pathname)).status()).toBe(200);

  const description = (await meta('meta[name="description"]'))!;
  expect(description).toContain("Endpreis inkl. Anfahrt");
  const policy = (await (await request.get("/stornierung")).text()).match(/Bis (\d+)\s*Stunden vor dem Termin/);
  const bound = description.match(/stornierbar bis (\d+)\s*Std\./);
  if (bound) expect(bound[1]).toBe(policy?.[1]);
  else expect(policy, "no free window on /stornierung either").toBeNull();
});

test("T17 indexability follows DEMO_MODE", async ({ page, request }) => {
  const demo = await demoMode(request);
  await openLanding(page);
  const robots = await page.locator('meta[name="robots"]').first().getAttribute("content").catch(() => null);
  const robotsTxt = await (await request.get("/robots.txt")).text();
  if (demo) {
    expect(robots).toBe("noindex, nofollow");
    expect(robotsTxt).toMatch(/Disallow: \/\s*$/m);
  } else {
    expect(robots ?? "").not.toContain("noindex");
    expect(await (await request.get("/sitemap.xml")).text()).toMatch(/<loc>[^<]*\/<\/loc>/);
  }
});

test("T18 structured data hygiene", async ({ page }) => {
  await openLanding(page);
  const nodes = await jsonLdNodes(page);
  const types = nodes.map((n) => n["@type"]);
  for (const t of ["Organization", "WebSite", "WebPage"]) expect(types).toContain(t);
  expect(JSON.stringify(nodes)).not.toContain("SearchAction");
  const org = nodes.find((n) => n["@type"] === "Organization")!;
  expect(org).not.toHaveProperty("aggregateRating");
  expect(org.slogan).toBe("Your body. Your place.");
  const cityLinks = (await page.locator('footer a[href^="/staedte/"]').allTextContents()).map((t) => t.trim());
  for (const c of (org.areaServed as Array<{ name: string }> | undefined) ?? []) expect(cityLinks).toContain(c.name);
});

test("T19 tile prices equal the real floors on /behandlungen", async ({ page }) => {
  await page.goto("/behandlungen");
  const floors = await page.locator("section[id]").evaluateAll((ss) =>
    Object.fromEntries(ss.map((s) => [s.id, (s.querySelector(".type-overline")?.textContent ?? "").match(/ab\s(\d+(?:,\d{2})?)\s€/)?.[1] ?? null])),
  );
  await openLanding(page);
  const tiles = await page.locator('#behandlungen a[href^="/behandlungen/"]').evaluateAll((as) =>
    as.map((a) => ({ slug: a.getAttribute("href")!.split("/")[2], price: (a.textContent ?? "").match(/ab\s(\d+(?:,\d{2})?)\s€/)?.[1] ?? null })),
  );
  expect(tiles.length).toBeGreaterThan(0);
  for (const t of tiles) {
    if (t.price) expect(t.price, t.slug).toBe(floors[t.slug]);
  }
});

// ---------------------------------------------------------------------------------------------------------------------
// T20–T22
// ---------------------------------------------------------------------------------------------------------------------
test("T20 privacy: same-origin requests only; no storage beyond the remembered PLZ", async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).host;
  const foreign: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (/^https?:$/.test(u.protocol) && u.host !== origin) foreign.push(r.url());
  });
  await openLanding(page);
  await enterPlz(hero(page), "10115", "Berlin");
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 900) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(120);
  }
  expect(foreign).toEqual([]);
  const keys = await page.evaluate(() => Object.keys(window.localStorage));
  expect(keys.filter((k) => k !== "soma:last-plz")).toEqual([]);
});

test("T21 deep links prefill the hero entry", async ({ page }) => {
  await page.goto(`/?plz=10115&leistung=entspannungsmassage&datum=${berlinDate(2)}&zeit=morgens`, { waitUntil: "networkidle" });
  const entry = hero(page);
  await expect(plzIn(entry)).toHaveValue("10115");
  await expect(entry.getByRole("button", { name: /^Was\?/ })).toContainText("Entspannungsmassage");
  await expect(entry.getByRole("button", { name: /^Wann\?/ })).toContainText("Morgens");
  await submitIn(entry).click();
  await page.waitForURL(/\/suche\?/);
  expect(params(page)).toEqual({ plz: "10115", kategorie: "massage", leistung: "entspannungsmassage", datum: berlinDate(2), zeit: "morgens" });
});

test("T22 reduced motion: booking works and nothing loops", async ({ page }, ti) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLanding(page);
  await enterPlz(hero(page), "20095", "Hamburg");
  if (ti.project.name === "mobile" && (await dockState(page)) !== null) {
    await scrollToId(page, "behandlungen");
    await page.locator("body").focus();
    await expect.poll(() => dockState(page)).toBe("shown");
  }
  const loops = await page.evaluate(() =>
    document.getAnimations().filter((a) => a.playState === "running" && (a.effect?.getTiming().iterations ?? 1) === Infinity).length,
  );
  expect(loops).toBe(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await plzIn(hero(page)).press("Enter");
  await page.waitForURL(/\/suche\?plz=20095/);
});
