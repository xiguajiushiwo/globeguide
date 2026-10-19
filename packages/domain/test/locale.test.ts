import { describe, expect, it } from 'vitest';

import {
  parseCurrencyCode,
  parseLocaleCode,
  parseTimeZoneId,
} from '../src/locale.js';

describe('globalization value objects', () => {
  it('canonicalizes valid locale values', () => {
    expect(parseLocaleCode('en-us')).toBe('en-US');
  });

  it('rejects malformed locale values', () => {
    expect(() => parseLocaleCode('not a locale')).toThrow('Invalid locale');
  });

  it('accepts IANA time zones and ISO currencies', () => {
    expect(parseTimeZoneId('Asia/Tokyo')).toBe('Asia/Tokyo');
    expect(parseCurrencyCode('usd')).toBe('USD');
  });

  it('rejects unknown time zones and currencies', () => {
    expect(() => parseTimeZoneId('Mars/Base')).toThrow('Invalid time zone');
    expect(() => parseCurrencyCode('US')).toThrow('Invalid currency');
  });
});
