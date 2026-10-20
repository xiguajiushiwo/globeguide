import type { Metadata } from 'next';
import { Suspense } from 'react';

import { StoriesFeed } from '@/components/stories-feed';

export const metadata: Metadata = {
  title: 'Travel Notes',
  description: 'Discover place-linked guides and travel moments from the GlobeGuide community.',
};

export default function StoriesPage() {
  return <div className="shell stories-page">
    <div className="stories-heading">
      <div><p className="stories-eyebrow">GlobeGuide community</p><h1>Travel Notes</h1>
        <p>Ideas, places, and small moments worth saving.</p></div>
    </div>
    <Suspense fallback={<p className="story-status">Loading travel notes…</p>}><StoriesFeed /></Suspense>
  </div>;
}
