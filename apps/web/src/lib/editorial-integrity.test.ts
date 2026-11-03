import { describe, expect, it } from 'vitest';
import { getDestination } from '@globeguide/domain';
import { iranArticles, iranCities, iranSources, iranTenDayReference } from './iran-guide';
import { iranGuideIndex, iranDestinationId } from './iran-guide-index';
import { japanTopics, japanTopicSources } from './japan-topics';
import { japanTopicIndex } from './japan-topic-index';

describe('editorial content integrity', () => {
  it('keeps Japan topics, related articles, sources and tables connected', () => {
    const slugs = new Set(japanTopicIndex.map((topic) => topic.slug));
    expect(new Set(japanTopics.map((topic) => topic.slug))).toEqual(slugs);
    for (const topic of japanTopics) {
      const ids = topic.sections.map((section) => section.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const section of topic.sections) {
        for (const source of section.sourceIds ?? []) expect(japanTopicSources[source]).toBeDefined();
        for (const row of section.table?.rows ?? []) expect(row).toHaveLength(section.table!.columns.length);
      }
      for (const related of topic.related) expect(slugs.has(related)).toBe(true);
    }
  });

  it('keeps Iran source references and the ten-day itinerary consistent', () => {
    expect(iranArticles).toHaveLength(4);
    expect(new Set(iranGuideIndex.map((item) => item.href)).size).toBe(4);
    for (const article of iranArticles) {
      const ids = [...article.sections.map((section) => section.id), 'cities', 'checklist', 'sources', 'related'];
      expect(new Set(ids).size).toBe(ids.length);
      for (const section of article.sections) {
        for (const source of section.sources ?? []) expect(iranSources[source]).toBeDefined();
        for (const row of section.table?.rows ?? []) expect(row).toHaveLength(section.table!.columns.length);
      }
    }
    for (const city of iranCities) for (const source of city.sources) expect(iranSources[source]).toBeDefined();
    expect(iranTenDayReference.map((item) => item.day)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(iranTenDayReference.at(-1)?.sleep).toBe('返程');
    const nights = iranTenDayReference.slice(0, -1).reduce<Record<string, number>>((counts, day) => {
      counts[day.sleep] = (counts[day.sleep] ?? 0) + 1;
      return counts;
    }, {});
    expect(nights).toEqual({ 德黑兰: 2, 卡尚: 1, 伊斯法罕: 2, 亚兹德: 2, 设拉子: 2 });
    expect(getDestination(iranDestinationId)?.place.timeZone).toBe('Asia/Tehran');
  });
});
