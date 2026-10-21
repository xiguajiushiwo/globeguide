import { requireOrigin } from './auth.js';
import type { SessionUser } from './auth.js';
import type { Env } from './env.js';
import { blockedBetween } from './social.js';

const MAX_TEXT = 2000;
function json(data: unknown, status = 200): Response { return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } }); }
function error(status: number, code: string): Response { return json({ error: code }, status); }
function plainText(value: string): boolean { return !/<\s*\/?\s*[a-z!][^>]*>/i.test(value) && !/!\[[^\]]*\]\([^)]*\)/.test(value) && !/(https?:\/\/|www\.)/i.test(value); }
async function readJson(request: Request): Promise<Record<string, unknown> | null> { if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return null; try { const value: unknown = await request.json(); return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null; } catch { return null; } }
function validId(value: unknown): value is string { return typeof value === 'string' && value.length > 0 && value.length <= 100 && /^[A-Za-z0-9_-]+$/.test(value); }
function writer(request: Request, user: SessionUser | null): Response | null { if (!user) return error(401, 'login_required'); if (!user.emailVerifiedAt) return error(403, 'email_not_verified'); if (!requireOrigin(request)) return error(403, 'invalid_origin'); return null; }
async function member(env: Env, conversationId: string, userId: string) { return env.DB.prepare("SELECT cm.role, cm.muted_at AS mutedAt, cm.left_at AS leftAt FROM conversation_members cm JOIN conversations c ON c.id = cm.conversation_id WHERE cm.conversation_id = ? AND cm.user_id = ? AND cm.left_at IS NULL AND c.deleted_at IS NULL").bind(conversationId, userId).first<{ role: 'owner' | 'admin' | 'member'; mutedAt: string | null; leftAt: string | null }>(); }
async function conversation(env: Env, id: string) { return env.DB.prepare('SELECT id, kind, name, owner_id AS ownerId, created_at AS createdAt, updated_at AS updatedAt FROM conversations WHERE id = ? AND deleted_at IS NULL').bind(id).first<{ id: string; kind: 'direct' | 'group'; name: string | null; ownerId: string; createdAt: string; updatedAt: string }>(); }
async function usersExist(env: Env, ids: string[]): Promise<boolean> { if (!ids.length) return false; const marks = ids.map(() => '?').join(','); const row = await env.DB.prepare(`SELECT COUNT(*) AS count FROM users WHERE id IN (${marks})`).bind(...ids).first<{ count: number }>(); return row?.count === ids.length; }
async function blockedWithMembers(env: Env, userId: string, ids: string[]): Promise<boolean> { for (const id of ids) if (id !== userId && await blockedBetween(env, userId, id)) return true; return false; }

