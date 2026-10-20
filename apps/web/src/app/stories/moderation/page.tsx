import type { Metadata } from 'next';

import { StoryModeration } from '@/components/story-moderation';

export const metadata: Metadata = { title: 'Story moderation' };

export default function ModerationPage() { return <StoryModeration />; }
