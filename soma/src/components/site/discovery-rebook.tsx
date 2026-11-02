"use client";

import { useEffect, useState, type ComponentType } from "react";
import { getRebookSuggestionAction } from "@/server/actions/site-ext";
import type { RebookSuggestionDTO } from "@/server/services/site-ext";

type Row = ComponentType<{ s: RebookSuggestionDTO }>;
let rowModule: Promise<Row> | null = null;
/** The row (avatar, AI label, links) is its own chunk: guests and first-time visitors, who never see it, never load it. */
const loadRow = () => (rowModule ??= import("./discovery-rebook-row").then((m) => m.RebookSuggestionRow));

/**
 * "Erneut buchen" row above the booking entry for returning customers
 * (design-guideline §8 "Returning users"). Fetched after hydration so the
 * page itself stays static; renders nothing for guests or without history.
 * The row's code loads only when there is a suggestion (audit-2 RT-5: no
 * avatar, `next/image` or image registry in the landing's first load).
 */
export function RebookRow() {
  const [shown, setShown] = useState<{ s: RebookSuggestionDTO; Row: Row } | null>(null);
  useEffect(() => {
    let alive = true;
    getRebookSuggestionAction()
      .then(async (res) => {
        if (!alive || !res.ok || !res.data) return;
        const Row = await loadRow();
        if (alive) setShown({ s: res.data, Row });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  if (!shown) return null;
  const { Row, s } = shown;
  return <Row s={s} />;
}
