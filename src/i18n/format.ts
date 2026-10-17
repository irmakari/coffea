// All date, number and currency formatting goes through here so the app
// stays consistent and a locale switch is a one-line change.
export const locale = 'en-US';

const dateStyles = {
  day: { weekday: 'long', month: 'long', day: 'numeric' },
  dayShort: { weekday: 'short', month: 'short', day: 'numeric' },
  month: { month: 'long', year: 'numeric' },
  monthName: { month: 'long' },
  monthShort: { month: 'short' },
  weekdayInitial: { weekday: 'narrow' },
  year: { year: 'numeric' },
  short: { month: 'short', day: 'numeric', year: 'numeric' },
  time: { hour: 'numeric', minute: '2-digit' },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

export function formatDate(date: Date | string, style: keyof typeof dateStyles = 'short'): string {
  return new Intl.DateTimeFormat(locale, dateStyles[style]).format(new Date(date));
}

// Single-letter weekday headings, Monday first.
export function weekdayInitials(): string[] {
  const narrow = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
  // 1 January 2024 was a Monday.
  return Array.from({ length: 7 }, (_, index) => narrow.format(new Date(2024, 0, 1 + index)));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(locale).format(value);
}

// Currencies the English locale would otherwise print as a bare code.
const symbols: Record<string, string> = { TRY: '₺' };

// "₺", "$", "€": the mark a price is written with, else the code itself.
export function currencySymbol(currency: string): string {
  if (symbols[currency]) return symbols[currency];
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    return parts.find((part) => part.type === 'currency')?.value ?? currency;
  } catch {
    return currency;
  }
}

// "₺ TRY", or just the code when it has no mark of its own.
export function currencyLabel(currency: string): string {
  const symbol = currencySymbol(currency);
  return symbol === currency ? currency : `${symbol} ${currency}`;
}

export function formatCurrency(amount: number, currency: string): string {
  const symbol = symbols[currency];
  if (symbol) {
    const digits = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    return `${symbol}${new Intl.NumberFormat(locale, digits).format(amount)}`;
  }
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    // Unknown currency code: show the number with the code rather than failing.
    return `${formatNumber(amount)} ${currency}`;
  }
}
