import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { handleSocial } from '../src/social';
import type { Env } from '../src/env';
import type { SessionUser } from '../src/auth';
import { createSocialDatabase } from './social-fixtures';

const origin = 'https://globeguide.pages.dev';
const alice: SessionUser = { id: 'alice', email: 'alice@example.com', displayName: 'Alice', role: 'member', emailVerifiedAt: 'now' };
const bob: SessionUser = { id: 'bob', email: 'bob@example.com', displayName: 'Bob', role: 'member', emailVerifiedAt: 'now' };
let env: Env; let close: () => void;
function request(path: string, method: string, body?: unknown) { return new Request(`${origin}${path}`, { method, headers: { Origin: origin, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); }
async function call(path: string, method: string, user: SessionUser | null, body?: unknown) { const response = await handleSocial(request(path, method, body), env, user); if (!response) throw new Error('unhandled'); return response; }
beforeEach(async () => { const fixture = createSocialDatabase(); env = { DB: fixture.db, ASSETS: { fetch: async () => new Response('asset') }, AUTH_SECRET: 'test-session-secret-with-at-least-thirty-two-characters', CODE_HMAC_KEY: 'test-code-key-with-at-least-thirty-two-characters' }; close = fixture.close; await env.DB.prepare(`INSERT INTO users (id,email,display_name,password_hash,email_verified_at,created_at,updated_at) VALUES ('alice','alice@example.com','Alice','x','now','now','now'),('bob','bob@example.com','Bob','x','now','now','now')`).run(); await env.DB.prepare(`INSERT INTO posts (id,author_id,type,body,language,destination_id,status,created_at,updated_at,published_at) VALUES ('post1','bob','moment','A published note with enough detail.','en','city','published','now','now','now')`).run(); });
afterEach(() => close());

describe('social relationships and interactions', () => {
  it('reads profiles, follows idempotently, and revokes follows on block', async () => {
    expect((await call('/api/profiles/bob', 'GET', null)).status).toBe(200);
    expect((await call('/api/follows/bob', 'POST', alice)).status).toBe(200);
    expect((await call('/api/follows/bob', 'POST', alice)).status).toBe(200);
    expect((await call('/api/blocks/bob', 'POST', alice)).status).toBe(200);
    expect((await call('/api/follows/bob', 'POST', alice)).status).toBe(403);
    expect((await env.DB.prepare('SELECT COUNT(*) AS count FROM follows').first<{ count: number }>())?.count).toBe(0);
  });
  it('toggles likes and validates two-level comments', async () => {
    expect((await call('/api/interactions/like/post1', 'POST', alice)).status).toBe(200);
    expect((await call('/api/interactions/like/post1', 'POST', alice)).status).toBe(200);
    const comment = await call('/api/comments', 'POST', alice, { postId: 'post1', body: 'Useful details, thank you.' });
    expect(comment.status).toBe(201); const id = (await comment.json() as { id: string }).id;
    expect((await call('/api/comments', 'POST', alice, { postId: 'post1', parentId: id, body: 'A helpful reply.' })).status).toBe(201);
    expect((await call('/api/comments', 'POST', alice, { postId: 'post1', parentId: 'missing', body: 'bad reply' })).status).toBe(400);
    expect((await call(`/api/comments/${id}`, 'DELETE', alice)).status).toBe(200);
  });

  it('accepts emoji, photo, sticker, and voice comment attachments', async () => {
    const photo = await call('/api/comments', 'POST', alice, { postId: 'post1', kind: 'photo', attachmentUrl: 'https://cdn.example.com/comment.jpg', body: '' });
    expect(photo.status).toBe(201);
    const voice = await call('/api/comments', 'POST', alice, { postId: 'post1', kind: 'voice', attachmentUrl: 'data:audio/webm;base64,AAAA', body: '' });
    expect(voice.status).toBe(201);
    const sticker = await call('/api/comments', 'POST', alice, { postId: 'post1', kind: 'sticker', body: '🎉' });
    expect(sticker.status).toBe(201);
    const comments = (await (await call('/api/comments?postId=post1', 'GET', null)).json() as { comments: { kind: string; attachmentUrl: string | null }[] }).comments;
    expect(comments).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'photo', attachmentUrl: 'https://cdn.example.com/comment.jpg' }),
      expect.objectContaining({ kind: 'voice', attachmentUrl: 'data:audio/webm;base64,AAAA' }),
      expect.objectContaining({ kind: 'sticker', body: '🎉' }),
    ]));
    expect((await call('/api/comments', 'POST', alice, { postId: 'post1', kind: 'photo', attachmentUrl: 'javascript:alert(1)', body: '' })).status).toBe(400);
  });
});
