"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { CalendarRange, CornerDownLeft, Search, UserCheck, Users, type LucideIcon } from "lucide-react";
import { Kbd } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { useDialogMotion } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import type { PaletteHit, PaletteResults } from "@/app/admin/suche/route";

type NavGroup = { label: string; items: Array<{ href: string; label: string; icon: LucideIcon }> };
type Option = { id: string; href: string; title: string; sub?: string; icon: LucideIcon; group: string; reference?: string };

const OPEN_EVENT = "soma:admin-palette";
const norm = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
const HIT_ICON: Record<PaletteHit["kind"], LucideIcon> = { booking: CalendarRange, provider: UserCheck, user: Users };
const HIT_GROUP: Record<PaletteHit["kind"], string> = { booking: "Buchungen", provider: "Profis", user: "Nutzer" };

/** Opens the palette from anywhere (trigger buttons). */
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/**
 * Trigger for the palette: a search-field-shaped button in the sidebar (`variant="field"`),
 * or a 44px icon button in the mobile top bar (`variant="icon"`).
 */
export function CommandPaletteTrigger({ variant = "field", className }: { variant?: "field" | "icon" | "rail"; className?: string }) {
  const [mod, setMod] = useState("Strg");
  useEffect(() => setMod(isMac() ? "⌘" : "Strg"), []);
  if (variant === "icon" || variant === "rail") {
    return (
      <button
        type="button"
        onClick={openCommandPalette}
        aria-label="Suchen und springen"
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+K Control+K"
        title={variant === "rail" ? `Suchen (${mod} K)` : undefined}
        className={cn(
          "inline-flex items-center justify-center pressable focus-ring",
          variant === "rail" ? "size-9 rounded-control text-ink-muted hover:bg-ink/[0.05] hover:text-ink" : "size-touch rounded-full text-ink hover:bg-ink/5",
          className,
        )}
      >
        <Icon icon={Search} size={variant === "rail" ? 18 : 20} />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      aria-haspopup="dialog"
      aria-keyshortcuts="Meta+K Control+K"
      className={cn(
        "group/cmd flex h-9 w-full items-center gap-2 rounded-control bg-surface-raised px-2.5 type-body-s text-ink-muted shadow-[0_0_0_1px_var(--color-line-mid),0_1px_2px_rgb(37_33_31/0.04)] transition-[box-shadow,color] duration-fast pressable focus-ring hover:text-ink hover:shadow-[0_0_0_1px_var(--color-line-strong),0_2px_6px_-2px_rgb(37_33_31/0.12)]",
        className,
      )}
    >
      <Icon icon={Search} size={16} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left">Suchen …</span>
      <span aria-hidden className="flex shrink-0 items-center gap-0.5">
        <Kbd>{mod}</Kbd>
        <Kbd>K</Kbd>
      </span>
    </button>
  );
}

/**
 * ⌘K / Strg+K command palette for /admin (design-guideline v2 §8.2, brief §11): jump to any
 * admin page, and quick-search bookings (reference, names, service), providers and accounts.
 *
 * Built on a modal <dialog> (focus trap, Esc, focus restore come from the platform) with the
 * kit's dialog motion. The input is an ARIA 1.2 combobox controlling a listbox: ↑ ↓ move the
 * active option (aria-activedescendant), ↵ opens it, Esc closes. Search requests are debounced
 * (160 ms) and aborted when the query changes.
 */
export function CommandPalette({ groups }: { groups: NavGroup[] }) {
  const router = useRouter();
  const uid = useId().replace(/:/g, "");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState<PaletteResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDialogMotion(open, close);

  // Global shortcut and the trigger event.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      e.preventDefault();
      setOpen((o) => !o);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  // Fresh state on every open; focus the field.
  useEffect(() => {
    if (!open) return;
    setQ("");
    setActive(0);
    setRemote(null);
    setFailed(false);
    requestAnimationFrame(() => input.current?.focus());
  }, [open]);

  // Debounced remote search.
  const term = q.trim();
  useEffect(() => {
    if (!open || term.length < 2) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/admin/suche?q=${encodeURIComponent(term)}`, { signal: ctrl.signal, headers: { accept: "application/json" } });
        if (!res.ok) throw new Error(String(res.status));
        setRemote((await res.json()) as PaletteResults);
        setFailed(false);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setFailed(true);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 160);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [term, open]);

  const options = useMemo<Option[]>(() => {
    const n = norm(term);
    const pages: Option[] = groups.flatMap((g) =>
      g.items
        .filter((i) => !n || norm(i.label).includes(n) || norm(g.label).includes(n))
        .map((i) => ({ id: `p-${i.href}`, href: i.href, title: i.label, sub: g.label, icon: i.icon, group: "Seiten" })),
    );
    const hits: Option[] =
      remote && term.length >= 2 && remote.q === term
        ? [...remote.bookings, ...remote.providers, ...remote.users].map((h) => ({ id: `${h.kind}-${h.id}`, href: h.href, title: h.title, sub: h.sub, reference: h.reference, icon: HIT_ICON[h.kind], group: HIT_GROUP[h.kind] }))
        : [];
    return [...pages, ...hits];
  }, [groups, term, remote]);

  useEffect(() => setActive(0), [term]);
  useEffect(() => {
    if (active >= options.length) setActive(Math.max(0, options.length - 1));
  }, [options.length, active]);

  // Keep the active option in view.
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (o: Option | undefined) => {
    if (!o) return;
    setOpen(false);
    router.push(o.href);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (options.length ? (i + 1) % options.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (options.length ? (i - 1 + options.length) % options.length : 0));
    } else if (e.key === "Home" && e.ctrlKey) {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End" && e.ctrlKey) {
      e.preventDefault();
      setActive(Math.max(0, options.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(options[active]);
    }
  };

  const grouped = useMemo(() => {
    const out: Array<{ label: string; items: Array<Option & { index: number }> }> = [];
    options.forEach((o, index) => {
      const g = out.find((x) => x.label === o.group) ?? (out.push({ label: o.group, items: [] }), out[out.length - 1]);
      g.items.push({ ...o, index });
    });
    return out;
  }, [options]);

  const listId = `${uid}-list`;
  const optId = (i: number) => `${uid}-opt-${i}`;
  const status =
    term.length >= 2 && loading
      ? "Suche läuft …"
      : failed
        ? "Die Suche ist gerade nicht erreichbar."
        : options.length === 0
          ? `Keine Treffer für „${term}“.`
          : `${options.length} ${options.length === 1 ? "Treffer" : "Treffer"}`;

  return (
    <dialog
      ref={ref}
      aria-label="Suchen und springen"
      className="soma-modal mx-auto mt-[12vh] mb-auto w-[calc(100%-1.5rem)] max-w-xl overflow-hidden rounded-card bg-surface-raised p-0 text-ink shadow-overlay open:animate-dialog-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <span aria-hidden className="relative inline-flex size-5 shrink-0 items-center justify-center text-ink-muted">
          <span className={cn("absolute inset-0 flex items-center justify-center transition-[opacity,scale] duration-base ease-spring", loading ? "scale-50 opacity-0" : "scale-100 opacity-100")}>
            <Icon icon={Search} size={18} />
          </span>
          <span className={cn("absolute inset-0 flex items-center justify-center transition-[opacity,scale] duration-base ease-spring", loading ? "scale-100 opacity-100" : "scale-50 opacity-0")}>
            {loading ? <Spinner size={16} /> : null}
          </span>
        </span>
        <input
          ref={input}
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={options.length ? optId(active) : undefined}
          aria-describedby={`${uid}-status`}
          aria-label="Seite, Buchung, Profi oder Konto suchen"
          placeholder="Seite, Buchung, Profi oder Konto suchen …"
          autoComplete="off"
          spellCheck={false}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          className="h-14 min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-muted"
        />
        <button type="button" onClick={close} className="shrink-0 rounded-[6px] focus-ring" aria-label="Schließen">
          <Kbd>Esc</Kbd>
        </button>
      </div>

      <div ref={list} id={listId} role="listbox" aria-label="Ergebnisse" className="max-h-[min(60vh,26rem)] overflow-y-auto overscroll-contain p-1.5">
        {grouped.map((g) => (
          <div key={g.label} role="group" aria-labelledby={`${uid}-g-${g.label}`} className="pb-1">
            <p id={`${uid}-g-${g.label}`} className="px-2.5 pt-2 pb-1 type-eyebrow text-ink-muted">
              {g.label}
            </p>
            {g.items.map((o) => {
              const isActive = o.index === active;
              return (
                <div
                  key={o.id}
                  id={optId(o.index)}
                  role="option"
                  aria-selected={isActive}
                  data-index={o.index}
                  onPointerMove={() => setActive(o.index)}
                  onClick={() => go(o)}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-3 rounded-tile px-2.5 py-2 transition-[background-color] duration-instant",
                    isActive ? "bg-surface-tint shadow-[inset_0_0_0_1px_var(--color-line-mid)]" : "",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] transition-colors duration-fast",
                      isActive ? "bg-surface-raised text-ink shadow-raised" : "bg-surface-sunken text-ink-muted",
                    )}
                  >
                    <Icon icon={o.icon} size={16} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate type-body-s font-[520] text-ink">
                      {o.reference ? (
                        <>
                          <span className="code-ref">{o.reference}</span>
                          <span className="text-ink-muted"> · </span>
                        </>
                      ) : null}
                      {o.title}
                    </span>
                    {o.sub ? <span className="truncate type-caption text-ink-muted">{o.sub}</span> : null}
                  </span>
                  <Icon icon={CornerDownLeft} size={14} className={cn("shrink-0 text-ink-muted transition-opacity duration-fast", isActive ? "opacity-100" : "opacity-0")} />
                </div>
              );
            })}
          </div>
        ))}
        {options.length === 0 ? <p className="px-3 py-8 text-center type-body-s text-ink-muted">{loading ? "Suche läuft …" : failed ? "Die Suche ist gerade nicht erreichbar." : `Keine Treffer für „${term}“.`}</p> : null}
        {term.length === 1 ? <p className="px-3 pt-1 pb-2 type-caption text-ink-muted">Ab zwei Zeichen werden auch Buchungen, Profis und Konten durchsucht.</p> : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line bg-surface/60 px-4 py-2.5 type-caption text-ink-muted max-sm:hidden">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> auswählen
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> öffnen
          </span>
          <span className="flex items-center gap-1">
            <Kbd>Esc</Kbd> schließen
          </span>
        </span>
        <span aria-hidden className="num">
          {status}
        </span>
      </div>
      <p id={`${uid}-status`} aria-live="polite" className="sr-only">
        {status}
      </p>
    </dialog>
  );
}
