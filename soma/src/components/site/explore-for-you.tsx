"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { Container } from "@/components/ui/layout";
import { Icon } from "@/components/ui/icon";
import { routes } from "@/lib/routes";
import { getForYouAction } from "@/server/actions/explore";
import type { ForYouDTO } from "@/server/services/explore";
import { accentLinkClass } from "./discovery-styles";
import { setPersonalCity } from "./explore-personal";

type On = Extract<ForYouDTO, { state: "on" }>;
type View = ComponentType<{ data: On }>;
let viewModule: Promise<View> | null = null;
/** The rails (cards, one-tap rebook sheet) are their own chunk: visitors and opted-out customers never load them. */
const loadView = () => (viewModule ??= import("./explore-for-you-view").then((m) => m.ForYouView));

type State = { kind: "loading" } | { kind: "guest" } | { kind: "hidden" } | { kind: "on"; data: On; View: View };

/**
 * „Für dich“ on the static /entdecken page: fetched after hydration (the (site) layout never reads cookies).
 * Loading keeps its space with a skeleton in the final shape; guests (no session) get one quiet line; opted-out
 * customers and signed-in Profis or admins get nothing, and the server computed nothing for them.
 */
export function ForYouSlot() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    getForYouAction()
      .then(async (res) => {
        if (!alive) return;
        if (!res.ok) {
          setState({ kind: "hidden" });
          return;
        }
        const d = res.data;
        if (d.state !== "on") {
          setPersonalCity(null);
          // Only a visitor without a session is invited to log in; Profis, admins and opted-out customers see nothing.
          setState({ kind: d.state === "guest" ? "guest" : "hidden" });
          return;
        }
        setPersonalCity(d.place?.citySlug ?? null);
        const View = await loadView();
        if (alive) setState({ kind: "on", data: d, View });
      })
      .catch(() => {
        if (alive) setState({ kind: "hidden" });
      });
    return () => {
      alive = false;
    };
  }, []);

  if (state.kind === "hidden") return null;
  if (state.kind === "on") return <state.View data={state.data} />;
  if (state.kind === "guest") {
    return (
      <aside aria-label="Für dich" className="pb-(--space-section)">
        <Container>
          <p className="flex flex-col gap-1 border-y border-line py-4 type-body-s text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <span>Melde dich an, dann siehst du hier Vorschläge aus deinen Buchungen und Favoriten.</span>
            <Link href={routes.login(routes.explore())} className={`${accentLinkClass} -my-2 shrink-0`}>
              Anmelden
              <Icon icon={ArrowRight} size={16} />
            </Link>
          </p>
        </Container>
      </aside>
    );
  }
  return (
    <div role="status" aria-label="Für dich wird geladen" className="pb-(--space-section)">
      <Container>
        <div aria-hidden className="mb-6 flex flex-col gap-3 md:mb-8">
          <div className="h-3 w-16 rounded-full bg-surface-sunken" />
          <div className="h-6 w-56 rounded-full bg-surface-sunken" />
          <div className="h-3.5 w-72 max-w-full rounded-full bg-surface-sunken" />
        </div>
        <div aria-hidden className="-mx-(--space-gutter) flex gap-3 overflow-hidden px-(--space-gutter) md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:px-0 lg:grid-cols-3 lg:gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex h-56 w-[min(78vw,19rem)] shrink-0 flex-col gap-4 rounded-card bg-surface-raised p-4 shadow-raised md:w-auto">
              <div className="flex items-start gap-3.5">
                <div className="size-16 shrink-0 rounded-[50%] bg-surface-sunken" />
                <div className="flex flex-1 flex-col gap-2 pt-1">
                  <div className="h-4 w-3/5 rounded-full bg-surface-sunken" />
                  <div className="h-3 w-4/5 rounded-full bg-surface-sunken" />
                </div>
              </div>
              <div className="mt-auto h-9 rounded-full bg-surface-sunken" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
