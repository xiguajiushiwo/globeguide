import type { Metadata } from 'next';

import { StoryModeration } from '@/components/story-moderation';

export const metadata: Metadata = { title: 'Travel Notes review queue' };

export default function ModerationPage() { return <StoryModeration />; }
