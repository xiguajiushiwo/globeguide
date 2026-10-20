# GlobeGuide Platform Beta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the public GlobeGuide beta with a browsable world map, 37 city entries, secure account foundations, and moderated creator stories.

**Architecture:** Keep Next.js static export for public pages. Build a Cloudflare Pages advanced-mode Worker backed by D1 for same-origin authentication and creator data. Split the city catalog from the three existing deep guides; render public creator content from the API and leave a useful offline/empty state.

**Tech Stack:** Node.js 22+, pnpm 11, Next.js 15, React 19, MapLibre GL JS, Cloudflare Pages/Workers/D1, TypeScript, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-20-globeguide-platform-beta-design.md`

## Global Constraints

- The existing GitHub repository and installable source remain private; the beta URL remains public.
- Anonymous browsing must not depend on login or the email provider.
- Production registration must not claim to email a code without a real configured sender.
- Never copy third-party original text or images without permission; clearly label editorial examples.
- Existing local trips and saved places must remain usable and must not be represented as synced account data.
- Public posts are only approved posts; changing a published post requires renewed review.
- Only Tokyo, Paris, and New York have complete curated guides in this release.

---

### Task 1: Canonical City Catalog and Discovery

**Files:** `apps/web/src/lib/destinations.ts`, catalog tests, search and destination routes, homepage, sitemap, copy and scoped styles.

**Interfaces:** `destinations: Destination[]`, `getDestination(id)`, `searchDestinations(query)`, `featuredDestinations`; each destination has stable ID, names/aliases, WGS84 coordinates, region, short editorial summary and `guideId?`.

- [ ] Write tests for unique IDs, all 31 mainland centers plus Hong Kong/Macau/Taipei, coordinate bounds, searchable Chinese and English names, and retained deep-guide IDs.
- [ ] Add sourced city data; keep `guides.ts` limited to the three complete guides.
- [ ] Update search, destination static params/details, saved places and trip destination selection to use the canonical catalog without fabricating missing highlights.
- [ ] Rework home discovery so the hero stays focused, map and China directory are discoverable, and no grid of 37 generic cards appears.
- [ ] Run Web tests, typecheck and static build; review desktop/mobile layouts.

### Task 2: World Map

**Files:** `apps/web/src/app/map/*`, map/list components, catalog/map styles, package manifest and tests.

**Interfaces:** Map and list consume the Task 1 catalog; selecting a destination produces a stable URL to `/destinations/<id>/`.

- [ ] Add MapLibre GL JS with configurable OpenFreeMap style URL and attribution intact.
- [ ] Implement searchable/filterable map and list, selected-city preview, marker clustering or clear density handling, zoom reset and mobile map/list control.
- [ ] Keep the list keyboard usable and visible when map tiles or WebGL fail; do not request geolocation.
- [ ] Verify marker/list coordination and links in desktop/mobile browser tests, plus no horizontal overflow.

### Task 3: Persistent API and Auth

**Files:** `apps/edge/*`, D1 migration, package/build scripts, Pages config, auth pages and header, API tests.

**Interfaces:** Same-origin `/api/auth/code`, `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/reset`; `UserSummary` is `{id,email,displayName,role}`. The Worker forwards non-API requests to `env.ASSETS.fetch(request)`.

- [ ] Build Pages Worker/D1 wiring and migrations; prove static asset fallback still works locally.
- [ ] Implement challenge creation/consumption, test-only local mail sink, production mail adapter disabled unless configured, password hashing, sessions, Origin checks and rate limits.
- [ ] Add login, registration, password-reset and account states with clear email-delivery status; keep all public views open to guests.
- [ ] Test registration code lifecycle, wrong/expired code, duplicate email, login, logout, reset, session revocation, and unauthenticated mutation denial.
- [ ] Add secure admin bootstrap tooling that never commits credentials; configure D1 binding without modifying unrelated Cloudflare resources.

### Task 4: Creator Publishing and Moderation

**Files:** `apps/edge/src/posts*`, D1 migration, `apps/web/src/app/stories/*`, creator components and styles, API/browser tests.

**Interfaces:** Anonymous GET `/api/posts` and `/api/posts/:id` expose approved content only; authenticated author POST/PATCH/submit/delete operate only on their own records; admin moderation endpoints record audit events.

- [ ] Implement guide/moment drafts, city links, submit/review/publish/reject/takedown, author ownership and public visibility checks.
- [ ] Add creator profiles, drafts, compose/edit flow, city and type filters, public feed/detail and clearly labeled platform examples.
- [ ] Add a minimal report flow and admin moderation queue with reasons and activity records.
- [ ] Validate length, type, city ID, HTML/URL input and status transitions; add cross-user and unpublished-ID leakage tests.
- [ ] Verify guest browse and author/admin workflows in a real browser; defer author image uploads until storage and moderation are ready.

### Task 5: Release and Documentation

**Files:** `README.md`, CI, Cloudflare configuration, deployment scripts and release docs.

- [ ] Extend CI to build the Worker and run API plus desktop/mobile smoke tests with a local D1 fixture.
- [ ] Create a dedicated GlobeGuide D1 database, apply migration and bind it to the existing Pages project; preserve the private repository.
- [ ] Deploy the static Web plus Worker, verify homepage, catalog, map, anonymous stories and account error states at the public URL.
- [ ] Document test-mail limitation, authentic sender setup, moderation/admin workflow, city-source attribution and data privacy.
- [ ] Commit, push and confirm the new GitHub Actions run; leave the workspace clean.
