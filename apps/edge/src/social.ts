import { requireOrigin } from './auth.js';
import type { SessionUser } from './auth.js';
import type { Env } from './env.js';

const MAX_TEXT = 2000;
type ProfileRow = { id: string; display_name: string; bio: string | null; avatar_initial: string | null; languages: string | null; travel_preferences: string | null; created_at: string; updated_at: string; deleted_at: string | null; };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}
function error(status: number, code: string): Response { return json({ error: code }, status); }
function plainText(value: string): boolean {
  return !/<\s*\/?\s*[a-z!][^>]*>/i.test(value) && !/!\[[^\]]*\]\([^)]*\)/.test(value) && !/(https?:\/\/|www\.)/i.test(value);
}
async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return null;
  try { const value: unknown = await request.json(); return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null; } catch { return null; }
}
function writer(request: Request, user: SessionUser | null): Response | null {
  if (!user) return error(401, 'login_required');
  if (!user.emailVerifiedAt) return error(403, 'email_not_verified');
  if (!requireOrigin(request)) return error(403, 'invalid_origin');
  return null;
}
function id(value: string | null): boolean { return Boolean(value && value.length <= 100 && /^[A-Za-z0-9_-]+$/.test(value)); }
function presentProfile(row: ProfileRow, counts: { followers: number; following: number; posts: number }, following: boolean, blocked: boolean) {
  return { id: row.id, displayName: row.display_name, bio: row.bio, avatarInitial: row.avatar_initial, languages: row.languages, travelPreferences: row.travel_preferences, createdAt: row.created_at, updatedAt: row.updated_at, counts, following, blocked };
}

export async function blockedBetween(env: Env, left: string, right: string): Promise<boolean> {
  if (left === right) return false;
  const row = await env.DB.prepare('SELECT 1 AS blocked FROM blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?) LIMIT 1').bind(left, right, right, left).first<{ blocked: number }>();
  return Boolean(row);
}
async function userExists(env: Env, userId: string): Promise<boolean> {
  const row = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first<{ id: string }>();
  return Boolean(row);
}
async function profileRow(env: Env, userId: string): Promise<ProfileRow | null> {
  return env.DB.prepare(`SELECT u.id, u.display_name, p.bio, p.avatar_initial, p.languages, p.travel_preferences,
    COALESCE(p.created_at, u.created_at) AS created_at, COALESCE(p.updated_at, u.updated_at) AS updated_at, p.deleted_at
    FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = ?`).bind(userId).first<ProfileRow>();
}
async function profileResponse(env: Env, idValue: string, viewer: SessionUser | null): Promise<Response> {
  const row = await profileRow(env, idValue);
  if (!row || row.deleted_at) return error(404, 'profile_not_found');
  if (viewer && viewer.id !== idValue && await blockedBetween(env, viewer.id, idValue)) return error(404, 'profile_not_found');
  const [followers, following, posts] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS count FROM follows f WHERE f.following_id = ? AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = f.follower_id AND b.blocked_id = ?) OR (b.blocker_id = ? AND b.blocked_id = f.follower_id))').bind(idValue, idValue, idValue).first<{ count: number }>(),
    env.DB.prepare('SELECT COUNT(*) AS count FROM follows f WHERE f.follower_id = ? AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = f.following_id AND b.blocked_id = ?) OR (b.blocker_id = ? AND b.blocked_id = f.following_id))').bind(idValue, idValue, idValue).first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM posts WHERE author_id = ? AND status = 'published' AND deleted_at IS NULL").bind(idValue).first<{ count: number }>(),
  ]);
  const isFollowing = viewer ? Boolean(await env.DB.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').bind(viewer.id, idValue).first()) : false;
  const blocked = viewer ? await blockedBetween(env, viewer.id, idValue) : false;
  return json({ profile: presentProfile(row, { followers: followers?.count ?? 0, following: following?.count ?? 0, posts: posts?.count ?? 0 }, isFollowing, blocked) });
}

