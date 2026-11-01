import "server-only";

import { getContentBlock } from "@/server/services/catalog";
import type { FaqItem } from "./discovery-copy";

/**
 * Typed readers for admin-editable content blocks (`content_blocks`). Every
 * reader validates the JSON shape and falls back to the designed default copy,
 * so an edited or missing block can never break a page.
 */

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

export type HeroCopy = { overline: string | null; title: string; lead: string };
export type Step = { title: string; body: string };

// Defaults mirror the seeded blocks (brand/COPY_DECK_LANDING.md): the hero uses the German signature line.
const DEFAULT_HERO: HeroCopy = {
  overline: "Zu Hause · Hotel · Büro",
  title: "Du bleibst. Dein Profi kommt.",
  lead: "Geprüfte Profis für Massage, Nägel, Kosmetik, Haare und Make-up kommen zu dir – nach Hause, ins Hotel oder ins Büro.",
};

const DEFAULT_STEPS: Step[] = [
  { title: "Entdecken", body: "Finde deine Behandlung. PLZ, Behandlung, Zeitraum: Du siehst nur echte freie Termine – mit Endpreis inklusive Anfahrt." },
  { title: "Buchen", body: "Wähl Ort und Uhrzeit – Zuhause, Hotel oder Büro. Bezahlt wird online, belastet erst nach dem Termin." },
  { title: "Bleiben", body: "Dein Profi kommt zu dir. Mit deinem vierstelligen Start-Code beginnt der Termin." },
];

async function block(key: string): Promise<Record<string, unknown> | null> {
  try {
    const b = await getContentBlock(key);
    return b && typeof b.value === "object" && b.value !== null ? (b.value as Record<string, unknown>) : null;
  } catch (e) {
    console.error(`[content] ${key} unavailable`, e);
    return null;
  }
}

export async function getHeroCopy(): Promise<HeroCopy> {
  const v = await block("home.hero");
  if (!v) return DEFAULT_HERO;
  const eyebrow = str(v.eyebrow);
  return {
    // Overlines hold at most three words (design-guideline §5); longer eyebrows fall back.
    overline: eyebrow && eyebrow.split(/\s+/).length <= 3 ? eyebrow : DEFAULT_HERO.overline,
    title: str(v.title) ?? DEFAULT_HERO.title,
    lead: str(v.subtitle) ?? DEFAULT_HERO.lead,
  };
}

export async function getHowItWorks(): Promise<Step[]> {
  const v = await block("home.how_it_works");
  const steps = Array.isArray(v?.steps)
    ? (v.steps as unknown[])
        .map((s) => (s && typeof s === "object" ? { title: str((s as Step).title), body: str((s as Step).body) } : null))
        .filter((s): s is Step => !!s?.title && !!s?.body)
    : [];
  return steps.length >= 2 ? steps.slice(0, 3) : DEFAULT_STEPS;
}

export async function getHomeFaq(): Promise<FaqItem[]> {
  const v = await block("home.faq");
  const items = Array.isArray(v?.items)
    ? (v.items as unknown[])
        .map((i) => (i && typeof i === "object" ? { q: str((i as FaqItem).q), a: str((i as FaqItem).a) } : null))
        .filter((i): i is FaqItem => !!i?.q && !!i?.a)
    : [];
  return items;
}

export async function getCityIntro(citySlug: string): Promise<{ title: string | null; body: string | null }> {
  const v = await block(`city.${citySlug}.intro`);
  return { title: str(v?.title), body: str(v?.body) };
}
