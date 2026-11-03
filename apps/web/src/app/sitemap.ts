import type { MetadataRoute } from 'next';

import { destinationCatalog } from '@globeguide/domain';
import { japanTopicHref, japanTopicIndex, japanTopicsUpdatedAt } from '@/lib/japan-topic-index';
import { iranGuideIndex, iranGuideUpdatedAt } from '@/lib/iran-guide-index';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = 'https://wayella.com';
  return [
    { url: origin, changeFrequency: 'weekly', priority: 1 },
    { url: `${origin}/map/`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${origin}/guides/`, changeFrequency: 'monthly', priority: 0.8 },
    ...iranGuideIndex.map((article) => ({ url: `${origin}${article.href}`, lastModified: iranGuideUpdatedAt, changeFrequency: 'weekly' as const, priority: 0.7 })),
    { url: `${origin}/guides/japan/`, lastModified: japanTopicsUpdatedAt, changeFrequency: 'monthly', priority: 0.7 },
    ...japanTopicIndex.map((topic) => ({ url: `${origin}${japanTopicHref(topic.slug)}`, lastModified: japanTopicsUpdatedAt, changeFrequency: 'monthly' as const, priority: 0.7 })),
    { url: `${origin}/stories/`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${origin}/live/`, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${origin}/market/`, changeFrequency: 'daily', priority: 0.6 },
    ...destinationCatalog.map((destination) => ({
      url: `${origin}/destinations/${destination.place.id}/`,
      lastModified: destination.place.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: destination.guideId ? 0.8 : 0.5,
    })),
  ];
}
