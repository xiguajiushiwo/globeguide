import { describe, expect, it } from 'vitest';
import { filterJapanThemePlaces, japanRegions, japanThemeCategories, japanThemePlaces } from './japan-theme-places';

describe('Japan theme map places', () => {
  it('has usable, distinct locations in every selectable category', () => {
    expect(new Set(japanThemePlaces.map((place) => place.id)).size).toBe(japanThemePlaces.length);
    for (const category of japanThemeCategories) {
      expect(japanThemePlaces.filter((place) => place.category === category.id).length).toBeGreaterThanOrEqual(4);
    }
    for (const region of japanRegions) {
      expect(japanThemePlaces.some((place) => place.region === region.id)).toBe(true);
    }
    for (const place of japanThemePlaces) {
      expect(place.coordinates[0]).toBeGreaterThan(122);
      expect(place.coordinates[0]).toBeLessThan(154);
      expect(place.coordinates[1]).toBeGreaterThan(20);
      expect(place.coordinates[1]).toBeLessThan(46);
      expect(place.context.length).toBeGreaterThan(15);
      expect(place.visitTip.length).toBeGreaterThan(10);
      if (place.source) expect(place.source.url).toMatch(/^https:\/\//);
      if (place.category === 'anime') {
        expect(place.work).toBeTruthy();
        expect(['scene', 'setting', 'related']).toContain(place.relation);
      }
    }
  });

  it('filters by category, region, and place or work name', () => {
    expect(filterJapanThemePlaces(japanThemePlaces, 'anime', 'all', '你的名字。').length).toBeGreaterThan(1);
    expect(filterJapanThemePlaces(japanThemePlaces, 'anime', 'kanto', '你的名字。').every((place) => place.region === 'kanto')).toBe(true);
    expect(filterJapanThemePlaces(japanThemePlaces, 'anime', 'all', '  须贺神社  ').map((place) => place.id)).toContain('suga-stairs');
    expect(filterJapanThemePlaces(japanThemePlaces, 'museum', 'all', '你的名字。')).toEqual([]);
    expect(filterJapanThemePlaces(japanThemePlaces, 'anime', 'all', '不存在的作品')).toEqual([]);
  });
});
