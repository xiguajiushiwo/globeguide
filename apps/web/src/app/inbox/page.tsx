import type { Metadata } from 'next';
import { Suspense } from 'react';
import { InboxView } from '@/components/inbox-view';

export const metadata: Metadata = { title: 'Inbox' };
export default function InboxPage() { return <Suspense fallback={<div className="shell inbox-page"><p className="story-status">Loading inbox…</p></div>}><InboxView /></Suspense>; }
