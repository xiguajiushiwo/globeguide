'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, FilePenLine, Plus, Trash2, Undo2 } from 'lucide-react';
import { getDestination } from '@globeguide/domain';

import { deleteStory, getSession, listOwnStories, retractStory, storyErrorMessage } from '@/lib/story-api';
import type { Story } from '@/lib/story-api';

export function StoryDashboard() {
  const [items, setItems] = useState<Story[]>([]);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const [workingId, setWorkingId] = useState('');

  const reload = useCallback(async () => {
    try {
      const user = await getSession();
      setAuthenticated(Boolean(user));
      if (user) setItems(await listOwnStories());
    } catch (error) { setMessage(storyErrorMessage(error)); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);

  async function act(story: Story, action: 'delete' | 'retract') {
    if (action === 'delete' && !window.confirm('Delete this story? It will no longer be available.')) return;
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
    <h1>Your writing</h1><p>Sign in to manage your drafts and published stories.</p>
    <Link className="story-primary" href="/login/?next=/stories/mine/">Sign in</Link>
  </div>;

  return <div className="shell stories-page">
    <div className="stories-heading"><div><p className="stories-eyebrow">Creator studio</p><h1>Your writing</h1>
      <p>Drafts, reviews and published stories in one place.</p></div>
      <Link className="story-primary" href="/stories/write/"><Plus size={18} aria-hidden="true" />New story</Link>
    </div>
    {message && <p className="story-notice" role="status">{message}</p>}
    {authenticated === null && !message && <p className="story-status">Loading your stories…</p>}
    {authenticated && items.length === 0 && <div className="story-empty"><FilePenLine size={30} aria-hidden="true" />
      <h2>No drafts yet</h2><p>Start a guide or write down a travel moment.</p>
      <Link href="/stories/write/">Write your first story <ArrowUpRight size={17} aria-hidden="true" /></Link></div>}
    <div className="story-dashboard-list">{items.map((story) => {
      const place = getDestination(story.destinationId);
      return <article className="story-dashboard-row" key={story.id}>
        <div><span className="story-status-pill">{story.status}</span><span className="story-row-kind">{story.type === 'guide' ? 'Guide' : 'Travel journal'}</span>
          <h2>{story.title || story.body.slice(0, 55)}</h2>
          <p>{place?.place.name ?? 'Destination'} · Updated {new Date(story.updatedAt).toLocaleDateString('en')}</p></div>
        <div className="story-row-actions">
          <Link href={`/stories/write/?id=${encodeURIComponent(story.id)}`} title="Edit story" aria-label="Edit story"><FilePenLine size={18} /></Link>
          {story.status === 'published' && <Link href={`/stories/post/?id=${encodeURIComponent(story.id)}`} title="View published story" aria-label="View published story"><ArrowUpRight size={18} /></Link>}
          {(story.status === 'pending' || story.status === 'published') && <button type="button" title="Withdraw story" aria-label="Withdraw story" disabled={workingId === story.id} onClick={() => void act(story, 'retract')}><Undo2 size={18} /></button>}
          <button type="button" title="Delete story" aria-label="Delete story" disabled={workingId === story.id} onClick={() => void act(story, 'delete')}><Trash2 size={18} /></button>
        </div>
      </article>;
    })}</div>
  </div>;
}
