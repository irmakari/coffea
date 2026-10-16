import { t } from '@/i18n';

import { isCoffeeType, type Entry } from './types';

export function typeLabel(entry: Entry): string | null {
  if (!entry.type) return null;
  return isCoffeeType(entry.type) ? t(`coffeeTypes.${entry.type}`) : entry.type;
}

// "Flat White · Kronotrop", or whichever half exists. The type is left out
// when the name is only the type, so a line never reads "Latte / Latte".
export function typeAndCafe(entry: Entry): string | null {
  const type = typeLabel(entry);
  const repeatsName = type?.trim().toLowerCase() === entry.name.trim().toLowerCase();
  const parts = [repeatsName ? null : type, entry.cafe].filter((part): part is string => !!part);
  return parts.length > 0 ? parts.join(' · ') : null;
}
