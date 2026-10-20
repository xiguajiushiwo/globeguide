import type { MetadataRoute } from 'next';

import { guides } from '@/lib/guides';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = 'https://globeguide.pages.dev';
  return [
    { url: origin, changeFrequency: 'weekly', priority: 1 },
    ...guides.map((guide) => ({
      url: `${origin}/destinations/${guide.place.id}/`,
      lastModified: guide.place.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
