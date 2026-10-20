import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, PenLine } from 'lucide-react';

import { StoriesFeed } from '@/components/stories-feed';

export const metadata: Metadata = {
  title: 'Traveler stories',
  description: 'Read place-linked guides and travel journals from the GlobeGuide community.',
};

export default function StoriesPage() {
  return <div className="shell stories-page">
    <div className="stories-heading">
      <div><p className="stories-eyebrow">The travel journal</p><h1>Stories from the road</h1>
        <p>Practical guides and small observations, anchored to places you can explore.</p></div>
      <Link className="story-primary" href="/stories/write/"><PenLine size={17} aria-hidden="true" />Write a story</Link>
    </div>
    <div className="stories-toolbar"><h2>Explore stories</h2><Link href="/stories/mine/">Your writing <ArrowRight size={16} aria-hidden="true" /></Link></div>
    <Suspense fallback={<p className="story-status">Loading stories…</p>}><StoriesFeed /></Suspense>
  </div>;
}
