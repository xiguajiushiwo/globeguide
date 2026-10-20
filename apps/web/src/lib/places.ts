import type { PlaceSummary } from '@globeguide/domain';

import { getGuide, guides, searchGuides } from './guides';

export const featured = guides.map((guide) => ({
  id: guide.place.id,
  name: guide.place.name,
  country: guide.country,
  image: guide.image,
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
  return getGuide(id)?.place ?? null;
}

export function searchPlaces(query: string): PlaceSummary[] {
  return searchGuides(query).map((guide) => guide.place);
}
