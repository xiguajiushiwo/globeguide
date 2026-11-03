import type { Metadata } from 'next';
import { AccountCenter } from '@/components/account-center';

export const metadata: Metadata = { title: '个人中心', robots: { index: false, follow: false } };
export default function AccountPage() { return <AccountCenter />; }
