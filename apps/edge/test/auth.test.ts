import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';

import { handleAuth, resolveSession } from '../src/auth';
import type { D1Database, D1Statement, Env } from '../src/env';

const schema = readFileSync(fileURLToPath(new URL('../migrations/0001_auth.sql', import.meta.url)), 'utf8');
const origin = 'https://globeguide.pages.dev';
const email = 'traveler@example.com';
let database: DatabaseSync;
let env: Env;
let inbox: string[];

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

function call(path: string, data?: Record<string, unknown>, cookie?: string, requestOrigin = origin): Promise<Response> {
  const request = new Request(`${origin}${path}`, data ? {
    method: 'POST', headers: { Origin: requestOrigin, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(data),
  } : { headers: cookie ? { Cookie: cookie } : {} });
  return handleAuth(request, env).then((response) => response!);
}

function lastCode(): string {
  const match = inbox.at(-1)?.match(/\b\d{8}\b/);
  if (!match) throw new Error('No verification code in test inbox.');
  return match[0];
}

async function register() {
  expect((await call('/api/auth/code', { email, purpose: 'register' })).status).toBe(202);
  const response = await call('/api/auth/register', { email, code: lastCode(), password: 'A secure 12+ password', displayName: 'Traveler' });
  expect(response.status).toBe(201);
  return response.headers.get('Set-Cookie')!.split(';')[0]!;
}

beforeEach(() => {
  database = new DatabaseSync(':memory:');
  database.exec(schema);
  inbox = [];
  env = {
    DB: d1(database),
    ASSETS: { fetch: async () => new Response('asset') },
    AUTH_SECRET: 'test-session-secret-with-at-least-thirty-two-characters',
    CODE_HMAC_KEY: 'test-code-key-with-at-least-thirty-two-characters',
    MAIL_SINK: { async send(_to, _subject, body) { inbox.push(body); } },
  };
});

describe('email and password auth', () => {
  it('keeps registration unavailable when there is no real provider or test sink', async () => {
    delete env.MAIL_SINK;
    expect((await call('/api/auth/config').then((response) => response.json()) as { registrationAvailable: boolean }).registrationAvailable).toBe(false);
    expect((await call('/api/auth/code', { email, purpose: 'register' })).status).toBe(503);
    expect(inbox).toHaveLength(0);
  });

  it('requires a valid single-use email code before registration and creates a revocable session', async () => {
    await call('/api/auth/code', { email, purpose: 'register' });
    expect((await call('/api/auth/register', { email, code: '00000000', password: 'A secure 12+ password', displayName: 'Traveler' })).status).toBe(400);
    const code = lastCode();
    const created = await call('/api/auth/register', { email, code, password: 'A secure 12+ password', displayName: 'Traveler' });
    expect(created.status).toBe(201);
    expect(created.headers.get('Set-Cookie')).toContain('HttpOnly; Secure; SameSite=Lax');
    const cookie = created.headers.get('Set-Cookie')!.split(';')[0]!;
    const session = await resolveSession(new Request(`${origin}/api/auth/me`, { headers: { Cookie: cookie } }), env);
    expect(session?.email).toBe(email);
    expect(session?.role).toBe('member');
    expect((await call('/api/auth/register', { email, code, password: 'A secure 12+ password', displayName: 'Traveler' })).status).toBe(400);
    expect((await call('/api/auth/logout', {}, cookie)).status).toBe(200);
    expect(await resolveSession(new Request(`${origin}/api/auth/me`, { headers: { Cookie: cookie } }), env)).toBeNull();
  });

  it('rejects expired codes and never creates a user from a failed challenge', async () => {
    await call('/api/auth/code', { email, purpose: 'register' });
    database.exec('UPDATE auth_challenges SET expires_at = 1');
    expect((await call('/api/auth/register', { email, code: lastCode(), password: 'A secure 12+ password', displayName: 'Traveler' })).status).toBe(400);
    expect(database.prepare('SELECT count(*) AS total FROM users').get()).toEqual({ total: 0 });
  });

  it('locks a challenge after five wrong codes', async () => {
    await call('/api/auth/code', { email, purpose: 'register' });
    for (let attempt = 0; attempt < 5; attempt++) {
      expect((await call('/api/auth/register', { email, code: '00000000', password: 'A secure 12+ password', displayName: 'Traveler' })).status).toBe(400);
    }
    expect((await call('/api/auth/register', { email, code: lastCode(), password: 'A secure 12+ password', displayName: 'Traveler' })).status).toBe(400);
  });

  it('logs in by password, resets it by email code, and revokes earlier sessions', async () => {
    const initialCookie = await register();
    expect((await call('/api/auth/login', { email, password: 'wrong password' })).status).toBe(401);
    expect((await call('/api/auth/login', { email, password: 'A secure 12+ password' })).status).toBe(200);
    expect((await call('/api/auth/code', { email, purpose: 'reset' })).status).toBe(202);
    expect((await call('/api/auth/reset', { email, code: lastCode(), password: 'A different secure password' })).status).toBe(200);
    expect(await resolveSession(new Request(`${origin}/api/auth/me`, { headers: { Cookie: initialCookie } }), env)).toBeNull();
    expect((await call('/api/auth/login', { email, password: 'A secure 12+ password' })).status).toBe(401);
    expect((await call('/api/auth/login', { email, password: 'A different secure password' })).status).toBe(200);
  });

  it('rejects cross-origin writes and masks account existence in code requests', async () => {
    expect((await call('/api/auth/code', { email, purpose: 'register' }, undefined, 'https://other.example')).status).toBe(403);
    await register();
    expect((await call('/api/auth/code', { email, purpose: 'register' })).status).toBe(202);
    expect((await call('/api/auth/code', { email: 'missing@example.com', purpose: 'reset' })).status).toBe(202);
    expect(inbox).toHaveLength(1);
  });
});
