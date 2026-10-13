import { t } from '@/i18n';

import { isCoffeeType, type Entry } from './types';

export function typeLabel(entry: Entry): string | null {
  if (!entry.type) return null;
  return isCoffeeType(entry.type) ? t(`coffeeTypes.${entry.type}`) : entry.type;
}

// "Flat White · Kronotrop", or whichever half exists.
export function typeAndCafe(entry: Entry): string | null {
  const parts = [typeLabel(entry), entry.cafe].filter((part): part is string => !!part);
  return parts.length > 0 ? parts.join(' · ') : null;
}
