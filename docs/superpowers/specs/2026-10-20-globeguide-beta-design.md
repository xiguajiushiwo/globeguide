# GlobeGuide Web Beta Design

Date: 2026-10-20
Status: implementation scope

## Purpose

Deliver a travel guide that invited testers can use from a stable public URL. Keep the GitHub repository private. The beta covers three editorially maintained destinations (Tokyo, Paris, New York) while the place data model continues to support global expansion.

The first useful journey is: discover a destination, read practical source-linked information, save places, create an editable trip, and return to that trip later. The interface must distinguish published facts from editorial suggestions and avoid implying that a seed record is an official source.

## Scope

1. Replace sparse city records with curated guide sections: orientation, getting around, practical essentials, and a short list of places to visit. Every time-sensitive claim has a source URL, source name, and checked date. Editorial tips are labelled separately. City-specific recommendations are informative, not booking inventory.
2. Search across the three curated cities and guide highlights. Results open working destination pages. Search accepts common alternate names where the existing place database knows them. Empty, loading, and unavailable states are usable.
3. Keep saved places in the browser and add a local trip planner with destination, dates, notes, and ordered stops. Edits persist across reloads in that browser. Export and import use a versioned JSON file so testers can back up or move plans without an account. No account sync is implied.
4. Provide a responsive Web/PWA experience with clear navigation among Explore, Saved, and Trips. Public destination pages retain metadata and structured data. Keyboard operation and reduced-motion behavior are required.
5. Publish a clear README for testers and collaborators, including product scope, requirements, setup, environment variables, database migration/seed, commands, test gates, privacy limitations, and deployment steps. Provide a command-line bootstrap for authorized collaborators. Private package distribution must require GitHub authorization; no private source is published to the public npm registry.
6. Deploy the self-contained Web beta to a stable Cloudflare Pages URL. The hosted beta uses the three versioned city guides and browser-local trips, so it remains available without a live database or the owner's computer. Keep the existing API and PostgreSQL workflow for local development and future account sync. Keep secrets out of the repo and verify a live smoke flow.

## Deliberate Beta Limits

- The initial beta is Web-first. Native iOS/Android, community posting, AI itineraries, payments, and cross-device accounts remain subsequent milestones in the platform design.
- A saved trip is browser-local and exportable. The product must say so where a user makes or retrieves a trip.
- Only the three curated destinations have detailed guides. Other global records may be searched but must not appear to have complete editorial coverage.
- No claim about price, opening hours, visa, safety, or transit operation is presented without a traceable source and date. Link users to the current official page for information likely to change.

## Components and Data Flow

- `apps/api` remains the place source of record for local development and exposes the existing geography API. Curated guide content is kept as versioned repository data keyed by stable place ID, then rendered by the Web app. This avoids a premature publishing CMS while allowing a future content module to import the same records.
- `apps/web` statically renders the three destination pages and searches the bundled city guides in the browser. Browser storage owns saved places and trip drafts; all stored data is schema-validated before use. The build exports static files for Cloudflare Pages.
- A small distribution CLI validates Node/pnpm/Git prerequisites, clones the authorized private repository, installs dependencies, and prints the exact database and start steps. It never embeds credentials or prompts users to paste tokens into a command argument.
- Hosted beta users need only the site URL. They do not install Node or access the private repository.

## Failure Handling and Verification

- If the API is down, the deployed beta's curated guides, search, saved places, and local trips continue to work because they use bundled content.
- Invalid or old local trip data is ignored with a recoverable import path; malformed import files cannot replace existing plans.
- Tests cover guide source integrity, trip storage validation and editing, CLI prerequisites, API integration, and browser search-to-trip flow. CI runs lint, typecheck, tests, build, and a browser smoke test against the exported site.
- Release acceptance requires a deployed URL, successful live search and destination load, saved trip persistence after reload, successful export/import, responsive desktop/mobile checks, private repo visibility, and green CI.
