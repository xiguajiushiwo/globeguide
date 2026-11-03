'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { destinationCatalog, getDestination } from '@globeguide/domain';
import { Check, PackagePlus, Search, ShoppingBag } from 'lucide-react';

import { createOrder, createProduct, listProducts, marketErrorMessage, type MarketProduct } from '@/lib/market-api';
import { getSession } from '@/lib/story-api';

export function MarketPage() {
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [query, setQuery] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: '', currency: 'CNY' as 'CNY' | 'JPY' | 'USD', imageUrl: '', destinationId: '', stock: '1' });

  async function load() {
    try { setProducts((await listProducts({ q: query.trim(), ...(destinationId ? { destinationId } : {}) })).items); setMessage(''); }
    catch (error) { setMessage(marketErrorMessage(error)); }
  }
  useEffect(() => { getSession().then((user) => setAuthenticated(Boolean(user))).catch(() => setAuthenticated(false)); void load(); }, []);

  async function search(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setWorking(true); await load(); setWorking(false); }
  async function publish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setWorking(true); setMessage('');
    try {
      await createProduct({ title: form.title.trim(), description: form.description.trim(), priceCents: Math.round(Number(form.price) * 100), currency: form.currency, imageUrl: form.imageUrl.trim() || null, destinationId: form.destinationId || null, stock: Number(form.stock) });
      setForm({ title: '', description: '', price: '', currency: 'CNY', imageUrl: '', destinationId: '', stock: '1' });
      setMessage('商品已上架。'); await load();
    } catch (error) { setMessage(marketErrorMessage(error)); }
    finally { setWorking(false); }
  }
  async function buy(product: MarketProduct) {
    setWorking(true); setMessage('');
    try { await createOrder(product.id); setMessage('购买意向已提交，卖家可以在站内联系你。'); }
    catch (error) { setMessage(marketErrorMessage(error)); }
    finally { setWorking(false); }
  }
  const formatPrice = (product: MarketProduct) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: product.currency }).format(product.priceCents / 100);

  return <div className="shell market-page">
    <div className="market-hero"><div><p className="stories-eyebrow">Wayella marketplace</p><h1>旅行商城</h1><p>交换旅行装备、当地体验和原创路线服务。先提交购买意向，再在站内确认细节。</p></div><ShoppingBag size={46} strokeWidth={1.4} aria-hidden="true" /></div>
    <form className="market-filters" onSubmit={search}><label><Search size={16} aria-hidden="true" /><span className="sr-only">搜索商品</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索装备、体验、路线服务" /></label><select value={destinationId} onChange={(event) => setDestinationId(event.target.value)}><option value="">全部目的地</option>{destinationCatalog.map((item) => <option key={item.place.id} value={item.place.id}>{item.place.name} · {item.nameZh}</option>)}</select><button className="story-primary" type="submit" disabled={working}>搜索</button></form>
    {message && <p className="story-notice" role="status">{message}</p>}
    {authenticated ? <details className="market-seller"><summary><PackagePlus size={18} aria-hidden="true" />发布商品</summary><form onSubmit={publish} className="market-seller__form"><label>商品标题<input required maxLength={100} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label>商品描述<textarea required minLength={10} maxLength={4000} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><div className="market-form-grid"><label>价格<input required type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label><label>货币<select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value as typeof form.currency })}><option value="CNY">CNY</option><option value="JPY">JPY</option><option value="USD">USD</option></select></label><label>库存<input required type="number" min="1" max="10000" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} /></label></div><label>商品图片地址 <span className="market-optional">可选</span><input type="url" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://…" /></label><label>关联目的地 <span className="market-optional">可选</span><select value={form.destinationId} onChange={(event) => setForm({ ...form, destinationId: event.target.value })}><option value="">不关联</option>{destinationCatalog.map((item) => <option key={item.place.id} value={item.place.id}>{item.place.name} · {item.nameZh}</option>)}</select></label><button className="story-primary" type="submit" disabled={working}>立即上架</button></form></details> : <p className="market-signin"><Link href="/login/?next=/market/">登录</Link>后可以发布商品或提交购买意向。</p>}
    <div className="market-grid">{products.map((product) => <article className="market-card" key={product.id}>{product.imageUrl ? <img src={product.imageUrl} alt={product.title} loading="lazy" /> : <div className="market-card__placeholder"><ShoppingBag size={28} aria-hidden="true" /></div>}<div className="market-card__body"><div className="market-card__meta"><span>{product.destinationId ? getDestination(product.destinationId)?.place.name ?? '旅行商品' : '旅行商品'}</span><span>{product.stock} 件</span></div><h2>{product.title}</h2><p>{product.description}</p><div className="market-card__footer"><strong>{formatPrice(product)}</strong>{authenticated ? <button className="story-primary" type="button" onClick={() => void buy(product)} disabled={working || product.stock < 1}>{product.stock < 1 ? '已售罄' : '我要购买'}</button> : <Link className="story-secondary" href={`/login/?next=/market/`}>登录购买</Link>}</div><small>卖家：{product.seller.displayName}</small></div></article>)}</div>
    {products.length === 0 && <div className="story-empty"><Check size={30} aria-hidden="true" /><h2>还没有匹配商品</h2><p>你可以先发布第一件旅行相关商品。</p></div>}
  </div>;
}
