import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SessionUser } from '../src/auth';
import type { Env } from '../src/env';
import { handleSocial } from '../src/social';
import { handleNotifications } from '../src/notifications';
import { handleMessaging } from '../src/messaging';
import { createSocialDatabase } from './social-fixtures';

const origin = 'https://globeguide.pages.dev';
const member = (id: string): SessionUser => ({ id, email: `${id}@example.test`, displayName: id, role: 'member', emailVerifiedAt: 'now' });
const alice = member('alice'), bob = member('bob'), carol = member('carol');
let env: Env;
let close: () => void;
async function call(path: string, user: SessionUser | null, method = 'GET', body?: unknown, requestOrigin = origin) {
  const request = new Request(origin + path, { method, headers: { Origin: requestOrigin, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const response = await handleNotifications(request, env, user) ?? await handleSocial(request, env, user) ?? await handleMessaging(request, env, user);
  if (!response) throw new Error('Unhandled route');
  return response;
}
async function comment(user: SessionUser, parentId?: string) {
  const response = await call('/api/comments', user, 'POST', { postId: 'post', body: '这里的旅行信息很有帮助。', parentId });
  expect(response.status).toBe(201);
  return (await response.json() as { id: string }).id;
}
type Page = { items: { id: string; kind: string; commentId: string; readAt: string | null }[]; unreadCount: number; nextCursor: string | null };
async function inbox(user: SessionUser, query = '') { return await (await call(`/api/notifications${query}`, user)).json() as Page; }

beforeEach(async () => {
  const fixture = createSocialDatabase(); close = fixture.close;
  env = { DB: fixture.db, ASSETS: { fetch: async () => new Response('asset') }, AUTH_SECRET: 'test-session-secret-with-at-least-thirty-two-characters', CODE_HMAC_KEY: 'test-code-key-with-at-least-thirty-two-characters' };
  for (const user of [alice, bob, carol]) await env.DB.prepare('INSERT INTO users (id,email,display_name,password_hash,email_verified_at,created_at,updated_at) VALUES (?,?,?, ?,?,?,?)').bind(user.id, user.email, user.displayName, 'private-hash', 'now', 'now', 'now').run();
  await env.DB.prepare("INSERT INTO posts (id,author_id,type,title,body,language,destination_id,status,created_at,updated_at) VALUES ('post','bob','guide','日本旅行','旅行攻略正文','zh-CN','city','published','now','now')").run();
});
afterEach(() => close());

describe('account and community journeys', () => {
  it('persists the owner profile without exposing email/password or allowing another user to edit it', async () => {
    const update = { displayName: '新的昵称', bio: '喜欢旅行', languages: '中文、日本語', travelPreferences: ['徒步'], avatarInitial: '旅' };
    expect((await call('/api/profiles/alice', bob, 'PATCH', update)).status).toBe(403);
    expect((await call('/api/profiles/alice', alice, 'PATCH', update, 'https://evil.example')).status).toBe(403);
    expect((await call('/api/profiles/alice', alice, 'PATCH', update)).status).toBe(200);
    const profile = await (await call('/api/profiles/alice', null)).json() as { profile: Record<string, unknown> };
    expect(profile.profile).toMatchObject({ displayName: '新的昵称', bio: '喜欢旅行', languages: '中文、日本語', avatarInitial: '旅' });
    expect(profile.profile).not.toHaveProperty('email'); expect(profile.profile).not.toHaveProperty('password_hash');
    expect((await call('/api/profiles/alice', alice, 'PATCH', { bio: '<script>bad</script>' })).status).toBe(400);
  });

  it('notifies the post author and reply recipient exactly once, excluding self notifications', async () => {
    const root = await comment(alice);
    expect((await inbox(bob)).items).toEqual([expect.objectContaining({ kind: 'comment', commentId: root })]);
    expect((await inbox(alice)).unreadCount).toBe(0);
    const reply = await comment(carol, root);
    expect((await inbox(bob)).unreadCount).toBe(2);
    expect((await inbox(alice)).items).toEqual([expect.objectContaining({ kind: 'reply', commentId: reply })]);
    const ownerComment = await comment(bob);
    await comment(alice, ownerComment);
    expect((await inbox(bob)).unreadCount).toBe(3);
    expect((await inbox(carol)).unreadCount).toBe(0);
  });

  it('requires authentication and scopes read state to the recipient', async () => {
    await comment(alice); const page = await inbox(bob); const notificationId = page.items[0]!.id;
    expect((await call('/api/notifications', null)).status).toBe(401);
    expect((await call('/api/notifications/read', alice, 'POST', { ids: [notificationId] })).status).toBe(200);
    expect((await inbox(bob)).unreadCount).toBe(1);
    expect((await call('/api/notifications/read', bob, 'POST', { ids: [notificationId] }, 'https://evil.example')).status).toBe(403);
    expect((await call('/api/notifications/read', bob, 'POST', { ids: [notificationId] })).status).toBe(200);
    expect((await inbox(bob)).unreadCount).toBe(0);
    expect((await inbox(bob, '?unread=1')).items).toHaveLength(0);
    await comment(alice);
    expect((await inbox(bob)).unreadCount).toBe(1);
  });

  it('hides deleted comments and withdrawn posts from both notifications and unread counts', async () => {
    const root = await comment(alice);
    await call(`/api/comments/${root}`, alice, 'DELETE');
    expect((await inbox(bob)).items).toHaveLength(0);
    expect((await inbox(bob)).unreadCount).toBe(0);
    await comment(alice);
    await env.DB.prepare("UPDATE posts SET status = 'draft' WHERE id = 'post'").run();
    expect((await inbox(bob)).items).toHaveLength(0);
    expect((await inbox(bob)).unreadCount).toBe(0);
  });

  it('blocks further comments and messages, filters notifications and allows explicit unblock', async () => {
    await comment(alice);
    const conversation = await (await call('/api/conversations', alice, 'POST', { participantId: 'bob' })).json() as { id: string };
    await call('/api/follows/bob', alice, 'POST');
    expect((await call('/api/blocks/alice', bob, 'POST')).status).toBe(200);
    expect((await inbox(bob)).unreadCount).toBe(0);
    expect((await inbox(bob)).items).toHaveLength(0);
    expect((await call('/api/comments', alice, 'POST', { postId: 'post', body: 'blocked comment' })).status).toBe(403);
    expect((await call(`/api/conversations/${conversation.id}/messages`, alice, 'POST', { body: 'blocked message' })).status).toBe(403);
    const blocks = await (await call('/api/blocks', bob)).json() as { items: { id: string }[] };
    expect(blocks.items.map((item) => item.id)).toEqual(['alice']);
    await call('/api/blocks/alice', bob, 'DELETE');
    expect((await call(`/api/conversations/${conversation.id}/messages`, alice, 'POST', { body: 'message after unblock' })).status).toBe(201);
    expect((await env.DB.prepare('SELECT COUNT(*) AS count FROM follows').first<{ count: number }>())?.count).toBe(0);
  });

  it('paginates without losing notifications that share the same timestamp', async () => {
    const root = await comment(alice);
    const stamp = '2026-10-29T00:00:00Z';
    await env.DB.prepare('DELETE FROM notifications').run();
    for (let index = 0; index < 35; index++) {
      const id = `comment-${index.toString().padStart(3, '0')}`;
      await env.DB.prepare('INSERT INTO post_comments (id, post_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, 'post', 'alice', 'Comment', stamp).run();
      await env.DB.prepare('INSERT INTO notifications (id, recipient_id, actor_id, comment_id, kind, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, 'bob', 'alice', id, 'comment', stamp).run();
    }
    const first = await inbox(bob); expect(first.items).toHaveLength(30);
    const second = await inbox(bob, `?cursor=${first.nextCursor}`); expect(second.items).toHaveLength(5);
    expect(new Set([...first.items, ...second.items].map((item) => item.id)).size).toBe(35);
    expect((await call(`/api/notifications?cursor=${first.nextCursor}`, alice)).status).toBe(400);
    expect(second.nextCursor).toBeNull(); expect(root).toBeTruthy();
  });
});
