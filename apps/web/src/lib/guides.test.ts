import { describe, expect, it } from 'vitest';

import { getGuide, guides, searchGuides } from './guides';
import { searchPlaces } from './places';

describe('curated city guides', () => {
  it('has three unique, addressable cities and stops', () => {
    expect(guides).toHaveLength(3);
    expect(new Set(guides.map((guide) => guide.place.id)).size).toBe(3);

    for (const guide of guides) {
      expect(getGuide(guide.place.id)).toBe(guide);
      expect(guide.sections.length).toBeGreaterThanOrEqual(5);
      expect(guide.highlights.length).toBeGreaterThanOrEqual(5);
      expect(new Set(guide.highlights.map((item) => item.id)).size).toBe(guide.highlights.length);
    }
  });

  it('provides checked HTTPS official sources for each factual item', () => {
    for (const guide of guides) {
      const sources = new Map(guide.sources.map((source) => [source.id, source]));
      for (const source of guide.sources) {
        expect(new URL(source.url).protocol).toBe('https:');
        expect(source.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(new Date(`${source.checkedAt}T00:00:00Z`).toString()).not.toBe('Invalid Date');
      }
      for (const item of [...guide.sections, ...guide.highlights]) {
        if (item.kind === 'fact') expect(sources.has(item.sourceId ?? '')).toBe(true);
        else expect(item.kind).toBe('editorial');
      }
    }
  });

  it('searches names, common aliases and places to visit', () => {
    expect(searchGuides('tokio').map((guide) => guide.place.name)).toEqual(['Tokyo']);
    expect(searchGuides('louvre').map((guide) => guide.place.name)).toEqual(['Paris']);
    expect(searchGuides('nyc').map((guide) => guide.place.name)).toEqual(['New York']);
    expect(searchGuides('  ')).toHaveLength(3);
    expect(searchGuides('nowhere nearby')).toEqual([]);
  });

  it('keeps deep-guide content searchable alongside the destination catalog', () => {
    expect(searchPlaces('louvre').map((place) => place.name)).toEqual(['Paris']);
    expect(searchPlaces('西安').map((place) => place.name)).toEqual(["Xi'an"]);
  });
});
