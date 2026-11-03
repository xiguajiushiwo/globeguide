import { isDestinationId } from '@globeguide/domain';

import { requireOrigin } from './auth.js';
import type { SessionUser } from './auth.js';
import type { Env } from './env.js';

type ProductRow = {
  id: string;
  seller_id: string;
  seller_name: string;
  title: string;
  description: string;
  price_cents: number;
  currency: string;
  image_url: string | null;
  destination_id: string | null;
  stock: number;
  status: 'published' | 'sold' | 'removed';
  created_at: string;
  updated_at: string;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}
function error(status: number, code: string): Response { return json({ error: code }, status); }
function plainText(value: string): boolean { return !/<\s*\/?\s*[a-z!][^>]*>/i.test(value) && !/(https?:\/\/|www\.)/i.test(value); }
function id(value: string | null): boolean { return Boolean(value && value.length <= 100 && /^[A-Za-z0-9_-]+$/.test(value)); }
function safeUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2_048) return false;
  try { const parsed = new URL(value); return parsed.protocol === 'https:' || parsed.protocol === 'http:'; } catch { return false; }
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
const columns = `p.id, p.seller_id, u.display_name AS seller_name, p.title, p.description,
  p.price_cents, p.currency, p.image_url, p.destination_id, p.stock, p.status,
  p.created_at, p.updated_at`;
