import type { Story } from './story-api';

// Editorial previews are local content, never presented as traveler submissions.
export const editorialExamples: Story[] = [
  {
    id: 'editorial-xian', author: { id: 'globeguide-editorial', displayName: 'Wayella Editorial' },
    type: 'guide', title: 'A slower first day in Xi’an',
    body: 'Start with a walk inside the old city walls and leave time to look down the side streets. Choose one major sight for the afternoon rather than crossing the city repeatedly. Check current opening details with each venue before you travel. This is an editorial planning example, not a visitor report.',
    language: 'en', destinationId: '10000000-0000-4000-8000-000000000061', visitedMonth: null,
    status: 'published', createdAt: '2026-10-20T00:00:00.000Z', updatedAt: '2026-10-20T00:00:00.000Z',
    submittedAt: null, publishedAt: '2026-10-20T00:00:00.000Z',
    coverImage: '/images/new-york.jpg',
    sourceLabel: 'Inspired by Wayella city planning guidance', sourceUrl: 'https://www.unesco.org/en/silk-roads',
  },
  {
    id: 'editorial-chengdu', author: { id: 'globeguide-editorial', displayName: 'Wayella Editorial' },
    type: 'moment', title: 'An unhurried afternoon in Chengdu',
    body: 'A good travel day does not need a long checklist. Set aside a neighborhood, walk at a comfortable pace, and leave room for a meal or a tea break. This is a Wayella editorial example that illustrates the kind of personal travel note members can publish.',
    language: 'en', destinationId: '10000000-0000-4000-8000-000000000051', visitedMonth: null,
    status: 'published', createdAt: '2026-10-20T00:00:00.000Z', updatedAt: '2026-10-20T00:00:00.000Z',
    submittedAt: null, publishedAt: '2026-10-20T00:00:00.000Z',
    coverImage: '/images/tokyo.jpg',
    sourceLabel: 'Inspired by Chengdu official visitor information', sourceUrl: 'https://www.gochengdu.cn/',
  },
  {
    id: 'editorial-paris', author: { id: 'globeguide-editorial', displayName: 'Wayella Editorial' },
    type: 'guide', title: 'Build a neighborhood day in Paris',
    body: 'Pick one neighborhood and give it a full morning before crossing the city. Pair one major museum or landmark with a nearby market, park, or cafe, then check each venue’s current visitor information before you go. The goal is a useful planning pattern, not a fixed itinerary.',
    language: 'en', destinationId: '22222222-2222-4222-8222-222222222222', visitedMonth: null,
    status: 'published', createdAt: '2026-10-20T00:00:00.000Z', updatedAt: '2026-10-20T00:00:00.000Z',
    submittedAt: null, publishedAt: '2026-10-20T00:00:00.000Z',
    coverImage: '/images/paris.jpg',
    sourceLabel: 'Check current details with Paris tourist information', sourceUrl: 'https://parisjetaime.com/eng/',
  },
  {
    id: 'editorial-tokyo', author: { id: 'globeguide-editorial', displayName: 'Wayella Editorial' },
    type: 'moment', title: 'A quiet hour between train stops',
    body: 'Some of the best travel notes begin with a small pause: step out of the station, find a bench or a side street, and let the neighborhood set the pace. Save the exact details you want to remember, then verify practical information before turning a memory into advice.',
    language: 'en', destinationId: '11111111-1111-4111-8111-111111111111', visitedMonth: null,
    status: 'published', createdAt: '2026-10-20T00:00:00.000Z', updatedAt: '2026-10-20T00:00:00.000Z',
    submittedAt: null, publishedAt: '2026-10-20T00:00:00.000Z',
    coverImage: '/images/tokyo.jpg',
    sourceLabel: 'Inspired by Tokyo official travel guidance', sourceUrl: 'https://www.gotokyo.org/en/',
  },
];

export function editorialExample(id: string): Story | undefined {
  return editorialExamples.find((story) => story.id === id);
}
