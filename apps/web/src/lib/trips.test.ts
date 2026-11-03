import { describe, expect, it } from 'vitest';

import { deleteTrip, exportTrips, importTrips, readTrips, saveTrip, type Trip } from './trips';

const tokyo = '11111111-1111-4111-8111-111111111111';
const paris = '22222222-2222-4222-8222-222222222222';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear() { values.clear(); },
    getItem(key) { return values.get(key) ?? null; },
    key(index) { return [...values.keys()][index] ?? null; },
    removeItem(key) { values.delete(key); },
    setItem(key, value) { values.set(key, value); },
  };
}

const trip: Trip = {
  version: 1,
  id: '99999999-9999-4999-8999-999999999999',
  title: 'Tokyo weekend',
  destinationId: tokyo,
  startDate: '2026-11-01',
  endDate: '2026-11-03',
  notes: 'Walk and explore.',
  highlightIds: ['tokyo-sensoji', 'tokyo-shibuya'],
  updatedAt: '2026-10-20T10:00:00.000Z',
};

const japanTrip: Trip = {
  ...trip,
  id: '88888888-8888-4888-8888-888888888888',
  title: 'Japan 10 days',
  destinationId: tokyo,
  highlightIds: ['ueno', 'fushimi', 'kix'],
  route: { kind: 'japan', templateId: '10-day' },
};

describe('browser-local trips', () => {
  it('creates and edits a trip, preserving stop order after reload', () => {
    const storage = memoryStorage();
    saveTrip(trip, storage);
    saveTrip({ ...trip, notes: 'Book museum', highlightIds: ['tokyo-shibuya', 'tokyo-sensoji'] }, storage);
    expect(readTrips(storage)).toEqual([{ ...trip, notes: 'Book museum', highlightIds: ['tokyo-shibuya', 'tokyo-sensoji'] }]);
  });

  it('rejects invalid or impossible date ranges', () => {
    const storage = memoryStorage();
    expect(() => saveTrip({ ...trip, startDate: '2026-11-04' }, storage)).toThrow();
    expect(() => saveTrip({ ...trip, startDate: '2026-02-30' }, storage)).toThrow();
    expect(readTrips(storage)).toEqual([]);
  });

  it('round trips a versioned export and import', () => {
    const source = memoryStorage();
    const target = memoryStorage();
    saveTrip(trip, source);
    expect(importTrips(exportTrips(source), target)).toEqual([trip]);
    expect(readTrips(target)).toEqual([trip]);
    deleteTrip(trip.id, target);
    expect(readTrips(target)).toEqual([]);
  });

  it('preserves Japan route metadata through save, export, and import', () => {
    const source = memoryStorage();
    const target = memoryStorage();
    saveTrip(japanTrip, source);
    expect(readTrips(source)).toEqual([japanTrip]);
    const exported = exportTrips(source);
    expect(exported).toContain('"templateId": "10-day"');
    expect(importTrips(exported, target)).toEqual([japanTrip]);
    expect(readTrips(target)).toEqual([japanTrip]);
  });

  it('rejects Japan route metadata for another destination or unknown template', () => {
    const storage = memoryStorage();
    expect(() => saveTrip({ ...trip, destinationId: paris, route: { kind: 'japan', templateId: '10-day' } }, storage)).toThrow();
    expect(() => saveTrip({ ...japanTrip, route: { kind: 'japan', templateId: '21-day' as '10-day' } }, storage)).toThrow();
    expect(readTrips(storage)).toEqual([]);
  });

  it('rejects malformed import without changing saved trips', () => {
    const storage = memoryStorage();
    saveTrip(trip, storage);
    const before = exportTrips(storage);
    expect(() => importTrips(JSON.stringify({ version: 1, trips: [{ ...trip, highlightIds: ['x', 'x'] }] }), storage)).toThrow();
    expect(() => importTrips(JSON.stringify({ version: 2, trips: [] }), storage)).toThrow();
    expect(() => importTrips('{bad json', storage)).toThrow();
    expect(exportTrips(storage)).toBe(before);
  });

  it('ignores corrupt stored data without executing or trusting it', () => {
    const storage = memoryStorage();
    storage.setItem('globeguide:trips:v1', '{bad json');
    expect(readTrips(storage)).toEqual([]);
    expect(() => exportTrips(storage)).toThrow();
  });

  it('reports an unavailable storage read during export', () => {
    const storage = memoryStorage();
    storage.getItem = () => { throw new Error('Storage unavailable'); };
    expect(() => exportTrips(storage)).toThrow('Storage unavailable');
  });
});
