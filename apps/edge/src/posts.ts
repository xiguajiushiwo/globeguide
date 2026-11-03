import { isDestinationId } from '@globeguide/domain';

import { requireOrigin } from './auth.js';
import type { SessionUser } from './auth.js';
import type { Env } from './env.js';

type PostType = 'guide' | 'moment';
type PostFormat = 'text' | 'video' | 'gallery' | 'live';
type PostStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'removed';
type PostRow = {
  id: string;
  author_id: string;
  author_name: string;
  type: PostType;
  format: PostFormat;
  title: string | null;
  body: string;
  language: string;
  destination_id: string;
  visited_month: string | null;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  published_at: string | null;
  media_json: string | null;
  live_url: string | null;
  live_starts_at: string | null;
};

type PostInput = {
  type: PostType;
  format: PostFormat;
  title: string | null;
  body: string;
  language: string;
  destinationId: string;
  visitedMonth: string | null;
  mediaUrls: string[];
  liveUrl: string | null;
  liveStartsAt: string | null;
};

const postColumns = `p.id, p.author_id, u.display_name AS author_name, p.type, p.title, p.body,
  p.language, p.destination_id, p.visited_month, p.status, p.created_at,
  p.updated_at, p.submitted_at, p.published_at, p.format, p.media_json,
  p.live_url, p.live_starts_at`;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function error(status: number, code: string): Response {
  return json({ error: code }, status);
}

function present(row: PostRow) {
  let mediaUrls: string[] = [];
  try {
    const parsed: unknown = row.media_json ? JSON.parse(row.media_json) : [];
    if (Array.isArray(parsed)) mediaUrls = parsed.filter((value): value is string => typeof value === 'string');
  } catch {
    mediaUrls = [];
  }
  return {
    id: row.id,
    author: { id: row.author_id, displayName: row.author_name },
    type: row.type,
    format: row.format || 'text',
    title: row.title,
    body: row.body,
    language: row.language,
    destinationId: row.destination_id,
    visitedMonth: row.visited_month,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    publishedAt: row.published_at,
    mediaUrls,
    liveUrl: row.live_url,
    liveStartsAt: row.live_starts_at,
  };
}

function plainText(value: string): boolean {
  return !/<\s*\/?\s*[a-z!][^>]*>/i.test(value) && !/!\[[^\]]*\]\([^)]*\)/.test(value)
    && !/(https?:\/\/|www\.)/i.test(value);
}

function safeMediaUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length < 8 || value.length > 2_048) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function parseMediaUrls(value: unknown, format: PostFormat): string[] | null {
  if (value === undefined || value === null) return format === 'text' || format === 'live' ? [] : null;
  if (!Array.isArray(value) || value.length > 9 || !value.every(safeMediaUrl)) return null;
  const urls = value as string[];
  if (format === 'video' && urls.length !== 1) return null;
  if (format === 'gallery' && urls.length < 1) return null;
  return urls;
}

function validIsoDate(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value));
}

function parseInput(value: unknown): PostInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.type !== 'guide' && record.type !== 'moment') return null;
  if (typeof record.body !== 'string' || typeof record.language !== 'string') return null;
  if (typeof record.destinationId !== 'string' || !isDestinationId(record.destinationId)) return null;

  const format = record.format === undefined ? 'text' : record.format;
  if (format !== 'text' && format !== 'video' && format !== 'gallery' && format !== 'live') return null;

  const body = record.body.trim();
  const title = typeof record.title === 'string' ? record.title.trim() || null : null;
  const visitedMonth = record.visitedMonth === null || record.visitedMonth === undefined
    ? null : record.visitedMonth;
  if (body.length < 20 || body.length > 6000 || !plainText(body)) return null;
  if (title && (title.length > 120 || !plainText(title))) return null;
  if (record.type === 'guide' && (!title || title.length < 4)) return null;
  if (title !== null && title.length < 4) return null;
  if (!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(record.language)) return null;
  if (visitedMonth !== null && (typeof visitedMonth !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(visitedMonth))) return null;
  const mediaUrls = parseMediaUrls(record.mediaUrls, format);
  if (!mediaUrls) return null;
  const liveUrl = record.liveUrl === undefined || record.liveUrl === null ? null : record.liveUrl;
  if (liveUrl !== null && !safeMediaUrl(liveUrl)) return null;
  if (format === 'live' && !liveUrl && !validIsoDate(record.liveStartsAt)) return null;
  const liveStartsAt = record.liveStartsAt === undefined || record.liveStartsAt === null ? null : record.liveStartsAt;
  if (liveStartsAt !== null && !validIsoDate(liveStartsAt)) return null;
  return {
    type: record.type,
    format,
    title,
    body,
    language: record.language,
    destinationId: record.destinationId,
    visitedMonth: visitedMonth as string | null,
    mediaUrls,
    liveUrl,
    liveStartsAt,
  };
}

