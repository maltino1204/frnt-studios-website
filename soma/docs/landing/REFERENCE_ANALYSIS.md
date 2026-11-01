# Reference analysis: theoneagency.de (Agent 1, Reference & Experience Researcher)

> Internal research for the SOMA landing workstream. Not shipped. Written 2026-11-01.
> **Source:** the client-approved capture in `research/reference/theoneagency/` (repository root, outside `soma/`).
> All file names below are relative to that folder, e.g. `desktop/scroll/scroll-12.jpg`.
> **Method:** I read every desktop and mobile scroll shot (60 + 60) as contact sheets and opened key frames at full resolution.
> I also extracted frames from both session videos with `ffmpeg` (1 fps overview; 3–5 fps for the load, reel and menu
> sequences), parsed both `page.html` DOMs (outline, inline styles, data attributes, ARIA) and all four `summary.json` files.
>
> **Evidence tags used throughout:**
> **[Obs]** seen in a screenshot or video frame · **[DOM]** read from the captured DOM or `summary.json` ·
> **[Inf]** inferred from the two together (stated with a confidence level). Nothing here is from memory of the site.

---

## 0. Executive summary

- The home page is one long narrative of **10 numbered chapters** (`[ 00 ]` … `[ 09 ]`). Each has an abstract one-word
  chapter name shown in a header HUD: "Idee", "Produkt", "Linie", "Form", "Drei", "Eins", "Struktur", "Netzwerk",
  "Komplexität", "Eins". **[DOM]** `nav.ticks` button labels.
- A **single fixed WebGL layer** (`canvas#gl`) runs behind all content. Its point cloud **re-forms into a new figure for
  every chapter**: chrome blob → six logo screens → line → ring → three spheres → merged blob → 3D lattice → node network
  → dense spiral. This morph *is* the transition between chapters. The page background stays white.
  **[Obs]** `desktop/scroll/scroll-00…59.jpg`.
- The persistent morph alternates with **pinned "takeover" scenes**: a card grows to full-bleed, holds, then shrinks back
  into the flow (showreel, IT consulting card, software carousel, calculator band). They give a white → dark → white rhythm,
  and the header inverts while a dark scene is on screen. **[Obs]**
- Navigation has two layers. A **narrative chapter index** (HUD, 10 progress ticks, "Kapitel" sheet; on mobile a bottom
  dock with a progress ring) sits next to a **utility menu** (7 content anchors, service pages, call/WhatsApp/e-mail).
  **A conversion CTA is visible at all times.** **[Obs][DOM]**
- **Mobile is deliberately reduced.** Three of the four pinned stages are switched off; one mobile-specific variant is
  kept; prototype scripts are not loaded; hint copy is rewritten for touch; parallax amplitude drops from up to 135 px to 4 px;
  a thumb-zone dock replaces the header pills. **[DOM][Obs]**
- **Technically lean:** one 30 KB `app.js` and one 16 KB `app.css`, no detected libraries, self-hosted variable fonts,
  AVIF/WebP `srcset`, lazy images, `preload="none"` video and a WebGL canvas rendered below device resolution. **[DOM]**

---

## 1. Information architecture and chapter-based storytelling

### 1.1 Chapter map (home page)

Section ids, classes and heights come from `desktop/summary.json` and `mobile/summary.json`. Headlines are paraphrased.

| # | `section#id` (`data-scene`) | HUD name | Purpose (paraphrased) | WebGL figure **[Obs]** | Embedded scene | Height desktop / mobile | Desktop shots | Mobile shots |
|---|---|---|---|---|---|---|---|---|
| 00 | `#top` (0), `ch ch-hero` | Idee | Statement headline, what the agency does, two CTAs, reassurance microcopy | Iridescent chrome blob in a dotted halo, plus a code-snippet trail on a 2nd canvas | Hero pinned ~1 viewport [Inf] | 1800 / 1079 | `00-initial.jpg`, `scroll-00…02` | `00-initial.jpg`, `scroll-00…02` |
| 01 | `#arbeiten` (1), `ch-long` | Produkt | Selected work: 14 project cards, client-logo wall, then showreel | Points re-form into six tilted dot-matrix "screens" showing client logos | Showreel card → full-bleed → card (`.reel-stage`) | 6298 / 3303 | `scroll-03…15` | `scroll-03…12` |
| 02 | `#richtung` (2), `ch-long` | Linie | How a project starts: steps 1–2, two fact cards, consulting offer | Points collapse into a wavy horizontal line | IT consulting card → full-bleed dark starfield → card (`.it-stage`) | 4021 / 2021 | `scroll-15…24` | `scroll-12…18` |
| 03 | `#form` (3) | Form | Branding and design services (2 cards) | Hand-drawn-looking ring outline | – | 1665 / 1020 | `scroll-25…28` | `scroll-18…21` |
| 04 | `#leistungen` (4) | Drei | All services grouped in 3 disciplines, a discipline picker | Three dotted spheres in the discipline colours, with HTML labels attached | Discipline filter (`.dcards` → `#svcs`) | 1665 / 1000 | `scroll-29…32` | `scroll-22…24` |
| 05 | `#eins` (5) | Eins | "Everything from one source" statement, blob-split switch | The spheres merge into one tri-lobed chrome blob | `role="switch"` "Blob teilen" | 1665 / 932 | `scroll-33…36` | `scroll-25…27` |
| 06 | `#software` (6), `ch-long` | Struktur | Software services, solutions carousel with live prototype, step 3, calculator CTA | 3D point lattice | Software stage scale 0.55 → 1 → back (`.sw-stage`), calculator band (`.kc-stage`) | 5906 / 5150 | `scroll-37…48` | `scroll-28…40` |
| 07 | `#ki` (7), `ch-long` | Netzwerk | AI automation: interactive workflow demo, 2 service cards, 2nd calculator CTA | Node-and-edge network; node labels mirror the demo's steps | Workflow stepper + log (`.app`), 2nd `.kc-stage` | 2994 / 3524 | `scroll-48…56` | `scroll-41…51` |
| 08 | `#stack` (8), `ch-long` | Komplexität | Technology grid with filter chips, step 4, FAQ, blog teasers | Dense multicoloured spiral ("6.000" points) | Count-up headline numeral, chip filter | 3521 / 3868 | `scroll-56…59` | `scroll-52…59` |
| 09 | `#kontakt` (9), `ch ch-end` | Eins | Closing statement, goal picker, big CTA, quick-contact cards, footer link columns | **not captured** | – | 2024 / 3047 | – | – |

The home page is **31,558 px** tall on desktop (≈35 viewports of 900 px) and **24,944 px** on mobile (≈37.6 viewports
of 664 px). **[DOM]** Standard chapters are 1665 px ≈ 1.85 desktop viewports. `ch-long` chapters are long because they
contain the pinned stages.

### 1.2 Storytelling devices
- **Numbered chapters, with abstract names that describe the visual figure, not the content.** The visual metaphor tells
  a story of its own: a dot becomes a product. This is backed by the 2nd-chapter showreel opening on a single point
  (`desktop/video` frames at 0:41–0:46; see 4.2). The abstract index ("Linie", "Form") runs alongside a pragmatic content
  menu ("Arbeiten", "Leistungen", "Kontakt"). **[DOM]** `#chapters` vs `#menu`.
