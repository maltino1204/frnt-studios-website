import type { Metadata } from "next";
import Link from "next/link";
import { ContentEditor } from "@/components/admin/content-editor";
import { formatDateTime } from "@/components/admin/format";
import { AdminPageHeader } from "@/components/admin/page";
import { hrefWith } from "@/components/admin/table";
import { EmptyState, Status } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { listContentBlocks } from "@/server/services/admin";
import { listCities } from "@/server/services/catalog";

export const metadata: Metadata = { title: "Inhalte" };

const NAMES: Record<string, string> = {
  "home.hero": "Startseite · Hero",
  "home.how_it_works": "Startseite · So funktioniert’s",
  "home.faq": "Startseite · Häufige Fragen",
  announcement: "Hinweisband",
};

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ block?: string }> }) {
  const session = await requireRole("admin", routes.admin.content());
  const sp = await searchParams;
  const [blocks, cities] = await Promise.all([listContentBlocks(session), listCities()]);
  const name = (key: string) => {
    if (NAMES[key]) return NAMES[key];
    const m = key.match(/^city\.([a-z-]+)\.intro$/);
    if (m) return `Stadtseite · ${cities.find((c) => c.slug === m[1])?.name ?? m[1]}`;
    return key;
  };
  const preview = (key: string): string | null => {
    if (key.startsWith("home.") || key === "announcement") return routes.home();
    const m = key.match(/^city\.([a-z-]+)\.intro$/);
    return m ? routes.city(m[1]) : null;
  };
  const selected = blocks.find((b) => b.key === sp.block) ?? blocks[0] ?? null;
  const groups = [
    { label: "Startseite & global", items: blocks.filter((b) => !b.key.startsWith("city.")) },
    { label: "Städte", items: blocks.filter((b) => b.key.startsWith("city.")) },
  ].filter((g) => g.items.length);
  const announcementActive = (() => {
    const a = blocks.find((b) => b.key === "announcement")?.value as { active?: boolean } | undefined;
    return !!a?.active;
  })();

  return (
    <>
      <AdminPageHeader group="System" title="Inhalte" description="Texte der Website ohne Deployment pflegen. Änderungen sind nach dem Speichern sofort live und werden protokolliert." />
      {blocks.length === 0 ? (
        <EmptyState title="Keine Inhaltsblöcke.">Die Seed-Daten legen die Standardblöcke an.</EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <nav aria-label="Inhaltsblöcke" className="flex flex-col gap-5 self-start">
            {groups.map((g) => (
              <div key={g.label} className="flex flex-col gap-1.5">
                <p className="type-overline text-ink-muted">{g.label}</p>
                <ul className="flex flex-col border border-line bg-surface-raised">
                  {g.items.map((b) => {
                    const active = selected?.key === b.key;
                    return (
                      <li key={b.key} className="border-b border-line last:border-b-0">
                        <Link
                          href={hrefWith(routes.admin.content(), {}, { block: b.key })}
                          aria-current={active ? "page" : undefined}
                          scroll={false}
                          className={cn(
                            "relative flex flex-col gap-0.5 px-3 py-2.5 transition-colors",
                            active ? "bg-accent-soft before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-accent" : "hover:bg-surface-sunken",
                          )}
                        >
                          <span className="flex items-center justify-between gap-2 type-body-s font-[520]">
                            {name(b.key)}
                            {b.key === "announcement" ? <Status tone={announcementActive ? "success" : "neutral"} className="font-normal">{announcementActive ? "an" : "aus"}</Status> : null}
                          </span>
                          <span className="type-caption text-ink-muted num">geändert {formatDateTime(b.updatedAt)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          {selected ? (
            <section aria-labelledby="block-title" className="flex min-w-0 flex-col gap-4 border border-line bg-surface-raised p-4 md:p-6">
              <h2 id="block-title" className="type-heading-m">
                {name(selected.key)}
              </h2>
              <ContentEditor key={`${selected.key}-${selected.updatedAt}`} blockKey={selected.key} value={selected.value} previewHref={preview(selected.key)} />
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
