import type { Metadata } from 'next';
import { Suspense } from 'react';

import { StoryCreator } from '@/components/story-creator';

export const metadata: Metadata = { title: 'Creator stories' };

export default function CreatorPage() {
  return <Suspense fallback={<div className="shell stories-page"><p>Loading creator…</p></div>}><StoryCreator /></Suspense>;
}
