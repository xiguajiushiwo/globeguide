import type { Metadata } from 'next';
import { Suspense } from 'react';

import { StoryComposer } from '@/components/story-composer';

export const metadata: Metadata = { title: 'Write a travel note' };

export default function WriteStoryPage() {
  return <Suspense fallback={<div className="shell story-compose"><p>Loading editor…</p></div>}><StoryComposer /></Suspense>;
}
