import type { Env } from './env';

export interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
  role: 'member' | 'admin';
  emailVerifiedAt: string;
}

type Purpose = 'register' | 'reset';
type UserRow = { id: string; email: string; display_name: string; role: 'member' | 'admin'; email_verified_at: string; password_hash: string };
type ChallengeRow = { id: string; code_hash: string; expires_at: number; attempts: number; consumed_at: number | null };

const encoder = new TextEncoder();
const COOKIE = 'gg_session';
const ITERATIONS = 600_000;
const SESSION_SECONDS = 60 * 60 * 24 * 30;

function reply(body: Record<string, unknown>, status = 200, cookie?: string): Response {
  const headers = new Headers({ 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' });
  if (cookie) headers.set('Set-Cookie', cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

function bytesToBase64(bytes: Uint8Array): string {
  let raw = '';
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const raw = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index++) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(new ArrayBuffer(length)));
}

async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return bytesToBase64(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))));
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left[index]! ^ right[index]!;
  return difference === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256);
  return `pbkdf2-sha256$${ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(new Uint8Array(hash))}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, iterationsText, saltText, hashText] = stored.split('$');
  if (algorithm !== 'pbkdf2-sha256' || !iterationsText || !saltText || !hashText) return false;
  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations < 100_000 || iterations > 1_000_000) return false;
  try {
    const expected = base64ToBytes(hashText);
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const actual = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: base64ToBytes(saltText), iterations }, key, expected.length * 8));
    return equalBytes(actual, expected);
  } catch {
    return false;
  }
}

function normalizedEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]{1,64}@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function validPassword(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 12 && value.length <= 128;
}

function safeName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  return name.length >= 2 && name.length <= 48 && !/[<>\u0000-\u001f]/.test(name) ? name : null;
}

function cookieFor(request: Request, token: string, maxAge: number): string {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${token}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

function sessionToken(request: Request): string | null {
  const pair = request.headers.get('Cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`));
  const token = pair?.slice(COOKIE.length + 1);
  return token && /^[A-Za-z0-9_-]{40,50}$/.test(token) ? token : null;
}

export function requireOrigin(request: Request): boolean {
  const origin = request.headers.get('Origin');
  return origin !== null && origin === new URL(request.url).origin;
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return null;
  try {
    const value: unknown = await request.json();
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

async function rateLimit(env: Env, key: string, maximum: number, windowSeconds: number): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const result = await env.DB.prepare(`INSERT INTO auth_rate_limits (key, count, reset_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET
      count = CASE WHEN reset_at <= ? THEN 1 ELSE count + 1 END,
      reset_at = CASE WHEN reset_at <= ? THEN ? ELSE reset_at END
    RETURNING count`).bind(key, now + windowSeconds, now, now, now + windowSeconds).first<{ count: number }>();
  return (result?.count ?? maximum + 1) <= maximum;
}

async function limited(env: Env, action: string, email: string, request: Request, emailMax: number, ipMax: number, seconds: number): Promise<boolean> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
  const emailKey = await hmac(env.CODE_HMAC_KEY, `${action}:email:${email}`);
  const ipKey = await hmac(env.CODE_HMAC_KEY, `${action}:ip:${ip}`);
  const [emailAllowed, ipAllowed] = await Promise.all([
    rateLimit(env, emailKey, emailMax, seconds),
    rateLimit(env, ipKey, ipMax, seconds),
  ]);
  return emailAllowed && ipAllowed;
}

function mailAvailable(env: Env): boolean {
  return Boolean(env.MAIL_SINK || (env.MAIL_API_KEY && env.MAIL_FROM));
}

