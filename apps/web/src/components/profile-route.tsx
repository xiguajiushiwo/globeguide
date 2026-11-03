'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ProfileView } from './profile-view';
export function ProfileRoute() {
  const id = useSearchParams().get('id');
  return id && /^[\w-]{1,100}$/.test(id) ? <ProfileView key={id} id={id} /> : <div className="shell member-page"><h1>请选择一位旅友</h1><Link href="/stories/">去看看旅行分享</Link></div>;
}
