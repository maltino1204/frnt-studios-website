import { Fragment, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

/**
 * The Ortszeile, *Ort · Stadtteil · Uhrzeit* (brand § 5.2): `type-place`, tabular figures, under its image and
 * aligned to its edge. Segments never break inside; a line may only wrap after a „ · “.
 */
export function Ortszeile({ text, className, ...props }: { text: string; className?: string } & Omit<ComponentProps<"p">, "children">) {
  const segments = text.split(/[\s\u00a0]·\s/);
  return (
    <p data-ortszeile="" className={cn("type-place text-ink-muted", className)} {...props}>
      {segments.map((s, i) => (
        <Fragment key={i}>
          {i > 0 ? " · " : null}
          <span className="whitespace-nowrap">{s}</span>
        </Fragment>
      ))}
    </p>
  );
}
