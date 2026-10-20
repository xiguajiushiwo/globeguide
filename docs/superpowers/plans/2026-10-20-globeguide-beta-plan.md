# GlobeGuide Web Beta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a source-linked three-city GlobeGuide beta with saved places, editable browser-local trips, private collaborator bootstrap, and a stable Cloudflare Pages URL.

**Architecture:** Bundle curated city guides into the Next.js Web build and statically export all public routes. Keep the NestJS/PostgreSQL API for local development; hosted beta journeys use versioned bundled content and browser storage. A dependency-free root CLI helps authorized GitHub collaborators clone and set up the private monorepo.

**Tech Stack:** Node.js 22+, pnpm 11, TypeScript, Next.js 15, React 19, Vitest, Playwright, Cloudflare Pages, NestJS, Prisma/PostgreSQL.

**Spec:** `docs/superpowers/specs/2026-10-20-globeguide-beta-design.md`

## Global Constraints

- Keep `xiguajiushiwo/globeguide` and installable source private.
- Hosted Web beta is static and must work without a running API or database.
- Curated detail is limited to Tokyo, Paris, and New York.
- Saved data stays in the browser; export/import provides portability, not account sync.
- Time-sensitive travel facts require a source URL and checked date.
- Do not introduce public package publishing, AI output, booking, payments, or user posts in this release.

---

### Task 1: Curated Guide Data and Static Routes

**Files:**
- Create: `apps/web/src/lib/guides.ts`
- Create: `apps/web/src/lib/guides.test.ts`
- Modify: `apps/web/src/lib/places.ts`
- Modify: `apps/web/src/app/destinations/[placeId]/page.tsx`
- Modify: `apps/web/src/app/search/page.tsx`
- Modify: `apps/web/next.config.ts`
- Modify: `apps/web/package.json`

**Interfaces:**
- `CityGuide` contains `place: PlaceSummary`, `intro`, `sections`, `highlights`, and source records `{ label, url, checkedAt }`.
- `getGuide(placeId: string): CityGuide | undefined` and `searchGuides(query: string): CityGuide[]` power the static routes.

- [ ] Add a failing test that requires three unique guide IDs, valid HTTPS source links for factual items, and useful results for city names and common aliases.
- [ ] Add the three guide records with source links and checked dates; mark unsourced recommendations as editorial.
- [ ] Render guide content and source attribution on destination pages. Generate all three route params and retain metadata/JSON-LD.
- [ ] Make search use bundled guides, including empty and no-results states. Remove production reliance on `127.0.0.1:3001`.
- [ ] Set Next.js `output: 'export'`, use compatible image settings, and verify `pnpm --filter @globeguide/web build` creates `apps/web/out`.
- [ ] Run guide tests, lint, typecheck, and build; commit the focused change.

### Task 2: Browser-Local Trip Planner

**Files:**
- Create: `apps/web/src/lib/trips.ts`
- Create: `apps/web/src/lib/trips.test.ts`
- Create: `apps/web/src/app/trips/page.tsx`
- Create: `apps/web/src/components/trip-planner.tsx`
- Create: `apps/web/src/app/trips/trips.css`
- Modify: `apps/web/src/components/site-header.tsx`
- Modify: `apps/web/src/lib/copy.ts`
- Modify: `apps/web/package.json`

**Interfaces:**
- `Trip` has schema version, ID, title, destination ID, start/end dates, notes, ordered highlight IDs, and update timestamp.
- `readTrips`, `saveTrip`, `deleteTrip`, `exportTrips`, and `importTrips` validate local data and preserve existing trips on invalid input.

- [ ] Add failing tests for trip creation/edit, date validation, ordered stops, reload round-trip, and rejected malformed import.
- [ ] Implement schema-validated storage and versioned export/import.
- [ ] Build the trip list/editor with add, remove, reorder, notes, date editing, import/export, and clear browser-local labeling.
- [ ] Link the planner from navigation and destination guides. Keep all controls keyboard accessible and responsive.
- [ ] Run tests, lint, typecheck, and build; commit the focused change.

### Task 3: Private Collaborator Install and README

**Files:**
- Create: `bin/gbg.mjs`
- Create: `test/gbg.test.mjs`
- Create: `README.md`
- Create: `.env.example`
- Modify: `package.json`

**Interfaces:**
- `npm exec --yes --package=git+https://github.com/xiguajiushiwo/globeguide.git -- gbg init <directory>` clones the private repository after GitHub authentication and installs workspace dependencies.
- `gbg doctor` reports Node, Git, Corepack/pnpm, and PostgreSQL readiness without printing secrets.

- [ ] Add tests for CLI help, invalid arguments, existing target directory, and prerequisite diagnostics.
- [ ] Add a dependency-free root CLI and package bin mapping; never place credentials in arguments or logs.
- [ ] Write README sections for product scope, tester URL, private access, one-command download, local DB setup, migration/seed, running Web/API, test gates, and data privacy.
- [ ] Test the npm Git package command with existing repository credentials in a temporary directory, plus local test and typecheck; commit the focused change.

### Task 4: Cloudflare Release and End-to-End Gate

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/beta-flow.spec.ts`
- Modify: `.github/workflows/ci.yml`
- Update: `README.md`

**Interfaces:**
- The Cloudflare Pages project serves `apps/web/out` at a stable `pages.dev` URL.
- Browser smoke covers Explore -> search -> destination -> save -> create/edit trip -> reload -> export/import.

- [ ] Add a Playwright browser test against the static export served locally; assert desktop and mobile flows.
- [ ] Add the browser test to CI with an explicit static-site start step.
- [ ] Authenticate Wrangler to the user's Cloudflare account, create the Pages project, and deploy `apps/web/out` without exposing repository secrets.
- [ ] Run browser smoke against the public URL and verify responsive screenshots, correct source links, private GitHub visibility, and green CI.
- [ ] Record the final URL, exact installer command, limitations, and release checks in README; commit and push.

## Review

- Every beta capability in the spec maps to a task above.
- Deployment depends on Cloudflare account authorization; Tasks 1-3 and local Task 4 testing can proceed independently.
- External publication is limited to the user-requested beta site. No source or package is published to a public registry.