async function patchProfile(request: Request, env: Env, user: SessionUser): Promise<Response> {
  const body = await readJson(request);
  if (!body) return error(400, 'invalid_profile');
  const existing = await profileRow(env, user.id);
  const displayName = body.displayName === undefined ? existing?.display_name ?? user.displayName : body.displayName;
  const bio = body.bio === undefined ? existing?.bio ?? null : body.bio;
  const avatarInitial = body.avatarInitial === undefined ? existing?.avatar_initial ?? null : body.avatarInitial;
  const languages = body.languages === undefined && body.language === undefined ? existing?.languages ?? null : body.languages ?? body.language;
  const travelPreferences = body.travelPreferences === undefined ? existing?.travel_preferences ?? null : body.travelPreferences;
  if (typeof displayName !== 'string' || displayName.trim().length < 2 || displayName.trim().length > 48 || !plainText(displayName)) return error(400, 'invalid_profile');
  if (bio !== null && (typeof bio !== 'string' || bio.length > 500 || !plainText(bio))) return error(400, 'invalid_profile');
  if (avatarInitial !== null && (typeof avatarInitial !== 'string' || avatarInitial.trim().length > 3 || !plainText(avatarInitial))) return error(400, 'invalid_profile');
  const listValue = (value: unknown) => {
    if (value === null) return null;
    if (Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length <= 40 && plainText(item))) return JSON.stringify(value);
    return typeof value === 'string' && value.length <= 500 && plainText(value) ? value.trim() : undefined;
  };
  const langValue = listValue(languages); const prefValue = listValue(travelPreferences);
  if (langValue === undefined || prefValue === undefined) return error(400, 'invalid_profile');
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?').bind(displayName.trim(), now, user.id),
    env.DB.prepare(`INSERT INTO profiles (user_id, bio, avatar_initial, languages, travel_preferences, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET bio = excluded.bio, avatar_initial = excluded.avatar_initial,
      languages = excluded.languages, travel_preferences = excluded.travel_preferences, updated_at = excluded.updated_at, deleted_at = NULL`)
      .bind(user.id, bio === null ? null : (bio as string).trim(), avatarInitial === null ? null : (avatarInitial as string).trim(), langValue, prefValue, now, now),
  ]);
  return profileResponse(env, user.id, user);
}

async function follow(request: Request, env: Env, user: SessionUser, target: string, add: boolean): Promise<Response> {
  if (!id(target) || !(await userExists(env, target))) return error(404, 'profile_not_found');
  if (target === user.id) return error(400, 'cannot_follow_self');
  if (await blockedBetween(env, user.id, target)) return error(403, 'blocked');
  if (add) await env.DB.prepare('INSERT OR IGNORE INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)').bind(user.id, target, new Date().toISOString()).run();
  else await env.DB.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').bind(user.id, target).run();
  const counts = await env.DB.prepare('SELECT COUNT(*) AS count FROM follows WHERE following_id = ?').bind(target).first<{ count: number }>();
  return json({ following: add, targetId: target, counts: { followers: counts?.count ?? 0 } });
}
async function removeFollower(env: Env, user: SessionUser, target: string): Promise<Response> {
  if (!id(target)) return error(400, 'invalid_profile');
  await env.DB.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').bind(target, user.id).run();
  return json({ removed: true, followerId: target });
}
async function blocksList(env: Env, user: SessionUser): Promise<Response> {
  const rows = await env.DB.prepare(`SELECT u.id, u.display_name AS displayName, b.created_at AS createdAt FROM blocks b JOIN users u ON u.id = b.blocked_id WHERE b.blocker_id = ? ORDER BY b.created_at DESC`).bind(user.id).all();
  return json({ items: rows.results ?? [] });
}
async function block(env: Env, user: SessionUser, target: string, add: boolean): Promise<Response> {
  if (!id(target) || !(await userExists(env, target))) return error(404, 'profile_not_found');
  if (target === user.id) return error(400, 'cannot_block_self');
  if (add) {
    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare('INSERT OR IGNORE INTO blocks (blocker_id, blocked_id, created_at) VALUES (?, ?, ?)').bind(user.id, target, now),
      env.DB.prepare('DELETE FROM follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)').bind(user.id, target, target, user.id),
    ]);
  } else await env.DB.prepare('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?').bind(user.id, target).run();
  return json({ blocked: add, targetId: target });
}

