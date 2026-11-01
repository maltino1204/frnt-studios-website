# SOMA brand identity and landing page: shared implementation plan (Lead)

Briefs (verbatim, binding): `brand/BRIEF.md` (brand identity) and `docs/landing/BRIEF.md` (landing page).
This plan sets the single creative direction, the order of work, file ownership and the quality gates.

## Lead decisions (apply to every agent)
1. **The new brand identity supersedes Design v2's visual language.** The ultramarine accent and the
   "aura" gradient motif are replaced, because the brief rules out excessive gradients and a conventional SaaS look.
   - Bone and Espresso form the foundation; Oxblood is the restrained signature accent.
   - Keep v2's craftsmanship: component APIs, accessibility, haptics, motion quality, performance budget, tests.
   - Re-theme through tokens wherever possible.
2. **Taglines.** The primary tagline is "Your body. Your place." The descriptor is "Beauty & Wellness, wherever you are."
   "Your wellness. Your place." is retired.
3. **Voice.** The client's German sample lines address the customer with *du*. The Brand Strategist decides *du* vs *Sie*
   with documented reasoning; the default is *du* for customers, as the client's copy suggests. Providers stay *du*.
   - If customers switch to *du*, the app's customer copy migrates in phase B2, E2E tests included.
   - The Strategist also decides "Profi" vs "Professional" (the client writes "Professional werden").
4. **Fonts.** Only legally free fonts with web and logo use permitted: OFL / Google Fonts, or Fontshare free licence with
   the licence documented. Never purchase.
5. **Logo masters.** SVG, hand-built as paths (no live text), in `brand/assets/logo/`. Raster exports are generated from the
   SVG masters with `sharp`.
6. **Imagery.**
   - New art-directed imagery may be generated with Higgsfield (already used in this project; balance about 1,300 credits).
   - Budget for this round: **≤ 200 credits**; report usage. All images are AI-generated development assets: label them so
     and keep the replacement requirements documented.
   - The photo CDN is currently blocked in this sandbox. Design every image slot so it looks intentional without the photo.
7. **Brand book page.** `/kit/marke` (noindex) renders the guidelines visually (logos, colours, type, motif, components),
   so the auditor can inspect the real artwork.
8. **No external publishing or purchases.** Pushing to the project repos is fine; deploying is the client's step.

## File layout
```
brand/
  BRIEF.md                 client brief (verbatim)
  PLAN.md                  this plan
  BRAND_STRATEGY.md        Strategist
  BRAND_VOICE.md           Strategist (voice guide, sample copy, CTAs, errors, communications)
  BRAND_GUIDELINES.md      Identity Designer (+ Art Director sections: photography, motion, applications)
  LOGO_USAGE.md            Identity Designer
  DESIGN_TOKENS/           Identity Designer: tokens.json (source), tokens.css (Tailwind v4 @theme mapping), README.md
  assets/logo/concepts/    A-architectural, B-editorial, C-organic (SVG + PNG previews)
  assets/logo/final/       wordmark, secondary lockup, symbol; light/dark/mono SVG + PNG
  assets/icons/            app icons (iOS, Android adaptive, PWA), favicon (svg, ico, png)
  assets/motif/            proprietary SOMA motif (SVG)
  assets/iconography/      icon grid and spec
  photography/             direction, shot list, generated development assets list
  applications/            social, ads, gift card, onboarding kit, email (HTML), app icon mockups, previews
  audit/                   independent brand audits
docs/landing/
  BRIEF.md, REFERENCE_ANALYSIS.md, LANDING_DESIGN_SPEC.md, INTEGRATION.md, audit-*.md
```

## Phases and ownership
| Phase | Agent | Owns (writes) | Depends on |
|---|---|---|---|
| **B1** | Brand Strategist | `brand/BRAND_STRATEGY.md`, `brand/BRAND_VOICE.md` | brief |
| **B1** | Identity Designer | `brand/assets/**` (logo, icons, motif, iconography), `brand/DESIGN_TOKENS/**`, `brand/LOGO_USAGE.md`, `brand/BRAND_GUIDELINES.md` (identity sections), `/kit/marke` page | brief; reads the strategy when present |
| **B2** | Digital Art Director | `brand/photography/**`, `brand/applications/**`, guideline sections on photography, motion and applications | B1 |
| **B2** | App Brand Migration (Frontend) | app tokens (`src/styles/tokens.css`), fonts (`src/app/layout.tsx`), logo components, favicons/manifest/OG, motif in the UI kit, tagline, customer copy migration (if *du*), E2E text updates | B1 |
| **B3** | Independent Brand Auditor | `brand/audit/**` | B2 |
| **L1** | Reference Researcher | `docs/landing/REFERENCE_ANALYSIS.md` | client-approved captures in `research/reference/theoneagency/` |
| **L1** | Landing Art Director | `docs/landing/LANDING_DESIGN_SPEC.md` | B3 (+ L1 research) |
| **L2** | Frontend Engineer | `src/app/(site)/page.tsx`, `src/components/landing/**` (sections, static and responsive) | spec |
| **L2** | Conversion & Integration | booking entry, routing and params, SEO metadata, JSON-LD, OG (`src/components/landing/booking/**`, metadata) | spec |
| **L3** | Motion & Creative Developer | `src/components/landing/motion/**`, data-attribute contract from the spec | L2 |
| **L4** | Independent Landing Auditor | `docs/landing/audit-*.md` | L3 |

Phases with dependencies run in sequence; agents within a phase have disjoint files and run in parallel.

## Quality gates
- **Brand:** 10 dimensions ≥ 8/10, scored by the independent auditor with evidence:
  originality, visual sophistication, memorability, typography, logo scalability, colour coherence, digital usability,
  accessibility, cross-platform consistency, long-term relevance.
- **Landing:** 11 dimensions ≥ 8/10, from an independent audit of the rendered page at desktop, tablet and mobile:
  overall visual experience, brand fidelity, typography and composition, interaction design, animation quality,
  mobile experience, UX, conversion clarity, technical quality, accessibility, performance.
- **Always:** `tsc` clean, `npm test` green, the full E2E suite green on a production build, no hydration errors,
  `prefers-reduced-motion` honoured.

## Environment notes for agents
- **Servers:** dev on :3000 (`npx next dev -p 3000`), production on :3100 (only the Lead or the named agent rebuilds it).
  The container may restart. If so, start Postgres with `pg_ctlcluster 16 main start` and the dev server with `nohup`.
  Kill processes by PID only, never with `pkill -f`.
- **Playwright:** `require('@playwright/test')` from inside `soma/`, `chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })`.
- **Demo logins** (password `soma-demo-2026`): `testkunde@soma.test`, `testkunde-b2b@soma.test`, `testadmin@soma.test`.
- **Blocked hosts:** `theoneagency.de` and the photo CDN are still blocked in this sandbox. The client-approved GitHub
  workflow `soma-capture` fetched both:
  - all 131 photos are now local in `public/images/**`;
  - the reference captures are in `research/reference/`.

  To fetch newly generated images, add them to `scripts/images/sources.json`; the Lead re-runs the workflow by changing
  `.github/capture-request`.
