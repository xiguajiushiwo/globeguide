import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { japanFieldDays } from './japan-field-guide';

describe('Japan field guide', () => {
  it('covers each day with distinct, usable map points', () => {
    expect(japanFieldDays.map((day) => day.day)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const stops = japanFieldDays.flatMap((day) => day.stops);
    expect(new Set(stops.map((stop) => stop.id)).size).toBe(stops.length);
    for (const stop of stops) {
      expect(stop.coordinates[0]).toBeGreaterThan(122);
      expect(stop.coordinates[0]).toBeLessThan(154);
      expect(stop.coordinates[1]).toBeGreaterThan(20);
      expect(stop.coordinates[1]).toBeLessThan(46);
    }
  });

  it('keeps credited photos in the exported site', () => {
    const photos = japanFieldDays.flatMap((day) => day.stops).flatMap((stop) => stop.photo ? [stop.photo] : []);
    expect(photos.length).toBeGreaterThanOrEqual(3);
    for (const photo of photos) {
      expect(existsSync(resolve(process.cwd(), 'public', photo.src.slice(1)))).toBe(true);
      expect(photo.credit).toContain('Pexels');
      expect(photo.alt.length).toBeGreaterThan(8);
    }
  });
});
