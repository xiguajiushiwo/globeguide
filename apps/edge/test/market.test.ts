import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { handleMarket } from '../src/market';
import type { Env } from '../src/env';
import type { SessionUser } from '../src/auth';
import { createSocialDatabase } from './social-fixtures';

const origin = 'https://globeguide.pages.dev';
const city = '10000000-0000-4000-8000-000000000061';
const alice: SessionUser = { id: 'alice', email: 'alice@example.com', displayName: 'Alice', role: 'member', emailVerifiedAt: 'now' };
const bob: SessionUser = { id: 'bob', email: 'bob@example.com', displayName: 'Bob', role: 'member', emailVerifiedAt: 'now' };
let env: Env; let close: () => void;

function request(path: string, method: string, body?: unknown) {
  return new Request(`${origin}${path}`, { method, headers: { Origin: origin, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
async function call(path: string, method: string, user: SessionUser | null, body?: unknown) {
  const response = await handleMarket(request(path, method, body), env, user);
  if (!response) throw new Error('unhandled market route');
  return response;
}

beforeEach(async () => {
  const fixture = createSocialDatabase(); env = { DB: fixture.db, ASSETS: { fetch: async () => new Response('asset') }, AUTH_SECRET: 'test-session-secret-with-at-least-thirty-two-characters', CODE_HMAC_KEY: 'test-code-key-with-at-least-thirty-two-characters' }; close = fixture.close;
  await env.DB.prepare(`INSERT INTO users (id,email,display_name,password_hash,email_verified_at,created_at,updated_at)
    VALUES ('alice','alice@example.com','Alice','x','now','now','now'),('bob','bob@example.com','Bob','x','now','now','now')`).run();
});
afterEach(() => close());

describe('marketplace MVP', () => {
  it('lets a verified user list a product and another user submit a purchase intent', async () => {
    const created = await call('/api/market/products', 'POST', alice, { title: '东京交通卡套装', description: '适合第一次去东京的旅行小套装，包含收纳和路线提示。', priceCents: 2990, currency: 'CNY', destinationId: city, stock: 3 });
    expect(created.status).toBe(201);
    const productId = (await created.json() as { product: { id: string } }).product.id;
    expect((await call('/api/market/products', 'GET', null)).status).toBe(200);
    const order = await call('/api/market/orders', 'POST', bob, { productId, quantity: 1 });
    expect(order.status).toBe(201);
    expect((await call('/api/market/orders', 'POST', alice, { productId, quantity: 1 })).status).toBe(400);
  });

  it('rejects unsafe listings and duplicate purchase intents', async () => {
    expect((await call('/api/market/products', 'POST', alice, { title: '<b>Bad</b>', description: 'This should not be accepted as a listing.', priceCents: 100, currency: 'CNY', stock: 1 })).status).toBe(400);
    const created = await call('/api/market/products', 'POST', alice, { title: '京都手作地图', description: '一份适合慢慢走京都街区的纸质地图和路线建议。', priceCents: 1200, currency: 'CNY', stock: 1 });
    const productId = (await created.json() as { product: { id: string } }).product.id;
    expect((await call('/api/market/orders', 'POST', bob, { productId, quantity: 1 })).status).toBe(201);
    expect((await call('/api/market/orders', 'POST', bob, { productId, quantity: 1 })).status).toBe(409);
  });
});
