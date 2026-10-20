'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, PenLine } from 'lucide-react';
import { destinationCatalog } from '@globeguide/domain';

import { StoryCard } from './story-card';
import { editorialExamples } from '@/lib/story-examples';
import { listStories, storyErrorMessage } from '@/lib/story-api';
import type { Story, StoryType } from '@/lib/story-api';

export function StoriesFeed({ authorId }: { authorId?: string }) {
  const initialDestinationId = useSearchParams().get('destinationId') ?? '';
  const [destinationId, setDestinationId] = useState(initialDestinationId);
  const [type, setType] = useState<'' | StoryType>('');
  const [items, setItems] = useState<Story[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    listStories({ ...(destinationId ? { destinationId } : {}), ...(type ? { type } : {}), ...(authorId ? { authorId } : {}) })
      .then((data) => {
        if (!active) return;
        setItems(data.items);
        setCursor(data.nextCursor);
        setMessage('');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setItems([]);
        setCursor(null);
        setMessage(storyErrorMessage(error));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [destinationId, type, authorId]);

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    try {
      const data = await listStories({ ...(destinationId ? { destinationId } : {}), ...(type ? { type } : {}), ...(authorId ? { authorId } : {}), cursor });
      setItems((current) => [...current, ...data.items]);
      setCursor(data.nextCursor);
      setMessage('');
    } catch (error) {
      setMessage(storyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const examples = authorId ? [] : editorialExamples.filter((story) =>
    (!destinationId || story.destinationId === destinationId) && (!type || story.type === type));

  return <>
    {!authorId && <div className="story-filters" aria-label="Filter stories">
      <label>Destination
        <select value={destinationId} onChange={(event) => setDestinationId(event.target.value)}>
          <option value="">All destinations</option>
          {destinationCatalog.map((destination) => <option key={destination.place.id} value={destination.place.id}>
            {destination.place.name} · {destination.nameZh}
          </option>)}
        </select>
      </label>
      <label>Story type
        <select value={type} onChange={(event) => setType(event.target.value as '' | StoryType)}>
          <option value="">All stories</option><option value="guide">Guides</option><option value="moment">Travel journals</option>
        </select>
      </label>
    </div>}
    {message && <p className="story-notice" role="status">{message}</p>}
    <div className="stories-grid" aria-live="polite">
      {items.map((story) => <StoryCard key={story.id} story={story} />)}
      {examples.map((story) => <StoryCard key={story.id} story={story} example />)}
    </div>
    {loading && <p className="story-status" role="status">Loading stories…</p>}
    {!loading && !message && items.length === 0 && examples.length === 0 && <div className="story-empty">
      <PenLine size={28} aria-hidden="true" /><h2>No stories here yet</h2>
      <p>Be the first to share a thoughtful guide or travel note for this destination.</p>
      <Link href="/stories/write/">Write a story <ArrowRight size={17} aria-hidden="true" /></Link>
    </div>}
    {cursor && <button className="story-secondary" type="button" onClick={loadMore} disabled={loading}>Load more</button>}
  </>;
}
