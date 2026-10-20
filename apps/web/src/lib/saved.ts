import { placeSummarySchema } from '@globeguide/domain';
import type { PlaceSummary } from '@globeguide/domain';

const KEY = 'globeguide:saved-places';

export function readSaved(): PlaceSummary[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.flatMap((item: unknown) => {
      const parsed = placeSummarySchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    });
  } catch {
    return [];
  }
}

export function writeSaved(places: PlaceSummary[]): void {
  localStorage.setItem(KEY, JSON.stringify(places));
  window.dispatchEvent(new Event('globeguide:saved-change'));
}
