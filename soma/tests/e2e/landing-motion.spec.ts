import { expect, test, type Page } from "@playwright/test";

/**
 * The landing's motion layer (docs/landing/LANDING_DESIGN_SPEC.md § 5, § 8, § 11.3; src/components/landing/motion).
 * Automation runs in the `none` tier by default (navigator.webdriver); `?motion=full|lite` exercises the moving tiers.
 * Run: `E2E_BASE_URL=http://localhost:3000 npx playwright test landing-motion`.
 */

const root = (page: Page, key: string) => page.evaluate((k) => document.documentElement.dataset[k] ?? null, key);
const dock = (page: Page) => page.locator('nav[aria-label="Schnellzugriff"]');

async function open(page: Page, query = "") {
  await page.goto(`/${query}`, { waitUntil: "networkidle" });
  await expect.poll(() => root(page, "dock")).not.toBeNull(); // the nav observer is running
}

/** Waits for the lazily imported runtime (full and lite tiers). */
async function runtime(page: Page) {
  await page.evaluate(() => window.scrollBy(0, 1));
  await expect.poll(() => page.evaluate(() => performance.getEntriesByName("lp-motion:init").length), { timeout: 10_000 }).toBe(1);
}

async function scrollToId(page: Page, id: string, block: ScrollLogicalPosition = "start") {
  await page.evaluate(([x, b]) => document.getElementById(x)?.scrollIntoView({ block: b as ScrollLogicalPosition, behavior: "instant" }), [id, block]);
}

/** Resolves once the page has stopped scrolling (scrollY unchanged for 400 ms): a jump has ended, corrections included. */
async function scrollSettled(page: Page) {
  await page.waitForFunction(
    () =>
      new Promise<boolean>((resolve) => {
        let y = window.scrollY;
        let still = 0;
        const t = window.setInterval(() => {
          if (Math.abs(window.scrollY - y) < 1) still++;
          else {
            still = 0;
            y = window.scrollY;
          }
          if (still >= 4) {
            window.clearInterval(t);
            resolve(true);
          }
        }, 100);
      }),
    undefined,
    { timeout: 10_000 },
  );
}

/**
 * Where a chapter jump ended (audit 2, N-1): the chapter's heading 0–320 px from the top and the chapter active. The
 * position is read after the scroll has settled, so a smooth scroll that passes the target on its way does not count.
 */
async function expectLanded(page: Page, id: string, nn: string) {
  await scrollSettled(page);
  const top = await page.evaluate((x) => Math.round(document.getElementById(`${x}-titel`)!.getBoundingClientRect().top), id);
  expect(top, `#${id}-titel top after the jump`).toBeGreaterThanOrEqual(0);
  expect(top, `#${id}-titel top after the jump`).toBeLessThanOrEqual(320);
  await expect.poll(() => root(page, "chapterActive")).toBe(nn);
}

const opacity = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)));

test("tiers: automation is none, ?motion= overrides it", async ({ page }, ti) => {
  await open(page);
  expect(await root(page, "motion")).toBe("none");
  await open(page, "?motion=lite");
  expect(await root(page, "motion")).toBe("lite");
  if (ti.project.name === "desktop") {
    await open(page, "?motion=full");
    expect(await root(page, "motion")).toBe("full");
  }
});

test("reduced motion shows the final states: nothing hidden, nothing pinned, the seal complete", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await page.waitForTimeout(2500); // past the idle import window: the runtime must not load in `none`
  expect(await root(page, "motion")).toBe("none");
  expect(await page.evaluate(() => performance.getEntriesByName("lp-motion:init").length)).toBe(0);
  await expect(page.locator("[data-reveal-state], [data-scene-ready], [data-scene-state]")).toHaveCount(0);

  await scrollToId(page, "soma", "center");
  for (const part of ["o-fill", "s-fill", "wordmark", "line"]) expect(await opacity(page, `[data-seal-part="${part}"]`)).toEqual([1]);
  expect(await opacity(page, '[data-seal-part="tagline"] [data-reveal-order]')).toEqual([1, 1]);
  for (const id of ["idee", "behandlungen", "so-funktionierts", "fuer-profis"]) {
    expect((await opacity(page, `#${id}-titel [data-reveal-order]`)).every((o) => o === 1), id).toBe(true);
  }
  const loops = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.getTiming().iterations === Infinity).length);
  expect(loops).toBe(0);
});