async function sendMail(env: Env, to: string, purpose: Purpose, code: string): Promise<void> {
  const subject = purpose === 'register' ? 'GlobeGuide email verification' : 'GlobeGuide password reset';
  const body = `Your GlobeGuide verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`;
  if (env.MAIL_SINK) return env.MAIL_SINK.send(to, subject, body);
  if (!env.MAIL_API_KEY || !env.MAIL_FROM) throw new Error('Email provider is not configured.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.MAIL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, text: body }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}.`);
}

async function issueSession(request: Request, env: Env, userId: string): Promise<string> {
  const token = bytesToBase64(randomBytes(32)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare('INSERT INTO auth_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .bind(await hmac(env.AUTH_SECRET, token), userId, now + SESSION_SECONDS, now).run();
  return cookieFor(request, token, SESSION_SECONDS);
}

export async function resolveSession(request: Request, env: Env): Promise<SessionUser | null> {
  const token = sessionToken(request);
  if (!token) return null;
  const row = await env.DB.prepare(`SELECT u.id, u.email, u.display_name, u.role, u.email_verified_at
    FROM auth_sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?`).bind(await hmac(env.AUTH_SECRET, token), Math.floor(Date.now() / 1000))
    .first<Omit<UserRow, 'password_hash'>>();
  return row ? { id: row.id, email: row.email, displayName: row.display_name, role: row.role, emailVerifiedAt: row.email_verified_at } : null;
}

async function sendCode(request: Request, env: Env): Promise<Response> {
  if (!mailAvailable(env)) return reply({ error: 'Email registration is not available yet.' }, 503);
  const data = await readJson(request);
  const email = normalizedEmail(data?.email);
  const purpose = data?.purpose === 'reset' ? 'reset' : data?.purpose === 'register' ? 'register' : null;
  if (!email || !purpose) return reply({ error: 'Enter a valid email and purpose.' }, 400);
  if (!await limited(env, `code:${purpose}`, email, request, 5, 30, 3600)) return reply({ error: 'Too many requests. Try again later.' }, 429);
  const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>();
  if ((purpose === 'register' && user) || (purpose === 'reset' && !user)) return reply({ ok: true }, 202);
  const now = Math.floor(Date.now() / 1000);
  const recent = await env.DB.prepare('SELECT created_at FROM auth_challenges WHERE email = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1')
    .bind(email, purpose).first<{ created_at: number }>();
  if (recent && now - recent.created_at < 60) return reply({ ok: true }, 202);
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0]! % 100_000_000).padStart(8, '0');
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO auth_challenges (id, email, purpose, code_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, email, purpose, await hmac(env.CODE_HMAC_KEY, `${purpose}:${email}:${code}`), now + 600, now).run();
  try {
    await sendMail(env, email, purpose, code);
  } catch {
    await env.DB.prepare('DELETE FROM auth_challenges WHERE id = ?').bind(id).run();
    return reply({ error: 'Email delivery is temporarily unavailable.' }, 503);
  }
  return reply({ ok: true }, 202);
}

async function consumeCode(env: Env, email: string, purpose: Purpose, code: unknown): Promise<boolean> {
  if (typeof code !== 'string' || !/^\d{8}$/.test(code)) return false;
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(`SELECT id, code_hash, expires_at, attempts, consumed_at FROM auth_challenges
    WHERE email = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1`).bind(email, purpose).first<ChallengeRow>();
  if (!row || row.consumed_at || row.expires_at <= now || row.attempts >= 5) return false;
  const provided = await hmac(env.CODE_HMAC_KEY, `${purpose}:${email}:${code}`);
  if (!equalBytes(base64ToBytes(provided), base64ToBytes(row.code_hash))) {
    await env.DB.prepare('UPDATE auth_challenges SET attempts = attempts + 1 WHERE id = ? AND consumed_at IS NULL AND attempts < 5').bind(row.id).run();
    return false;
  }
  const result = await env.DB.prepare('UPDATE auth_challenges SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL AND attempts < 5 AND expires_at > ?')
    .bind(now, row.id, now).run();
  return (result.meta.changes ?? 0) === 1;
}

async function register(request: Request, env: Env): Promise<Response> {
  if (!mailAvailable(env)) return reply({ error: 'Email registration is not available yet.' }, 503);
  const data = await readJson(request);
  const email = normalizedEmail(data?.email);
  const displayName = safeName(data?.displayName);
  if (!email || !displayName || !validPassword(data?.password)) return reply({ error: 'Check your email, name and password (12-128 characters).' }, 400);
  if (!await limited(env, 'register', email, request, 10, 30, 3600)) return reply({ error: 'Too many requests. Try again later.' }, 429);
  if (!await consumeCode(env, email, 'register', data?.code)) return reply({ error: 'Code is invalid or expired.' }, 400);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  try {
    await env.DB.prepare(`INSERT INTO users (id, email, display_name, role, password_hash, email_verified_at, created_at, updated_at)
      VALUES (?, ?, ?, 'member', ?, ?, ?, ?)`).bind(id, email, displayName, await hashPassword(data.password), now, now, now).run();
  } catch {
    return reply({ error: 'Could not create account. Try signing in.' }, 409);
  }
  return reply({ user: { id, email, displayName, role: 'member' } }, 201, await issueSession(request, env, id));
}

async function login(request: Request, env: Env): Promise<Response> {
  const data = await readJson(request);
  const email = normalizedEmail(data?.email);
  if (!email || typeof data?.password !== 'string') return reply({ error: 'Invalid email or password.' }, 400);
  if (!await limited(env, 'login', email, request, 10, 30, 900)) return reply({ error: 'Too many attempts. Try again later.' }, 429);
  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>();
  if (!user || !await verifyPassword(data.password, user.password_hash)) return reply({ error: 'Invalid email or password.' }, 401);
  return reply({ user: { id: user.id, email: user.email, displayName: user.display_name, role: user.role } }, 200, await issueSession(request, env, user.id));
}

async function reset(request: Request, env: Env): Promise<Response> {
  if (!mailAvailable(env)) return reply({ error: 'Password reset email is not available yet.' }, 503);
  const data = await readJson(request);
  const email = normalizedEmail(data?.email);
  if (!email || !validPassword(data?.password)) return reply({ error: 'Enter a valid email and a password of 12-128 characters.' }, 400);
  if (!await limited(env, 'reset', email, request, 10, 30, 3600)) return reply({ error: 'Too many requests. Try again later.' }, 429);
  if (!await consumeCode(env, email, 'reset', data?.code)) return reply({ error: 'Code is invalid or expired.' }, 400);
  const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>();
  if (!user) return reply({ error: 'Code is invalid or expired.' }, 400);
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').bind(await hashPassword(data.password), new Date().toISOString(), user.id),
    env.DB.prepare('DELETE FROM auth_sessions WHERE user_id = ?').bind(user.id),
  ]);
  return reply({ ok: true });
}

