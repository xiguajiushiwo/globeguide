import { destinationCatalog, getDestination, searchDestinations } from '@globeguide/domain';
import type { PlaceSummary } from '@globeguide/domain';

import { searchGuides } from './guides';
export const featured = destinationCatalog
  .filter((destination) => destination.image)
  .map((destination) => ({
    id: destination.place.id,
    name: destination.place.name,
    country: countryName(destination.place.countryCode),
    image: destination.image!,
  }));

export function cityPresentation(id: string) {
  return featured.find((city) => city.id === id);
}

export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function getPlace(id: string): PlaceSummary | null {
  return getDestination(id)?.place ?? null;
}

export function searchPlaces(query: string): PlaceSummary[] {
  const byId = new Map(searchDestinations(query).map((destination) => [destination.place.id, destination.place]));
  searchGuides(query).forEach((guide) => byId.set(guide.place.id, guide.place));
  return [...byId.values()];
}
