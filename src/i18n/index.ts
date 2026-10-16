import { en } from './en';

// English is the only language for now. To add another, create a dictionary
// with the same shape as `en` and select it here from the device locale.
const dictionary = en;

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = Leaves<typeof en>;

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  let value: unknown = dictionary;
  for (const part of key.split('.')) {
    value = (value as Record<string, unknown>)[part];
  }
  const text = typeof value === 'string' ? value : key;
  if (!params) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export { currencyLabel, currencySymbol, formatCurrency, formatDate, formatNumber, locale, weekdayInitials } from './format';