- **Every chapter repeats the same anatomy** **[Obs]**:
  1. a small bracketed kicker with the chapter number and an SEO-style descriptor;
  2. a 2–3 line display headline;
  3. a one-sentence lead;
  4. content (cards, a demo or a scene);
  5. an **"Als Nächstes"** pill that names the next chapter (`a.nextch`, 9 instances; e.g. `scroll-16.jpg`, `scroll-27.jpg`).
- **A four-step process is threaded through the chapters** rather than shown in one place: "Schritt 1 von 4" and
  "2 von 4" in ch. 02 (`scroll-18/19`), "3 von 4" in ch. 06 (`scroll-45/46`), "4 von 4" in ch. 08 (`scroll-59`).
  **[Obs][DOM]** `ol.deck.steps`.
- **Conversion is woven in repeatedly and in context.** A calculator CTA appears after software (ch. 06) and after AI
  (ch. 07), each with pre-filtered chips that deep-link with a query parameter (`anfrage/?typ=website`,
  `?typ=ecommerce`…). The closing chapter has a goal picker. **[DOM]** `.tchips a.tchip`, `.goals`.

### 1.3 Pacing and rhythm (desktop)
The observed cycle is: **statement** (big headline on white, WebGL figure on the right) → **dense content** (cards in the
left column, `scroll-05…09`) → **immersive takeover** (pinned full-bleed scene, often dark: `scroll-11…14`, `21…22`,
`41…43`, `49`, `55`) → **breathing space** (white, figure morphing, almost empty viewport: `scroll-16/17`, `25/26`) →
**"Als Nächstes" hand-off**. The full-page capture shows how much empty canvas is left for the WebGL stage: the content
column occupies only the left ~45 % of the 1440 px width for most of the page (`desktop/03-fullpage.jpg`).

### 1.4 Mobile IA
Same ten chapters in the same order, in one column. The page is shorter in absolute pixels because the pinned stages are
disabled (section 6). The WebGL figure appears *above* or *behind* the chapter header instead of to the right
(`mobile/scroll/scroll-03.jpg`, `13`, `19`, `22`, `28`).

### 1.5 Inner pages (sampled)
- `/software/` and `/webdesign/` use a lighter template: `lp.js`/`lp.css`, `class="rvjs"` reveal-on-scroll, **no canvases**,
  a sticky header with in-page anchors and a soft colour orb at the top right
  (`desktop/inner-0/scroll-00.jpg`, `inner-2/scroll-00.jpg`). **[DOM][Obs]**
- `/anfrage/` is a **one-question-per-screen wizard**: "1 von 7" segmented progress bar, close button, large selectable
  option cards, a reassurance row and a sticky full-width "Weiter" button (`desktop/inner-1/scroll-00.jpg`). **[Obs]**
- So the immersive engine is reserved for the home page. Service and conversion pages are fast and conventional.

---

## 2. Navigation system

### 2.1 Desktop header (`header.bar`, fixed)
- **Composition** **[Obs]** `desktop/00-initial.jpg`: logo on the left; a centred **HUD** with chapter number and name
  plus a live "Punkte" counter (the current point count of the WebGL figure), above a row of **10 progress ticks**; on the
  right three pills: secondary link, solid primary CTA ("Projekt anfragen", `data-mag`), and "Kapitel"
  (`popovertarget="chapters"`).
- **The header never hides on scroll.** It is present in all 60 desktop shots, with no background panel but a soft white
  fade under it, so content dissolves as it passes beneath (`scroll-03.jpg`, `scroll-12.jpg`, `scroll-23.jpg`). **[Obs]**
- **It adapts its theme over dark scenes.** On the dark IT and software stages the logo text turns light and the primary
  pill inverts to white (`scroll-21.jpg`, `scroll-42.jpg`; header strips compared in a crop of `00-initial`,
  `scroll-04/16/21/30/42/52/59`). **[Obs]**
- **Progress ticks are a segmented bar:** past chapters mid-grey, current chapter dark (white on dark scenes), future
  chapters light grey. Each tick is a `<button data-go="N" aria-label="Kapitel N: …" aria-current>`, so it is also a
  direct chapter jump. **[DOM][Obs]**
- A burger (`button.burger`, `popovertarget="menu"`) exists but is **not visible at 1440 px**; the capture's click failed
  for that reason (`capture-log.txt`). On desktop the "Kapitel" pill is the overlay entry point. **[DOM]**

### 2.2 Overlays (Popover API, `<dialog>`)
- `#chapters` (`popover`): numbered list 00–09 with chapter names, plus quick actions (software link, call, WhatsApp, a
  copy-e-mail button with `data-copy` and a toast). **[DOM]** *Not captured open.*
- `#menu` (`popover`, class `sheet menu`): see 2.3. A first inline script adds `html.no-pop` when
  `HTMLElement.prototype.popover` is missing, i.e. a **progressive-enhancement fallback**. **[DOM]**
- `dialog#cmd`: a **command palette** (combobox + listbox, hint "arrow keys / Enter / Esc", a `/` key hint), opened from a
  footer "Befehle" button. **[DOM]** *Not captured open.*
- `dialog#case`: project detail with previous/next buttons, filled from the `<script type="application/json" id="cases">`
  data. **[DOM]**
- `dialog.sw-ov`: full-screen prototype view (opened by "Vollbild" on mobile, `mobile/scroll/scroll-34/35.jpg`). **[DOM][Obs]**

### 2.3 Mobile header, menu and dock
- **Header** **[Obs]** (`mobile/00-initial.jpg`, header crops): at the very top the logo is **centred**. After the first
  scroll it **moves to the left** (`scroll-00` vs `scroll-01`). A round burger sits on the right. Over dark scenes the
  header switches to its light-on-dark variant (`scroll-38/39`, `49/50`). The pink ring on the burger appears only after
  the menu was opened and closed (`02-menu-open.jpg` was taken before the scroll run). **[Inf, medium]** It is most likely
  the focus indicator, not a scroll effect.
- **Menu sheet** **[Obs]** `mobile/02-menu-open.jpg`; video frames at 0:07–0:11:
  - Full-screen sheet with a thin gradient rule at the very top and a soft colour orb behind the content.
  - The logo plus a "Schließen" pill replace the burger.
  - The claim is repeated, then 7 large numbered anchors (01–07), then "services and guides" link cards with arrows, then
    call/WhatsApp/e-mail pills and the address/legal links (DOM).
  - **Entrance:** the sheet arrives from above and the list items fade in one after another. In the 1.0 s frame
    "Arbeiten" is solid while "Showreel" and "Leistungen" are still faint. Items carry `style="--i:N"`, i.e. a CSS stagger
    index.
  - **Exit:** the sheet slides up and away while the page underneath is briefly dimmed (frames 3.2–3.4 s).
- **Bottom dock** (`nav.dock`, fixed) **[Obs]** `mobile/scroll/*`, dock crops:
  - A floating pill in the thumb zone. Its left half is a button with an **SVG progress ring**
    (`circle.ring-p pathLength="1"`, driven by `--p` on the dock) plus the current chapter name and point count; it opens
    `#chapters`.
  - Its right half is a solid **"Anfragen"** CTA.
  - The ring visibly fills as the page progresses: "Idee" almost empty, "Struktur" ~¾, "Komplexität" nearly full.