async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function postById(env: Env, id: string): Promise<PostRow | null> {
  return env.DB.prepare(`SELECT ${postColumns} FROM posts p JOIN users u ON u.id = p.author_id WHERE p.id = ?`)
    .bind(id).first<PostRow>();
}

function requireWriter(request: Request, user: SessionUser | null): Response | null {
  if (!user) return error(401, 'login_required');
  if (!user.emailVerifiedAt) return error(403, 'email_not_verified');
  if (!requireOrigin(request)) return error(403, 'invalid_origin');
  return null;
}

async function publicList(url: URL, env: Env, user: SessionUser | null): Promise<Response> {
  const destinationId = url.searchParams.get('destinationId');
  const type = url.searchParams.get('type');
  const format = url.searchParams.get('format');
  const authorId = url.searchParams.get('authorId');
  const feed = url.searchParams.get('feed') ?? 'for-you';
  const cursor = Number(url.searchParams.get('cursor') ?? '0');
  if (destinationId && !isDestinationId(destinationId)) return error(400, 'invalid_destination');
  if (type && type !== 'guide' && type !== 'moment') return error(400, 'invalid_type');
  if (format && format !== 'text' && format !== 'video' && format !== 'gallery' && format !== 'live') return error(400, 'invalid_format');
  if (authorId && (authorId.length > 80 || !/^[\w-]+$/.test(authorId))) return error(400, 'invalid_author');
  if (feed !== 'for-you' && feed !== 'following' && feed !== 'saved') return error(400, 'invalid_feed');
  if ((feed === 'following' || feed === 'saved') && !user) return error(401, 'login_required');
  if (!Number.isSafeInteger(cursor) || cursor < 0 || cursor > 10000) return error(400, 'invalid_cursor');

  const conditions = ["p.status = 'published'"];
  const bindings: string[] = [];
  if (destinationId) { conditions.push('p.destination_id = ?'); bindings.push(destinationId); }
  if (type) { conditions.push('p.type = ?'); bindings.push(type); }
  if (format) { conditions.push('p.format = ?'); bindings.push(format); }
  if (authorId) { conditions.push('p.author_id = ?'); bindings.push(authorId); }
  if (feed === 'following') { conditions.push('EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = p.author_id)'); bindings.push(user!.id); }
  if (feed === 'saved') { conditions.push('EXISTS (SELECT 1 FROM post_bookmarks b WHERE b.actor_id = ? AND b.post_id = p.id)'); bindings.push(user!.id); }
  if (user) {
    conditions.push('NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = ? AND b.blocked_id = p.author_id) OR (b.blocker_id = p.author_id AND b.blocked_id = ?))');
    bindings.push(user.id, user.id);
  }
  const query = `SELECT ${postColumns} FROM posts p JOIN users u ON u.id = p.author_id
    WHERE ${conditions.join(' AND ')} ORDER BY p.published_at DESC, p.id DESC LIMIT 21 OFFSET ?`;
  const rows = await env.DB.prepare(query).bind(...bindings, cursor).all<PostRow>();
  const results = rows.results ?? [];
  return json({
    items: results.slice(0, 20).map(present),
    nextCursor: results.length > 20 ? String(cursor + 20) : null,
  });
}

async function mine(env: Env, user: SessionUser): Promise<Response> {
  const rows = await env.DB.prepare(`SELECT ${postColumns} FROM posts p JOIN users u ON u.id = p.author_id
    WHERE p.author_id = ? AND p.status != 'removed' ORDER BY p.updated_at DESC LIMIT 100`)
    .bind(user.id).all<PostRow>();
  return json({ items: (rows.results ?? []).map(present) });
}

