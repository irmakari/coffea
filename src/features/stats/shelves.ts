import type { Entry } from '@/features/entries/types';
import { formatDate, formatNumber, t } from '@/i18n';

import type { StatsPeriod } from './stats';

export type Shelf = {
  key: string;
  title: string;
  // How many coffees the shelf stands for, photo or not.
  detail: string;
  // The ones with a photo, newest first: those are what stand on it.
  entries: Entry[];
};

function coffees(count: number) {
  return count === 1 ? t('diary.count.one') : t('diary.count.other', { count: formatNumber(count) });
}

// A week or a month is one shelf. A year, or all of it, is a shelf for every
// month, newest first. Shelves with no photo on them are left out.
export function shelvesFor(entries: Entry[], period: StatsPeriod): Shelf[] {
  if (period === 'week' || period === 'month') {
    const withPhoto = entries.filter((entry) => entry.photoUrl);
    if (withPhoto.length === 0) return [];
    return [{ key: period, title: t(`stats.shelf.${period}`), detail: coffees(entries.length), entries: withPhoto }];
  }

  const months = new Map<string, { start: Date; all: Entry[] }>();
  for (const entry of entries) {
    const at = new Date(entry.consumedAt);
    const key = `${at.getFullYear()}-${at.getMonth()}`;
    const month = months.get(key) ?? { start: new Date(at.getFullYear(), at.getMonth(), 1), all: [] };
    month.all.push(entry);
    months.set(key, month);
  }

  return [...months.entries()].flatMap(([key, month]) => {
    const withPhoto = month.all.filter((entry) => entry.photoUrl);
    if (withPhoto.length === 0) return [];
    return [
      {
        key,
        // Within a year the month alone is enough; across years it is not.
        title: formatDate(month.start, period === 'year' ? 'monthName' : 'month'),
        detail: coffees(month.all.length),
        entries: withPhoto,
      },
    ];
  });
}