### 2.4 Chapter-to-chapter navigation and persistent CTAs
- Every chapter ends with the "Als Nächstes" pill (anchor link with a down arrow; next chapter's title as the label). **[Obs]**
- **Always-available conversion:** desktop header "Projekt anfragen" and mobile dock "Anfragen" stay on screen through
  all captured shots. Contextual CTAs repeat inside chapters (hero CTA pair, IT card buttons, calculator cards, step
  badges). **[Obs]**
- **Accessibility hooks:**
  - skip link "Zum Inhalt springen";
  - `nav` landmarks with labels ("Kapitel", "Schnellzugriff", "Hauptmenü");
  - `aria-current` on the ticks;
  - a visually hidden `p#sr aria-live="polite"`, probably announcing chapter changes [Inf, medium];
  - `section aria-labelledby` per chapter. **[DOM]**

---

## 3. Hero (`#top`, chapter 00)

### 3.1 Composition
- **Desktop** **[Obs]** `desktop/00-initial.jpg`:
  - A **huge left-aligned two-line headline** (about 110 px cap height) spans ~75 % of the width at y≈420–620.
  - Above it: a small status pill (live clock, green "available" dot) and a bracketed kicker.
  - Bottom left: a 4-line lead. Bottom right: the CTA pair (solid + ghost) with two reassurance bullets. At the foot: a
    one-line interaction hint.
  - The WebGL blob sits at the upper right, behind the headline's right half. Its lower part looks frosted/washed from
    about y≈360 down in every hero frame (`01-pointer-0…5.jpg`). That is consistent with a translucent layer behind the
    text block, kept for legibility [Inf, medium].
  - Faint monospace code fragments drift on the left on a second canvas (`canvas#code`).
- **Mobile** **[Obs]** `mobile/00-initial.jpg`: the blob fills the top ~45 % of the viewport. Below it come the status
  pill, kicker and a 3-line headline; the lead and CTAs follow below the fold. The dock overlaps the bottom edge.

### 3.2 The interaction
- **WebGL, not video.** `canvas#gl` (desktop backing store 922×576 for a 1440×900 CSS box) and `canvas#code`
  (1440×900), both `aria-hidden`; `html.gl-on`; a `.fallback` div exists for non-WebGL clients. **[DOM]**
- **The blob is always moving.** Its silhouette and highlights change between every frame, including frames without
  pointer movement (`desktop/video` 0:02–0:31). **[Obs]**
- **Pointer-reactive code trail** **[Obs, high]**: across `01-pointer-0…5.jpg` the custom cursor dot moves left → right.
  The code fragments cluster around and *behind* the pointer's recent path: x 0–430 when the pointer is at x≈163; x 410–830
  at x≈578; trailing toward x≈970. They fade with age.
- **Refraction** [Inf, medium]: in `01-pointer-3.jpg` code lines that pass behind the blob look bent and magnified. This
  suggests the blob shader samples the code canvas as a texture.
- **The point counter reacts:** "Punkte" reads 900 → 765 → 650 across the pointer frames, then 650 → 1,312 as scrolling
  starts (`scroll-00…02`). It is the live particle count of the current figure. **[Obs]**
- **Direct manipulation (not exercised by the capture)** **[DOM]**: the hint text has two variants. `.tip-f` (fine pointer)
  says to press and hold or drag the blob to rotate it. `.tip-t` (touch) says to tap the blob to split it. The mobile
  shots show the touch variant (`mobile/scroll/scroll-02.jpg`, `scroll-26/27.jpg`). Chapter 05 adds an explicit
  `role="switch"` "Blob teilen" as an accessible, non-gestural alternative (`scroll-34.jpg`).

### 3.3 Load sequence (`desktop/video/*.webm`, frames 0.0–3.0 s at 5 fps) **[Obs]**

| t | State |
|---|---|
| 0.0–0.8 s | Blank white (document loading) |
| 1.0 s | Header, HUD ("Punkte 1"), ticks and kicker fade in; headline area still empty |
| 1.2–1.4 s | Status pill appears (place name first, then the clock value) |
| 1.6 s | Headline **reveals letter by letter, left to right, from blurred to sharp**. The first line is half resolved and the second not yet visible. Lead and CTAs are fading in (CTA still greyed) |
| 1.8 s | Headline sharp; CTAs solid; **the blob emerges small and grows**; the counter jumps to 900 |
| 2.0–3.0 s | Blob reaches full size; the dotted halo assembles; the code trail starts |

The DOM confirms that each letter is a `span.c` with a `--i` stagger index inside `aria-hidden` word spans, while the
`<h1>` carries the full sentence as `aria-label`. **[DOM]**

### 3.4 Exit
Between `scroll-00`, `01` and `02` the hero text does not move (pixel diff of the text area ≈0.1–0.2), while the blob
shrinks and scatters into loose particles and the counter rises. Then the page scrolls normally (`scroll-03`: headline
450 px higher; particles re-forming as six screens). Together with the hero's 1800 px height (2 viewports), this indicates
**the hero is pinned for about one viewport while the WebGL transition plays**. [Inf, medium-high] On mobile the hero
scrolls immediately (`mobile/scroll/scroll-00→01`).

---

## 4. Scroll-driven techniques

### 4.1 The persistent morphing layer (all chapters)
- One fixed canvas; each `section.ch` has `data-scene="0…9"`. When a chapter becomes active, the HUD name changes and the
  particle system re-forms into that chapter's figure. The re-formation takes about 1–2 scroll steps (≈450–900 px).
  Intermediate states are visible: scattered points with a mid-tween count (`scroll-02` 1,312; `scroll-14` 2,463;
  `scroll-24` 374; `scroll-29` 1,177; `scroll-56` 5,587). **[Obs]** The figure stays centred in the right half of the
  viewport while the content scrolls on the left: a **fixed stage, scrolling text**.
- **HTML labels are pinned to 3D positions.** `ul.glabels` holds 8 labels ("Strategie", "Design", "Technologie", "Anfrage",
  "KI-Analyse", …). They follow the spheres in ch. 04 and the network nodes in ch. 07, and stay crisp because they are
  DOM, not canvas text (`scroll-30…32`, `scroll-50…53`; mobile `scroll-22…24`). **[DOM][Obs]**
- **DOM ↔ WebGL coupling:**
  - Project cards carry `data-screen="0…5"`, mapping a card to one of the six logo screens [DOM]. A hover link is likely
    but not captured.
  - The AI workflow demo's active step ("02 KI-Analyse", pink) and the glowing "KI-Analyse" node in the network are in
    sync (`scroll-52.jpg`). **[Obs]**

### 4.2 Pinned takeover scenes (desktop)

| Scene | Evidence | Mechanics observed | DOM clues |
|---|---|---|---|
| **Showreel** (`#showreel .reel-stage.rs-on`) | `scroll-10…15`; video 0:41–0:46 at 3 fps | A rounded card rises over the logo screens (DOM above canvas). It then **grows to near full-bleed** (≈37 px inset, `scroll-12.jpg`) over ~2 steps, holds ~2 steps while the muted video plays (button reads "Pausieren"), and **shrinks back to a card** as the next chapter starts. The player UI (counter "01 / 04", title, prev/next, play, sound, 4-segment progress) shows at the start of the hold and is gone in the later frames | `--il`, `--it` (inset left/top), `--rr` (radius), `--e` (expansion 0→1) on the stage; `.rs-pin` sticky child; `video preload="none"` with a WebP poster; `aria-roledescription="Mediaplayer"`; `.pl-meta aria-live="polite"` |
| **IT consulting** (`.it-stage.it-on`) | `scroll-20…24`; video 0:48–0:53 | A dark card in the content column **expands to the full viewport**, revealing a starfield with a faint orbit ring; the card's content re-centres; then it contracts back to a column card. **The header inverts** during the hold | Stage `height: 2541px`; `.it-pin` sticky `top: 169.5px`; `.it-sky` sized to the full viewport (1440×900, offset to viewport origin) |
| **Software solutions** (`.sw-stage.ss-on`) | `scroll-40…45`; video 1:06–1:11 | A small white card **scales up** into a full-bleed dark scene with an earth-horizon background and a **3D arc carousel** of ~10 cards (arrows, auto-advance), with a live interactive prototype below. Then it scales back down | `#softwareloesungen style="transform: scale(0.55)"` (resting state); `.sw-space` with opacity 0→1; `.wheel` `--R: 1486.8px`, `--cw`, `--ch`; cards with `--a: ±5.77°…28.86°` and stepped opacity/z-index; `data-auto="6500"` and `data-hold=".sw-sol"` |
| **Calculator band** (`.kc-stage.kc-on`, ×2) | `scroll-46…49`, `53…56`; video 1:12–1:19 | The calculator card sits in the column. A **dark band extends behind it to full viewport width**, then a panel **slides in from the right** with an animated count-up amount. Then the band scrolls away | `--kch`; `.kc-bg` (left −56 px, width 1440 px = viewport); `.kc-big` positioned in the right half |

**Common mechanism [Inf, high]:**
- a tall wrapper plus a sticky inner element ("pin");
- one or two JS-written CSS custom properties (progress or inset);
- CSS doing the actual transform, clip or radius from those variables.

This is visible in the runtime inline styles. There is no CSS-transform-matrix noise that would point to a library
writing styles every frame.

### 4.3 Typographic scroll techniques
- **Masked word reveals for chapter headlines.** Each word of the kicker and headline is wrapped
  (`span.wd > span[style="--i:N"]`). In mid-reveal frames the words rise from below a clip line with a stagger: only the
  tops of the glyphs of "Ausgewählte" are visible (`scroll-03.jpg`), and the kicker words sit at different baselines.
  The same holds for `scroll-17.jpg`, `scroll-26.jpg`, `scroll-29.jpg` and mobile `scroll-20.jpg`. **[Obs][DOM]**
- **Parallax chapter numerals.** Huge numerals ("01"…"08") with a top-to-bottom fade sit behind the headline; each has
  `data-depth="-.16"` and a JS-written `--by` offset: up to 135 px on desktop (5 of 8 at 135 px, 3 at 0 px when the DOM
  was saved) vs 4 px on mobile. The numeral drifts against the headline while
  scrolling (`scroll-03` vs `scroll-04`). **[DOM][Obs]** The status pill has its own `--py` offset (0 px at rest;
  −19.7 px in the mobile DOM).
- **Count-ups:**
  - the ch. 08 headline number starts as "0" in the DOM and reaches its final value on reveal (`scroll-57.jpg` mid-reveal;
    video 1:20 shows the bare "0");
  - the calculator panel amount counts up (`scroll-48` → `49` → `55`; video 1:13–1:19);
  - the step and fact numbers in cards are static. **[Obs][DOM]**

### 4.4 Transitions between sections (summary)
1. **No background colour change between chapters.** The page stays white. The transition is carried by the **morphing
   figure** and the **HUD/tick state**. **[Obs]**
2. **Scale and inset transitions** of a card to full-bleed and back (reel, IT, software): the "full-screen composition"
   moments. **[Obs]**
3. **Light → dark → light takeovers** inside chapters, with the header inverting to match. **[Obs]**
4. **Width wipes:** the calculator band widening from the card to the viewport edges. **[Obs]**
5. **Masked text rises** at every chapter start, and a **blur-to-sharp per-letter** reveal at load. **[Obs]**
6. **No scroll hijacking.** Shots advance ~450 px per wheel step (59 steps ≈ 26,600 px), consistent with native scrolling.
   Pins are sticky-based, not wheel-captured. `summary.json` reports one scroll-snap container (location not identifiable
   from the shots). **[DOM][Inf, high]**

---

## 5. Microinteractions

| Element | Observation | Evidence | Confidence |
|---|---|---|---|
| Custom cursor | A small black dot (`div.cursor`, `translate3d`) follows the pointer on desktop. On mobile it has no transform | Dot visible in `01-pointer-*`, `scroll-12.jpg` (x≈1200, y≈500); DOM both | High |
| Cursor labels | `data-cursor="Ansehen"` on 14 project cards and `"Abspielen"` on the video. Likely a cursor-attached label on hover | DOM only, no hover capture | Medium (existence), unknown (look) |
| Magnetic buttons | `data-mag` on 6 primary CTAs | DOM only | Medium |
| Project hover preview | `figure.preview` (`aria-hidden`) after the project grid; probably a floating preview | DOM only | Low–medium |
| Live status pill | Clock ticks every second ("16:41:59" → "16:42:00" → …, `data-clock`), pulsing green dot | `00-initial`, `01-pointer-*` | High |
| Copy e-mail | `button.copy[data-copy]` with a `p#toast` feedback element | DOM | High (existence) |
| Toggle switch | "Blob teilen", `role="switch" aria-checked` | `scroll-34.jpg`; DOM | High |
| Scenario tabs | Workflow demo scenarios as `role="radiogroup"` with roving `tabindex="-1"` | `scroll-51.jpg`; DOM | High |
| Typing log | Console lines appear with timestamps; `role="log" aria-live="off"` (deliberately silent for screen readers) | `scroll-51/52.jpg`, mobile `scroll-44/45.jpg` | High |
| Stepper | 5-node stepper; the active node fills pink and the label turns pink | `scroll-51/52.jpg` | High |
| Carousel | Arc of cards, active card upright and opaque, outer cards rotated and faded, round prev/next buttons, auto-advance 6.5 s with hold on hover/press | `scroll-41…43`, mobile `scroll-32/33`; DOM | High (look), medium (behaviour) |
| Filter chips | Discipline cards filter a service list; technology chips with counts filter a logo grid; "show all 88" toggle | `scroll-31/58`; DOM `data-k`, `data-g`, `#more` | High (look), medium (behaviour) |
| Next-chapter pill | Round dark icon with a down arrow plus a two-line label | Many shots | High |
| Buttons | Pills throughout: solid dark with a right arrow for primary, outline for secondary; white variants on dark scenes | Many shots | High (static look); hover not captured |
| Cards | White cards with a soft wide shadow; some with a blurred colour glow in one corner (fact cards, `scroll-18/19`); gradient borders on calculator cards (`scroll-46/47`) | Shots | High |
| FAQ | Native `<details>/<summary>` with a plus icon on the right | `scroll-59.jpg`, mobile `scroll-58/59` | High |

Hover, focus and active states of buttons, links and cards were **not captured**. See section 10.

---

## 6. Mobile patterns

1. **Motion is cut by design, not by accident** **[DOM]**:
   - the showreel, IT and software stages lose their `*-on` classes (`reel-stage`, `it-stage` and `sw-stage` without
     `rs-on`, `it-on`, `ss-on`) and render as ordinary in-flow cards (`mobile/scroll/scroll-10…12`, `15…17`, `30…34`);
   - `sticky` elements drop from 9 to 2: only the two calculator stages remain, as a **mobile-specific variant
     `kcm-on`** with its own heights (1917 px, 1843 px) and a negative sticky `top`.
2. **One mobile-only full-screen moment.** The `kcm-on` calculator stage turns into a full-viewport dark takeover with a
   centred headline, the amount card and a white CTA, and the header inverts (`scroll-38/39`, `49/50`). **[Obs]**
3. **The WebGL layer stays on, but cheaper.** Backing store 374×637 for a 390×664 CSS viewport at DPR 3, i.e. about one
   pixel per CSS pixel, not three. All figures still morph: screens `scroll-03`, line `13`, ring `19`, spheres `22`,
   blob `25`, lattice `28`, network `43`, spiral `53`. **[DOM][Obs]**
4. **Heavier modules are not loaded.** The mobile `scripts` list lacks `software/proto.js` and `software/sc/ceo-bot.js`.
   The prototype is a static preview with a **"Vollbild"** button that opens a dialog (`scroll-34/35`). **[DOM][Obs]**
5. **Thumb-zone dock** with chapter progress and the primary CTA. It is about 57 CSS px tall and spans almost the full
   width minus margins (`mobile/scroll/*` bottom). The burger is a ≈47 px round target at the top right. **[Obs]**
6. **Touch-specific copy and gestures:** "tap the blob" instead of "hold/drag"; no cursor follower. **[DOM][Obs]**
7. **Reduced parallax:** `--by` up to 135 px on desktop → 4 px on mobile. **[DOM]**
8. **Layout adaptations** **[Obs]**:
   - project cards become a 2-column grid at `46vw` with 640 w AVIF images (`scroll-04…08`);
   - the logo wall becomes a 2-column grid; chips wrap to multiple rows (`scroll-55/56`);
   - the carousel shows ~3 cards on a tighter arc (`--R: 380px` vs 1486.8 px; `scroll-32`);
   - the workflow stepper keeps all 5 nodes, with labels squeezed (`scroll-44`).
9. **Menu sheet:** full screen, numbered big-type anchors (~46 CSS px rows), staggered entrance, slide-up exit (2.3). **[Obs]**

---

## 7. Technical and performance observations

### 7.1 Stack clues **[DOM]**
- No generator meta. `libs: []` on all four pages: no global library objects were detected.
- Scripts on the home page: two small inline scripts (a 148-byte feature/`js` class switch; JSON-LD), `app.js` (`defer`,
  **30 KB**), `software/proto.js` (3 KB) + `software/sc/ceo-bot.js` (7 KB) + `protos.json` (9 KB, fetched) on desktop,
  and two JSON data islands (`#reels` 860 B, `#cases` 13 KB).
- Styles: `app.css` (**16 KB**), `proto.css` (2 KB; also in `<noscript>`), `ceo-bot.css` (5 KB, desktop only).
- With 30 KB of script for a custom WebGL particle engine, pins, a carousel, a media player, filters, demos, a command
  palette and dialogs, the code is almost certainly **hand-written vanilla JS with raw WebGL**. A bundled three.js or
  GSAP + ScrollTrigger alone would exceed that transfer size. [Inf, high]
- Platform features used: Popover API (with `no-pop` fallback), `<dialog>`, `<details>`, `role="switch"`,
  `aria-roledescription`.
- `summary.json` sizes are transfer sizes from the load-time resource list; the reel MP4 does not appear in it
  (`preload="none"`).

### 7.2 Fonts (do not reuse; see section 9)
Self-hosted variable WOFF2: Space Grotesk 300–700 (22 KB, preloaded), Inter 100–900 (47 KB, preloaded),
JetBrains Mono 100–800 (40 KB, not preloaded; used for the code canvas and console). Inner pages load only the first two.

### 7.3 Images and media
- **Project images:** `<picture>` with AVIF + WebP `srcset` at 320/480/640/1024/1600 w, `sizes="(max-width: 760px) 46vw, 310px"`.
  All 25 images use `loading="lazy" decoding="async"`. Desktop fetched the 320 w AVIFs (3–21 KB each); mobile fetched
  640 w (7–51 KB).
- **Client logos** are referenced via CSS custom properties (`--src:url(...)`), as SVG or WebP, 2–30 KB.
- **WebGL textures:** `atlas.webp` (12 KB) + `atlas-hd.webp` (36 KB).
- **Video:** MP4 with a WebP poster (51 KB), `muted playsinline preload="none"`. The showreel 2024 also offers WebM. Data
  for four films lives in `#reels`.
- **Transfer totals** in the captured resource lists: desktop ≈ **524 KB**, mobile ≈ **655 KB**. Mobile is higher because
  of the 640 w images.

### 7.4 Layers and counts **[DOM]**
- Desktop: `canvases 2`, `sticky 9`, `fixed 12`, `scrollSnap 1`, `images 25`.
- Mobile: `canvases 2`, `sticky 2`, `fixed 10`, `scrollSnap 1`.
- Fixed layers in the DOM: `canvas#gl`, `canvas#code`, `.fallback`, `ul.glabels`, `.cursor`, `#toast`, `header.bar`,
  `nav.dock`, the popovers and dialogs.

### 7.5 Likely CSS vs JS split [Inf, medium-high]
- **JS:** the WebGL engine (figure morphs, point counts, pointer trail, refraction); writing progress variables
  (`--e`, `--p`, `--py`, `--by`, `--lx`, heights and offsets of the stages); active-chapter detection
  (`aria-current`, HUD text, `.seen`); the media player, carousel auto-advance, filters, demo playback, count-ups, the
  clock, copy-to-clipboard, the command palette.
- **CSS:** all visual transforms keyed off those variables (scale, inset, radius, ring dash offset); the staggered
  reveals via `--i` (`animation-delay`/`transition-delay`); the menu stagger; header theming; the responsive layout.
- The DOM contains no inline `transition` or `animation` values. Durations and easings live in the uncaptured
  `app.css`/`app.js`.

### 7.6 SEO and semantics (relevant to SOMA's brief)
- **All story content is real HTML text.** The canvases carry no information (`aria-hidden`).
- Logical H1 → H2 per chapter → H3 per card.
- JSON-LD graph with ProfessionalService, WebSite, WebPage, FAQPage (9 Q&A), 3× VideoObject and an OfferCatalog of
  8 services.
- Canonical URL, full Open Graph/Twitter cards, `lang="de"`, `theme-color`, web manifest.

---

## 8. Transferable principles for SOMA

Each principle names **what to adapt (principle)**, never the reference's look. The SOMA expression belongs to the
Landing Art Director (Agent 2) and the brand system.

Stack context, checked in `soma/package.json`:
- Next.js 16.4, React 19.3, Tailwind v4;
- **GSAP is not installed yet**, so adding it is a Lead or Agent 3 decision;
- no other animation library is present.

Default to CSS (transitions, `@starting-style`, scroll-driven animations behind `@supports (animation-timeline: view())`).
Use GSAP + ScrollTrigger only for scrubbed or pinned scenes that need precise timelines.

1. **One persistent stage that changes state per chapter.**
   - *Reference:* one fixed WebGL figure re-forms per `data-scene` (4.1).
   - *SOMA:* a single art-directed layer (for example a framed editorial image or SOMA's own motif) that re-crops,
     re-positions or re-masks per chapter, so the page reads as one continuous composition rather than stacked blocks.
   - *Implementation:* a `<ChapterStage>` client component, `fixed inset-0 pointer-events-none -z-10`. Chapters are
     RSC `<section data-chapter="02" data-stage="frame-left">`. One `IntersectionObserver`
     (`rootMargin: "-45% 0px -45% 0px"`) writes `data-stage` onto the stage. CSS transitions on `clip-path`, `translate`,
     `scale` and `opacity` do the rest. Use canvas or WebGL only if Agent 2 specifies a figure that truly needs it
     (brief §7).
   - *Reduced motion:* state changes become an opacity cross-fade under 200 ms, or an instant swap.
   - *Mobile:* keep the states but simplify (fewer layers, smaller frame), or let each chapter carry its own in-flow
     image.

2. **A chapter index that doubles as a progress indicator.**
   - *Reference:* the HUD (number + name), 10 segmented ticks with `aria-current`, a chapter sheet (2.1, 2.2).
   - *SOMA:* a quiet chapter index for the 10 sections with short SOMA names and a progress line.
   - *Implementation:* `<ChapterNav>` with `<a href="#…" aria-current="true">` (links, not buttons, so it works without
     JS). Active state comes from the same observer as principle 1. On jump, focus the target `h2` (`tabIndex={-1}`).
     Each tick's fill comes from a `--p` custom property.
   - *Reduced motion:* no animated fill; the jump uses `behavior: "auto"`.
   - *Mobile:* collapse into the dock (principle 3).

3. **Booking is always one tap away: header CTA on desktop, thumb-zone dock on mobile.**
   - *Reference:* `nav.dock` with a progress ring, chapter name and CTA (2.3).
   - *SOMA:* a bottom dock with the primary booking CTA and a compact chapter or progress control. This meets brief §5
     ("immediate access to booking at all times", thumb-friendly).
   - *Implementation:* `fixed bottom-[max(1rem,env(safe-area-inset-bottom))]`, targets ≥ 48 px, an SVG ring with
     `pathLength="1"` and `stroke-dashoffset: calc(1 - var(--p))`. `--p` comes from
     `animation-timeline: scroll(root)` where supported, otherwise a passive scroll listener throttled with rAF. Hide the
     dock while the hero booking form or the final CTA is in view, and while a text field has focus (virtual keyboard).
   - *Reduced motion:* identical, minus ring easing.
   - *Mobile:* this *is* the mobile pattern.

4. **Pinned takeovers: card → full-bleed → card.**
   - *Reference:* showreel, IT and software stages (4.2).
   - *SOMA:* one or two signature moments only, for example in "The SOMA Experience" (an image opens into a full-screen
     scene) or "The Digital Experience" (the device stage takes over).
   - *Implementation:*
     - a wrapper `h-[220svh]` with a `sticky top-0 h-svh` child;
     - animate `clip-path: inset(var(--inset) round var(--radius))` (cheaper than width/height; no layout) from card
       geometry to 0;
     - scrub with ScrollTrigger (`scrub: true`, no `pin` needed when CSS sticky does the pinning), or with CSS
       `animation-timeline: view(); animation-range: contain 0% contain 40%`;
     - the stage declares `data-header-theme="dark"` (principle 13).
   - *Reduced motion:* no pin and no scrub; render the full-bleed state statically, or the card.
   - *Mobile:* turn the pin off, as the reference does, or keep at most one short mobile-specific variant (the
     reference's `kcm-on`).

5. **Masked, staggered headline reveals that stay accessible.**
   - *Reference:* `span.wd > span[--i]` word rises; a per-letter blur-in for the H1; `aria-label` on the heading with
     `aria-hidden` fragments (3.3, 4.3).
   - *SOMA:* line or word reveals for the display typography, with restraint ("sensual restraint").
   - *Implementation:* a server-side `<RevealHeading>` splits words at render time (no client JS for splitting) and keeps
     the full string as real text. Prefer one visually hidden full-text span plus `aria-hidden` fragments over
     `aria-label` on a heading. Keyframes: `translate: 0 105%` → `0`, inside an `overflow: clip` line box, with
     `animation-delay: calc(var(--i) * 45ms)`. Trigger by toggling `data-seen` from one shared observer, or by
     `animation-timeline: view()`. Never gate the LCP headline's visibility on JS: render it visible and enhance.
   - *Reduced motion:* opacity only, no stagger, or no animation (`motion-reduce:animate-none`).
   - *Mobile:* word level, not letter level, with a shorter total duration.

6. **Explicit chapter hand-off.**
   - *Reference:* "Als Nächstes" pill naming the next chapter (1.2).
   - *SOMA:* a small, elegant "next" link at the end of selected chapters that previews the next title and keeps the
     story moving.
   - *Implementation:* a plain `<a href="#how-it-works">`, `scroll-margin-top` equal to the header height, and
     `scroll-behavior: smooth` only inside `@media (prefers-reduced-motion: no-preference)`.
   - *Reduced motion:* instant jump.
   - *Mobile:* full-width tap target ≥ 48 px.

7. **A real product demo synchronised with the visual layer.**
   - *Reference:* AI workflow stepper + log + network nodes in sync; live prototypes in the carousel (4.1, 5).
   - *SOMA:* "How SOMA works" (Entdecken → Buchen → Genießen) and "The Digital Experience" as a device frame showing
     **actual SOMA screens or components** (brief §4.07). The active step drives the screen state.
   - *Implementation:*
     - desktop: a sticky device frame next to a step list; each step `<li>` is observed and sets `data-step` on the frame;
       screens cross-fade or slide;
     - also offer a manual tab control (`role="tablist"` or a radiogroup with roving tabindex);
     - render screens with `next/image` (AVIF) or as real lightweight components;
     - label previews honestly (the reference marks its demo as sample data; SOMA should mark previews as "Vorschau"
       where needed);
     - autoplay only while visible; pause on hover, focus and `visibilitychange`.
   - *Reduced motion:* no autoplay; manual tabs; instant screen swaps.
   - *Mobile:* no pin; a horizontal snap row of step cards or tabs above a single device frame.

8. **Controlled browsing for a collection, with a detail panel.**
   - *Reference:* an arc carousel with prev/next, auto-advance 6.5 s, hold on hover, the selected card driving a detail
     region (`aria-controls`) (4.2).
   - *SOMA:* the seven service categories as a curated, horizontally browsable editorial sequence. Each item links to its
     **verified** marketplace route (Agent 5).
   - *Implementation:*
     - `overflow-x: auto; scroll-snap-type: x mandatory`, with a visible peek of the next item;
     - prev/next buttons that call `scrollBy`; `aria-roledescription="carousel"` plus a label;
     - each slide is a real `<a>`;
     - an optional arc look via `rotate: var(--a)` with a distant `transform-origin`, set by a small rAF loop from the
       scroll position;
     - no auto-advance by default; if used, provide pause (WCAG 2.2.2).
   - *Reduced motion:* a flat row with no rotation and no auto-advance.
   - *Mobile:* native swipe with snap; arrows remain for switch and keyboard users.

9. **A load choreography that is short, ordered and content-first.**
   - *Reference:* blank → header/HUD (1.0 s) → kicker and status → headline blur-in (1.6 s) → copy and CTAs → visual
     layer grows (1.8–3.0 s) (3.3).
   - *SOMA:* the hero headline, booking entry and CTAs paint first as server HTML; the image reveal and the signature
     interaction follow within about 1 s.
   - *Implementation:* SSR/RSC hero; `next/font` with preload for the display face only; `next/image priority` with
     `fetchpriority="high"` on the hero image (the LCP element); CSS-only entrance on first paint. Load the interactive
     module through `next/dynamic` after `requestIdleCallback` or on first pointer/scroll. A blank first second like the
     reference's (0–0.8 s) should be avoided for Core Web Vitals.
   - *Reduced motion:* final state immediately.
   - *Mobile:* same order, shorter, and without the heavy module if the motion tier is "lite" (principle 14).

10. **Interaction and hint copy adapt to the input modality.**
    - *Reference:* `.tip-f` "hold/drag" vs `.tip-t` "tap"; the cursor follower only on fine pointers; an accessible
      switch duplicates a gesture (3.2).
    - *SOMA:* the hero interaction must work fully by tap and by keyboard; hints change by device.
    - *Implementation:* Pointer Events (`pointerdown/move/up`) for one code path. Variants via
      `@media (hover: hover) and (pointer: fine)` (Tailwind v4 `pointer-fine:` / `pointer-coarse:` variants, or a
      `@custom-variant`). Every gesture also gets a visible button or switch.
    - *Reduced motion:* gesture result shown without physics.
    - *Mobile:* tap-first, with no hover-only affordances (brief §5).

11. **Contextual entry points that carry intent into the flow.**
    - *Reference:* calculator chips deep-link with `?typ=…`, service pages with `?ziel=…`; the wizard shows "1 von 7"
      with a sticky "Weiter" (1.2, 1.5).
    - *SOMA:* service, location and date from the hero, and service chips in "Service Exploration", passed into the
      app's discovery route as query parameters; repeated, context-specific CTAs after the relevant chapters
      (brief §8).
    - *Implementation:* `<Link href={{ pathname: verifiedRoute, query: { service, plz, date } }}>`, routes taken only
      from the existing app routing (Agent 5); a hero form that works as a plain GET form without JS.
    - *Reduced motion:* not applicable.
    - *Mobile:* stepwise entry (one field per step) is a valid mobile adaptation of the wizard pattern.

12. **Two navigation layers: narrative chapters and a utility menu.**
    - *Reference:* `#chapters` sheet vs `#menu` sheet (main anchors, service pages, direct contact) (2.2, 2.3).
    - *SOMA:* the chapter index for the story; a full-screen menu overlay for destinations (discovery, for
      professionals, app, FAQ, account) with booking always present.
    - *Implementation:*
      - `<div popover id="menu">` + `<button popovertarget="menu">` (top layer, light dismiss, Esc for free);
      - entrance with `@starting-style` and `transition-behavior: allow-discrete`;
      - item stagger via `--i`;
      - feature-detect and fall back to a `<dialog>` or a disclosure;
      - manage focus return and `inert` on the page if needed.
    - *Reduced motion:* fade only, no stagger.
    - *Mobile:* full-height sheet, large type rows, close button in the same position as the opener.

13. **The header adapts to the scene beneath it.**
    - *Reference:* the header inverts over dark stages; a soft fade under the header instead of a solid bar (2.1).
    - *SOMA:* the header switches between light and dark brand variants as sections declare their theme, so it never
      fights the art direction.
    - *Implementation:* each section has `data-header-theme`. One observer with a thin `rootMargin` at header height
      sets `html[data-header="dark"]`. Tokens swap via CSS variables in Tailwind v4 `@theme`. The fade is a
      `mask-image: linear-gradient(...)` or a gradient pseudo-element. Keep the contrast ≥ 4.5:1 in both states.
    - *Reduced motion:* colour swap without transition, or 150 ms.
    - *Mobile:* same.

14. **Device-tiered motion and progressive enhancement.**
    - *Reference:* mobile drops 3 pins and keeps 1 mobile variant; skips prototype scripts; renders WebGL at ~1×; has
      `no-pop`, `gl-on` and `.fallback` switches (6, 7).
    - *SOMA:* define three motion tiers in the spec: **full** (fine pointer, wide, no reduced-motion), **lite**
      (coarse pointer or narrow: no pins, no scrubbing, simple reveals), **none** (`prefers-reduced-motion: reduce`:
      static final states).
    - *Implementation:*
      - a `useMotionTier()` hook built on `matchMedia`, mirrored by CSS media queries;
      - with GSAP, register scenes in `gsap.matchMedia()` so they revert automatically when a query flips;
      - lazy-import heavy modules per tier;
      - cap any canvas at `devicePixelRatio ≤ 1.5` (≤ 1 on mobile);
      - the page must be complete with JS disabled (brief §7).
    - *Reduced motion / mobile:* these are the tiers themselves.

15. **Depth through sparing typographic parallax.**
    - *Reference:* chapter numerals at `data-depth="-.16"` (up to 135 px desktop → 4 px mobile); a status pill offset (4.3).
    - *SOMA:* very slight drift of secondary elements (numerals, captions, a second image plane) against the primary
      image, for an editorial, layered feel.
    - *Implementation:* `@supports (animation-timeline: view())` → `@keyframes drift { from { translate: 0 var(--d) } to { translate: 0 calc(var(--d) * -1) } }`
      with `animation-timeline: view()`. Without support: no parallax (not a JS fallback). Animate only
      `translate`/`opacity`.
    - *Reduced motion:* none.
    - *Mobile:* amplitude cut by ≥ 90 % or none.

**Cross-cutting rules taken from the reference's good practice:**
- canvases and decoration `aria-hidden`;
- real text for everything that matters;
- `aria-live` used sparingly: polite for chapter or now-playing changes, `off` for chatty logs;
- native `<details>` for the FAQ;
- structured data (FAQPage, Organization or LocalBusiness as applicable to SOMA's real facts);
- images as AVIF/WebP with `srcset` and lazy loading;
- video `preload="none"` with a poster;
- no scroll hijacking.

**Do not adopt:**
- the live "availability" pill and count-up metrics as patterns that would require SOMA to state availability or numbers
  it cannot verify (brief §5, §9);
- the blank first second of the reference's load.

---

## 9. Do-not-copy list (principle vs expression)

**The line:** SOMA may adopt *mechanisms*: how attention, navigation and state are orchestrated over scroll, pointer and
time. SOMA must not adopt *expression*: anything a visitor would recognise as theoneagency.de's look, words, figures,
assets or code. If an element could be screenshotted and identified as "theirs", it is expression.

| Category | Reference expression: **do not copy** | Allowed principle |
|---|---|---|
| Colour | White canvas with a cyan/magenta/yellow accent system (`--c`, `--m`, `--y`); rainbow gradients on the logo, borders, menu rule and orb; black/white pill contrast; dark "space" panels with starfield, orbit ring and earth horizon | A restrained accent used consistently; dark scenes as rhythm, in **SOMA's** palette (Bone, Stone, Taupe, Oxblood, Espresso or the approved tokens) |
| Typography | Space Grotesk, Inter, JetBrains Mono; bracketed numerals `[ 00 ]`; giant faded chapter numerals; uppercase tracked kickers in that exact form | A display/text pairing from SOMA's licensed fonts; *some* chapter numbering system designed by Agent 2 |
| Logo and brand marks | Orbit logo, gradient "ONE" wordmark, favicon, client logos | None. SOMA uses its own logo masters only |
| Signature graphics | Iridescent chrome or metaball blob; dot-particle halos and dot-matrix screens; particle line, ring, spheres, lattice, network and spiral figures; code-snippet trail; "Punkte" counter; voucher/ticket card; status pill with live clock and "available" dot; glowing colour blobs in card corners | A *SOMA-original* persistent visual that changes per chapter, only if it serves the brand (brief §7: no decorative 3D) |
| Narrative concept | The dot → product story and the abstract chapter names (Idee, Produkt, Linie, Form, Drei, Eins, Struktur, Netzwerk, Komplexität, Eins); "Blob teilen"; three disciplines merging into one | Named, numbered chapters with SOMA's own narrative (care adapting to life; at home, hotel, office) |
| Copy and microcopy | Headlines, leads, CTAs ("Projekt starten", "Arbeiten ansehen", "Als Nächstes", "Anfragen"), hints, FAQ texts, SEO descriptors, chapter descriptors | SOMA copy from `brand/BRAND_VOICE.md` / `COPY_DECK_LANDING.md`; only the *function* (e.g. a "next chapter" link) is transferable |
| Specific layouts | Left text column + right WebGL stage; centred HUD over a 10-tick bar; 2-column project grid with logo wall; tri-sphere service picker; 3D arc carousel with earth horizon; calculator band with right-side count-up panel; workflow stepper + console log; tech-logo chip grid | Generic structures (sticky media + scrolling text, a horizontal collection, a step demo) composed afresh by Agent 2 |
| Media | All screenshots, case images, showreels, posters, WebGL atlases, logos, OG image | None. SOMA uses its own or licensed imagery (brief §6) |
| Code and animation | `app.js`, `app.css`, shaders, `proto.js`, `ceo-bot.js`, the exact CSS-variable contract (`--il/--it/--rr/--e`, `--R/--a`, `--kch`), class names, timing and easing | Independently written implementations on our stack. Reading the DOM for principles is fine; reproducing their code or their exact parameterisation is not |
| Interaction signatures | Press-and-hold or drag to rotate a blob; tap to split it; cursor-spawned code trail; command palette as a site feature in that form | A SOMA-specific hero interaction that serves booking or the brand idea (brief §4.01) |

---

## 10. Gaps and confidence

### Not covered by the captures
1. **Chapter 09 (contact) and the footer were never on screen.**
   - Desktop scrolling stopped at the FAQ (≈ y 26,600 of 31,558; `scroll-59.jpg`); mobile stopped at the FAQ as well
     (≈ y 19,900 of 24,944).
   - In `desktop/03-fullpage.jpg` the area from y≈29,500 is blank white, which suggests reveal-gated content (only the
     hero has `.seen` in the DOM) [Inf, medium].
   - Its structure is known only from the DOM: closing headline, goal picker, CTA, quick-contact cards, four link
     columns, legal row with "Befehle" and "Nach oben".
2. **`mobile/03-fullpage.jpg` is an empty file (0 bytes).**
3. **No hover, focus or active states.** The capture made no hover screenshots. Cursor labels, magnetic CTAs, the project
   preview, card hovers and button states are DOM-inferred only.
4. **Overlays on desktop:** the burger is hidden at 1440 px (`capture-log.txt`); the "Kapitel" sheet, the command palette
   and the case dialog were not opened. Only the mobile menu was captured.
5. **Exact timing and easing.** `app.css` and `app.js` were not captured. Scroll shots are 650 ms and ~450 px apart and the
   video runs at 25 fps (1280×800, scaled from 1440×900). So durations, easing curves, scrub smoothing, and whether the
   blob reacts to the pointer directly or only animates by itself cannot be measured.
6. **WebGL internals:** shaders, particle counts per figure (beyond the HUD numbers), the refraction technique and the
   gesture physics are unknown.
7. **`prefers-reduced-motion` handling is unknown.** It is not in the HTML; it would be in the external CSS/JS. No
   reduced-motion capture was made.
8. **Inner pages** were sampled lightly (10 + 2 + 10 shots); the wizard only on step 1 of 7.
9. **Resource sizes** come from the load-time resource list only. Video bytes, lazy images fetched during the scroll and
   later script chunks are not included.
10. **`--lx`** (581 px desktop, 99.5 px mobile on `<html>`) and the single `scrollSnap` element could not be attributed.

### Confidence

| Topic | Confidence | Basis |
|---|---|---|
| IA, chapter order, pacing | **High** | DOM sections + 120 scroll shots + video |
| Navigation (header, ticks, HUD, dock, mobile menu) | **High** | Observed repeatedly + DOM. Desktop overlays: **medium** (DOM only) |
| Hero composition and load sequence | **High** | Screenshots + 5 fps video frames |
| Hero interaction (pointer trail, morphing blob) | **Medium-high** | Pointer frames. Gestures and refraction: **medium/low** |
| Pinned stages and morph transitions (what happens) | **High** | Consecutive shots + video + runtime inline styles |
| Pinned stages (how it is built: sticky + CSS variables) | **Medium-high** | DOM runtime styles |
| Microinteractions | **Medium** overall | High for static look; low for hover behaviour |
| Mobile adaptations | **High** | DOM class diff + mobile shots + video |
| Stack (vanilla JS, raw WebGL, no libraries) | **Medium-high** | `libs: []`, 30 KB script budget, no library globals |
| Exact motion parameters (durations, easing) | **Low** | Not measurable from the captures |

**Recommendation:** if exact easing or hover behaviour becomes decision-relevant for Agent 3, a second capture run could
add hover screenshots of a project card and a CTA, an opened "Kapitel" sheet, a 60 fps recording of one pinned stage,
a `prefers-reduced-motion: reduce` run, and a scroll to the end of the page. This is optional; the principles above do
not depend on it.
