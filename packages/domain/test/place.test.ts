import { describe, expect, it } from 'vitest';

import { placeSummarySchema } from '../src/place.js';

const validPlace = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Tokyo',
  countryCode: 'JP',
  latitude: 35.6762,
  longitude: 139.6503,
  locale: 'en-US',
  timeZone: 'Asia/Tokyo',
  currency: 'JPY',
  updatedAt: '2026-10-19T08:00:00Z',
  sourceLabel: 'Tokyo Metropolitan Government',
};

describe('place summary schema', () => {
  it('accepts a globally addressable place', () => {
    const parsed = placeSummarySchema.parse(validPlace);
    expect(parsed.id).toBe(validPlace.id);
    expect(parsed.currency).toBe('JPY');
  });

  it('rejects coordinates outside the earth', () => {
    expect(() => placeSummarySchema.parse({ ...validPlace, latitude: 91 })).toThrow();
    expect(() => placeSummarySchema.parse({ ...validPlace, longitude: -181 })).toThrow();
  });
});