async function interaction(request: Request, env: Env, user: SessionUser | null, kind: string, postId: string, add: boolean): Promise<Response> {
  if (!['like', 'bookmark', 'share'].includes(kind)) return error(404, 'endpoint_not_found');
  const post = await env.DB.prepare("SELECT id, author_id FROM posts WHERE id = ? AND status = 'published' AND deleted_at IS NULL").bind(postId).first<{ id: string; author_id: string }>();
  if (!post) return error(404, 'post_not_found');
  if (user && await blockedBetween(env, user.id, post.author_id)) return error(403, 'blocked');
  if (!user) return error(401, 'login_required');
  const now = new Date().toISOString();
  if (kind === 'like') {
    if (add) await env.DB.prepare('INSERT OR IGNORE INTO post_likes (actor_id, post_id, created_at) VALUES (?, ?, ?)').bind(user.id, postId, now).run();
    else await env.DB.prepare('DELETE FROM post_likes WHERE actor_id = ? AND post_id = ?').bind(user.id, postId).run();
  } else if (kind === 'bookmark') {
    if (add) await env.DB.prepare('INSERT OR IGNORE INTO post_bookmarks (actor_id, post_id, created_at) VALUES (?, ?, ?)').bind(user.id, postId, now).run();
    else await env.DB.prepare('DELETE FROM post_bookmarks WHERE actor_id = ? AND post_id = ?').bind(user.id, postId).run();
  } else if (add) await env.DB.prepare('INSERT INTO post_shares (id, actor_id, post_id, created_at) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), user.id, postId, now).run();
  const counts = await countsForPost(env, postId, user.id);
  return json(counts);
}
async function countsForPost(env: Env, postId: string, viewerId?: string) {
  const [likes, bookmarks, shares, comments] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ?').bind(postId).first<{ count: number }>(),
    env.DB.prepare('SELECT COUNT(*) AS count FROM post_bookmarks WHERE post_id = ?').bind(postId).first<{ count: number }>(),
    env.DB.prepare('SELECT COUNT(*) AS count FROM post_shares WHERE post_id = ?').bind(postId).first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM post_comments WHERE post_id = ? AND status = 'published' AND deleted_at IS NULL").bind(postId).first<{ count: number }>(),
  ]);
  const liked = viewerId ? Boolean(await env.DB.prepare('SELECT 1 FROM post_likes WHERE actor_id = ? AND post_id = ?').bind(viewerId, postId).first()) : false;
  const bookmarked = viewerId ? Boolean(await env.DB.prepare('SELECT 1 FROM post_bookmarks WHERE actor_id = ? AND post_id = ?').bind(viewerId, postId).first()) : false;
  return { counts: { likes: likes?.count ?? 0, bookmarks: bookmarks?.count ?? 0, shares: shares?.count ?? 0, comments: comments?.count ?? 0 }, liked, bookmarked };
}

