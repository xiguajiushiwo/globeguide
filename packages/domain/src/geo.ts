export type PlaceId = string & { readonly __brand: 'PlaceId' };
export type TripId = string & { readonly __brand: 'TripId' };
export type UserId = string & { readonly __brand: 'UserId' };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseUuid(value: string, label: string): string {
  if (!UUID_PATTERN.test(value)) {
    throw new Error(`Invalid ${label} identifier: ${value}`);
  }

  return value.toLowerCase();
}

export function parsePlaceId(value: string): PlaceId {
  return parseUuid(value, 'place') as PlaceId;
}

export function parseTripId(value: string): TripId {
  return parseUuid(value, 'trip') as TripId;
}

export function parseUserId(value: string): UserId {
  return parseUuid(value, 'user') as UserId;
}
