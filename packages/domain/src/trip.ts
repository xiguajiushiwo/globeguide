import { z } from 'zod';

import { parseCurrencyCode, parseLocaleCode, parseTimeZoneId } from './locale.js';
import { parsePlaceId, parseTripId, parseUserId } from './geo.js';

const isoDate = z.string().date();
const isoDateTime = z.string().datetime({ offset: true });

export const tripItemSchema = z
  .object({
    id: z.string().uuid(),
    placeId: z.string().transform(parsePlaceId),
    position: z.number().int().min(0),
    startsAt: isoDateTime,
    endsAt: isoDateTime,
    notes: z.string().max(2_000),
  })
  .refine((item) => item.endsAt > item.startsAt, {
    path: ['endsAt'],
    message: 'trip.item.end_must_follow_start',
  });

export type TripItem = z.infer<typeof tripItemSchema>;

export const tripDraftSchema = z
  .object({
    id: z.string().transform(parseTripId),
    ownerId: z.string().transform(parseUserId),
    destinationId: z.string().transform(parsePlaceId),
    locale: z.string().transform(parseLocaleCode),
    timeZone: z.string().transform(parseTimeZoneId),
    currency: z.string().transform(parseCurrencyCode),
    startDate: isoDate,
    endDate: isoDate,
    items: z.array(tripItemSchema),
  })
  .refine((trip) => trip.endDate >= trip.startDate, {
    path: ['endDate'],
    message: 'trip.end_date_must_follow_start_date',
  });

export type TripDraft = z.infer<typeof tripDraftSchema>;
