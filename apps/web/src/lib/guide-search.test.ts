import { describe, expect, it } from 'vitest';
import { searchGuideArticles } from './guide-search';

describe('country guide search', () => {
  it('finds Iranian practical help by Chinese query and English city name', () => {
    expect(searchGuideArticles('伊朗 签证').map(item => item.href)).toContain('/guides/iran/entry-and-arrival/');
    expect(searchGuideArticles('Shiraz').map(item => item.href)).toContain('/guides/iran/culture-and-routes/');
    expect(searchGuideArticles('伊朗 现金').map(item => item.href)).toEqual(['/guides/iran/money-and-etiquette/']);
  });
  it('preserves Japan search and keeps unrelated countries out of country-specific queries', () => {
    expect(searchGuideArticles('日本 JR Pass').map(item => item.href)).toEqual(['/guides/japan/transport-tickets/']);
    expect(searchGuideArticles('伊朗').every(item => item.href.startsWith('/guides/iran/'))).toBe(true);
    expect(searchGuideArticles('  ')).toEqual([]);
  });
});
