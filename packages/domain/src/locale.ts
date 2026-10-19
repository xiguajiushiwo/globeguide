export type LocaleCode = string & { readonly __brand: 'LocaleCode' };
export type TimeZoneId = string & { readonly __brand: 'TimeZoneId' };
export type CurrencyCode = string & { readonly __brand: 'CurrencyCode' };

export function parseLocaleCode(value: string): LocaleCode {
  let canonical: string | undefined;
  try {
    [canonical] = Intl.getCanonicalLocales(value);
  } catch {
    throw new Error(`Invalid locale: ${value}`);
  }

  if (!canonical) {
    throw new Error(`Invalid locale: ${value}`);
  }

  return canonical as LocaleCode;
}

export function parseTimeZoneId(value: string): TimeZoneId {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
  } catch {
    throw new Error(`Invalid time zone: ${value}`);
  }

  return value as TimeZoneId;
}

export function parseCurrencyCode(value: string): CurrencyCode {
  const normalized = value.toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new Error(`Invalid currency: ${value}`);
  }

  try {
    new Intl.NumberFormat('en', { style: 'currency', currency: normalized }).format(0);
  } catch {
    throw new Error(`Invalid currency: ${value}`);
  }

  return normalized as CurrencyCode;
}
