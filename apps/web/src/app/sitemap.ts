import type { MetadataRoute } from 'next';

import { destinationCatalog } from '@globeguide/domain';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = 'https://globeguide.pages.dev';
  return [
    { url: origin, changeFrequency: 'weekly', priority: 1 },
    { url: `${origin}/map/`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${origin}/guides/japan/`, lastModified: '2026-10-22', changeFrequency: 'monthly', priority: 0.9 },
    ...destinationCatalog.map((destination) => ({
      url: `${origin}/destinations/${destination.place.id}/`,
      lastModified: destination.place.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: destination.guideId ? 0.8 : 0.5,
    })),
  ];
}
