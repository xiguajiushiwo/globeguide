import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';

import { handlePosts } from '../src/posts';
import type { D1Database, D1Statement, Env } from '../src/env';
import type { SessionUser } from '../src/auth';

const origin = 'https://globeguide.pages.dev';
const city = '10000000-0000-4000-8000-000000000061';
const schema = [
  readFileSync(fileURLToPath(new URL('../migrations/0001_auth.sql', import.meta.url)), 'utf8'),
  readFileSync(fileURLToPath(new URL('../migrations/0002_posts.sql', import.meta.url)), 'utf8'),
].join('\n');
let database: DatabaseSync;
let env: Env;
const alice: SessionUser = { id: 'alice', email: 'alice@example.com', displayName: 'Alice', role: 'member', emailVerifiedAt: '2026-10-20T00:00:00Z' };
const bob: SessionUser = { id: 'bob', email: 'bob@example.com', displayName: 'Bob', role: 'member', emailVerifiedAt: '2026-10-20T00:00:00Z' };
const admin: SessionUser = { id: 'admin', email: 'admin@example.com', displayName: 'Moderator', role: 'admin', emailVerifiedAt: '2026-10-20T00:00:00Z' };

function d1(db: DatabaseSync): D1Database {
  return {
    prepare(query: string): D1Statement {
      const statement = db.prepare(query);
      let parameters: unknown[] = [];
      return {
        bind(...values: unknown[]) { parameters = values; return this; },
        async first<T>() { return (statement.get(...parameters as []) ?? null) as T | null; },
        async run() { const result = statement.run(...parameters as []); return { success: true, meta: { changes: Number(result.changes) } }; },
        async all<T>() { return { results: statement.all(...parameters as []) as T[] }; },
      };
    },
    async batch(statements) { return Promise.all(statements.map((statement) => statement.run())); },
  };
}

function request(path: string, method: string, body?: unknown): Request {
  return new Request(`${origin}${path}`, {
    method, headers: { Origin: origin, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function call(path: string, method: string, user: SessionUser | null, body?: unknown): Promise<Response> {
  const response = await handlePosts(request(path, method, body), env, user);
  if (!response) throw new Error(`Unhandled posts route: ${method} ${path}`);
  return response;
}

beforeEach(() => {
  database = new DatabaseSync(':memory:');
  database.exec(schema);
  database.exec(`INSERT INTO users (id, email, display_name, role, password_hash, email_verified_at, created_at, updated_at)
    VALUES ('alice', 'alice@example.com', 'Alice', 'member', 'x', '2026-10-20T00:00:00Z', '2026-10-20T00:00:00Z', '2026-10-20T00:00:00Z'),
      ('bob', 'bob@example.com', 'Bob', 'member', 'x', '2026-10-20T00:00:00Z', '2026-10-20T00:00:00Z', '2026-10-20T00:00:00Z'),
      ('admin', 'admin@example.com', 'Moderator', 'admin', 'x', '2026-10-20T00:00:00Z', '2026-10-20T00:00:00Z', '2026-10-20T00:00:00Z')`);
  env = { DB: d1(database), ASSETS: { fetch: async () => new Response('asset') }, AUTH_SECRET: 'x', CODE_HMAC_KEY: 'x' };
});

const valid = { type: 'guide', title: 'A calm first day', body: 'This is an original plain text guide with enough useful detail for another traveler.', language: 'en', destinationId: city, visitedMonth: '2026-09' };

describe('creator publishing boundaries', () => {
  it('keeps drafts and pending posts private and prevents cross-author edits', async () => {
    const created = await call('/api/posts', 'POST', alice, valid);
    expect(created.status).toBe(201);
    const id = (await created.json() as { id: string }).id;
    expect((await call(`/api/posts/${id}`, 'PATCH', bob, valid)).status).toBe(404);
    expect((await call(`/api/posts/${id}`, 'GET', null)).status).toBe(404);
    expect((await call(`/api/posts/${id}/submit`, 'POST', alice, {})).status).toBe(200);
    await expect((await call('/api/posts', 'GET', null)).json()).resolves.toMatchObject({ items: [] });
    expect((await call(`/api/posts/${id}`, 'GET', null)).status).toBe(404);
  });

  it('requires renewed moderation after a published story is edited', async () => {
    const created = await call('/api/posts', 'POST', alice, valid);
    const id = (await created.json() as { id: string }).id;
    await call(`/api/posts/${id}/submit`, 'POST', alice, {});
    expect((await call(`/api/moderation/${id}/approve`, 'POST', admin, { reason: 'Looks good.' })).status).toBe(200);
    expect((await call(`/api/posts/${id}`, 'GET', null)).status).toBe(200);
    expect((await call(`/api/posts/${id}`, 'PATCH', alice, { ...valid, body: `${valid.body} Updated by the author.` })).status).toBe(200);
    expect((await call(`/api/posts/${id}`, 'GET', null)).status).toBe(404);
    expect((await call(`/api/moderation/${id}/approve`, 'POST', admin, { reason: 'Reviewed again.' })).status).toBe(200);
  });

  it('accepts a report and lets an admin dismiss it or take the story down', async () => {
    const created = await call('/api/posts', 'POST', alice, valid);
    const id = (await created.json() as { id: string }).id;
    await call(`/api/posts/${id}/submit`, 'POST', alice, {});
    await call(`/api/moderation/${id}/approve`, 'POST', admin, { reason: 'Approved.' });
    expect((await call('/api/reports', 'POST', bob, { postId: id, reason: 'This needs a factual review.' })).status).toBe(201);
    const queue = await call('/api/moderation/queue', 'GET', admin);
    const reportId = (await queue.json() as { reports: { id: string }[] }).reports[0]?.id;
    expect(reportId).toBeTypeOf('string');
    expect((await call(`/api/moderation/reports/${reportId}/dismiss`, 'POST', admin, { reason: 'Reviewed and no action needed.' })).status).toBe(200);
    await expect((await call('/api/moderation/queue', 'GET', admin)).json()).resolves.toMatchObject({ reports: [] });
  });

  it('rejects links and HTML in the plain text beta', async () => {
    expect((await call('/api/posts', 'POST', alice, { ...valid, body: 'Visit https://example.com for copied details and more text.' })).status).toBe(400);
    expect((await call('/api/posts', 'POST', alice, { ...valid, body: '<b>Bold</b> content with enough words for the test.' })).status).toBe(400);
  });
});