test("reveals never hide what is already in view, and arrive once below", async ({ page }) => {
  await open(page, "?motion=lite");
  await runtime(page);
  // nothing in the first viewport is pending (the hero is the LCP and never waits)
  const pendingInView = await page.evaluate(() =>
    [...document.querySelectorAll('[data-reveal-state="pending"]')].filter((el) => el.getClientRects().length && el.getBoundingClientRect().top < innerHeight).length,
  );
  expect(pendingInView).toBe(0);
  await expect(page.locator('#bei-dir [data-reveal-state]')).toHaveCount(0);
  // a headline below the fold arrives when it scrolls in, and ends fully visible
  await expect(page.locator("#idee-titel")).toHaveAttribute("data-reveal-state", "pending");
  await scrollToId(page, "idee-titel", "center");
  await expect(page.locator("#idee-titel")).toHaveAttribute("data-reveal-state", "in");
  await expect.poll(() => opacity(page, "#idee-titel [data-reveal-order]"), { timeout: 3000 }).toEqual([1, 1]);
});

test("active chapter, header theme and the soma:chapter event follow the reader", async ({ page }, ti) => {
  await open(page);
  expect(await root(page, "chapterActive")).toBe("01");
  await page.evaluate(() => {
    (window as unknown as { __chapters: string[] }).__chapters = [];
    window.addEventListener("soma:chapter", (e) => (window as unknown as { __chapters: string[] }).__chapters.push((e as CustomEvent<{ id: string }>).detail.id));
  });

  await scrollToId(page, "behandlungen");
  await expect.poll(() => root(page, "chapterActive")).toBe("03");
  const index = ti.project.name === "desktop" ? page.locator("header").getByRole("button", { name: /^Kapitel/ }) : dock(page).getByRole("button", { name: /^Kapitel/ });
  await expect(index).toHaveAccessibleName("Kapitel 03 Behandlungen");
  expect(await page.evaluate(() => (window as unknown as { __chapters: string[] }).__chapters)).toContain("behandlungen");
  expect(await root(page, "headerTheme")).toBe("light");

  await scrollToId(page, "dein-ort-titel");
  await expect.poll(() => root(page, "chapterActive")).toBe("05");
  await expect.poll(() => root(page, "headerTheme")).toBe("dark");
  // well inside 06 (right after a jump the header still covers the tail of 05, which is dark)
  await page.evaluate(() => window.scrollTo(0, document.getElementById("profis")!.getBoundingClientRect().top + scrollY + 300));
  await expect.poll(() => root(page, "headerTheme")).toBe("light");
});

test("dock rules (< 1024): a booking control is always in view; fields, dialogs and the sheet", async ({ page }, ti) => {
  test.skip(ti.project.name !== "mobile", "the dock exists below 1024 px only");
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  // at load the hero's booking card is still below the fold: the dock carries booking (audit 1, I-4)
  expect(await root(page, "dock")).toBe("shown");
  await expect(dock(page)).toBeVisible();
  // the hero entry's submit in view stands in for the dock
  await scrollToId(page, "termin", "center");
  await expect.poll(() => root(page, "dock")).toBe("hidden");
  await scrollToId(page, "behandlungen");
  await expect.poll(() => root(page, "dock")).toBe("shown");
  await expect(dock(page)).toBeVisible();

  // a focused text field takes the dock away (virtual keyboard); blurring brings it back
  await page.evaluate(() => document.querySelector<HTMLInputElement>('#termin input[name="plz"]')?.focus({ preventScroll: true }));
  await expect.poll(() => root(page, "dock")).toBe("hidden");
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await expect.poll(() => root(page, "dock")).toBe("shown");

  // the chapter overlay opened from the dock: focus moves in, Esc returns it to the dock button
  const chapters = dock(page).getByRole("button", { name: /^Kapitel/ });
  await chapters.click();
  const overlay = page.getByRole("dialog", { name: "Kapitel und Seiten" });
  await expect(overlay).toBeVisible();
  expect(await overlay.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(overlay).toBeHidden();
  await expect(chapters).toBeFocused();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  // the booking sheet replaces the dock through Conversion's html[data-booking-open]
  const book = dock(page).getByRole("link", { name: "Termin finden" });
  await book.click();
  const sheet = page.getByRole("dialog", { name: "Termin finden" });
  await expect(sheet).toBeVisible();
  await expect(dock(page)).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(book).toBeFocused(); // the dock is visible again in time for the focus to come back
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  // chapter 10's search CTA in view stands in for the dock; past it (the footer), the dock is back
  await page.evaluate(() => document.querySelector("#soma [data-dock-hide]")?.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect.poll(() => root(page, "dock")).toBe("hidden");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => root(page, "dock")).toBe("shown");
  // a jump from the very end straight to the top leaves nothing behind
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => root(page, "dock")).toBe("shown");
});

