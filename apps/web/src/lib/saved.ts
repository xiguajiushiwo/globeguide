import type { PlaceSummary } from '@globeguide/domain';

const KEY = 'globeguide:saved-places';

export function readSaved(): PlaceSummary[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(value) ? value as PlaceSummary[] : [];
  } catch {
    return [];
  }
}

export function writeSaved(places: PlaceSummary[]): void {
  localStorage.setItem(KEY, JSON.stringify(places));
  window.dispatchEvent(new Event('globeguide:saved-change'));
}
