import { cn } from "@/lib/cn";
import { CHAPTERS } from "./chapters";

/**
 * The seven chapter labels „NN Name“. CSS shows only the one matching `html[data-chapter-active]` (01 until the motion
 * layer has written one), the others are display:none, so the accessible name is always „Kapitel 02 Behandlungen“
 * (label in name, WCAG 2.5.3) and no React state is needed (spec § 5.2).
 */
export function ChapterLabels({ className }: { className?: string }) {
  return (
    <>
      {CHAPTERS.map((c) => (
        <span key={c.nn} data-chapter-label={c.nn} className={cn("lp-chapter-label truncate", className)}>
          <span className="num">{c.nn}</span> {c.name}
        </span>
      ))}
    </>
  );
}