test("phones: a booking control is in view at every scroll position from load (390 × 844)", async ({ page }, ti) => {
  test.skip(ti.project.name !== "mobile", "the dock exists below 1024 px only");
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "?motion=lite");
  const { vh, height } = await page.evaluate(() => ({ vh: innerHeight, height: document.documentElement.scrollHeight }));
  const gaps: number[] = [];
  for (let y = 0; y <= height - vh; y += 100) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(120);
    const covered = await page.evaluate(() => {
      const visible = (el: Element | null) => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.height > 0 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== "hidden" && Number(cs.opacity) > 0.5;
      };
      if (document.documentElement.dataset.dock === "shown" && !document.documentElement.dataset.bookingOpen) return true;
      if (visible(document.querySelector('#termin button[type="submit"]'))) return true;
      return [...document.querySelectorAll("main a, main button")].some((a) => /Termine? finden/.test(a.textContent ?? "") && visible(a));
    });
    if (!covered) gaps.push(y);
  }
  expect(gaps, "scroll positions without any booking control in view").toEqual([]);
});

test("chapter overlay: focus moves in, the current chapter is marked, a jump focuses the heading", async ({ page }, ti) => {
  test.skip(ti.project.name !== "desktop", "the header chapter index exists from 1024 px");
  await open(page, "?motion=full");
  await scrollToId(page, "behandlungen");
  await expect.poll(() => root(page, "chapterActive")).toBe("03");
  // keyboard path: focusing the sticky header's index must not scroll the page (landing.css scroll-margin)
  const trigger = page.locator("header").getByRole("button", { name: /^Kapitel/ });
  const y = await page.evaluate(() => scrollY);
  await trigger.focus();
  expect(await page.evaluate(() => scrollY)).toBe(y);
  await page.keyboard.press("Enter");
  const overlay = page.getByRole("dialog", { name: "Kapitel und Seiten" });
  await expect(overlay).toBeVisible();
  expect(await overlay.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  await expect(overlay.locator('a[aria-current="location"]')).toHaveText(/03\s*Behandlungen/);
  await page.keyboard.press("Escape");
  await expect(overlay).toBeHidden();
  await expect(trigger).toBeFocused();

  await page.keyboard.press("Enter");
  await overlay.getByRole("link", { name: /Fragen/ }).click();
  await expect(overlay).toBeHidden();
  await expect(page.locator("#fragen-titel")).toBeFocused();
  // …and the jump lands there: 06–09 change height on the way (content-visibility), the scroll is re-targeted
  await expectLanded(page, "fragen", "09");
});

test("phones: chapter jumps land on their chapter (overlay, hero link; lite tier, 390 × 844)", async ({ page }, ti) => {
  test.skip(ti.project.name !== "mobile", "the dock's chapter overlay exists below 1024 px");
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  // a fresh page per jump: every chapter on the way is still laid out at its estimated height (audit 2, N-1)
  for (const [id, nn] of [
    ["profis", "06"],
    ["fragen", "09"],
  ] as const) {
    await open(page, "?motion=lite");
    await dock(page).getByRole("button", { name: /^Kapitel/ }).click();
    const overlay = page.getByRole("dialog", { name: "Kapitel und Seiten" });
    await expect(overlay).toBeVisible();
    await overlay.locator(`a[href="#${id}"]`).click();
    await expect(overlay).toBeHidden();
    await expect(page.locator(`#${id}-titel`)).toBeFocused();
    await expectLanded(page, id, nn);
  }
  await open(page, "?motion=lite");
  await page.locator('#bei-dir a[href="#so-funktionierts"]').click();
  await expectLanded(page, "so-funktionierts", "04");
});

test("full tier: the 05 stage CTA takes a real mouse click (audit 2, N-2)", async ({ page }, ti) => {
  test.skip(ti.project.name !== "desktop", "the pinned stage is a desktop layout");
  await open(page, "?motion=full");
  await runtime(page);
  const stage = page.locator('[data-scene="stage"]');
  await expect(stage).toHaveAttribute("data-scene-ready", "");
  await page.evaluate(() => {
    const s = document.querySelector<HTMLElement>('[data-scene="stage"]')!;
    const run = s.offsetHeight - s.querySelector<HTMLElement>("[data-stage]")!.offsetHeight;
    window.scrollTo(0, s.getBoundingClientRect().top + scrollY + run * (2.5 / 6));
  });
  await expect(stage).toHaveAttribute("data-step", "3");
  // Playwright clicks at the centre only once nothing else would receive the click there (the active item used to)
  await page.locator('[data-cta="ch05-stage-termin"]').click({ timeout: 5000 });
  const bar = page.getByRole("dialog", { name: "Termin finden" });
  await expect(bar).toBeVisible();
  await expect(bar.locator('input[name="plz"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(bar).toBeHidden();
});

test("full tier: pins upgrade only below the fold, steps follow the scroll, no layout shift", async ({ page }, ti) => {
  test.skip(ti.project.name !== "desktop", "pins are desktop layouts");
  // The test jumps by script (no user input) across chapters 06–09, which skip their layout until they are near the
  // viewport (content-visibility: auto, now also under automation): lay the whole page out, as automation always did
  // here, so the check stays about the pins and the seal.
  await page.addInitScript(() => document.addEventListener("DOMContentLoaded", () => document.documentElement.setAttribute("data-capture", "full")));
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
        if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  // a deep link into 04: that scene is already in view and keeps its lite layout; the scenes below still upgrade
  await open(page, "?motion=full#so-funktionierts");
  await runtime(page);
  await expect(page.locator('[data-scene="walkthrough"]')).not.toHaveAttribute("data-scene-ready", "");
  await expect(page.locator('[data-scene="stage"]')).toHaveAttribute("data-scene-ready", "");

  await open(page, "?motion=full&fresh=1");
  await runtime(page);
  for (const s of ["doorway", "walkthrough", "dusk", "stage", "dawn", "seal"]) await expect(page.locator(`[data-scene="${s}"]`)).toHaveAttribute("data-scene-ready", "");

  const walk = page.locator('[data-scene="walkthrough"]');
  for (const n of [1, 2, 3]) {
    await page.evaluate((k) => {
      const el = document.querySelector(`[data-step-trigger="${k}"]`)!;
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight / 2 + 40);
    }, n);
    await expect(walk).toHaveAttribute("data-step", String(n));
  }

  const stage = page.locator('[data-scene="stage"]');
  await expect(stage).toHaveAttribute("data-scene-state", "idle");
  for (const n of [1, 3, 6]) {
    await page.evaluate((k) => {
      const s = document.querySelector<HTMLElement>('[data-scene="stage"]')!;
      const run = s.offsetHeight - s.querySelector<HTMLElement>("[data-stage]")!.offsetHeight;
      window.scrollTo(0, s.getBoundingClientRect().top + scrollY + run * ((k - 0.5) / 6));
    }, n);
    await expect(stage).toHaveAttribute("data-step", String(n));
    await expect(stage).toHaveAttribute("data-scene-state", "active");
  }

  // the seal starts once the mask is square (40 % of the band in view): the band never sits empty (audit 1, I-9)
  await page.evaluate(() => {
    const band = document.getElementById("soma")!;
    window.scrollTo(0, band.getBoundingClientRect().top + scrollY - innerHeight + band.offsetHeight * 0.45);
  });
  await expect(page.locator('[data-scene="seal"]')).not.toHaveAttribute("data-scene-state", "idle");
  // it plays once and ends on the final frame
  await scrollToId(page, "soma");
  await expect(page.locator('[data-scene="seal"]')).toHaveAttribute("data-scene-state", "done", { timeout: 5000 });
  expect(await opacity(page, '[data-seal-part="wordmark"]')).toEqual([1]);
  expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThanOrEqual(0.05);
});
