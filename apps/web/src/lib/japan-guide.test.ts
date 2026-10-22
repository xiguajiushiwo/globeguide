import { describe, expect, it } from 'vitest';

import { bookingTimeline, japanAreaNotes, japanPackingChecklist, japanSources, japanTenDayRoute } from './japan-guide';

describe('Japan travel guide content', () => {
  it('keeps the detailed route contiguous and aligned with nine hotel nights', () => {
    expect(japanTenDayRoute.map((day) => day.day)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(japanTenDayRoute.filter((day) => day.sleep !== '返程')).toHaveLength(9);
    expect(japanTenDayRoute.every((day) => day.title && day.transit && day.morning && day.afternoon && day.evening)).toBe(true);
    expect(japanTenDayRoute.every((day) => day.steps.length >= 3)).toBe(true);
  });

  it('keeps source references and preparation coverage complete', () => {
    expect(new Set(japanSources.map((source) => source.id)).size).toBe(japanSources.length);
    expect(japanSources.every((source) => source.url.startsWith('https://'))).toBe(true);
    expect(bookingTimeline).toHaveLength(4);
    expect(japanAreaNotes.some((area) => area.city === '京都')).toBe(true);
    expect(japanPackingChecklist.some((item) => item.includes('护照'))).toBe(true);
  });
});
