import type { Metadata } from 'next';

import { StoryDashboard } from '@/components/story-dashboard';

export const metadata: Metadata = { title: 'Your Travel Notes' };

export default function MyStoriesPage() { return <StoryDashboard />; }
