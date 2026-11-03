import { describe, expect, it } from 'vitest';

import { flattenJapanRoute, getJapanRouteTemplate, japanRouteTemplates, japanTripStops } from './japan-trip';

describe('Japan route templates', () => {
  it('keeps the published 7, 10 and 14 day templates addressable', () => {
    expect(japanRouteTemplates.map((template) => template.id)).toEqual(['7-day', '10-day', '14-day']);
    expect(japanRouteTemplates.map((template) => template.days.length)).toEqual([7, 10, 14]);
    expect(japanRouteTemplates.every((template) => template.days.every((day) => day.title && day.summary))).toBe(true);
  });

  it('does not merge the Fushimi and Arashiyama alternatives', () => {
    const short = getJapanRouteTemplate('7-day');
    expect(short?.days[5]?.stopIds).toEqual(['fushimi']);
    const recommended = flattenJapanRoute('10-day');
    expect(recommended).toContain('fushimi');
    expect(recommended).not.toContain('arashiyama');
    expect(new Set(recommended).has('fushimi') && new Set(recommended).has('arashiyama')).toBe(false);
  });

  it('reserves the final day for departure and matches the advertised hotel nights', () => {
    const expectedNights = {
      '7-day': { '东京': 3, '京都': 2, '大阪': 1 },
      '10-day': { '东京': 4, '京都': 3, '大阪': 2 },
      '14-day': { '东京': 4, '箱根': 1, '京都': 3, '大阪': 3, '广岛': 2 },
    };
    for (const template of japanRouteTemplates) {
      expect(template.days.map((day) => day.day)).toEqual(Array.from({ length: template.nights + 1 }, (_, index) => index + 1));
      expect(template.days.at(-1)).toMatchObject({ city: '返程', stopIds: ['kix'] });
      const nights: Record<string, number> = {};
      for (const day of template.days.slice(0, -1)) {
        expect(day.stopIds).not.toContain('kix');
        nights[day.city] = (nights[day.city] ?? 0) + 1;
      }
      expect(nights).toEqual(expectedNights[template.id]);
    }
  });

  it('places Hakone before Kyoto and gives Hiroshima and Miyajima separate days before returning to Osaka', () => {
    const extended = getJapanRouteTemplate('14-day')!;
    expect(extended.days.map((day) => day.city)).toEqual([
      '东京', '东京', '东京', '东京', '箱根', '京都', '京都', '京都',
      '大阪', '大阪', '广岛', '广岛', '大阪', '返程',
    ]);
    const stops = flattenJapanRoute('14-day');
    expect(stops.indexOf('hakone-yumoto')).toBeLessThan(stops.indexOf('nishiki'));
    expect(extended.days[10]?.stopIds).toContain('hiroshima-peace-park');
    expect(extended.days[11]?.stopIds).toContain('miyajima');
    expect(stops.at(-1)).toBe('kix');
  });

  it('only references known route stops', () => {
    const known = new Set(japanTripStops.map((stop) => stop.id));
    for (const template of japanRouteTemplates) {
      for (const stopId of template.days.flatMap((day) => day.stopIds)) expect(known.has(stopId)).toBe(true);
    }
  });
});
