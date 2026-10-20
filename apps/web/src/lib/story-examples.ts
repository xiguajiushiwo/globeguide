import type { Story } from './story-api';

// Editorial previews are local content, never presented as traveler submissions.
export const editorialExamples: Story[] = [
  {
    id: 'editorial-xian', author: { id: 'globeguide-editorial', displayName: 'GlobeGuide Editorial' },
    type: 'guide', title: 'A slower first day in Xi’an',
    body: 'Start with a walk inside the old city walls and leave time to look down the side streets. Choose one major sight for the afternoon rather than crossing the city repeatedly. Check current opening details with each venue before you travel. This is an editorial planning example, not a visitor report.',
    language: 'en', destinationId: '10000000-0000-4000-8000-000000000061', visitedMonth: null,
    status: 'published', createdAt: '2026-10-20T00:00:00.000Z', updatedAt: '2026-10-20T00:00:00.000Z',
    submittedAt: null, publishedAt: '2026-10-20T00:00:00.000Z',
  },
  {
    id: 'editorial-chengdu', author: { id: 'globeguide-editorial', displayName: 'GlobeGuide Editorial' },
    type: 'moment', title: 'An unhurried afternoon in Chengdu',
    body: 'A good travel day does not need a long checklist. Set aside a neighborhood, walk at a comfortable pace, and leave room for a meal or a tea break. This is a GlobeGuide editorial example that illustrates the kind of personal travel note members can publish.',
    language: 'en', destinationId: '10000000-0000-4000-8000-000000000051', visitedMonth: null,
    status: 'published', createdAt: '2026-10-20T00:00:00.000Z', updatedAt: '2026-10-20T00:00:00.000Z',
    submittedAt: null, publishedAt: '2026-10-20T00:00:00.000Z',
  },
];

export function editorialExample(id: string): Story | undefined {
  return editorialExamples.find((story) => story.id === id);
}
