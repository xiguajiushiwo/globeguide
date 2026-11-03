import type { Metadata } from 'next';
import { NotificationCenter } from '@/components/notification-center';
export const metadata: Metadata = { title: '互动通知', robots: { index: false, follow: false } };
export default function NotificationsPage() { return <NotificationCenter />; }
