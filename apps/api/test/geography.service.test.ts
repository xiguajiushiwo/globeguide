import { describe, expect, it, vi } from 'vitest';

import { GeographyService } from '../src/geography/geography.service.js';

const place = {
  id: '11111111-1111-4111-8111-111111111111',
  kind: 'city',
  countryCode: 'JP',
  latitude: 35.6762,
  longitude: 139.6503,
  timeZone: 'Asia/Tokyo',
  currency: 'JPY',
  dataRegion: 'global',
  createdAt: new Date('2026-10-01T00:00:00Z'),
  updatedAt: new Date('2026-10-19T00:00:00Z'),
  names: [
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', placeId: '11111111-1111-4111-8111-111111111111', locale: 'en', value: 'Tokyo', isPreferred: true },
    { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', placeId: '11111111-1111-4111-8111-111111111111', locale: 'ja-JP', value: '東京', isPreferred: true },
  ],
  sources: [
    { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', placeId: '11111111-1111-4111-8111-111111111111', label: 'Tokyo official tourism source', url: null, sourceType: 'official', license: null, collectedAt: new Date('2026-10-19T00:00:00Z') },
  ],
};

describe('GeographyService', () => {
  it('returns the requested localized name and source', async () => {
    const prisma = {
      place: {
        findUnique: vi.fn().mockResolvedValue(place),
        findMany: vi.fn(),
      },
    };
    const service = new GeographyService(prisma as never);

    await expect(service.getPlace(place.id, 'ja-JP')).resolves.toMatchObject({
      id: place.id,
      name: '東京',
      locale: 'ja-JP',
      sourceLabel: 'Tokyo official tourism source',
    });
  });

  it('uses English as the fallback locale', async () => {
    const prisma = {
      place: {
        findUnique: vi.fn().mockResolvedValue(place),
        findMany: vi.fn(),
      },
    };
    const service = new GeographyService(prisma as never);

    await expect(service.getPlace(place.id, 'fr-FR')).resolves.toMatchObject({
      name: 'Tokyo',
      locale: 'fr-FR',
    });
  });
});
