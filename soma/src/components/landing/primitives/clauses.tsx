import { Fragment, type ComponentProps, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A headline as server-rendered clauses (spec § 8.3 "clause arrival"): each sentence or line is its own block span
 * with `data-reveal-order`, so the motion layer can let them arrive one by one. Roman only: the landing has no <em>
 * (D10). A plain space between the spans keeps the accessible text intact („Drei Schritte. Kein Weg.“).
 */
export function Clauses<T extends ElementType = "span">({
  as,
  parts,
  inline,
  className,
  partClassName,
  ...props
}: {
  as?: T;
  parts: ReactNode[];
  /** inline-block parts that may share a line (default: one block per part) */
  inline?: boolean;
  className?: string;
  partClassName?: string;
} & Omit<ComponentProps<T>, "as" | "className" | "children">) {
  const Tag = (as ?? "span") as ElementType;
  return (
    <Tag data-reveal="clause" className={className} {...props}>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 ? " " : null}
          <span data-reveal-order={i} className={cn(inline ? "inline-block" : "block", partClassName)}>
            {p}
          </span>
        </Fragment>
      ))}
    </Tag>
  );
}