export async function handleAuth(request: Request, env: Env): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (!path.startsWith('/api/auth/')) return null;
  if (!env.DB || !env.AUTH_SECRET || env.AUTH_SECRET.length < 32 || !env.CODE_HMAC_KEY || env.CODE_HMAC_KEY.length < 32) return reply({ error: 'Authentication is not configured.' }, 503);
  if (request.method === 'GET' && path === '/api/auth/config') return reply({ registrationAvailable: mailAvailable(env) });
  if (request.method === 'GET' && path === '/api/auth/me') {
    const user = await resolveSession(request, env);
    return reply({ user: user ? { id: user.id, email: user.email, displayName: user.displayName, role: user.role } : null });
  }
  if (request.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405);
  if (!requireOrigin(request)) return reply({ error: 'Request origin is not allowed.' }, 403);
  if (path === '/api/auth/code') return sendCode(request, env);
  if (path === '/api/auth/register') return register(request, env);
  if (path === '/api/auth/login') return login(request, env);
  if (path === '/api/auth/reset') return reset(request, env);
  if (path === '/api/auth/logout') {
    const token = sessionToken(request);
    if (token) await env.DB.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(await hmac(env.AUTH_SECRET, token)).run();
    return reply({ ok: true }, 200, cookieFor(request, '', 0));
  }
  return reply({ error: 'Not found.' }, 404);
}
