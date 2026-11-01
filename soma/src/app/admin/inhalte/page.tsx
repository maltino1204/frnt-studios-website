import type { Metadata } from "next";
import Link from "next/link";
import { ContentEditor } from "@/components/admin/content-editor";
import { formatDateTime } from "@/components/admin/format";
import { AdminPageHeader, Card } from "@/components/admin/page";
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
        <EmptyState seed="inhalte-leer" title="Keine Inhaltsblöcke.">Die Seed-Daten legen die Standardblöcke an.</EmptyState>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
          <nav aria-label="Inhaltsblöcke" className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-6 lg:gap-5">
            {groups.map((g) => (
              <div key={g.label} className="flex flex-col gap-2">
                <p className="px-1 type-overline text-ink-muted">{g.label}</p>
                <Card as="ul" className="flex gap-0.5 p-1.5 max-lg:overflow-x-auto max-lg:scrollbar-none lg:flex-col">
                  {g.items.map((b) => {
                    const active = selected?.key === b.key;
                    return (
                      <li key={b.key} className="max-lg:shrink-0">
                        <Link
                          href={hrefWith(routes.admin.content(), {}, { block: b.key })}
                          aria-current={active ? "page" : undefined}
                          scroll={false}
                          className={cn(
                            "relative flex flex-col gap-0.5 rounded-tile px-3 py-2.5 transition-[background-color,box-shadow] duration-fast focus-ring",
                            active ? "bg-surface-tint shadow-[inset_0_0_0_1px_var(--color-line-mid)]" : "hover:bg-surface-sunken/70",
                          )}
                        >
                          <span className="flex items-center justify-between gap-2 type-body-s font-[520] whitespace-nowrap">
                            {name(b.key)}
                            {b.key === "announcement" ? <Status tone={announcementActive ? "success" : "neutral"} className="font-normal">{announcementActive ? "an" : "aus"}</Status> : null}
                          </span>
                          <span className="type-caption text-ink-muted num max-lg:hidden">geändert {formatDateTime(b.updatedAt)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </Card>
              </div>
            ))}
          </nav>
          {selected ? (
            <Card as="section" aria-labelledby="block-title" className="flex flex-col gap-4 p-4 md:p-6">
              <div className="flex flex-col gap-0.5">
                <h2 id="block-title" className="type-heading-m">
                  {name(selected.key)}
                </h2>
                <p className="type-caption text-ink-muted num">Zuletzt geändert {formatDateTime(selected.updatedAt)}</p>
              </div>
              <ContentEditor key={`${selected.key}-${selected.updatedAt}`} blockKey={selected.key} value={selected.value} previewHref={preview(selected.key)} />
            </Card>
          ) : null}
        </div>
      )}
    </>
  );
}
