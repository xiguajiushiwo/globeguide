import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { handleMessaging } from '../src/messaging';
import type { SessionUser } from '../src/auth';
import type { Env } from '../src/env';
import { createSocialDatabase } from './social-fixtures';

const origin = 'https://globeguide.pages.dev';
const alice: SessionUser = { id: 'alice', email: 'alice@example.com', displayName: 'Alice', role: 'member', emailVerifiedAt: 'now' };
const bob: SessionUser = { id: 'bob', email: 'bob@example.com', displayName: 'Bob', role: 'member', emailVerifiedAt: 'now' };
let env: Env; let close: () => void;
function request(path: string, method: string, body?: unknown) { return new Request(`${origin}${path}`, { method, headers: { Origin: origin, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); }
async function call(path: string, method: string, user: SessionUser | null, body?: unknown) { const response = await handleMessaging(request(path, method, body), env, user); if (!response) throw new Error('unhandled'); return response; }
beforeEach(async () => { const fixture = createSocialDatabase(); env = { DB: fixture.db, ASSETS: { fetch: async () => new Response('asset') }, AUTH_SECRET: 'test-session-secret-with-at-least-thirty-two-characters', CODE_HMAC_KEY: 'test-code-key-with-at-least-thirty-two-characters' }; close = fixture.close; await env.DB.prepare(`INSERT INTO users (id,email,display_name,password_hash,email_verified_at,created_at,updated_at) VALUES ('alice','alice@example.com','Alice','x','now','now','now'),('bob','bob@example.com','Bob','x','now','now','now')`).run(); });
afterEach(() => close());

describe('conversations and messages', () => {
  it('reuses direct conversations and keeps cursor reads ordered', async () => {
    const created = await call('/api/conversations', 'POST', alice, { participantId: 'bob' }); expect(created.status).toBe(201); const id = (await created.json() as { id: string }).id;
    expect((await call('/api/conversations', 'POST', alice, { participantId: 'bob' })).status).toBe(200);
    expect((await call(`/api/conversations/${id}/messages`, 'POST', alice, { body: 'Hello Bob.' })).status).toBe(201);
    const second = await call(`/api/conversations/${id}/messages`, 'POST', bob, { body: 'Hello Alice.' }); expect(second.status).toBe(201);
    const firstPage = await call(`/api/conversations/${id}/messages`, 'GET', alice); const page = await firstPage.json() as { items: { id: string }[] }; expect(page.items).toHaveLength(2);
    const after = await call(`/api/conversations/${id}/messages?after=${page.items.at(-1)!.id}`, 'GET', alice); expect((await after.json() as { items: unknown[] }).items).toHaveLength(0);
  });
  it('supports group membership, read cursors, and sender-only deletion', async () => {
    const created = await call('/api/conversations', 'POST', alice, { kind: 'group', memberIds: ['bob'], name: 'Trip' }); const id = (await created.json() as { id: string }).id;
    const sent = await call(`/api/conversations/${id}/messages`, 'POST', alice, { body: 'A plain text message.' }); const messageId = (await sent.json() as { id: string }).id;
    expect((await call(`/api/conversations/${id}/read`, 'POST', alice, { messageId })).status).toBe(200);
    expect((await call(`/api/messages/${messageId}`, 'DELETE', bob)).status).toBe(404);
    expect((await call(`/api/messages/${messageId}`, 'DELETE', alice)).status).toBe(200);
    const messages = await call(`/api/conversations/${id}/messages`, 'GET', bob); expect((await messages.json() as { items: [{ body: string }] }).items[0]?.body).toBe('Message deleted');
  });
});
