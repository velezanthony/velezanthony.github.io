import { ogLocales } from './locales';
import type { Locale } from './locales';
import type { IsoDate, YearMonth } from '@core/types';

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

/** `10 de noviembre de 2026`. Built and printed in UTC, so no time zone moves the day. The
    territory comes from the Open Graph locale: a bare `en` is American, and day-first is how
    this site is read. */
export function formatDate(lang: Locale, value: IsoDate): string {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return new Intl.DateTimeFormat(ogLocales[lang].replace('_', '-'), {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(date);
}
