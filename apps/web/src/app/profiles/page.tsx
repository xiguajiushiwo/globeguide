import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ProfileRoute } from '@/components/profile-route';
export const metadata: Metadata = { title: '旅友主页' };
export default function ProfilePage() { return <Suspense fallback={<div className="shell member-page">正在加载主页…</div>}><ProfileRoute /></Suspense>; }
