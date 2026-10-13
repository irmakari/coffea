// The currencies offered in settings. Entries keep the currency they were
// saved with, so changing the preference never rewrites old prices.
export const currencies = [
  'TRY',
  'USD',
  'EUR',
  'GBP',
  'CHF',
  'CAD',
  'AUD',
  'JPY',
  'SEK',
  'NOK',
  'DKK',
  'AED',
] as const;

export type CurrencyCode = (typeof currencies)[number];

export const DEFAULT_CURRENCY: CurrencyCode = 'USD';
