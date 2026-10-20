'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, BookOpen, Compass, PenLine, Sparkles } from 'lucide-react';
import { destinationCatalog } from '@globeguide/domain';

import { StoryCard } from './story-card';
import { editorialExamples } from '@/lib/story-examples';
import { listStories, storyErrorMessage } from '@/lib/story-api';
import type { Story, StoryType } from '@/lib/story-api';

type Props = { authorId?: string; onItemsChange?: (items: Story[]) => void };

export function StoriesFeed({ authorId, onItemsChange }: Props) {
  const params = useSearchParams();
  const initialDestinationId = params.get('destinationId') ?? '';
  const initialType = params.get('type');
  const [destinationId, setDestinationId] = useState(initialDestinationId);
  const [type, setType] = useState<'' | StoryType>(initialType === 'guide' || initialType === 'moment' ? initialType : '');
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
        onItemsChange?.(data.items);
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
  }, [destinationId, type, authorId, onItemsChange]);

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    try {
      const data = await listStories({ ...(destinationId ? { destinationId } : {}), ...(type ? { type } : {}), ...(authorId ? { authorId } : {}), cursor });
      setItems((current) => {
        const next = [...current, ...data.items];
        onItemsChange?.(next);
        return next;
      });
      setCursor(data.nextCursor);
      setMessage('');
    } catch (error) {
      setMessage(storyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function selectType(value: '' | StoryType) {
    setType(value);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set('type', value);
    else url.searchParams.delete('type');
    window.history.replaceState(window.history.state, '', url.pathname + url.search);
  }

  const examples = useMemo(() => authorId ? [] : editorialExamples.filter((story) =>
    (!destinationId || story.destinationId === destinationId) && (!type || story.type === type)), [authorId, destinationId, type]);
  const featured = examples.slice(0, 2);
  const remainingExamples = examples.slice(2);

  return <div className="notes-feed">
    {!authorId && <>
      <div className="notes-feed__controls">
        <div className="notes-tabs" role="tablist" aria-label="Travel note type">
          <button type="button" role="tab" aria-selected={!type} className={!type ? 'is-active' : ''} onClick={() => selectType('')}><Compass size={16} aria-hidden="true" />Discover</button>
          <button type="button" role="tab" aria-selected={type === 'guide'} className={type === 'guide' ? 'is-active' : ''} onClick={() => selectType('guide')}><BookOpen size={16} aria-hidden="true" />Guides</button>
          <button type="button" role="tab" aria-selected={type === 'moment'} className={type === 'moment' ? 'is-active' : ''} onClick={() => selectType('moment')}><Sparkles size={16} aria-hidden="true" />Moments</button>
        </div>
        <div className="story-filters">
          <label>Destination
            <select value={destinationId} onChange={(event) => setDestinationId(event.target.value)}>
              <option value="">All destinations</option>
              {destinationCatalog.map((destination) => <option key={destination.place.id} value={destination.place.id}>{destination.place.name} · {destination.nameZh}</option>)}
            </select>
          </label>
        </div>
      </div>
    </>}

    {message && <p className="story-notice" role="status">{message}</p>}
    {featured.length > 0 && <section className="notes-featured" aria-labelledby="featured-notes-title">
      <div className="notes-section-heading"><div><p className="stories-eyebrow">From the desk</p><h2 id="featured-notes-title">GlobeGuide editorial picks</h2></div><span>Original planning patterns and travel prompts</span></div>
      <div className="notes-featured__grid">{featured.map((story) => <StoryCard key={story.id} story={story} example featured />)}</div>
    </section>}

    <section className="notes-latest" aria-labelledby="latest-notes-title">
      <div className="notes-section-heading"><div><p className="stories-eyebrow">The community</p><h2 id="latest-notes-title">Latest travel notes</h2></div>{!authorId && <Link href="/stories/mine/">Your notes <ArrowRight size={16} aria-hidden="true" /></Link>}</div>
      <div className="stories-grid" aria-live="polite">
        {items.map((story) => <StoryCard key={story.id} story={story} />)}
        {remainingExamples.map((story) => <StoryCard key={story.id} story={story} example />)}
      </div>
      {loading && <p className="story-status" role="status">Loading travel notes…</p>}
      {!loading && !message && items.length === 0 && remainingExamples.length === 0 && <div className="story-empty">
        <PenLine size={28} aria-hidden="true" /><h2>No notes here yet</h2><p>Be the first to share a thoughtful guide or travel moment for this destination.</p>
        <Link href="/stories/write/">Write your first note <ArrowRight size={17} aria-hidden="true" /></Link>
      </div>}
      {cursor && <button className="story-secondary notes-load-more" type="button" onClick={loadMore} disabled={loading}>Load more notes</button>}
    </section>
  </div>;
}
