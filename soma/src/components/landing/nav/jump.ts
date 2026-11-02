import { scrollToTarget } from "@/lib/scroll-jump";
import { titleId } from "./chapters";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * An explicit chapter jump (index, overlay, chapter foot, header links; spec § 5.1): smooth scroll unless reduced
 * motion, push `#id` (passive scrolling never rewrites the hash), and focus the chapter's heading, not the section.
 * The scroll is re-targeted once it ends, because chapters skipped by `content-visibility` change height on the way
 * (audit 2, N-1; `lib/scroll-jump.ts`).
 */
export function jumpToChapter(id: string): boolean {
  const section = document.getElementById(id);
  if (!section) return false;
  scrollToTarget(section, { smooth: !reduced() });
  if (location.hash !== `#${id}`) history.pushState(history.state, "", `#${id}`);
  const heading = document.getElementById(titleId(id));
  (heading ?? section).focus({ preventScroll: true });
  return true;
}