async function create(request: Request, env: Env, user: SessionUser): Promise<Response> {
  const input = parseInput(await readJson(request));
  if (!input) return error(400, 'invalid_post');
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO posts (id, author_id, type, format, title, body, language, destination_id,
    visited_month, media_json, live_url, live_starts_at, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`)
    .bind(id, user.id, input.type, input.format, input.title, input.body, input.language,
      input.destinationId, input.visitedMonth, JSON.stringify(input.mediaUrls), input.liveUrl, input.liveStartsAt, now, now).run();
  return json({ id, status: 'draft' }, 201);
}

async function edit(request: Request, env: Env, user: SessionUser, id: string): Promise<Response> {
  const existing = await postById(env, id);
  if (!existing || existing.author_id !== user.id || existing.status === 'removed') return error(404, 'post_not_found');
  const input = parseInput(await readJson(request));
  if (!input) return error(400, 'invalid_post');
  const status: PostStatus = existing.status === 'published' ? 'pending' : 'draft';
  const now = new Date().toISOString();
  await env.DB.prepare(`UPDATE posts SET type = ?, format = ?, title = ?, body = ?, language = ?, destination_id = ?,
    visited_month = ?, media_json = ?, live_url = ?, live_starts_at = ?, status = ?, updated_at = ?, submitted_at = ? WHERE id = ? AND author_id = ?`)
    .bind(input.type, input.format, input.title, input.body, input.language, input.destinationId,
      input.visitedMonth, JSON.stringify(input.mediaUrls), input.liveUrl, input.liveStartsAt,
      status, now, status === 'pending' ? now : null, id, user.id).run();
  return json({ id, status });
}

async function transition(env: Env, user: SessionUser, id: string, action: 'submit' | 'retract' | 'delete'): Promise<Response> {
  const existing = await postById(env, id);
  if (!existing || existing.author_id !== user.id || existing.status === 'removed') return error(404, 'post_not_found');
  let status: PostStatus;
  if (action === 'submit') {
    if (existing.status !== 'draft' && existing.status !== 'rejected') return error(409, 'invalid_transition');
    status = 'pending';
  } else if (action === 'retract') {
    if (existing.status !== 'pending' && existing.status !== 'published') return error(409, 'invalid_transition');
    status = 'draft';
  } else {
    status = 'removed';
  }
  const now = new Date().toISOString();
  await env.DB.prepare(`UPDATE posts SET status = ?, updated_at = ?, submitted_at = ?, deleted_at = ?
    WHERE id = ? AND author_id = ?`)
    .bind(status, now, status === 'pending' ? now : null, status === 'removed' ? now : null, id, user.id).run();
  return json({ id, status });
}

async function report(request: Request, env: Env, user: SessionUser): Promise<Response> {
  const body = await readJson(request);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return error(400, 'invalid_report');
  const { postId, reason } = body as Record<string, unknown>;
  if (typeof postId !== 'string' || typeof reason !== 'string') return error(400, 'invalid_report');
  const note = reason.trim();
  if (note.length < 10 || note.length > 500 || !plainText(note)) return error(400, 'invalid_report');
  const post = await postById(env, postId);
  if (!post || post.status !== 'published') return error(404, 'post_not_found');
  if (post.author_id === user.id) return error(400, 'cannot_report_own_post');
  const cutoff = new Date(Date.now() - 86400000).toISOString();
  const count = await env.DB.prepare('SELECT COUNT(*) AS count FROM post_reports WHERE reporter_id = ? AND created_at >= ?')
    .bind(user.id, cutoff).first<{ count: number }>();
  if ((count?.count ?? 0) >= 5) return error(429, 'report_limit');
  const result = await env.DB.prepare('INSERT OR IGNORE INTO post_reports (id, post_id, reporter_id, reason, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), postId, user.id, note, new Date().toISOString()).run();
  if (!result.meta.changes) return error(409, 'already_reported');
  return json({ status: 'received' }, 201);
}

async function moderationQueue(env: Env): Promise<Response> {
  const rows = await env.DB.prepare(`SELECT ${postColumns} FROM posts p JOIN users u ON u.id = p.author_id
    WHERE p.status = 'pending' ORDER BY p.submitted_at ASC LIMIT 100`).all<PostRow>();
  const reports = await env.DB.prepare(`SELECT r.id, r.post_id AS postId, r.reason, r.created_at AS createdAt,
    u.display_name AS reporterName FROM post_reports r JOIN users u ON u.id = r.reporter_id
    JOIN posts p ON p.id = r.post_id WHERE p.status = 'published' AND r.status = 'open'
    ORDER BY r.created_at ASC LIMIT 100`).all();
  return json({ items: (rows.results ?? []).map(present), reports: reports.results ?? [] });
}

async function moderationHistory(url: URL, env: Env): Promise<Response> {
  const postId = url.searchParams.get('postId');
  if (!postId || !/^[\w-]{1,80}$/.test(postId)) return error(400, 'invalid_post');
  const rows = await env.DB.prepare(`SELECT a.action, a.reason, a.created_at AS createdAt,
    u.display_name AS moderatorName FROM post_moderation_actions a JOIN users u ON u.id = a.actor_id
    WHERE a.post_id = ? ORDER BY a.created_at DESC LIMIT 100`).bind(postId).all();
  return json({ items: rows.results ?? [] });
}

async function dismissReport(request: Request, env: Env, user: SessionUser, id: string): Promise<Response> {
  if (user.role !== 'admin') return error(403, 'admin_required');
  const body = await readJson(request);
  const rawReason = body && typeof body === 'object' && !Array.isArray(body)
    ? (body as Record<string, unknown>).reason : null;
  const reason = typeof rawReason === 'string' ? rawReason.trim() : '';
  if (reason.length < 10 || reason.length > 500 || !plainText(reason)) return error(400, 'invalid_reason');
  const report = await env.DB.prepare(`SELECT post_id AS postId FROM post_reports WHERE id = ? AND status = 'open'`)
    .bind(id).first<{ postId: string }>();
  if (!report) return error(404, 'report_not_found');
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`UPDATE post_reports SET status = 'dismissed', reviewed_at = ?, reviewer_id = ? WHERE id = ?`)
      .bind(now, user.id, id),
    env.DB.prepare(`INSERT INTO post_moderation_actions (id, post_id, actor_id, action, reason, created_at)
      VALUES (?, ?, ?, 'dismiss_report', ?, ?)`).bind(crypto.randomUUID(), report.postId, user.id, reason, now),
  ]);
  return json({ id, status: 'dismissed' });
}

async function moderate(request: Request, env: Env, user: SessionUser, id: string,
  action: 'approve' | 'reject' | 'takedown'): Promise<Response> {
  if (user.role !== 'admin') return error(403, 'admin_required');
  const body = await readJson(request);
  const rawReason = body && typeof body === 'object' && !Array.isArray(body)
    ? (body as Record<string, unknown>).reason : null;
  const reason = typeof rawReason === 'string' ? rawReason.trim() : '';
  if (reason.length > 500 || !plainText(reason) || ((action === 'reject' || action === 'takedown') && reason.length < 10)) {
    return error(400, 'invalid_reason');
  }
  const existing = await postById(env, id);
  if (!existing) return error(404, 'post_not_found');
  if ((action === 'takedown' && existing.status !== 'published') ||
    (action !== 'takedown' && existing.status !== 'pending')) return error(409, 'invalid_transition');
  const status: PostStatus = action === 'approve' ? 'published' : action === 'reject' ? 'rejected' : 'removed';
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('UPDATE posts SET status = ?, updated_at = ?, published_at = ?, deleted_at = ? WHERE id = ?')
      .bind(status, now, action === 'approve' ? now : existing.published_at, action === 'takedown' ? now : null, id),
    env.DB.prepare('INSERT INTO post_moderation_actions (id, post_id, actor_id, action, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), id, user.id, action, reason || 'Reviewed by moderator', now),
  ]);
  return json({ id, status });
}

export async function handlePosts(request: Request, env: Env, user: SessionUser | null): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();
  if (!path.startsWith('/api/posts') && !path.startsWith('/api/reports') && !path.startsWith('/api/moderation')) return null;

  if (method !== 'GET') {
    const denied = requireWriter(request, user);
    if (denied) return denied;
  }

  if (path === '/api/posts' && method === 'GET') return publicList(url, env, user);
  if (path === '/api/posts' && method === 'POST') return create(request, env, user!);
  if (path === '/api/posts/mine' && method === 'GET') return user ? mine(env, user) : error(401, 'login_required');
  if (path === '/api/moderation/queue' && method === 'GET') {
    return user?.role === 'admin' ? moderationQueue(env) : error(user ? 403 : 401, 'admin_required');
  }
  if (path === '/api/moderation/history' && method === 'GET') {
    return user?.role === 'admin' ? moderationHistory(url, env) : error(user ? 403 : 401, 'admin_required');
  }
  if (path === '/api/reports' && method === 'POST') return report(request, env, user!);

  const dismissMatch = /^\/api\/moderation\/reports\/([\w-]+)\/dismiss$/.exec(path);
  if (dismissMatch && method === 'POST') return dismissReport(request, env, user!, dismissMatch[1]!);

  const mineMatch = /^\/api\/posts\/mine\/([\w-]+)$/.exec(path);
  if (mineMatch && method === 'GET') {
    if (!user) return error(401, 'login_required');
    const row = await postById(env, mineMatch[1]!);
    return row && row.author_id === user.id && row.status !== 'removed'
      ? json({ post: present(row) }) : error(404, 'post_not_found');
  }

  const moderationMatch = /^\/api\/moderation\/([\w-]+)\/(approve|reject|takedown)$/.exec(path);
  if (moderationMatch && method === 'POST') {
    return moderate(request, env, user!, moderationMatch[1]!, moderationMatch[2] as 'approve' | 'reject' | 'takedown');
  }

  const postAction = /^\/api\/posts\/([\w-]+)\/(submit|retract)$/.exec(path);
  if (postAction && method === 'POST') return transition(env, user!, postAction[1]!, postAction[2] as 'submit' | 'retract');

  const postMatch = /^\/api\/posts\/([\w-]+)$/.exec(path);
  if (postMatch) {
    const id = postMatch[1]!;
    if (method === 'PATCH') return edit(request, env, user!, id);
    if (method === 'DELETE') return transition(env, user!, id, 'delete');
    if (method === 'GET') {
      const row = await postById(env, id);
      return row?.status === 'published' ? json({ post: present(row) }) : error(404, 'post_not_found');
    }
  }
  return error(404, 'endpoint_not_found');
}
