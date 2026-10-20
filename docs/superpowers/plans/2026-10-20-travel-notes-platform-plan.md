# Travel Notes Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current Stories area into a global Travel Notes product with an understandable discovery feed, clear Guides/Moments vocabulary, author profiles, and a complete public-to-publish workflow.

**Architecture:** Keep `/stories/` as the stable route for existing links, but present it as `Travel Notes` and expose a `Guides & Moments` information architecture. Reuse the existing D1 post, draft, moderation, and report contracts; improve the static Next.js client through focused feed, card, detail, creator, and composer components. Editorial examples remain local original content with source references, while user posts remain plain text and moderation-gated.

**Tech Stack:** Next.js 15 static export, React 19, TypeScript, lucide-react, Cloudflare Pages Worker/D1, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-20-globeguide-platform-beta-design.md`

## Global Constraints

- Anonymous browsing must not depend on login or the email provider.
- Public posts are only approved posts; changing a published post requires renewed review.
- Do not copy third-party original text or images without permission; editorial examples are original and clearly labeled.
- Keep user posts plain text in this beta; do not add image uploads, comments, likes, follows, or private messaging in this slice.
- Keep `/stories/` and existing post URLs working while changing visible product language to Travel Notes.
- Saved places and trips remain browser-local and are not mixed with creator content.

---

### Task 1: Travel Notes language and navigation

**Files:**
- Modify: `apps/web/src/app/stories/page.tsx`
- Modify: `apps/web/src/app/stories/layout.tsx`
- Modify: `apps/web/src/components/site-header.tsx`
- Modify: `apps/web/src/components/story-composer.tsx`
- Modify: `apps/web/src/components/story-dashboard.tsx`
- Modify: `apps/web/src/components/story-viewer.tsx`
- Modify: `apps/web/src/lib/story-api.ts`
- Modify: `apps/web/src/app/stories/stories.css`

**Interfaces:** Existing API paths and `StoryType = 'guide' | 'moment'` remain unchanged. Visible labels become `Travel Notes`, `Guides`, `Moments`, `Write a note`, and `Your notes`.

- [x] Add a focused copy test or static assertions for the new navigation labels and preserve the `/stories/` route.
- [x] Replace user-facing “story” terminology with Travel Notes language, retaining “story” only where it describes the API status or legacy URL.
- [x] Update metadata, breadcrumbs, empty states, auth redirects, and creator controls so the full workflow uses the same vocabulary.
- [x] Run `pnpm --filter @globeguide/web typecheck` and confirm no API contract changes are needed.

### Task 2: Discovery feed and editorial examples

**Files:**
- Modify: `apps/web/src/components/stories-feed.tsx`
- Modify: `apps/web/src/components/story-card.tsx`
- Modify: `apps/web/src/lib/story-examples.ts`
- Modify: `apps/web/src/app/stories/stories.css`
- Test: `apps/web/src/lib/story-examples.test.ts`

**Interfaces:** `StoriesFeed` accepts the existing optional `authorId`; feed filters remain `destinationId`, `type`, and `cursor`. Editorial examples gain optional `sourceLabel` and `sourceUrl` fields used only for attribution.

- [x] Write tests requiring at least four original editorial examples, both content types, valid destination IDs, and HTTPS source links where a reference is shown.
- [x] Add a feed header with `Discover`, `Guides`, and `Moments` states, a compact destination filter, and an explicit `Write a note` action.
- [x] Add a featured editorial strip and a latest traveler feed state that handles loading, unavailable API, empty results, and pagination without hiding examples.
- [x] Improve cards with type, author, destination, reading context, editorial label, source attribution, and stable keyboard links; keep text clamped on small screens.
- [x] Run `pnpm --filter @globeguide/web test` and inspect desktop/mobile card layouts.

### Task 3: Post detail and creator profile experience

**Files:**
- Modify: `apps/web/src/app/stories/post/page.tsx`
- Modify: `apps/web/src/components/story-viewer.tsx`
- Modify: `apps/web/src/app/stories/creator/page.tsx`
- Modify: `apps/web/src/components/story-creator.tsx`
- Modify: `apps/web/src/app/stories/stories.css`

**Interfaces:** Public detail continues to load `getStory(id)` and editorial examples through `editorialExample(id)`. Creator pages continue to use `listStories({ authorId })` and add a profile summary without changing the Worker response shape.

- [x] Add a detail header that clearly distinguishes `Guide`, `Moment`, `GlobeGuide Editorial`, and verified traveler content.
- [x] Add destination context, publication date, reading-friendly body layout, and a related notes section using the same destination filter.
- [x] Build a creator profile header with display name, notes shown, destination coverage, and a link back to the feed; keep anonymous and missing-author states useful.
- [x] Preserve the report flow for real published posts and exclude the report action from editorial examples.
- [x] Run `pnpm --filter @globeguide/web typecheck` and static build checks for all post/profile routes.

### Task 4: Writer studio and moderation language

**Files:**
- Modify: `apps/web/src/components/story-composer.tsx`
- Modify: `apps/web/src/components/story-dashboard.tsx`
- Modify: `apps/web/src/components/story-moderation.tsx`
- Modify: `apps/web/src/app/stories/write/page.tsx`
- Modify: `apps/web/src/app/stories/mine/page.tsx`
- Modify: `apps/web/src/app/stories/moderation/page.tsx`
- Modify: `apps/web/src/app/stories/stories.css`

**Interfaces:** Existing `saveStory`, `submitStory`, `retractStory`, `deleteStory`, `getModerationQueue`, `moderateStory`, and report functions remain the only mutation clients.

- [x] Rename writer surfaces to `Write a note`, `Your notes`, `Creator studio`, and `Review queue` while preserving status values and API error handling.
- [x] Make the two content modes visually distinct: `Guide` asks for a title and practical context; `Moment` emphasizes a short personal observation.
- [x] Add clear review state messaging for draft, awaiting review, rejected, published, and withdrawn content.
- [x] Keep plain-text rights guidance and the no-image-upload limitation visible at the point of writing.
- [x] Verify authenticated, unauthenticated, and API-unavailable states in component tests or browser smoke coverage.

### Task 5: Browser acceptance and release documentation

**Files:**
- Modify: `apps/web/e2e/beta-flow.spec.ts`
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-10-20-globeguide-platform-beta-plan.md`

**Interfaces:** Browser smoke continues to run against the static export at `http://127.0.0.1:4173`; the public route remains `/stories/`.

- [x] Extend the desktop/mobile flow to open Travel Notes, switch Guides/Moments, open an editorial detail, and reach the writer entry point without login.
- [x] Add assertions for no horizontal overflow, visible editorial attribution, stable destination links, and the unavailable API empty state.
- [x] Update README product scope and route descriptions to call the area Travel Notes and document the original-content/reference policy.
- [x] Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm --filter @globeguide/web test:e2e`.
- [x] Review generated static routes and leave the workspace with only intentional source changes.

---

## Self-review

- The plan covers naming, discovery, detail, creator, publishing, moderation, attribution, and browser acceptance without changing the existing D1 contracts.
- No step introduces third-party copied content, image uploads, or unbounded social features.
- Every later task consumes only functions and response types already present or explicitly named in an earlier task.
- The existing `/stories/` URL remains stable, so current destination links and API-backed details do not break during the rename.
