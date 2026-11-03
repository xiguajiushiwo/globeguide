import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Radio, Upload } from 'lucide-react';

import { StoriesFeed } from '@/components/stories-feed';

export const metadata: Metadata = {
  title: 'Travel Notes',
  description: 'Discover place-linked guides and travel moments from the Wayella community.',
};

export default function StoriesPage() {
  return <div className="shell stories-page">
    <div className="stories-heading">
      <div><p className="stories-eyebrow">Wayella community</p><h1>Travel Notes</h1>
        <p>Ideas, places, and small moments worth saving.</p></div>
      <div className="stories-heading__actions"><Link className="story-primary" href="/stories/write/"><Upload size={16} aria-hidden="true" />发布内容</Link><Link className="story-secondary" href="/stories/write/?mode=live"><Radio size={16} aria-hidden="true" />预约直播</Link></div>
    </div>
    <Suspense fallback={<p className="story-status">Loading travel notes…</p>}><StoriesFeed /></Suspense>
  </div>;
}
