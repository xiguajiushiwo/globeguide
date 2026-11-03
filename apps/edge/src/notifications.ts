import { requireOrigin, type SessionUser } from './auth';
import type { Env } from './env';

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

// Read the live comment and title so withdrawn/deleted content is never copied into an inbox.
const visible = `FROM notifications n
  JOIN post_comments c ON c.id = n.comment_id
  JOIN posts p ON p.id = c.post_id
  JOIN users u ON u.id = n.actor_id
  WHERE n.recipient_id = ? AND c.status = 'published' AND c.deleted_at IS NULL
  AND p.status = 'published' AND p.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM blocks b WHERE
    (b.blocker_id = n.recipient_id AND b.blocked_id IN (n.actor_id, p.author_id)) OR
    (b.blocked_id = n.recipient_id AND b.blocker_id IN (n.actor_id, p.author_id)))`;

export async function handleNotifications(request: Request, env: Env, user: SessionUser | null): Promise<Response | null> {
  const url = new URL(request.url);
  if (!['/api/notifications', '/api/notifications/count', '/api/notifications/read'].includes(url.pathname)) return null;
  if (!user) return json({ error: 'login_required' }, 401);
  if (request.method === 'GET' && url.pathname !== '/api/notifications/read') {
    const count = await env.DB.prepare(`SELECT COUNT(*) AS count ${visible} AND n.read_at IS NULL`).bind(user.id).first<{ count: number }>();
    if (url.pathname.endsWith('/count')) return json({ unreadCount: count?.count ?? 0 });
    const cursor = url.searchParams.get('cursor');
    let anchor: { created_at: string; id: string } | null = null;
    if (cursor) {
      if (cursor.length > 100) return json({ error: 'invalid_cursor' }, 400);
      anchor = await env.DB.prepare('SELECT created_at, id FROM notifications WHERE id = ? AND recipient_id = ?').bind(cursor, user.id).first();
      if (!anchor) return json({ error: 'invalid_cursor' }, 400);
    }
    const unread = url.searchParams.get('unread') === '1';
    const rows = await env.DB.prepare(`SELECT n.id, n.kind, n.created_at AS createdAt, n.read_at AS readAt,
      n.actor_id AS actorId, u.display_name AS actorName, c.id AS commentId, c.post_id AS postId,
      substr(c.body, 1, 240) AS body, c.kind AS commentKind, COALESCE(p.title, substr(p.body, 1, 80)) AS postTitle
      ${visible} ${unread ? 'AND n.read_at IS NULL' : ''}
      ${anchor ? 'AND (n.created_at < ? OR (n.created_at = ? AND n.id < ?))' : ''}
      ORDER BY n.created_at DESC, n.id DESC LIMIT 31`)
      .bind(user.id, ...(anchor ? [anchor.created_at, anchor.created_at, anchor.id] : [])).all<{ id: string }>();
    return json({ items: rows.results.slice(0, 30), unreadCount: count?.count ?? 0, nextCursor: rows.results.length > 30 ? rows.results[29]!.id : null });
  }
  if (request.method === 'POST' && url.pathname === '/api/notifications/read') {
    if (!requireOrigin(request)) return json({ error: 'invalid_origin' }, 403);
    let body: { ids?: unknown } | null = null;
    try { body = await request.json(); } catch { /* Invalid bodies are rejected below. */ }
    if (!Array.isArray(body?.ids) || !body.ids.length || body.ids.length > 100 || !body.ids.every((id) => typeof id === 'string' && /^[\w-]{1,100}$/.test(id))) return json({ error: 'invalid_notifications' }, 400);
    const ids = [...new Set(body.ids as string[])];
    await env.DB.prepare(`UPDATE notifications SET read_at = ? WHERE recipient_id = ? AND read_at IS NULL AND id IN (${ids.map(() => '?').join(',')})`)
      .bind(new Date().toISOString(), user.id, ...ids).run();
    return json({ ok: true });
  }
  return json({ error: 'method_not_allowed' }, 405);
}
