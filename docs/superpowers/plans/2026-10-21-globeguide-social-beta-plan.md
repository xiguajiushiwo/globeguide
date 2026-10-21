# GlobeGuide Social Beta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a text-only social beta with profiles, follows, blocks, post interactions, comments, direct messages, group chats, moderation, and seeded system accounts.

**Architecture:** Extend the existing same-origin Cloudflare Pages Worker and D1 database. Keep public browsing anonymous, require verified sessions for writes, and use D1 cursor polling for messages. Keep the static Next.js export as the web shell and load social data through client-side API calls.

**Tech Stack:** Next.js 15 static export, React, TypeScript, lucide-react, Cloudflare Worker, D1 SQLite, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-21-globeguide-social-beta-design.md`

## Global Constraints

- First release is plain text only; no image, video, audio, file, external preview, or arbitrary HTML uploads.
- Guests can browse published posts and public profiles; verified sessions are required for interactions, messaging, and publishing.
- Every mutating request must pass the existing same-origin and session checks.
- Blocked users are filtered from public lists and cannot interact, message, or invite one another.
- User content is soft-deleted and moderation actions retain actor, reason, and timestamp.
- Test credentials are generated or supplied through environment variables and never committed.
- Preserve unrelated existing homepage animation changes in `apps/web/src/app/globals.css`, `apps/web/src/components/home-hero.tsx`, and `apps/web/src/components/journey-planner.tsx`.

---

### Task 1: Social D1 schema and test database helpers

**Files:**
- Create: `apps/edge/migrations/0003_social.sql`
- Modify: `apps/edge/test/posts.test.ts`
- Create: `apps/edge/test/social-fixtures.ts`

**Interfaces:**
- Produces tables `profiles`, `follows`, `blocks`, `post_comments`, `post_likes`, `post_bookmarks`, `post_shares`, `conversations`, `conversation_members`, `messages`, `message_reads`, and `social_reports`.
- Produces test helper `createSocialDatabase(): { db: D1Database; close(): void }` that applies migrations 0001 through 0003.

- [ ] **Step 1: Write schema assertions first**

Add a Vitest test that applies all migrations and verifies each table exists, each relationship has a foreign key, and duplicate `(actor_id, post_id)` likes/bookmarks and duplicate `(follower_id, following_id)` follows fail with a unique constraint.

- [ ] **Step 2: Add the migration**

Define text IDs, ISO timestamps, soft-delete columns, foreign keys with explicit `ON DELETE` behavior, indexes for feed and message cursors, and checks for `conversation_members.role`, `messages.kind`, `social_reports.target_type`, and report status. Add a data copy from `post_reports` into `social_reports` so existing reports use the unified queue.

- [ ] **Step 3: Run the focused worker tests**

Run `pnpm --filter @globeguide/edge test -- --run apps/edge/test/social-fixtures.test.ts` and verify the failure becomes a passing schema test.

- [ ] **Step 4: Commit the schema**

```powershell
git add apps/edge/migrations/0003_social.sql apps/edge/test/social-fixtures.ts apps/edge/test/posts.test.ts
git commit -m "feat: add social beta database schema"
```

### Task 2: Profiles, relationships, interactions, comments, and reports API

**Files:**
- Create: `apps/edge/src/social.ts`
- Modify: `apps/edge/src/index.ts`
- Create: `apps/edge/test/social.test.ts`

**Interfaces:**
- `handleSocial(request: Request, env: Env, user: SessionUser | null): Promise<Response | null>` handles `/api/profiles`, `/api/follows`, `/api/blocks`, `/api/interactions`, `/api/comments`, and `/api/social-reports`.
- Response objects expose `profile`, `following`, `blocked`, `counts`, `comments`, and `nextCursor` fields without email, password, or session data.

- [ ] **Step 1: Add failing API tests**

Cover anonymous profile reads, verified-session profile edits, follow/unfollow idempotency, follower removal, block revocation of follows, like/bookmark toggles, share count, two-level comment validation, soft deletion, report creation, and blocked-user filtering.

- [ ] **Step 2: Implement shared validation and visibility helpers**

Use `resolveSession` and `requireOrigin`; reject unverified writers, self-follow, self-block, messages longer than 2,000 characters, comments deeper than one parent, and duplicate reports. Centralize a `blockedBetween(env, viewerId, targetId)` query and apply it to every public relationship and interaction read.

- [ ] **Step 3: Implement profile and relationship routes**

Support `GET/PATCH /api/profiles/:id`, `POST/DELETE /api/follows/:id`, `DELETE /api/followers/:id`, `POST/DELETE /api/blocks/:id`, and `GET /api/blocks`. Ensure blocking deletes both follow directions in one D1 batch.

- [ ] **Step 4: Implement post interactions and comments**

Support `POST/DELETE /api/interactions/:kind/:postId` for `like`, `bookmark`, and `share`; support `GET/POST /api/comments`, `DELETE /api/comments/:id`, and `POST /api/social-reports`. Return counts and the current viewer state in one response.

- [ ] **Step 5: Run API tests and commit**

Run `pnpm --filter @globeguide/edge test -- --run apps/edge/test/social.test.ts`, then commit:

```powershell
git add apps/edge/src/social.ts apps/edge/src/index.ts apps/edge/test/social.test.ts
git commit -m "feat: add social relationships and post interactions"
```

### Task 3: Direct messages and group chat API

**Files:**
- Create: `apps/edge/src/messaging.ts`
- Modify: `apps/edge/src/index.ts`
- Create: `apps/edge/test/messaging.test.ts`

**Interfaces:**
- `handleMessaging(request: Request, env: Env, user: SessionUser | null): Promise<Response | null>` handles `/api/conversations` and `/api/messages`.
- `GET /api/conversations/:id/messages?after=<messageId>` returns `{ items, nextCursor }`; message bodies are plain text and deleted messages are returned as `Message deleted`.

- [ ] **Step 1: Write failing messaging tests**

Cover one-to-one conversation creation, idempotent reuse, group creation, member roles, invite/remove/leave, mute, send/delete message, read cursor, blocked-user rejection, and cursor ordering without duplicates.

- [ ] **Step 2: Implement conversation authorization**

Require membership for reads and writes. Allow group owner/admin membership changes, prevent removing the owner, and reject invitations when a block exists in either direction.

- [ ] **Step 3: Implement message operations**

Validate plain text and the 2,000-character limit, insert messages with monotonic ISO timestamps plus IDs for cursor ordering, soft-delete only the sender’s messages, and update `message_reads` atomically.

- [ ] **Step 4: Run tests and commit**

Run `pnpm --filter @globeguide/edge test -- --run apps/edge/test/messaging.test.ts`, then commit:

```powershell
git add apps/edge/src/messaging.ts apps/edge/src/index.ts apps/edge/test/messaging.test.ts
git commit -m "feat: add direct messages and group chats"
```

### Task 4: Web API client and reusable social controls

**Files:**
- Modify: `apps/web/src/lib/story-api.ts`
- Create: `apps/web/src/lib/social-api.ts`
- Create: `apps/web/src/components/social-actions.tsx`
- Create: `apps/web/src/components/comment-thread.tsx`
- Modify: `apps/web/src/app/stories/stories.css`

**Interfaces:**
- `social-api.ts` exports `getProfile`, `updateProfile`, `followUser`, `unfollowUser`, `removeFollower`, `blockUser`, `unblockUser`, `toggleLike`, `toggleBookmark`, `recordShare`, `listComments`, `createComment`, `deleteComment`, and `reportSocialTarget`.
- `SocialActions` accepts `{ postId: string; initial: SocialState; authenticated: boolean }` and emits sign-in links for unauthenticated actions.
- `CommentThread` accepts `{ postId: string; authenticated: boolean }` and renders two-level comments with pending/error states.

- [ ] **Step 1: Add client tests for API parsing and error mapping**

Test each request path, method, JSON body, cursor, `login_required`, `blocked`, and `rate_limited` messages using mocked `fetch`.

- [ ] **Step 2: Implement the typed API client**

Reuse `StoryApiError` and `requestJson` conventions; map social errors to concise English messages and never expose raw database errors.

- [ ] **Step 3: Implement actions and comments**

Use lucide icons with accessible labels, optimistic counts with rollback on failure, copy the current post URL for share, and keep comments plain text with a visible two-level reply relationship.

- [ ] **Step 4: Run web tests and commit**

Run `pnpm --filter @globeguide/web test` and `pnpm --filter @globeguide/web typecheck`, then commit:

```powershell
git add apps/web/src/lib/social-api.ts apps/web/src/lib/story-api.ts apps/web/src/components/social-actions.tsx apps/web/src/components/comment-thread.tsx apps/web/src/app/stories/stories.css
git commit -m "feat: add web social interaction controls"
```

### Task 5: Profiles, feed tabs, inbox, and story integration

**Files:**
- Create: `apps/web/src/app/profiles/[id]/page.tsx`
- Create: `apps/web/src/app/inbox/page.tsx`
- Create: `apps/web/src/components/profile-view.tsx`
- Create: `apps/web/src/components/inbox-view.tsx`
- Modify: `apps/web/src/components/stories-feed.tsx`
- Modify: `apps/web/src/components/story-card.tsx`
- Modify: `apps/web/src/components/story-viewer.tsx`
- Modify: `apps/web/src/components/site-header.tsx`
- Modify: `apps/web/src/app/stories/stories.css`

**Interfaces:**
- Profile pages use `GET /api/profiles/:id`; the inbox uses conversation and message APIs with a five-second refresh while a conversation is open.
- Story cards and story detail consume `SocialActions` and `CommentThread` without changing the existing editorial examples.

- [ ] **Step 1: Add route shells and loading states**

Create accessible profile and inbox pages that work in the static export and show a sign-in state for private operations.

- [ ] **Step 2: Add profile and relationship controls**

Show follow state, counts, public posts, block/report menus, and a link to start a conversation. Hide blocked users and private controls according to API responses.

- [ ] **Step 3: Add feed tabs and story actions**

Add `For you`, `Following`, and `Saved` controls to the Travel Notes feed; preserve editorial examples in `For you` and keep guests on the public view.

- [ ] **Step 4: Add inbox and group chat controls**

Render conversation list, create-group dialog, member management, mute, leave, message composer, delete action, read state, and polling cleanup on unmount.

- [ ] **Step 5: Run browser tests and commit**

Extend `apps/web/e2e/beta-flow.spec.ts` for guest browsing, signed-in interactions, profile follow/block, comments, and a two-user message flow. Run `pnpm --filter @globeguide/web test:e2e`, then commit:

```powershell
git add apps/web/src/app/profiles apps/web/src/app/inbox apps/web/src/components/profile-view.tsx apps/web/src/components/inbox-view.tsx apps/web/src/components/stories-feed.tsx apps/web/src/components/story-card.tsx apps/web/src/components/story-viewer.tsx apps/web/src/components/site-header.tsx apps/web/src/app/stories/stories.css apps/web/e2e/beta-flow.spec.ts
git commit -m "feat: add social profiles feed and inbox"
```

### Task 6: Seed system accounts, documentation, and migration verification

**Files:**
- Create: `apps/edge/scripts/seed-social-demo.mjs`
- Modify: `apps/edge/package.json`
- Modify: `README.md`
- Create: `apps/edge/test/seed-social-demo.test.ts`

- [ ] **Step 1: Add deterministic seed behavior**

Create four verified users and published sample posts using `DEMO_PASSWORD` or generated one-time passwords. Use `INSERT OR IGNORE`, print credentials once, and never write them to files or source control.

- [ ] **Step 2: Document migration and seed commands**

Document local and remote D1 commands, rollback limitations, demo account names, message polling behavior, block semantics, and the text-only media boundary. Do not document actual passwords.

- [ ] **Step 3: Test idempotency**

Run the seed twice against an in-memory D1-compatible test database and assert the user/post counts stay unchanged.

- [ ] **Step 4: Commit documentation and seed**

```powershell
git add apps/edge/scripts/seed-social-demo.mjs apps/edge/package.json apps/edge/test/seed-social-demo.test.ts README.md
git commit -m "feat: add social beta demo accounts and runbook"
```

### Task 7: Full verification and Cloudflare release

**Files:**
- Modify: `docs/superpowers/specs/2026-10-21-globeguide-social-beta-design.md` (set status to implemented after acceptance)

- [ ] **Step 1: Run focused checks**

Run `pnpm --filter @globeguide/edge test`, `pnpm --filter @globeguide/web test`, `pnpm --filter @globeguide/web typecheck`, and `git diff --check`.

- [ ] **Step 2: Build the static web app**

Run `pnpm --filter @globeguide/web build` and verify the static export includes `/profiles/[id]`, `/inbox`, `/stories`, and existing destination pages.

- [ ] **Step 3: Apply D1 migration and seed**

Run `npx wrangler d1 migrations apply globeguide-beta --remote` and the documented seed command with a one-time `DEMO_PASSWORD`; capture the command output without storing credentials in Git.

- [ ] **Step 4: Deploy and smoke test**

Run `npx --yes wrangler@4.151.2 pages deploy ../web/out --project-name globeguide --branch main --commit-dirty=true`. Check the home page, `/stories/`, `/profiles/<demo-id>/`, `/inbox/`, and `/map/` return HTTP 200; verify guests can browse and signed-in demo users can follow, comment, bookmark, share, message, and create a group.

- [ ] **Step 5: Commit the accepted status and push**

```powershell
git add docs/superpowers/specs/2026-10-21-globeguide-social-beta-design.md
git commit -m "docs: mark social beta design implemented"
git push origin main
```