async function listConversations(env: Env, user: SessionUser): Promise<Response> {
  const rows = await env.DB.prepare(`SELECT c.id, c.kind, c.name, c.owner_id AS ownerId, c.created_at AS createdAt, c.updated_at AS updatedAt,
    cm.role, cm.muted_at AS mutedAt, (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.deleted_at IS NULL) AS messageCount,
    (SELECT m.id FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS lastMessageId,
    (SELECT m.body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS lastMessage
    FROM conversations c JOIN conversation_members cm ON cm.conversation_id = c.id
    WHERE cm.user_id = ? AND cm.left_at IS NULL AND c.deleted_at IS NULL ORDER BY c.updated_at DESC, c.id DESC`).bind(user.id).all<Record<string, unknown>>();
  const items = await Promise.all((rows.results ?? []).map(async (row) => {
    const memberRows = await env.DB.prepare(`SELECT cm.user_id AS id, u.display_name AS displayName, cm.role,
      CASE WHEN cm.muted_at IS NULL THEN 0 ELSE 1 END AS muted FROM conversation_members cm JOIN users u ON u.id = cm.user_id
      WHERE cm.conversation_id = ? AND cm.left_at IS NULL ORDER BY cm.joined_at ASC`).bind(row.id).all();
    return { ...row, isGroup: row.kind === 'group', members: memberRows.results ?? [], muted: Boolean(row.mutedAt) };
  }));
  return json({ items });
}
async function createConversation(request: Request, env: Env, user: SessionUser): Promise<Response> {
  const body = await readJson(request); if (!body) return error(400, 'invalid_conversation');
  const candidateMembers = Array.isArray(body.memberIds) ? body.memberIds : Array.isArray(body.members) ? body.members : Array.isArray(body.userIds) ? body.userIds : [];
  const rawMembers = candidateMembers.filter(validId) as string[];
  const participant = validId(body.participantId) ? body.participantId : validId(body.userId) ? body.userId : null;
  const kind = body.kind === 'group' || rawMembers.length > 1 || Boolean(body.name) ? 'group' : 'direct';
  const members = Array.from(new Set([user.id, ...(kind === 'direct' ? participant ? [participant] : [] : rawMembers)]));
  if (kind === 'direct' && members.length !== 2) return error(400, 'invalid_conversation');
  if (kind === 'group' && members.length < 2) return error(400, 'invalid_conversation');
  if (!await usersExist(env, members)) return error(404, 'profile_not_found');
  if (await blockedWithMembers(env, user.id, members)) return error(403, 'blocked');
  if (kind === 'direct') {
    const existing = await env.DB.prepare(`SELECT c.id FROM conversations c JOIN conversation_members a ON a.conversation_id = c.id AND a.user_id = ?
      JOIN conversation_members b ON b.conversation_id = c.id AND b.user_id = ? WHERE c.kind = 'direct' AND c.deleted_at IS NULL
      AND a.left_at IS NULL AND b.left_at IS NULL`).bind(user.id, members[1]!).first<{ id: string }>();
    if (existing) return json({ id: existing.id, reused: true });
  }
  const id = crypto.randomUUID(); const now = new Date().toISOString(); const name = typeof body.name === 'string' ? body.name.trim() : null;
  if (name !== null && (name.length < 1 || name.length > 80 || !plainText(name))) return error(400, 'invalid_conversation');
  const statements = [env.DB.prepare('INSERT INTO conversations (id, kind, name, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, kind, name, user.id, now, now), ...members.map((memberId) => env.DB.prepare('INSERT INTO conversation_members (conversation_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)').bind(id, memberId, memberId === user.id ? 'owner' : 'member', now))];
  await env.DB.batch(statements); return json({ id, kind, name, reused: false }, 201);
}
async function members(env: Env, conversationId: string): Promise<Response> { const rows = await env.DB.prepare(`SELECT cm.user_id AS id, u.display_name AS displayName, cm.role, cm.muted_at AS mutedAt, cm.joined_at AS joinedAt FROM conversation_members cm JOIN users u ON u.id = cm.user_id WHERE cm.conversation_id = ? AND cm.left_at IS NULL ORDER BY cm.joined_at ASC`).bind(conversationId).all(); return json({ items: rows.results ?? [] }); }
async function invite(request: Request, env: Env, user: SessionUser, conversationId: string, targetId: string, role: string | null): Promise<Response> {
  const convo = await conversation(env, conversationId); const current = await member(env, conversationId, user.id); if (!convo || !current) return error(404, 'conversation_not_found');
  if (convo.kind !== 'group' || (current.role !== 'owner' && current.role !== 'admin')) return error(403, 'conversation_forbidden');
  if (!validId(targetId) || !await usersExist(env, [targetId])) return error(404, 'profile_not_found');
  if (await blockedBetween(env, user.id, targetId)) return error(403, 'blocked');
  const existing = await env.DB.prepare('SELECT left_at FROM conversation_members WHERE conversation_id = ? AND user_id = ?').bind(conversationId, targetId).first<{ left_at: string | null }>();
  const now = new Date().toISOString(); const newRole = role === 'admin' && (current.role === 'owner' || current.role === 'admin') ? 'admin' : 'member';
  if (existing) await env.DB.prepare('UPDATE conversation_members SET role = ?, joined_at = ?, left_at = NULL WHERE conversation_id = ? AND user_id = ?').bind(newRole, now, conversationId, targetId).run();
  else await env.DB.prepare('INSERT INTO conversation_members (conversation_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)').bind(conversationId, targetId, newRole, now).run();
  await env.DB.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').bind(now, conversationId).run(); return json({ conversationId, userId: targetId, role: newRole }, 201);
}
async function removeMember(env: Env, user: SessionUser, conversationId: string, targetId: string, leave = false): Promise<Response> {
  const convo = await conversation(env, conversationId); const current = await member(env, conversationId, user.id); if (!convo || !current) return error(404, 'conversation_not_found');
  const target = leave ? user.id : targetId; const targetMember = await member(env, conversationId, target); if (!targetMember) return error(404, 'member_not_found');
  if (!leave && (current.role !== 'owner' && current.role !== 'admin')) return error(403, 'conversation_forbidden');
  if (!leave && targetMember.role === 'owner') return error(400, 'owner_required');
  await env.DB.prepare('UPDATE conversation_members SET left_at = ? WHERE conversation_id = ? AND user_id = ?').bind(new Date().toISOString(), conversationId, target).run(); return json({ conversationId, userId: target, left: true });
}
async function changeRole(request: Request, env: Env, user: SessionUser, conversationId: string, targetId: string): Promise<Response> {
  const convo = await conversation(env, conversationId); const current = await member(env, conversationId, user.id); const target = await member(env, conversationId, targetId);
  if (!convo || !current || !target) return error(404, 'member_not_found');
  if (convo.kind !== 'group' || current.role !== 'owner' || target.role === 'owner') return error(403, 'conversation_forbidden');
  const body = await readJson(request); const role = body?.role === 'admin' || body?.role === 'member' ? body.role : null;
  if (!role) return error(400, 'invalid_member');
  await env.DB.prepare('UPDATE conversation_members SET role = ? WHERE conversation_id = ? AND user_id = ?').bind(role, conversationId, targetId).run();
  return json({ conversationId, userId: targetId, role });
}
async function mute(env: Env, user: SessionUser, conversationId: string, on: boolean): Promise<Response> { if (!await member(env, conversationId, user.id)) return error(404, 'conversation_not_found'); const now = on ? new Date().toISOString() : null; await env.DB.prepare('UPDATE conversation_members SET muted_at = ? WHERE conversation_id = ? AND user_id = ?').bind(now, conversationId, user.id).run(); return json({ muted: on }); }
async function renameConversation(request: Request, env: Env, user: SessionUser, conversationId: string): Promise<Response> {
  const convo = await conversation(env, conversationId); const current = await member(env, conversationId, user.id);
  if (!convo || !current) return error(404, 'conversation_not_found');
  if (convo.kind !== 'group' || (current.role !== 'owner' && current.role !== 'admin')) return error(403, 'conversation_forbidden');
  const body = await readJson(request); const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 80 || !plainText(name)) return error(400, 'invalid_conversation');
  await env.DB.prepare('UPDATE conversations SET name = ?, updated_at = ? WHERE id = ?').bind(name, new Date().toISOString(), conversationId).run();
  return json({ id: conversationId, name });
}

async function messagesGet(url: URL, env: Env, user: SessionUser, conversationId: string): Promise<Response> {
  if (!await member(env, conversationId, user.id)) return error(403, 'conversation_forbidden');
  const after = url.searchParams.get('after'); let cursor: { created_at: string; id: string } | null = null;
  if (after) { if (!validId(after)) return error(400, 'invalid_cursor'); cursor = await env.DB.prepare('SELECT created_at, id FROM messages WHERE id = ? AND conversation_id = ?').bind(after, conversationId).first<{ created_at: string; id: string }>(); if (!cursor) return error(400, 'invalid_cursor'); }
  const query = `SELECT m.id, m.conversation_id AS conversationId, m.sender_id AS senderId, u.display_name AS senderName,
    CASE WHEN m.deleted_at IS NULL THEN m.body ELSE 'Message deleted' END AS body, m.kind, m.created_at AS createdAt, m.deleted_at AS deletedAt
    FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.conversation_id = ? ${cursor ? 'AND (m.created_at > ? OR (m.created_at = ? AND m.id > ?))' : ''}
    ORDER BY m.created_at ASC, m.id ASC LIMIT 101`;
  const values = cursor ? [conversationId, cursor.created_at, cursor.created_at, cursor.id] : [conversationId]; const rows = await env.DB.prepare(query).bind(...values).all<Record<string, unknown>>(); const items = rows.results ?? []; return json({ items: items.slice(0, 100), nextCursor: items.length > 100 ? (items[99] as { id: string }).id : null });
}
async function messagePost(request: Request, env: Env, user: SessionUser, conversationId: string): Promise<Response> {
  const current = await member(env, conversationId, user.id); if (!current) return error(403, 'conversation_forbidden'); const convo = await conversation(env, conversationId); if (!convo) return error(404, 'conversation_not_found');
  const body = await readJson(request); const text = typeof body?.body === 'string' ? body.body.trim() : typeof body?.message === 'string' ? body.message.trim() : ''; if (!text || text.length > MAX_TEXT || !plainText(text)) return error(400, 'invalid_message');
  const otherRows = await env.DB.prepare('SELECT user_id AS id FROM conversation_members WHERE conversation_id = ? AND user_id != ? AND left_at IS NULL').bind(conversationId, user.id).all<{ id: string }>(); if (await blockedWithMembers(env, user.id, (otherRows.results ?? []).map((row) => row.id))) return error(403, 'blocked');
  const id = crypto.randomUUID(); const now = new Date().toISOString(); await env.DB.batch([
    env.DB.prepare("INSERT INTO messages (id, conversation_id, sender_id, body, kind, created_at) VALUES (?, ?, ?, ?, 'text', ?)").bind(id, conversationId, user.id, text, now),
    env.DB.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').bind(now, conversationId),
  ]); return json({ id, conversationId, senderId: user.id, body: text, kind: 'text', createdAt: now }, 201);
}
async function messageDelete(env: Env, user: SessionUser, messageId: string): Promise<Response> { const row = await env.DB.prepare('SELECT sender_id FROM messages WHERE id = ?').bind(messageId).first<{ sender_id: string }>(); if (!row || row.sender_id !== user.id) return error(404, 'message_not_found'); await env.DB.prepare('UPDATE messages SET deleted_at = ?, status = \'removed\' WHERE id = ? AND deleted_at IS NULL').bind(new Date().toISOString(), messageId).run(); return json({ id: messageId, deleted: true }); }
async function readCursor(request: Request, env: Env, user: SessionUser, conversationId: string): Promise<Response> { if (!await member(env, conversationId, user.id)) return error(403, 'conversation_forbidden'); const body = await readJson(request); const messageId = typeof body?.messageId === 'string' ? body.messageId : typeof body?.lastMessageId === 'string' ? body.lastMessageId : null; if (messageId && !await env.DB.prepare('SELECT id FROM messages WHERE id = ? AND conversation_id = ?').bind(messageId, conversationId).first()) return error(400, 'invalid_cursor'); const now = new Date().toISOString(); await env.DB.prepare(`INSERT INTO message_reads (conversation_id, user_id, last_message_id, last_read_at) VALUES (?, ?, ?, ?) ON CONFLICT(conversation_id, user_id) DO UPDATE SET last_message_id = excluded.last_message_id, last_read_at = excluded.last_read_at`).bind(conversationId, user.id, messageId, now).run(); return json({ conversationId, lastMessageId: messageId, lastReadAt: now }); }

export async function handleMessaging(request: Request, env: Env, user: SessionUser | null): Promise<Response | null> {
  const url = new URL(request.url); const path = url.pathname; const method = request.method.toUpperCase(); if (!path.startsWith('/api/conversations') && !path.startsWith('/api/messages')) return null; if (method !== 'GET') { const denied = writer(request, user); if (denied) return denied; } if (!user) { if (method === 'GET' && path === '/api/conversations') return error(401, 'login_required'); return error(401, 'login_required'); }
  if (path === '/api/conversations' && method === 'GET') return listConversations(env, user);
  if (path === '/api/conversations' && method === 'POST') return createConversation(request, env, user);
  if (path === '/api/messages' && method === 'POST') {
    const body = await readJson(request); const conversationId = typeof body?.conversationId === 'string' ? body.conversationId : null;
    if (!conversationId) return error(400, 'invalid_conversation');
    const synthetic = new Request(request.url.replace('/api/messages', `/api/conversations/${conversationId}/messages`), { method: 'POST', headers: request.headers, body: JSON.stringify(body) });
    return messagePost(synthetic, env, user, conversationId);
  }
  if (path === '/api/messages' && method === 'GET') {
    const conversationId = url.searchParams.get('conversationId');
    return conversationId && validId(conversationId) ? messagesGet(url, env, user, conversationId) : error(400, 'invalid_conversation');
  }
  const memberPath = /^\/api\/conversations\/([A-Za-z0-9_-]+)\/members\/([A-Za-z0-9_-]+)$/.exec(path);
  if (memberPath) {
    const conversationId = memberPath[1]!; const targetId = memberPath[2]!;
    if (method === 'DELETE') return removeMember(env, user, conversationId, targetId);
    if (method === 'POST') return invite(request, env, user, conversationId, targetId, null);
    if (method === 'PATCH') return changeRole(request, env, user, conversationId, targetId);
    return error(405, 'method_not_allowed');
  }
  const invitePath = /^\/api\/conversations\/([A-Za-z0-9_-]+)\/invite$/.exec(path);
  if (invitePath && method === 'POST') { const body = await readJson(request); const targetId = typeof body?.userId === 'string' ? body.userId : null; return targetId ? invite(request, env, user, invitePath[1]!, targetId, typeof body?.role === 'string' ? body.role : null) : error(400, 'invalid_member'); }
  const convoMatch = /^\/api\/conversations\/([A-Za-z0-9_-]+)(?:\/(messages|members|leave|mute|unmute|read))?$/.exec(path);
  if (convoMatch) {
    const conversationId = convoMatch[1]!; const action = convoMatch[2];
    if (!action && method === 'GET') { if (!await member(env, conversationId, user.id)) return error(403, 'conversation_forbidden'); const convo = await conversation(env, conversationId); return convo ? json({ conversation: convo }) : error(404, 'conversation_not_found'); }
    if (!action && method === 'PATCH') return renameConversation(request, env, user, conversationId);
    if (action === 'messages') { if (method === 'GET') return messagesGet(url, env, user, conversationId); if (method === 'POST') return messagePost(request, env, user, conversationId); }
    if (action === 'members') { if (method === 'GET') return await member(env, conversationId, user.id) ? members(env, conversationId) : error(403, 'conversation_forbidden'); const body = await readJson(request); const target = typeof body?.userId === 'string' ? body.userId : null; if (method === 'POST' && target) return invite(request, env, user, conversationId, target, typeof body?.role === 'string' ? body.role : null); if (method === 'DELETE' && target) return removeMember(env, user, conversationId, target); }
    if (action === 'leave' && method === 'POST') return removeMember(env, user, conversationId, user.id, true);
    if ((action === 'mute' || action === 'unmute') && method === 'POST') return mute(env, user, conversationId, action === 'mute');
    if (action === 'read' && method === 'POST') return readCursor(request, env, user, conversationId);
  }
  const messageMatch = /^\/api\/messages\/([A-Za-z0-9_-]+)$/.exec(path); if (messageMatch && method === 'DELETE') return messageDelete(env, user, messageMatch[1]!);
  return error(404, 'endpoint_not_found');
}