async function commentsGet(url: URL, env: Env, user: SessionUser | null): Promise<Response> {
  const postId = url.searchParams.get('postId');
  if (!id(postId)) return error(400, 'invalid_post');
  const post = await env.DB.prepare("SELECT author_id FROM posts WHERE id = ? AND status = 'published' AND deleted_at IS NULL").bind(postId).first<{ author_id: string }>();
  if (!post) return error(404, 'post_not_found');
  if (user && await blockedBetween(env, user.id, post.author_id)) return error(403, 'blocked');
  const rows = await env.DB.prepare(`SELECT c.id, c.post_id AS postId, c.author_id AS authorId, u.display_name AS authorName,
    c.parent_id AS parentId, c.body, c.status, c.created_at AS createdAt, c.deleted_at AS deletedAt
    FROM post_comments c JOIN users u ON u.id = c.author_id WHERE c.post_id = ? AND NOT EXISTS
    (SELECT 1 FROM blocks b WHERE (b.blocker_id = c.author_id AND b.blocked_id = ?) OR (b.blocker_id = ? AND b.blocked_id = c.author_id))
    ORDER BY c.created_at ASC, c.id ASC LIMIT 200`).bind(postId, user?.id ?? '', user?.id ?? '').all<Record<string, unknown>>();
  return json({ comments: (rows.results ?? []).map((row) => ({
    id: row.id,
    postId: row.postId,
    authorId: row.authorId,
    authorName: row.authorName,
    author: { id: row.authorId, displayName: row.authorName },
    parentId: row.parentId,
    body: row.status === 'removed' || row.deletedAt ? 'Comment deleted' : row.body,
    status: row.status,
    createdAt: row.createdAt,
    deletedAt: row.deletedAt,
  })), nextCursor: null });
}
async function commentsPost(request: Request, env: Env, user: SessionUser): Promise<Response> {
  const body = await readJson(request); const postId = typeof body?.postId === 'string' ? body.postId : null; const text = typeof body?.body === 'string' ? body.body.trim() : ''; const parentId = body?.parentId === null || body?.parentId === undefined ? null : typeof body.parentId === 'string' ? body.parentId : undefined;
  if (!id(postId) || !text || text.length > MAX_TEXT || !plainText(text) || parentId === undefined) return error(400, 'invalid_comment');
  const post = await env.DB.prepare("SELECT author_id FROM posts WHERE id = ? AND status = 'published' AND deleted_at IS NULL").bind(postId).first<{ author_id: string }>();
  if (!post) return error(404, 'post_not_found');
  if (await blockedBetween(env, user.id, post.author_id)) return error(403, 'blocked');
  if (parentId) {
    const parent = await env.DB.prepare('SELECT id, post_id, parent_id, author_id FROM post_comments WHERE id = ? AND status = \'published\'').bind(parentId).first<{ id: string; post_id: string; parent_id: string | null; author_id: string }>();
    if (!parent || parent.post_id !== postId || parent.parent_id) return error(400, 'invalid_comment_parent');
    if (await blockedBetween(env, user.id, parent.author_id)) return error(403, 'blocked');
  }
  const commentId = crypto.randomUUID(); const now = new Date().toISOString();
  await env.DB.prepare('INSERT INTO post_comments (id, post_id, author_id, parent_id, body, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(commentId, postId, user.id, parentId, text, now).run();
  const comment = { id: commentId, postId, parentId, body: text, createdAt: now, author: { id: user.id, displayName: user.displayName } };
  return json({ ...comment, comment }, 201);
}
async function commentDelete(env: Env, user: SessionUser, commentId: string): Promise<Response> {
  const row = await env.DB.prepare('SELECT author_id FROM post_comments WHERE id = ? AND status = \'published\'').bind(commentId).first<{ author_id: string }>();
  if (!row || row.author_id !== user.id) return error(404, 'comment_not_found');
  const now = new Date().toISOString(); await env.DB.prepare("UPDATE post_comments SET status = 'removed', deleted_at = ?, body = '' WHERE id = ?").bind(now, commentId).run();
  return json({ id: commentId, deleted: true });
}
async function socialReport(request: Request, env: Env, user: SessionUser): Promise<Response> {
  const body = await readJson(request); if (!body) return error(400, 'invalid_report');
  let targetType = typeof body.targetType === 'string' ? body.targetType : ''; let targetId = typeof body.targetId === 'string' ? body.targetId : '';
  if (!targetType && typeof body.postId === 'string') { targetType = 'post'; targetId = body.postId; }
  if (!targetType && typeof body.commentId === 'string') { targetType = 'comment'; targetId = body.commentId; }
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!['user', 'post', 'comment', 'message'].includes(targetType) || !id(targetId) || reason.length < 10 || reason.length > 500 || !plainText(reason)) return error(400, 'invalid_report');
  const exists = targetType === 'user' ? await userExists(env, targetId) : await env.DB.prepare(`SELECT id FROM ${targetType === 'post' ? 'posts' : targetType === 'comment' ? 'post_comments' : 'messages'} WHERE id = ?`).bind(targetId).first();
  if (!exists) return error(404, 'target_not_found');
  if (await env.DB.prepare('SELECT 1 FROM social_reports WHERE reporter_id = ? AND target_type = ? AND target_id = ?').bind(user.id, targetType, targetId).first()) return error(409, 'already_reported');
  await env.DB.prepare('INSERT INTO social_reports (id, reporter_id, target_type, target_id, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), user.id, targetType, targetId, reason, new Date().toISOString()).run();
  return json({ status: 'received' }, 201);
}

export async function handleSocial(request: Request, env: Env, user: SessionUser | null): Promise<Response | null> {
  const url = new URL(request.url); const path = url.pathname; const method = request.method.toUpperCase();
  if (!path.startsWith('/api/profiles') && !path.startsWith('/api/follows') && !path.startsWith('/api/followers') && !path.startsWith('/api/blocks') && !path.startsWith('/api/interactions') && !path.startsWith('/api/comments') && !path.startsWith('/api/social-reports')) return null;
  if (method !== 'GET') { const denied = writer(request, user); if (denied) return denied; }
  const profileMatch = /^\/api\/profiles\/([A-Za-z0-9_-]+)$/.exec(path);
  if (profileMatch) { if (method === 'GET') return profileResponse(env, profileMatch[1]!, user); if (method === 'PATCH') return profileMatch[1] === user?.id ? patchProfile(request, env, user!) : error(403, 'forbidden'); return error(405, 'method_not_allowed'); }
  if (path === '/api/profiles' && method === 'GET') { const profileId = url.searchParams.get('id'); return profileId && id(profileId) ? profileResponse(env, profileId, user) : error(400, 'invalid_profile'); }
  if (path === '/api/follows' || path.startsWith('/api/follows/')) { const target = path.split('/')[3]; if (!target) return error(400, 'invalid_profile'); if (method !== 'POST' && method !== 'DELETE') return error(405, 'method_not_allowed'); return follow(request, env, user!, target, method === 'POST'); }
  if (path.startsWith('/api/followers/')) { const target = path.split('/')[3]; return method === 'DELETE' && target ? removeFollower(env, user!, target) : error(405, 'method_not_allowed'); }
  if (path === '/api/blocks' && method === 'GET') return user ? blocksList(env, user) : error(401, 'login_required');
  if (path.startsWith('/api/blocks/')) { const target = path.split('/')[3]; if (!target) return error(400, 'invalid_profile'); if (method !== 'POST' && method !== 'DELETE') return error(405, 'method_not_allowed'); return block(env, user!, target, method === 'POST'); }
  const interactionMatch = /^\/api\/interactions\/(like|bookmark|share)\/([A-Za-z0-9_-]+)$/.exec(path);
  if (interactionMatch && (method === 'POST' || method === 'DELETE')) return interaction(request, env, user, interactionMatch[1]!, interactionMatch[2]!, method === 'POST');
  if (path === '/api/interactions' && method === 'GET') {
    const postId = url.searchParams.get('postId'); if (!postId || !id(postId)) return error(400, 'invalid_post');
    const post = await env.DB.prepare("SELECT author_id FROM posts WHERE id = ? AND status = 'published' AND deleted_at IS NULL").bind(postId).first<{ author_id: string }>();
    if (!post) return error(404, 'post_not_found');
    if (user && await blockedBetween(env, user.id, post.author_id)) return error(403, 'blocked');
    return countsForPost(env, postId, user?.id).then((value) => json(value));
  }
  if (path === '/api/comments' && method === 'GET') return commentsGet(url, env, user);
  if (path === '/api/comments' && method === 'POST') return commentsPost(request, env, user!);
  const commentMatch = /^\/api\/comments\/([A-Za-z0-9_-]+)$/.exec(path); if (commentMatch && method === 'DELETE') return commentDelete(env, user!, commentMatch[1]!);
  if (path === '/api/social-reports' && method === 'POST') return socialReport(request, env, user!);
  return error(404, 'endpoint_not_found');
}
