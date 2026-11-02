# SOMA — Your body. Your place.

SOMA is a premium, mobile-first marketplace for Germany. Independent beauty and wellness
professionals ("Profis") travel to their customers, at home, in a hotel or at the office.
One Next.js application serves three experiences:

| Experience | Entry | Who |
|---|---|---|
| Customer app (discovery, booking, account) | `/` | visitors and customers |
| Professional app (business tool) | `/pro` (acquisition page: `/fuer-profis`) | providers |
| Admin platform | `/admin` | SOMA operations |

The interface is entirely German and addresses everyone with *du* (brand decision, `brand/BRAND_VOICE.md`);
the provider product is called **SOMA Pro**. German signature line: „Du bleibst. Dein Profi kommt.“

> **Demo:** see **[DEMO.md](DEMO.md)** (German) — start in 5 minutes, three test logins, a 20-minute demo script,
> and §5 for a hosted demo on **Netlify + Supabase or Neon** (`netlify.toml`, `npm run netlify:prepare`).

> **Working title (client decision, 2026-11-01).** "SOMA" stays the working name until the word and figurative marks
> are cleared (a launch blocker). Renaming touches `src/lib/brand.ts`, the logo masters (`brand/assets/logo/`,
> `public/brand/*`, `src/components/brand/logo.tsx`) and the manifest.

> **Brand identity v1.2** lives in [`brand/`](brand/): strategy, voice, guidelines, logo usage, design tokens, logo and
> icon masters, photography direction and applications, plus the independent brand audits. The rendered brand book is
> at `/kit/marke` (noindex). The landing page `/` ("Durch den Bogen", 10 chapters) is specified and audited in
> [`docs/landing/`](docs/landing/).

---

## Quick start

**Prerequisites:** Node.js ≥ 20.11 and PostgreSQL ≥ 15 with the `btree_gist` and `pgcrypto` extensions
(any local Postgres, Postgres.app, Docker `postgres:16`, or `supabase start`).

```bash
cd soma
npm install
cp .env.example .env.local            # defaults: local Postgres, local auth, dev payments, demo mode

# create a database (example for a local Postgres superuser)
createuser -s soma -P                 # password: soma
createdb -O soma soma
createdb -O soma soma_test            # used by the integration tests

npm run db:setup -- --reset           # Supabase shim (local only) + migrations + base seed
DEMO_MODE=true npm run db:seed        # fictional demo marketplace (never in production)
npm run demo:refresh                  # run right before a demo: reseed + maintenance (appointment in ~35 min)

npm run dev                           # http://localhost:3000
```

Demo accounts (password `soma-demo-2026`):

