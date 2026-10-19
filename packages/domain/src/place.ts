import { z } from 'zod';

import { parseCurrencyCode, parseLocaleCode, parseTimeZoneId } from './locale.js';
import { parsePlaceId } from './geo.js';

const isoDateTime = z.string().datetime({ offset: true });

export const placeSummarySchema = z.object({
  id: z.string().transform(parsePlaceId),
  name: z.string().trim().min(1),
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locale: z.string().transform(parseLocaleCode),
  timeZone: z.string().transform(parseTimeZoneId),
  currency: z.string().transform(parseCurrencyCode),
  updatedAt: isoDateTime,
  sourceLabel: z.string().trim().min(1),
});

export type PlaceSummary = z.infer<typeof placeSummarySchema>;

export const placeNameSchema = z.object({
  locale: z.string().transform(parseLocaleCode),
  value: z.string().trim().min(1),
  isPreferred: z.boolean(),
});

export type PlaceName = z.infer<typeof placeNameSchema>;