function present(row: ProductRow) {
  return { id: row.id, seller: { id: row.seller_id, displayName: row.seller_name }, title: row.title, description: row.description, priceCents: row.price_cents, currency: row.currency, imageUrl: row.image_url, destinationId: row.destination_id, stock: row.stock, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
}
function parseProduct(value: Record<string, unknown> | null) {
  if (!value || typeof value.title !== 'string' || typeof value.description !== 'string') return null;
  const title = value.title.trim(); const description = value.description.trim();
  const priceCents = typeof value.priceCents === 'number' ? value.priceCents : Number(value.priceCents);
  const currency = value.currency === undefined ? 'CNY' : value.currency;
  const imageUrl = value.imageUrl === undefined || value.imageUrl === null || value.imageUrl === '' ? null : value.imageUrl;
  const destinationId = value.destinationId === undefined || value.destinationId === null || value.destinationId === '' ? null : value.destinationId;
  const stock = value.stock === undefined ? 1 : Number(value.stock);
  if (title.length < 2 || title.length > 100 || description.length < 10 || description.length > 4_000 || !plainText(title) || !plainText(description)) return null;
  if (!Number.isSafeInteger(priceCents) || priceCents < 1 || priceCents > 100_000_000) return null;
  if (currency !== 'CNY' && currency !== 'JPY' && currency !== 'USD') return null;
  if (imageUrl !== null && !safeUrl(imageUrl)) return null;
  if (destinationId !== null && (typeof destinationId !== 'string' || !isDestinationId(destinationId))) return null;
  if (!Number.isSafeInteger(stock) || stock < 1 || stock > 10_000) return null;
  return { title, description, priceCents, currency, imageUrl: imageUrl as string | null, destinationId: destinationId as string | null, stock };
}

async function list(url: URL, env: Env): Promise<Response> {
  const query = url.searchParams.get('q')?.trim() ?? '';
  const destinationId = url.searchParams.get('destinationId');
  if (query.length > 80 || (destinationId && !isDestinationId(destinationId))) return error(400, 'invalid_market_filter');
  const clauses = ["p.status = 'published'"]; const bindings: string[] = [];
  if (query) { clauses.push('(p.title LIKE ? OR p.description LIKE ?)'); bindings.push(`%${query}%`, `%${query}%`); }
  if (destinationId) { clauses.push('p.destination_id = ?'); bindings.push(destinationId); }
  const rows = await env.DB.prepare(`SELECT ${columns} FROM marketplace_products p JOIN users u ON u.id = p.seller_id WHERE ${clauses.join(' AND ')} ORDER BY p.created_at DESC, p.id DESC LIMIT 100`).bind(...bindings).all<ProductRow>();
  return json({ items: (rows.results ?? []).map(present) });
}
async function create(request: Request, env: Env, user: SessionUser): Promise<Response> {
  const product = parseProduct(await readJson(request)); if (!product) return error(400, 'invalid_product');
  const now = new Date().toISOString(); const productId = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO marketplace_products (id, seller_id, title, description, price_cents, currency, image_url, destination_id, stock, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)`).bind(productId, user.id, product.title, product.description, product.priceCents, product.currency, product.imageUrl, product.destinationId, product.stock, now, now).run();
  const row = await env.DB.prepare(`SELECT ${columns} FROM marketplace_products p JOIN users u ON u.id = p.seller_id WHERE p.id = ?`).bind(productId).first<ProductRow>();
  return row ? json({ product: present(row) }, 201) : error(500, 'product_not_found');
}
async function update(request: Request, env: Env, user: SessionUser, productId: string): Promise<Response> {
  const existing = await env.DB.prepare('SELECT seller_id FROM marketplace_products WHERE id = ? AND status != \'removed\'').bind(productId).first<{ seller_id: string }>();
  if (!existing || existing.seller_id !== user.id) return error(404, 'product_not_found');
  const product = parseProduct(await readJson(request)); if (!product) return error(400, 'invalid_product');
  const now = new Date().toISOString();
  await env.DB.prepare(`UPDATE marketplace_products SET title = ?, description = ?, price_cents = ?, currency = ?, image_url = ?, destination_id = ?, stock = ?, updated_at = ? WHERE id = ? AND seller_id = ?`)
    .bind(product.title, product.description, product.priceCents, product.currency, product.imageUrl, product.destinationId, product.stock, now, productId, user.id).run();
  const row = await env.DB.prepare(`SELECT ${columns} FROM marketplace_products p JOIN users u ON u.id = p.seller_id WHERE p.id = ?`).bind(productId).first<ProductRow>();
  return row ? json({ product: present(row) }) : error(404, 'product_not_found');
}
async function remove(env: Env, user: SessionUser, productId: string): Promise<Response> {
  const result = await env.DB.prepare("UPDATE marketplace_products SET status = 'removed', updated_at = ? WHERE id = ? AND seller_id = ? AND status != 'removed'").bind(new Date().toISOString(), productId, user.id).run();
  return result.meta.changes ? json({ id: productId, status: 'removed' }) : error(404, 'product_not_found');
}
async function order(request: Request, env: Env, user: SessionUser): Promise<Response> {
  const body = await readJson(request); const productId = typeof body?.productId === 'string' ? body.productId : null; const quantity = Number(body?.quantity ?? 1);
  if (!id(productId) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) return error(400, 'invalid_order');
  const product = await env.DB.prepare("SELECT id, seller_id, stock FROM marketplace_products WHERE id = ? AND status = 'published'").bind(productId).first<{ id: string; seller_id: string; stock: number }>();
  if (!product) return error(404, 'product_not_found');
  if (product.seller_id === user.id) return error(400, 'cannot_buy_own_product');
  if (quantity > product.stock) return error(409, 'insufficient_stock');
  const orderId = crypto.randomUUID();
  try {
    await env.DB.prepare('INSERT INTO marketplace_orders (id, product_id, buyer_id, quantity, created_at) VALUES (?, ?, ?, ?, ?)').bind(orderId, productId, user.id, quantity, new Date().toISOString()).run();
  } catch { return error(409, 'order_already_exists'); }
  return json({ id: orderId, status: 'pending' }, 201);
}

export async function handleMarket(request: Request, env: Env, user: SessionUser | null): Promise<Response | null> {
  const url = new URL(request.url); const path = url.pathname; const method = request.method.toUpperCase();
  if (!path.startsWith('/api/market/')) return null;
  if (method === 'GET' && path === '/api/market/products') return list(url, env);
  if (method !== 'GET') { const denied = writer(request, user); if (denied) return denied; }
  if (path === '/api/market/products' && method === 'POST') return create(request, env, user!);
  if (path === '/api/market/orders' && method === 'POST') return order(request, env, user!);
  const match = /^\/api\/market\/products\/([A-Za-z0-9_-]+)$/.exec(path);
  if (match && method === 'PATCH') return update(request, env, user!, match[1]!);
  if (match && method === 'DELETE') return remove(env, user!, match[1]!);
  return error(404, 'market_endpoint_not_found');
}
