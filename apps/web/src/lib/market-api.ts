import { requestJson, StoryApiError } from './story-api';

export type MarketProduct = {
  id: string;
  seller: { id: string; displayName: string };
  title: string;
  description: string;
  priceCents: number;
  currency: 'CNY' | 'JPY' | 'USD';
  imageUrl: string | null;
  destinationId: string | null;
  stock: number;
  status: 'published' | 'sold' | 'removed';
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = Pick<MarketProduct, 'title' | 'description' | 'priceCents' | 'currency' | 'imageUrl' | 'destinationId' | 'stock'>;

function jsonInit(method: string, data: unknown): RequestInit {
  return { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) };
}

export function listProducts(filters: { q?: string; destinationId?: string } = {}) {
  const params = new URLSearchParams(); if (filters.q) params.set('q', filters.q); if (filters.destinationId) params.set('destinationId', filters.destinationId);
  return requestJson<{ items: MarketProduct[] }>(`/api/market/products${params.size ? `?${params}` : ''}`);
}
export function createProduct(input: ProductInput) { return requestJson<{ product: MarketProduct }>('/api/market/products', jsonInit('POST', input)); }
export function createOrder(productId: string, quantity = 1) { return requestJson<{ id: string; status: string }>('/api/market/orders', jsonInit('POST', { productId, quantity })); }

export function marketErrorMessage(error: unknown): string {
  if (!(error instanceof StoryApiError)) return '商城服务暂时不可用，请稍后重试。';
  const messages: Record<string, string> = {
    login_required: '登录后才能发布商品或提交购买意向。',
    email_not_verified: '请先完成邮箱验证。',
    invalid_product: '请检查商品标题、描述、价格和库存。',
    invalid_order: '购买数量不正确。',
    insufficient_stock: '库存不足。',
    cannot_buy_own_product: '不能购买自己发布的商品。',
    order_already_exists: '你已经提交过这个商品的购买意向。',
  };
  return messages[error.code] ?? '商城操作没有完成，请稍后重试。';
}
