import type { Metadata } from 'next';
import { Suspense } from 'react';

import { StoryViewer } from '@/components/story-viewer';

export const metadata: Metadata = { title: 'Traveler story' };

export default function StoryPage() {
  return <Suspense fallback={<div className="shell story-detail"><p>Loading story…</p></div>}><StoryViewer /></Suspense>;
}
