'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { StoryCard } from './story-card';
import { editorialExamples } from '@/lib/story-examples';
import { listStories } from '@/lib/story-api';
import type { Story } from '@/lib/story-api';


export function DestinationStories({ destinationId }: { destinationId: string }) {
  const [items, setItems] = useState<Story[]>([]);
  useEffect(() => {
    let active = true;
    listStories({ destinationId }).then((data) => { if (active) setItems(data.items.slice(0, 3)); })
      .catch(() => { if (active) setItems([]); });
    return () => { active = false; };
  }, [destinationId]);
  const examples = editorialExamples.filter((story) => story.destinationId === destinationId);
  const visible = [...items, ...examples].slice(0, 3);
  return <section className="destination-stories" aria-labelledby="destination-stories-title">
    <div className="destination-stories__heading"><div><p className="stories-eyebrow">Community</p><h2 id="destination-stories-title">Travel Notes</h2></div>
      <Link href={`/stories/?destinationId=${encodeURIComponent(destinationId)}`}>Explore notes <ArrowRight size={16} aria-hidden="true" /></Link></div>
    {visible.length ? <div className="stories-grid">{visible.map((story) => <StoryCard key={story.id} story={story} example={story.id.startsWith('editorial-')} />)}</div>
      : <div className="destination-stories__empty"><p>No travel notes for this city yet.</p>
        <Link href="/stories/write/">Share a guide or travel note <ArrowRight size={16} aria-hidden="true" /></Link></div>}
  </section>;
}
