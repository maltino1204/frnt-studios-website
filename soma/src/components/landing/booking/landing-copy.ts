/**
 * Data-bound landing copy (Conversion & Integration; brand/COPY_DECK_LANDING.md § 0.3, § 01; INTEGRATION.md § 5).
 * Pure and isomorphic: no server imports, no React. One source for the hero lead, the hero trust row, the meta
 * description and `Organization.description`, so they can never disagree with each other or with the product.
 *
 * Rules: a category word appears only when at least one approved Profi offers that category; a policy number only
 * when the policy has it. Missing data drops the clause, never shows a placeholder.
 */
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import type { CancellationPolicyDTO } from "@/server/dto";
import { freeCancellationHours } from "@/components/site/discovery-copy";

const NBSP = " ";

/** deck § 0.3 */
export const LANDING_TITLE = `${BRAND_NAME} – Beauty & Wellness bei dir zu Hause, im Hotel und im Büro`;
export const LANDING_OG_TITLE = `${BRAND_NAME} · ${BRAND_TAGLINE}`;

/** The words of the deck's category list, in deck order, with the category slugs that make each one true. */
export const PROMISE_WORDS: ReadonlyArray<{ word: string; slugs: readonly string[] }> = [
  { word: "Massage", slugs: ["massage"] },
  { word: "Nägel", slugs: ["manikuere", "pedikuere"] },
  { word: "Kosmetik", slugs: ["kosmetik"] },
  { word: "Haare", slugs: ["haare-styling"] },
  { word: "Make-up", slugs: ["make-up"] },
];

/** Category slugs with at least one approved Profi (from `getPriceFloors()`; floors only cover active categories). */
export function liveCategorySlugs(floors: ReadonlyArray<{ categorySlug: string; providerCount: number }>): Set<string> {
  return new Set(floors.filter((f) => f.providerCount > 0).map((f) => f.categorySlug));
}

/** "A", "A und B", "A, B und C" */
export function joinGerman(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} und ${items[items.length - 1]}`;
}

export function promiseWords(live: ReadonlySet<string>): string[] {
  return PROMISE_WORDS.filter((w) => w.slugs.some((s) => live.has(s))).map((w) => w.word);
}

/**
 * Hero lead (deck § 01, with its fallback rule). v2 (client decision 2026-11-02, landing decluttered): one sentence; the
 * Endpreis is the trust row's directly under the entry, and „echte freie Termine“ is what the entry's submit finds.
 */
export function heroLead(live: ReadonlySet<string>): string {
  const words = promiseWords(live);
  if (!words.length) return "Geprüfte Profis kommen zu dir.";
  return `Geprüfte Profis für ${joinGerman(words)} kommen zu dir.`;
}

/** "24 Std." (NBSP), or null when the policy has no free cancellation window. */
export function freeCancellationShort(policy: CancellationPolicyDTO | null | undefined): string | null {
  const h = policy ? freeCancellationHours(policy) : null;
  return h != null && h > 0 ? `${h}${NBSP}Std.` : null;
}

/** Hero trust row (deck § 01). */
export function heroTrustItems(policy: CancellationPolicyDTO | null | undefined): string[] {
  const free = freeCancellationShort(policy);
  return ["Verifizierte Profis", "Endpreis inkl. Anfahrt", ...(free ? [`Kostenlos stornierbar bis ${free} vorher`] : [])];
}

/** Meta description (deck § 0.3), data-bound. */
export function landingDescription(live: ReadonlySet<string>, policy: CancellationPolicyDTO | null | undefined): string {
  const words = promiseWords(live);
  const who = words.length ? `Geprüfte Profis für ${joinGerman(words)} kommen zu dir.` : "Geprüfte Profis kommen zu dir.";
  const free = freeCancellationShort(policy);
  return `${who} Endpreis inkl. Anfahrt${free ? `, kostenlos stornierbar bis ${free} vorher` : ""}.`;
}
