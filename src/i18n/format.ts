import type { Locale } from '@i18n/ui';
import type { YearMonth } from '@data/types';

export function formatMonth(lang: Locale, value: YearMonth): string {
  const [year, month] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, 1));
  return new Intl.DateTimeFormat(lang, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** `oct 2025 — Actualidad`, with an en dash and a caller-supplied label. */
export function formatRange(
  lang: Locale,
  start: YearMonth,
  end: YearMonth | null,
  presentLabel: string,
): string {
  return `${formatMonth(lang, start)} – ${end ? formatMonth(lang, end) : presentLabel}`;
}

/** Machine-readable value for `<time datetime>`. */
export function isoMonth(value: YearMonth): string {
  return value;
}
