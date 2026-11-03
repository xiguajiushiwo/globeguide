'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { accountError, listNotifications, profileHref, readNotifications, type Notification } from '@/lib/account-api';
import { StoryApiError } from '@/lib/story-api';

export function NotificationCenter() {
  const [items, setItems] = useState<Notification[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [unread, setUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const load = useCallback(async (after?: string) => {
    const version = ++generation.current; setLoading(true); setError('');
    try {
      const page = await listNotifications(after, unread);
      if (version !== generation.current) return;
      setItems((current) => after ? [...current, ...page.items.filter((item) => !current.some((existing) => existing.id === item.id))] : page.items);
      setCursor(page.nextCursor); setCount(page.unreadCount); setSignedOut(false);
    } catch (cause) {
      if (version !== generation.current) return;
      if (cause instanceof StoryApiError && cause.status === 401) setSignedOut(true);
      else setError(accountError(cause));
    } finally { if (version === generation.current) setLoading(false); }
  }, [unread]);
  useEffect(() => { setItems([]); setCursor(null); void load(); return () => { generation.current++; }; }, [load]);
  async function mark(ids: string[]) {
    if (!ids.length || busy) return;
    setBusy(true); setError('');
    try {
      // Process only the displayed notifications, so newly arriving items remain unread.
      for (let index = 0; index < ids.length; index += 100) await readNotifications(ids.slice(index, index + 100));
      await load();
    } catch (cause) { setError(accountError(cause)); }
    finally { setBusy(false); }
  }
  if (signedOut) return <div className="shell member-page member-empty"><Bell size={32} /><h1>互动通知</h1><p>登录后查看收到的评论和回复。</p><Link className="story-primary" href="/login/?next=/notifications/">登录查看</Link></div>;
  return <div className="shell member-page notification-page">
    <Link className="story-back" href="/account/"><ArrowLeft size={16} />个人中心</Link>
    <div className="member-section-heading"><div><p className="member-eyebrow">STAY CONNECTED</p><h1>互动通知</h1><p>旅友给你的评论和回复 · {count} 条未读</p></div><Link className="story-secondary" href="/inbox/">查看私信</Link></div>
    <div className="notification-toolbar"><label><input type="checkbox" checked={unread} disabled={busy} onChange={(event) => setUnread(event.target.checked)} />只看未读</label><button className="story-secondary" disabled={busy || loading} onClick={() => void load()}><RefreshCw size={15} />刷新</button><button className="story-secondary" disabled={busy || loading || !items.some((item) => !item.readAt)} onClick={() => void mark(items.filter((item) => !item.readAt).map((item) => item.id))}><CheckCheck size={16} />当前列表全部已读</button></div>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {!loading && !error && items.length === 0 && <div className="member-empty"><Bell size={32} /><h2>{unread ? '未读通知已处理完' : '还没有收到互动'}</h2><p>有人评论你的作品或回复你的评论时，会出现在这里。</p><Link className="story-primary" href="/stories/mine/">查看我的作品</Link></div>}
    <ul className="notification-list">{items.map((item) => <li className={`notification-item${item.readAt ? '' : ' is-unread'}`} key={item.id}>
      <header><Link href={profileHref(item.actorId)}>{item.actorName}</Link><span>{item.kind === 'reply' ? '回复了你的评论' : '评论了你的作品'}</span>{!item.readAt && <span className="notification-badge">未读</span>}<time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></header>
      <p>{item.body || (item.commentKind === 'voice' ? '收到一条语音评论' : '收到一条图片评论')}</p><p className="member-hint">来自：{item.postTitle}</p>
      <footer><Link href={`/stories/post/?id=${encodeURIComponent(item.postId)}#comment-${encodeURIComponent(item.commentId)}`} onClick={() => { if (!item.readAt) void readNotifications([item.id]).catch(() => {}); }}>查看并回复 →</Link>{!item.readAt && <button disabled={busy || loading} onClick={() => void mark([item.id])}>标为已读</button>}</footer>
    </li>)}</ul>
    {loading && <p role="status">正在加载通知…</p>}{cursor && <button className="story-secondary" disabled={loading || busy} onClick={() => void load(cursor)}>加载更多</button>}
  </div>;
}
