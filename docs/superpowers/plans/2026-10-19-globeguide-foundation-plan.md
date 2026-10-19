# GlobeGuide Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first executable milestone of GlobeGuide: a globalized monorepo with shared domain types, a modular API foundation, a web shell, a mobile shell, and the initial place/identity/trip boundaries defined in the approved platform design.

**Architecture:** Use a pnpm workspace managed by Turborepo. Keep the backend as a NestJS + Fastify modular monolith, with PostgreSQL/PostGIS as the system of record and OpenAPI as the client contract. Web and mobile consume the same generated API client and shared domain validation; no cross-module table writes are allowed.

**Tech Stack:** Node.js 22+, pnpm 11, TypeScript, Turborepo, Next.js, Expo/React Native, NestJS/Fastify, PostgreSQL/PostGIS, Prisma, Vitest, Playwright, ESLint, Prettier, OpenAPI.

**Spec:** `docs/superpowers/specs/2026-10-19-globeguide-platform-design.md`

## Global Constraints

- 全球数据模型，分阶段部署和运营。
- Web 负责搜索获客与深度阅读，移动 App 负责贡献、留存和旅行中使用。
- 用户内容围绕地点组织，不能成为与目的地脱节的信息流。
- 原始事实、用户经验、翻译和 AI 结论必须分开存储。
- 早期采用规则推荐；有足够行为数据后再引入学习排序。
- 先做模块化单体，不提前承担微服务和全球多活成本。
- 英语为首发界面语言，代码不得硬编码展示文案。
- 数据库保存 BCP 47 locale、IANA 时区和 ISO 货币代码。
- API 使用版本化 REST、游标分页、稳定错误码和幂等键。
- AI 不可用时，搜索、浏览、发布、收藏和手工行程仍可使用。

---

