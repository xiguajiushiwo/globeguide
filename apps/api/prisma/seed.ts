import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cities = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Tokyo',
    countryCode: 'JP',
    latitude: 35.6762,
    longitude: 139.6503,
    timeZone: 'Asia/Tokyo',
    currency: 'JPY',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Paris',
    countryCode: 'FR',
    latitude: 48.8566,
    longitude: 2.3522,
    timeZone: 'Europe/Paris',
    currency: 'EUR',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'New York',
    countryCode: 'US',
    latitude: 40.7128,
    longitude: -74.006,
    timeZone: 'America/New_York',
    currency: 'USD',
  },
] as const;

for (const city of cities) {
  await prisma.place.upsert({
    where: { id: city.id },
    update: { countryCode: city.countryCode, latitude: city.latitude, longitude: city.longitude, timeZone: city.timeZone, currency: city.currency },
    create: { id: city.id, kind: 'city', countryCode: city.countryCode, latitude: city.latitude, longitude: city.longitude, timeZone: city.timeZone, currency: city.currency },
  });
  await prisma.placeName.upsert({
    where: { placeId_locale_value: { placeId: city.id, locale: 'en', value: city.name } },
    update: { isPreferred: true },
    create: { placeId: city.id, locale: 'en', value: city.name, isPreferred: true },
  });
  await prisma.source.upsert({
    where: { id: `${city.id.slice(0, 8)}-0000-4000-8000-000000000000` },
    update: { label: `${city.name} official tourism source`, sourceType: 'official' },
    create: { id: `${city.id.slice(0, 8)}-0000-4000-8000-000000000000`, placeId: city.id, label: `${city.name} official tourism source`, sourceType: 'official' },
  });
}

await prisma.$disconnect();
