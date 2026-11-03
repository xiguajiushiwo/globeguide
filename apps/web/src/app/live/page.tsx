import type { Metadata } from 'next';
import { Suspense } from 'react';

import { StoriesFeed } from '@/components/stories-feed';
import './live.css';

export const metadata: Metadata = { title: '旅行直播', description: 'Discover scheduled travel live rooms from Wayella creators.' };

export default function LivePage() {
  return <div className="shell live-page"><div className="live-page__hero"><div><p className="stories-eyebrow">Live from the community</p><h1>旅行直播</h1><p>看路线实况、目的地问答和出发前的实时分享。创作者可以先预约直播，再补充直播间地址。</p></div><a className="story-primary" href="/stories/write/?mode=live">预约直播</a></div><Suspense fallback={<p className="story-status">Loading live rooms…</p>}><StoriesFeed format="live" /></Suspense></div>;
}
