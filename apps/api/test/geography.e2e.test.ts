import { afterEach, describe, expect, it, vi } from 'vitest';

import { Test } from '@nestjs/testing';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/database.module.js';

describe('place search endpoint', () => {
  let app: NestFastifyApplication | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('resolves Geography dependencies and returns localized places', async () => {
    const database = {
      place: {
        findMany: vi.fn().mockResolvedValue([
          {
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
              {
                id: '22222222-2222-4222-8222-222222222222',
                placeId: '11111111-1111-4111-8111-111111111111',
                locale: 'en',
                value: 'Tokyo',
                isPreferred: true,
              },
            ],
            sources: [
              {
                id: '33333333-3333-4333-8333-333333333333',
                placeId: '11111111-1111-4111-8111-111111111111',
                label: 'Tokyo official tourism source',
                url: null,
                sourceType: 'official',
                license: null,
                collectedAt: new Date('2026-10-19T00:00:00Z'),
              },
            ],
          },
        ]),
      },
    };
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(database)
      .compile();

    app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.setGlobalPrefix('v1');
    await app.init();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: 'GET',
      url: '/v1/places/search?q=Tokyo&locale=en',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      items: [
        {
          name: 'Tokyo',
          countryCode: 'JP',
          timeZone: 'Asia/Tokyo',
          sourceLabel: 'Tokyo official tourism source',
        },
      ],
      nextCursor: null,
    });
    expect(database.place.findMany).toHaveBeenCalledOnce();
  });
});
