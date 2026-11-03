import { Inject, Injectable } from '@nestjs/common';
import { DomainError, parseLocaleCode, parsePlaceId } from '@globeguide/domain';
import type { PlaceSummary } from '@globeguide/domain';
import type { Place, PlaceName, Source } from '@prisma/client';

import { PrismaService } from '../database/database.module.js';

type PlaceWithNames = Place & { names: PlaceName[]; sources: Source[] };

@Injectable()
export class GeographyService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getPlace(placeId: string, requestedLocale = 'en'): Promise<PlaceSummary> {
    const place = await this.prisma.place.findUnique({
      where: { id: placeId },
      include: { names: true, sources: true },
    }) as PlaceWithNames | null;

    if (!place) {
      throw new DomainError('NOT_FOUND', 'places.not_found', { placeId });
    }

    return this.toSummary(place, requestedLocale);
  }

  async searchPlaces(query: string, requestedLocale = 'en', cursor?: string): Promise<{
    items: PlaceSummary[];
    nextCursor: string | null;
  }> {
    const places = await this.prisma.place.findMany({
      where: {
        names: {
          some: { value: { contains: query, mode: 'insensitive' } },
        },
      },
      include: { names: true, sources: true },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 21,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    }) as PlaceWithNames[];

    const hasMore = places.length > 20;
    const page = hasMore ? places.slice(0, 20) : places;
    return {
      items: page.map((place) => this.toSummary(place, requestedLocale)),
      nextCursor: hasMore ? page.at(-1)?.id ?? null : null,
    };
  }

  private toSummary(place: PlaceWithNames, requestedLocale: string): PlaceSummary {
    const locale = parseLocaleCode(requestedLocale);
    const localizedName = place.names.find((name) => name.locale === locale)
      ?? place.names.find((name) => name.locale.startsWith(locale.split('-')[0] ?? ''))
      ?? place.names.find((name) => name.locale === 'en')
      ?? place.names.find((name) => name.isPreferred)
      ?? place.names[0];

    if (!localizedName) {
      throw new DomainError('CONFLICT', 'places.missing_name', { placeId: place.id });
    }

    return {
      id: parsePlaceId(place.id),
      name: localizedName.value,
      countryCode: place.countryCode,
      latitude: place.latitude,
      longitude: place.longitude,
      locale,
      timeZone: place.timeZone as PlaceSummary['timeZone'],
      currency: place.currency as PlaceSummary['currency'],
      updatedAt: place.updatedAt.toISOString(),
      sourceLabel: place.sources[0]?.label ?? 'Wayella',
    };
  }
}
