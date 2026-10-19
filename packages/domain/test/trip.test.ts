import { describe, expect, it } from 'vitest';

import { tripDraftSchema, tripItemSchema } from '../src/trip.js';

const validItem = {
  id: '22222222-2222-4222-8222-222222222222',
  placeId: '11111111-1111-4111-8111-111111111111',
  position: 0,
  startsAt: '2026-11-01T09:00:00+09:00',
  endsAt: '2026-11-01T11:00:00+09:00',
  notes: '',
};

describe('trip schemas', () => {
  it('rejects an item whose end precedes its start', () => {
    expect(() => tripItemSchema.parse({ ...validItem, endsAt: validItem.startsAt })).toThrow(
      'trip.item.end_must_follow_start',
    );
  });

  it('rejects a trip whose end date precedes its start date', () => {
    expect(() =>
      tripDraftSchema.parse({
        id: '33333333-3333-4333-8333-333333333333',
        ownerId: '44444444-4444-4444-8444-444444444444',
        destinationId: validItem.placeId,
        locale: 'en-US',
        timeZone: 'Asia/Tokyo',
        currency: 'JPY',
        startDate: '2026-11-03',
        endDate: '2026-11-01',
        items: [validItem],
      }),
    ).toThrow('trip.end_date_must_follow_start_date');
  });
});
