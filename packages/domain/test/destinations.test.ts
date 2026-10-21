import { describe, expect, it } from 'vitest';

import { destinationCatalog, getDestination, isDestinationId, searchDestinations } from '../src/destinations.js';

describe('destination catalog', () => {
  it('contains the existing destinations plus the world capital catalog', () => {
    expect(destinationCatalog).toHaveLength(232);
    expect(destinationCatalog.filter((destination) => destination.regionGroup === 'mainland')).toHaveLength(31);
    expect(new Set(destinationCatalog.map((destination) => destination.place.id)).size).toBe(232);
    expect(destinationCatalog.filter((destination) => destination.guideId)).toHaveLength(3);
    expect(destinationCatalog.filter((destination) => destination.isCapital)).toHaveLength(199);
    for (const id of [
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      '33333333-3333-4333-8333-333333333333',
    ]) expect(isDestinationId(id)).toBe(true);
  });

  it('keeps coordinates and region codes valid', () => {
    for (const destination of destinationCatalog) {
      expect(destination.place.latitude).toBeGreaterThanOrEqual(-90);
      expect(destination.place.latitude).toBeLessThanOrEqual(90);
      expect(destination.place.longitude).toBeGreaterThanOrEqual(-180);
      expect(destination.place.longitude).toBeLessThanOrEqual(180);
      expect(destination.regionCode).not.toBe('');
      expect(getDestination(destination.place.id)).toBe(destination);
    }
  });

  it('searches Chinese, English, and alternate names', () => {
    expect(searchDestinations('西安')[0]?.place.name).toBe("Xi'an");
    expect(searchDestinations('Xian')[0]?.place.name).toBe("Xi'an");
    expect(searchDestinations('Canton')[0]?.place.name).toBe('Guangzhou');
    expect(searchDestinations('París')[0]?.place.name).toBe('Paris');
    expect(searchDestinations('CN-SC')[0]?.place.name).toBe('Chengdu');
    expect(searchDestinations('Nairobi')[0]?.capitalOf).toBe('Kenya');
    expect(searchDestinations('巴勒斯坦')[0]?.place.name).toBe('Ramallah');
  });
});
