'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { StoriesFeed } from './stories-feed';

export function StoryCreator() {
  const id = useSearchParams().get('id');
  return <div className="shell stories-page">
    <Link className="story-back" href="/stories/"><ArrowLeft size={17} aria-hidden="true" />All stories</Link>
    <div className="stories-heading"><div><p className="stories-eyebrow">Community contributor</p><h1>Creator stories</h1>
      <p>Published guides and travel notes from this traveler.</p></div></div>
    {id ? <StoriesFeed authorId={id} /> : <p className="story-notice">Choose a creator from a story.</p>}
  </div>;
}
