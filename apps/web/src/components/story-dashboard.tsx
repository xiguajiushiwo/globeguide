'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, FilePenLine, Plus, Trash2, Undo2 } from 'lucide-react';
import { getDestination } from '@globeguide/domain';

import { deleteStory, getSession, listOwnStories, retractStory, storyErrorMessage } from '@/lib/story-api';
import type { Story, StoryStatus } from '@/lib/story-api';

const statusNames: Record<StoryStatus, string> = { draft: '草稿', pending: '待审核', published: '已发布', rejected: '未通过', removed: '已移除' };

export function StoryDashboard() {
  const [items, setItems] = useState<Story[]>([]);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const [workingId, setWorkingId] = useState('');
  const [filter, setFilter] = useState<StoryStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true); setMessage('');
    try {
      const user = await getSession();
      setAuthenticated(Boolean(user));
      if (user) setItems(await listOwnStories());
    } catch (error) { setMessage(storyErrorMessage(error)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);

  async function act(story: Story, action: 'delete' | 'retract') {
    if (workingId) return;
    if (action === 'delete' && !window.confirm('删除这篇作品？删除后将不再展示，也无法从个人中心找回。')) return;
    if (action === 'retract' && !window.confirm('撤回作品为草稿？撤回后公开页面将不可见，你可以修改后重新提交。')) return;
    setWorkingId(story.id);
    setMessage('');
    try {
      if (action === 'delete') await deleteStory(story.id);
      else await retractStory(story.id);
      await reload();
    } catch (error) { setMessage(storyErrorMessage(error)); }
    finally { setWorkingId(''); }
  }

  if (authenticated === false) return <div className="shell stories-page">
    <h1>我的作品</h1><p>登录后管理草稿、审核中和已发布的作品。</p>
    <Link className="story-primary" href="/login/?next=/stories/mine/">登录查看</Link>
  </div>;

  return <div className="shell stories-page">
    <Link className="story-back" href="/account/">← 返回个人中心</Link>
    <div className="stories-heading"><div><p className="stories-eyebrow">Creator studio</p><h1>我的作品</h1>
      <p>从第一份草稿到公开分享，在这里管理创作。修改已发布内容后会重新审核。</p></div>
      <Link className="story-primary" href="/stories/write/"><Plus size={18} aria-hidden="true" />发布新内容</Link>
    </div>
    {message && <div className="story-notice" role="alert">{message} <button className="story-tertiary" disabled={loading} onClick={() => void reload()}>重新加载</button></div>}
    {loading && <p className="story-status">正在加载作品…</p>}
    {authenticated && <div className="member-status-filters" aria-label="按作品状态筛选">{(['all', 'draft', 'pending', 'published', 'rejected'] as const).map((status) => <button key={status} aria-pressed={filter === status} onClick={() => setFilter(status)}>{status === 'all' ? '全部' : statusNames[status]} · {status === 'all' ? items.length : items.filter((item) => item.status === status).length}</button>)}</div>}
    {!loading && !message && authenticated && !items.some((item) => filter === 'all' || item.status === filter) && <div className="story-empty"><FilePenLine size={30} aria-hidden="true" />
      <h2>{filter === 'all' ? '还没有创作' : `暂无${statusNames[filter]}作品`}</h2><p>记录一条旅行经验，让下一位旅友少走弯路。</p>
      <Link href="/stories/write/">开始创作 <ArrowUpRight size={17} aria-hidden="true" /></Link></div>}
    <div className="story-dashboard-list">{items.filter((item) => filter === 'all' || item.status === filter).map((story) => {
      const place = getDestination(story.destinationId);
      return <article className="story-dashboard-row" key={story.id}>
        <div><span className="story-status-pill">{statusNames[story.status]}</span><span className="story-row-kind">{story.format === 'video' ? '视频' : story.format === 'gallery' ? '相册' : story.format === 'live' ? '直播' : story.type === 'guide' ? '攻略' : '动态'}</span>
          <h2>{story.title || story.body.slice(0, 55)}</h2>
          <p>{place?.place.name ?? '目的地'} · 更新于 {new Date(story.updatedAt).toLocaleDateString('zh-CN')}</p></div>
        <div className="story-row-actions">
          <Link href={`/stories/write/?id=${encodeURIComponent(story.id)}`} title="编辑作品" aria-label="编辑作品"><FilePenLine size={18} />编辑</Link>
          {story.status === 'published' && <Link href={`/stories/post/?id=${encodeURIComponent(story.id)}`} title="查看作品" aria-label="查看作品"><ArrowUpRight size={18} />查看</Link>}
          {(story.status === 'pending' || story.status === 'published') && <button type="button" title="撤回作品" aria-label="撤回作品" disabled={Boolean(workingId)} onClick={() => void act(story, 'retract')}><Undo2 size={18} />撤回</button>}
          <button type="button" title="删除作品" aria-label="删除作品" disabled={Boolean(workingId)} onClick={() => void act(story, 'delete')}><Trash2 size={18} />删除</button>
        </div>
      </article>;
    })}</div>
  </div>;
}
