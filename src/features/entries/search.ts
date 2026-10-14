import { t } from '@/i18n';

import { typeLabel } from './display';
import { isMilkType, type Entry } from './types';

// Lowercase, without accents, so "turk kahvesi" finds "Türk Kahvesi".
function fold(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i');
}

// Coffees whose name, type, milk, café or notes hold every word of the
// query, in the order they were given: newest first.
export function searchEntries(entries: Entry[], query: string): Entry[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return entries.filter((entry) => {
    const milk = isMilkType(entry.milk) ? t(`milkTypes.${entry.milk}`) : entry.milk;
    const text = fold([entry.name, typeLabel(entry), milk, entry.cafe, entry.notes].filter(Boolean).join(' '));
    return words.every((word) => text.includes(word));
  });
}
