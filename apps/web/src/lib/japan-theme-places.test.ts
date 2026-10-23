import { describe, expect, it } from 'vitest';
import { japanThemeCategories, japanThemePlaces } from './japan-theme-places';

describe('Japan theme map places', () => {
  it('has usable, distinct locations in every selectable category', () => {
    expect(new Set(japanThemePlaces.map((place) => place.id)).size).toBe(japanThemePlaces.length);
    for (const category of japanThemeCategories) {
      expect(japanThemePlaces.filter((place) => place.category === category.id).length).toBeGreaterThanOrEqual(4);
    }
    for (const place of japanThemePlaces) {
      expect(place.coordinates[0]).toBeGreaterThan(122);
      expect(place.coordinates[0]).toBeLessThan(154);
      expect(place.coordinates[1]).toBeGreaterThan(20);
      expect(place.coordinates[1]).toBeLessThan(46);
      expect(place.context.length).toBeGreaterThan(15);
      expect(place.visitTip.length).toBeGreaterThan(10);
      expect(place.source.url).toMatch(/^https:\/\//);
    }
  });
});