### Task 1: Workspace and Repository Tooling

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `.nvmrc`
- Create: `tsconfig.base.json`
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig.json`
- Create: `packages/config/src/index.ts`
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces workspace scripts: `pnpm build`, `pnpm lint`, `pnpm test`, and `pnpm typecheck`.
- Produces shared TypeScript, ESLint, and Prettier configuration consumed by every package.

- [ ] **Step 1: Write the workspace manifest and package manager constraints**

Set `packageManager` to `pnpm@11.19.0`, require Node `>=22.0.0`, and declare `apps/*` and `packages/*` workspace globs.

- [ ] **Step 2: Add the Turbo task graph**

Define `build` outputs, `dev` as persistent and uncached, and `lint`, `test`, and `typecheck` dependencies on upstream package tasks.

- [ ] **Step 3: Add shared compiler and formatting configuration**

Use strict TypeScript, ES2022 modules, NodeNext resolution, no implicit `any`, and consistent import ordering. Export named config paths from `packages/config/src/index.ts`.

- [ ] **Step 4: Add the CI workflow**

Run `pnpm install --frozen-lockfile`, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` on pushes and pull requests.

- [ ] **Step 5: Verify the repository tooling**

Run `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. Expected result: all commands exit 0 with no application code present yet.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json .gitignore .editorconfig .nvmrc tsconfig.base.json packages/config .github/workflows/ci.yml pnpm-lock.yaml
git commit -m "chore: bootstrap GlobeGuide workspace"
```

### Task 2: Shared Globalization and Domain Package

**Files:**
- Create: `packages/domain/package.json`
- Create: `packages/domain/src/locale.ts`
- Create: `packages/domain/src/geo.ts`
- Create: `packages/domain/src/place.ts`
- Create: `packages/domain/src/trip.ts`
- Create: `packages/domain/src/errors.ts`
- Create: `packages/domain/src/index.ts`
- Create: `packages/domain/test/locale.test.ts`
- Create: `packages/domain/test/place.test.ts`
- Create: `packages/domain/test/trip.test.ts`

**Interfaces:**
- `LocaleCode`, `TimeZoneId`, and `CurrencyCode` are branded string types validated by constructors.
- `PlaceId`, `TripId`, and `UserId` are opaque identifiers with parse/format helpers.
- `PlaceSummary`, `TripDraft`, and `TripItem` are JSON-safe schemas shared by API, web, and mobile.
- `DomainError` exposes a stable `code`, safe `messageKey`, and optional field violations.

- [ ] **Step 1: Write failing tests for locale and identifier validation**

Cover valid BCP 47 locales, IANA time zones, ISO 4217 currencies, UUID identifiers, and rejection of empty or malformed values.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run `pnpm --filter @globeguide/domain test -- locale.test.ts`. Expected result: module and constructors are not defined.

- [ ] **Step 3: Implement locale and identifier value objects**

Use `Intl.getCanonicalLocales` for locale normalization and `Intl.DateTimeFormat(..., { timeZone })` for time zone validation. Keep the original user-facing locale separate from normalized storage values.

- [ ] **Step 4: Write failing tests for place and trip invariants**

Verify that a place has a stable ID, coordinates in valid ranges, an IANA time zone, and that trip items reject invalid date ranges or duplicate ordering positions.

- [ ] **Step 5: Implement place and trip schemas**

Use Zod schemas as the runtime boundary and export inferred TypeScript types. Keep facts, posts, translations, and AI summaries as separate types; do not merge them into `PlaceSummary`.

- [ ] **Step 6: Run all domain tests and typecheck**

Run `pnpm --filter @globeguide/domain test`, `pnpm --filter @globeguide/domain typecheck`, and confirm PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/domain
git commit -m "feat: add shared global domain types"
```

### Task 3: API Application Shell and Error Contract

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/common/http-error.filter.ts`
- Create: `apps/api/src/common/request-context.middleware.ts`
- Create: `apps/api/src/health/health.module.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/test/health.e2e-spec.ts`
- Create: `apps/api/openapi/openapi.json`

**Interfaces:**
- `GET /v1/health` returns `{ status: "ok", version: string, requestId: string }`.
- All errors return `{ code: string, messageKey: string, requestId: string, details?: unknown }`.
- Every request receives or generates an `x-request-id` header.

- [ ] **Step 1: Write the health endpoint contract test**

Assert HTTP 200, the exact `status` value, a non-empty `version`, and an `x-request-id` response header. Add a second test asserting that a route error uses the stable error envelope.

- [ ] **Step 2: Run the API tests and confirm failure**

Run `pnpm --filter @globeguide/api test:e2e`. Expected result: the API package and health route do not exist.

- [ ] **Step 3: Implement the NestJS/Fastify application shell**

Enable URI versioning with prefix `v1`, JSON body limits, CORS from an environment allowlist, request IDs, structured logging, and the global error filter. Do not add business modules to `main.ts`.

- [ ] **Step 4: Implement the health module**

Return the application version from package metadata and keep external dependency checks behind a separate service so the health endpoint remains available during partial outages.

- [ ] **Step 5: Generate the initial OpenAPI document**

Expose `/docs` only in non-production environments and write the checked-in `openapi.json` from the controller decorators during the build task.

- [ ] **Step 6: Run API tests and lint**

Run `pnpm --filter @globeguide/api test:e2e`, `pnpm --filter @globeguide/api lint`, and `pnpm --filter @globeguide/api typecheck`. Expected result: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api
git commit -m "feat: add versioned API shell"
```

### Task 4: Persistence Foundation and Geography Module

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/202610190001_init/migration.sql`
- Create: `apps/api/src/database/database.module.ts`
- Create: `apps/api/src/geography/geography.module.ts`
- Create: `apps/api/src/geography/geography.service.ts`
- Create: `apps/api/src/geography/geography.controller.ts`
- Create: `apps/api/test/geography.e2e-spec.ts`
- Create: `apps/api/prisma/seed.ts`

**Interfaces:**
- `GET /v1/places/:placeId` returns a localized `PlaceSummary` with coordinates, time zone, currency, aliases, and freshness metadata.
- `GET /v1/places/search?q=&locale=&cursor=` returns cursor-paginated place summaries.
- Geography owns `Place`, `PlaceName`, and `PlaceRelation`; other modules access them through service methods only.

- [ ] **Step 1: Write failing geography contract tests**

Test exact place lookup, locale fallback from requested locale to English, cursor pagination, invalid coordinates, and a missing-place 404 error envelope.

- [ ] **Step 2: Run geography tests and confirm failure**

Run `pnpm --filter @globeguide/api test:e2e -- geography.e2e-spec.ts`. Expected result: routes and persistence models are missing.

- [ ] **Step 3: Add the initial PostGIS schema**

Create `Place`, `PlaceName`, `PlaceRelation`, `Source`, and `FactVersion` tables with UUID primary keys, `data_region`, BCP 47 locale, IANA time zone, ISO currency, `geography(Point, 4326)`, created/updated timestamps, and versioned fact metadata.

- [ ] **Step 4: Implement the geography service**

Use parameterized Prisma queries for exact ID lookup and search. Apply cursor pagination using `(updatedAt, id)` ordering and never expose raw database rows from controllers.

- [ ] **Step 5: Seed representative global data**

Seed Tokyo, Paris, and New York with country, city, alias, coordinate, time zone, currency, and one official source per city. Keep seed content deterministic and safe to rerun.

- [ ] **Step 6: Run migration, seed, and tests**

Run `pnpm --filter @globeguide/api prisma:migrate`, `pnpm --filter @globeguide/api prisma:seed`, and the geography e2e tests. Expected result: all tests PASS against a disposable PostgreSQL/PostGIS database.

- [ ] **Step 7: Commit**

```bash
git add apps/api/prisma apps/api/src/database apps/api/src/geography apps/api/test/geography.e2e-spec.ts
git commit -m "feat: add global geography module"
```

### Task 5: Web and Mobile Application Shells

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/destinations/[placeId]/page.tsx`
- Create: `apps/web/src/lib/api-client.ts`
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/src/App.tsx`
- Create: `apps/mobile/src/lib/api-client.ts`
- Create: `packages/api-client/package.json`
- Create: `packages/api-client/src/index.ts`

**Interfaces:**
- Web and mobile consume the same `PlaceSummary` and `SearchPlacesResponse` types from `@globeguide/api-client`.
- Web destination pages are server-rendered and addressable at `/destinations/:placeId`.
- Mobile has a stable navigation shell with destination search and a saved-trip placeholder route.

- [ ] **Step 1: Generate the typed API client from OpenAPI**

Configure the client package to generate request and response types from `apps/api/openapi/openapi.json`; fail generation when the document is invalid.

- [ ] **Step 2: Write the web destination page test**

Use Playwright to load a seeded place page and assert the place name, country, local time zone, source label, and accessible page title are present.

- [ ] **Step 3: Implement the Next.js web shell**

Use server rendering for public destination pages, locale-aware metadata, JSON-LD for a tourist destination, and a visible degraded state when the API is unavailable.

- [ ] **Step 4: Implement the Expo shell**

Add destination search, a destination detail screen, and a saved-trip route. Keep API calls behind the generated client and store no auth secrets in the bundle.

- [ ] **Step 5: Run web and mobile checks**

Run `pnpm --filter @globeguide/web test:e2e`, `pnpm --filter @globeguide/web typecheck`, and `pnpm --filter @globeguide/mobile typecheck`. Expected result: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web apps/mobile packages/api-client
git commit -m "feat: add web and mobile application shells"
```

### Task 6: Observability, Local Operations, and Release Gate

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `packages/config/src/env.ts`
- Create: `apps/api/src/telemetry/telemetry.module.ts`
- Create: `apps/api/src/telemetry/telemetry.service.ts`
- Create: `docs/runbooks/local-development.md`
- Create: `docs/runbooks/database-recovery.md`
- Create: `tests/smoke/core-flow.spec.ts`

**Interfaces:**
- Local development starts PostgreSQL/PostGIS with `docker compose up -d postgres`.
- Environment parsing fails fast for missing required values and never logs secrets.
- The smoke flow covers search -> destination page -> save request and records a request ID on failure.

- [ ] **Step 1: Add local PostgreSQL/PostGIS services**

Pin a PostgreSQL image with PostGIS, expose it only on localhost, mount a named volume, and add health checks. Do not include production credentials in compose files.

- [ ] **Step 2: Add environment validation**

Validate API port, database URL, public web URL, allowed origins, and log level with Zod. Keep third-party keys optional until their modules are introduced.

- [ ] **Step 3: Add structured telemetry**

Emit JSON logs with request ID, route, status, duration, and error code. Add OpenTelemetry hooks without requiring an external collector for local startup.

- [ ] **Step 4: Write the core smoke test**

Run against the local stack and assert that the seeded Tokyo flow can search, load a destination, and create a saved item through the API contract.

- [ ] **Step 5: Document startup and recovery**

Document exact commands for install, migration, seed, web, mobile, API, and database restore rehearsal. Include the required backup and restore verification from the platform design.

- [ ] **Step 6: Run the release gate**

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`, and the smoke test from a clean checkout. Expected result: all commands PASS and no secret values appear in logs.

- [ ] **Step 7: Commit**

```bash
git add docker-compose.yml .env.example packages/config/src/env.ts apps/api/src/telemetry docs/runbooks tests/smoke
git commit -m "chore: add local operations and release gate"
```

## Self-Review

- The plan covers the platform design's monorepo, shared domain, versioned API, geography model, Web/Mobile clients, global locale fields, source metadata, and operational baseline.
- Publishing, community, search, recommendation, AI, moderation, payments, and notifications remain separate follow-up plans because they are independent subsystems with their own testable contracts.
- No task relies on a hidden cross-module database write; Geography is the first domain boundary exposed through an application service.
- No placeholder markers are used; each task names concrete files, interfaces, tests, and commands.
