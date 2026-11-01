import { titleId } from "./chapters";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * An explicit chapter jump (index, overlay, chapter foot, header links; spec § 5.1): smooth scroll unless reduced
 * motion, push `#id` (passive scrolling never rewrites the hash), and focus the chapter's heading, not the section.
 */
export function jumpToChapter(id: string): boolean {
  const section = document.getElementById(id);
  if (!section) return false;
  section.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  if (location.hash !== `#${id}`) history.pushState(history.state, "", `#${id}`);
  const heading = document.getElementById(titleId(id));
  (heading ?? section).focus({ preventScroll: true });
  return true;
}
