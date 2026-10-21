import type { Metadata } from 'next';
import { ProfileView } from '@/components/profile-view';

export const metadata: Metadata = { title: 'Traveler profile' };
// Demo profiles are deterministic so the static export includes the beta smoke-test paths.
export function generateStaticParams() { return ['demo-official', 'demo-tokyo', 'demo-silk-road', 'demo-weekend'].map((id) => ({ id })); }

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProfileView id={id} />;
}