| Role | E-mail | Start at |
|---|---|---|
| Customer (Julia H.) | `testkunde@soma.test` | `/konto` |
| Professional (Selin A., SOMA's B2B customer) | `testkunde-b2b@soma.test` | `/pro` |
| Admin | `testadmin@soma.test` | `/admin` |

Useful postal codes for search: `10115` and `10435` (Berlin), `80331` (München), `20457` (Hamburg),
`50667` (Köln), `60311` (Frankfurt), `40213` (Düsseldorf).

### Photography

The art-directed photo set (`docs/art-direction.md`) was AI-generated for this prototype and is loaded
from its CDN until you store it locally:

```bash
npm run images:fetch     # downloads, crops to the documented focal points, writes public/images/**
```

If an image can't load, the UI renders the designed tone-on-tone fallback panels, so every page still
looks finished. The AI portraits are **illustrative demo material only**. Real providers upload their
own photos.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` / `npm start` | production build / server |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm test` | Vitest: unit tests (domain logic) + integration tests against `TEST_DATABASE_URL` |
| `npm run test:e2e` | Playwright journeys against a running build (`npm run build` first) |
| `npm run db:setup [-- --reset]` | apply shim + migrations + base seed |
| `npm run db:seed` | demo seed (refuses to run unless `DEMO_MODE=true`) |
| `npm run demo:refresh` | **run right before a demo**: demo seed + one maintenance run, all times relative to now (testkunde ↔ testkunde-b2b appointment starts in ≈ 35 min, open requests stay open ≥ 3 h); reads `.env.local` |
| `npm run images:fetch` | store the photo set locally |
| `npm run netlify:prepare` | Netlify build step: refuses a missing/localhost `DATABASE_URL`, applies migrations, reloads the demo data when `DEMO_MODE=true` |

---

## Architecture in one paragraph

Server Components read through a typed service layer (`src/server/services`). Client interactions go
through Server Actions (`src/server/actions`) that validate with zod and return `ActionResult`.
Postgres holds the business rules that must never be wrong: row-level security on every table,
switched per transaction exactly like Supabase (`withUser` / `withAnon`); an exclusion constraint
that makes double bookings impossible; triggers that reject invalid slots and invalid state
transitions. Auth, payments, storage and e-mail sit behind adapters, with fully working
development implementations and production implementations for Supabase, Stripe Connect and Resend.

## Documentation

| Document | Content |
|---|---|
| `docs/STATUS.md` | **implementation status, what was tested, QA scores, production blockers** |
| `docs/architecture.md` | stack decisions, security model, schema, booking engine, integration boundaries |
| `docs/api.md` | service and Server Action reference (signatures, DTOs, roles) |
| `docs/product-spec.md` | information architecture, journeys, taxonomy, policies, legal notes |
| `docs/research/competitive-analysis.md` | Blys, Selfkea, jeff, EveryWayz, Welladom, Glow2Go |
| `brand/BRAND_GUIDELINES.md`, `brand/LOGO_USAGE.md` | brand identity v1.2: logo, symbol, colour, type, arch motif, imagery, motion, applications |
| `brand/BRAND_STRATEGY.md`, `brand/BRAND_VOICE.md` | positioning, voice (*du*), copy rules, zero-tolerance rule |
| `brand/DESIGN_TOKENS/` | tokens (`tokens.json` source, `tokens.css` = `src/styles/tokens.css`), contrast table |
| `brand/audit/` | independent brand audits 1–3 |
| `docs/landing/` | landing brief, reference analysis, design spec, integration plan, audits |
| `docs/design-guideline.md` | product UI guideline (Design v2; colours and type superseded by brand v1.2) |
| `docs/art-direction.md` | original photographic language (superseded by `brand/photography/`) |
| `docs/qa/` | independent QA audit reports |
| `.claude/agents/` | the six specialist agent definitions used to build SOMA |

## Project layout

```
soma/
  brand/                brand identity v1.2 (docs, tokens, logo/icon masters, applications, audits)
  docs/                 specs, guidelines, QA reports; docs/landing/ for the landing page
  supabase/
    local/              Supabase shim for plain Postgres (auth schema, roles) — local only
    migrations/         schema, booking engine, RLS (Supabase-compatible)
    seed-data/          German postal-code centroids (+ provenance)
  scripts/db/           setup + seed
  scripts/images/       photo fetch pipeline
  src/
    app/                routes: (landing) (site) (checkout) (auth) konto pro admin api kit
    components/         ui (design system), brand, landing, site, pro, admin
    server/             db, auth, domain (pure logic), services, actions, payments, storage, email
    lib/                formatting (de-DE, Europe/Berlin), routes, images, brand
    styles/tokens.css   design tokens (Tailwind v4)
  tests/                unit, integration, e2e
```

## Production checklist (summary)

Development mode needs no external accounts. Going live requires the items listed in
`docs/STATUS.md` → *Production blockers*, notably a Supabase project (`AUTH_PROVIDER=supabase`,
pooled `DATABASE_URL`), Stripe Connect keys and webhook, an e-mail provider, legal review of all
customer-facing terms, and replacement of demo data and AI imagery.
