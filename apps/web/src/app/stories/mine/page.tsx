import type { Metadata } from 'next';

import { StoryDashboard } from '@/components/story-dashboard';

export const metadata: Metadata = { title: 'Your writing' };

export default function MyStoriesPage() { return <StoryDashboard />; }
