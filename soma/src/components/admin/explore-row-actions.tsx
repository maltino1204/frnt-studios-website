"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { setExploreCollectionPublishedAction } from "@/server/actions/explore";
import { useMutation } from "./use-mutation";

/** Row actions on /admin/entdecken: preview and switch on/off (audited `explore.publish` / `explore.unpublish`). */
export function ExploreRowActions({ id, title, published, previewHref }: { id: string; title: string; published: boolean; previewHref: string }) {
  const m = useMutation(setExploreCollectionPublishedAction, { success: published ? `„${title}“ ist nicht mehr aktiv.` : `„${title}“ ist aktiv.` });
  return (
    <>
      <Link href={previewHref} target="_blank" className={buttonClasses({ variant: "ghost", size: "s" })} aria-label={`Vorschau: ${title}`}>
        <Icon icon={Eye} size={16} />
        Vorschau
      </Link>
      <Button size="s" variant="secondary" loading={m.pending} onClick={() => m.run({ id, published: !published })} aria-label={`${title} ${published ? "deaktivieren" : "aktivieren"}`}>
        {published ? "Deaktivieren" : "Aktivieren"}
      </Button>
      {m.error ? <span role="alert" className="max-w-48 truncate type-caption text-danger" title={m.error}>{m.error}</span> : null}
    </>
  );
}
