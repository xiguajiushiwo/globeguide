'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { StoriesFeed } from './stories-feed';
import type { Story } from '@/lib/story-api';

export function StoryCreator() {
  const id = useSearchParams().get('id');
  const [items, setItems] = useState<Story[]>([]);
  const author = items[0]?.author;
  return <div className="shell stories-page">
    <Link className="story-back" href="/stories/"><ArrowLeft size={17} aria-hidden="true" />All travel notes</Link>
    <div className="creator-profile">
      <div className="creator-profile__avatar" aria-hidden="true">{author?.displayName.slice(0, 1).toUpperCase() ?? 'G'}</div>
      <div><p className="stories-eyebrow">Community contributor</p><h1>{author?.displayName ?? 'Creator travel notes'}</h1>
        <p>Published guides and moments from this traveler.</p></div>
      {author && <dl className="creator-profile__stats"><div><dt>Notes shown</dt><dd>{items.length}</dd></div><div><dt>Places</dt><dd>{new Set(items.map((item) => item.destinationId)).size}</dd></div></dl>}
    </div>
    {id ? <StoriesFeed authorId={id} onItemsChange={setItems} /> : <p className="story-notice">Choose a creator from a note.</p>}
  </div>;
}
