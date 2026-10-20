import type { Metadata } from 'next';
import { Suspense } from 'react';

import { StoryViewer } from '@/components/story-viewer';

export const metadata: Metadata = { title: 'Travel Note' };

export default function StoryPage() {
  return <Suspense fallback={<div className="shell story-detail"><p>Loading travel note…</p></div>}><StoryViewer /></Suspense>;
}
