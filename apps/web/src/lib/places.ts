import { placeSummarySchema } from '@globeguide/domain';
import type { PlaceSummary } from '@globeguide/domain';

const API_BASE = process.env.API_BASE_URL ?? 'http://127.0.0.1:3001';

export const featured = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Tokyo', country: 'Japan', image: '/images/tokyo.jpg' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Paris', country: 'France', image: '/images/paris.jpg' },
  { id: '33333333-3333-4333-8333-333333333333', name: 'New York', country: 'United States', image: '/images/new-york.jpg' },
] as const;

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

export async function getPlace(id: string): Promise<PlaceSummary | null> {
  const response = await fetch(`${API_BASE}/v1/places/${encodeURIComponent(id)}`, {
    cache: 'no-store',
    headers: { 'Accept-Language': 'en' },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Place request failed: ${response.status}`);
  return placeSummarySchema.parse(await response.json());
}

export async function searchPlaces(query: string): Promise<PlaceSummary[]> {
  const response = await fetch(`${API_BASE}/v1/places/search?q=${encodeURIComponent(query)}&locale=en`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Search request failed: ${response.status}`);
  const data: unknown = await response.json();
  if (typeof data !== 'object' || data === null || !('items' in data) || !Array.isArray(data.items)) {
    throw new Error('Invalid search response');
  }
  return data.items.map((item: unknown) => placeSummarySchema.parse(item));
}
