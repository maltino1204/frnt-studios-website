/**
 * Explicit in-page jumps that land where they aim (landing audit 2, N-1 / RT-1).
 *
 * A smooth `scrollIntoView()` fixes its destination when it starts. Sections with `content-visibility: auto` are laid
 * out at their estimated `contain-intrinsic-size` until they come near the viewport, and the landing's full tier
 * changes the page height once its pins engage. Both happen while a long smooth scroll runs, so the target moves and
 * the scroll used to end hundreds of px (phones: up to ≈ 2,000 px) away from it. Re-issuing a smooth scroll mid-flight
 * restarts Chromium's animation from zero velocity (a visible stall), so the destination is checked once the scroll has
 * ended (`scrollend`; without it, the first quiet period) and corrected without smoothing, until the layout holds
 * (at most `MAX_CORRECTIONS` times). Native scrolling only (landing spec § 7: no smooth-scroll library).
 *
 * The visitor wins: a wheel, touch, pointer or key input during the jump cancels the correction.
 */

/** A target this far (px) from its aligned position counts as landed (the audit's tolerance). */
export const JUMP_TOLERANCE_PX = 8;
const MAX_CORRECTIONS = 4;
/** With `scrollend`: a safety net if it never fires (no scroll happened, or an engine bug). */
const QUIET_WITH_SCROLLEND_MS = 450;
/** Without `scrollend` (Safari ≤ 18): the scroll counts as ended after this long without a scroll event. */
const QUIET_MS = 160;
/** Before the first scroll event (a busy main thread can delay the animation's first frame). */
const FIRST_FRAME_MS = 700;
/** The watcher gives up after this long, whatever happens. */
const MAX_WATCH_MS = 6000;

const INPUTS = ["wheel", "touchstart", "pointerdown", "keydown"] as const;

let cancelActive: (() => void) | null = null;

const px = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

/** The viewport scrolls this element into view (not a dialog, a fixed layer or a nested scroll container). */
function scrollsWithViewport(el: HTMLElement): boolean {
  if (el.closest("dialog")) return false;
  for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
    const cs = getComputedStyle(p);
    if (cs.position === "fixed") return false;
    if (/(auto|scroll|overlay)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight) return false;
  }
  return true;
}

/**
 * How far (px) the element's top is from where `scrollIntoView({ block: "start" })` puts it (the root's
 * scroll-padding-top plus the element's scroll-margin-top); 0 when the page cannot scroll any further that way.
 */
export function jumpOffset(el: HTMLElement): number {
  const root = document.scrollingElement ?? document.documentElement;
  const aim = px(getComputedStyle(document.documentElement).scrollPaddingTop) + px(getComputedStyle(el).scrollMarginTop);
  const delta = el.getBoundingClientRect().top - aim;
  const y = root.scrollTop;
  if (delta > 0 && y >= root.scrollHeight - root.clientHeight - 1) return 0;
  if (delta < 0 && y <= 0) return 0;
  return delta;
}

/**
 * Scroll `el` to the top of the viewport (block start, its scroll margin respected), smoothly or at once, and keep
 * correcting until it is there (see the module comment). A new jump replaces a running one.
 */
export function scrollToTarget(el: HTMLElement, opts: { smooth: boolean }): void {
  cancelActive?.();
  el.scrollIntoView({ behavior: opts.smooth ? "smooth" : "instant", block: "start" });
  if (!scrollsWithViewport(el)) return;

  const hasScrollEnd = "onscrollend" in window;
  let timer = 0;
  let frame = 0;
  let corrections = 0;
  let done = false;
  const started = performance.now();

  const stop = () => {
    if (done) return;
    done = true;
    window.clearTimeout(timer);
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("scrollend", onEnd);
    for (const t of INPUTS) window.removeEventListener(t, stop, true);
    if (cancelActive === stop) cancelActive = null;
  };
  /** After a correction: check again once two frames have laid out what came into view. */
  const verify = () => {
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(check);
    });
  };
  const check = () => {
    if (done) return;
    if (!el.isConnected || performance.now() - started > MAX_WATCH_MS) return stop();
    if (Math.abs(jumpOffset(el)) <= JUMP_TOLERANCE_PX) return stop();
    if (corrections >= MAX_CORRECTIONS) return stop();
    corrections++;
    // From here on the watcher drives the checks itself (an instant scroll also fires scroll and scrollend).
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("scrollend", onEnd);
    window.clearTimeout(timer);
    el.scrollIntoView({ behavior: "instant", block: "start" });
    verify();
  };
  function onEnd() {
    window.clearTimeout(timer);
    check();
  }
  function onScroll() {
    window.clearTimeout(timer);
    timer = window.setTimeout(onEnd, hasScrollEnd ? QUIET_WITH_SCROLLEND_MS : QUIET_MS);
  }

  cancelActive = stop;
  for (const t of INPUTS) window.addEventListener(t, stop, { capture: true, passive: true });
  if (opts.smooth) {
    window.addEventListener("scroll", onScroll, { passive: true });
    if (hasScrollEnd) window.addEventListener("scrollend", onEnd);
    timer = window.setTimeout(onEnd, FIRST_FRAME_MS);
  } else {
    verify();
  }
}
